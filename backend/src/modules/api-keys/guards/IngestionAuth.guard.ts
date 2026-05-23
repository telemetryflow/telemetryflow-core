import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import * as crypto from "crypto";
import { API_KEY_REPOSITORY, IApiKeyRepository } from "../domain";
import {
  ApiKeyEncryptionService,
  API_KEY_ENCRYPTION_SERVICE,
} from "../infrastructure/services/ApiKeyEncryption.service";
import {
  IngestionRateLimiterService,
  INGESTION_RATE_LIMITER_SERVICE,
} from "../infrastructure/services/IngestionRateLimiter.service";

export const TFO_ENCRYPTION_KEY_HEADER = "x-telemetryflow-encryption-key";
export const TFO_KEY_ID_HEADER = "x-telemetryflow-key-id";
export const TFO_KEY_SECRET_HEADER = "x-telemetryflow-key-secret";

export interface IngestionAuthenticatedRequest extends Request {
  apiKey: {
    id: string;
    organizationId: string;
    workspaceId?: string;
    permissions: string[];
    scopes: string[];
  };
}

/**
 * IngestionAuthGuard
 *
 * Supports two authentication schemes:
 *
 * 1. Basic Auth (agents/services):
 *      Authorization: Basic <base64(keyId:keySecret)>
 *      x-telemetryflow-encryption-key — per-key encryption key, validated against stored value
 *
 * 2. Custom headers (TFO Collector / tfoexporter):
 *      X-TelemetryFlow-Key-ID: tfk_...
 *      X-TelemetryFlow-Key-Secret: tfs_...
 *      (encryption key validation skipped — collector does not carry it)
 *
 * keyId  format: tfk_[A-Za-z0-9]{32,64}
 * keySecret format: tfs_[A-Za-z0-9]{32,64}
 *
 * On success, attaches `req.apiKey` with the resolved organizationId.
 * The organizationId comes from the validated API key record — never from a header.
 */
@Injectable()
export class IngestionAuthGuard implements CanActivate {
  private readonly logger = new Logger(IngestionAuthGuard.name);

  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
    @Inject(API_KEY_ENCRYPTION_SERVICE)
    private readonly encryptionService: ApiKeyEncryptionService,
    @Inject(INGESTION_RATE_LIMITER_SERVICE)
    private readonly rateLimiter: IngestionRateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const clientIp = this.getClientIp(request);

    // --- Parse credentials from either auth scheme ---
    let keyId: string;
    let keySecret: string;
    let encryptionKey: string | null = null;
    let skipEncryptionCheck = false;

    const authHeader = request.headers["authorization"];
    const customKeyId = this.getHeader(request, TFO_KEY_ID_HEADER);
    const customKeySecret = this.getHeader(request, TFO_KEY_SECRET_HEADER);

    if (customKeyId && customKeySecret) {
      // Scheme 2: TFO Collector custom headers
      keyId = customKeyId;
      keySecret = customKeySecret;
      skipEncryptionCheck = true;
    } else if (authHeader?.startsWith("Basic ")) {
      // Scheme 1: HTTP Basic Auth
      try {
        const base64 = authHeader.slice(6);
        const decoded = Buffer.from(base64, "base64").toString("utf8");
        const colonIdx = decoded.indexOf(":");
        if (colonIdx === -1) {
          this.warn("invalid_format", clientIp);
          throw new UnauthorizedException(
            "Invalid Basic Auth format — missing ':' separator",
          );
        }
        keyId = decoded.slice(0, colonIdx);
        keySecret = decoded.slice(colonIdx + 1);
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
        this.warn("invalid_format", clientIp);
        throw new UnauthorizedException("Malformed Basic Auth credentials");
      }
      encryptionKey = this.getHeader(request, TFO_ENCRYPTION_KEY_HEADER);
      if (!encryptionKey) {
        this.warn("missing_auth_header", clientIp);
        throw new UnauthorizedException(
          `Missing required header: ${TFO_ENCRYPTION_KEY_HEADER}`,
        );
      }
    } else {
      this.warn("missing_auth_header", clientIp);
      throw new UnauthorizedException(
        "Missing credentials — provide Authorization: Basic or X-TelemetryFlow-Key-ID/Secret headers",
      );
    }

    // --- Validate key formats ---
    if (!this.isValidKeyId(keyId)) {
      this.warn("invalid_format", clientIp);
      throw new UnauthorizedException(
        "Invalid keyId format — expected tfk_... prefix",
      );
    }
    if (!this.isValidKeySecret(keySecret)) {
      this.warn("invalid_format", clientIp);
      throw new UnauthorizedException(
        "Invalid keySecret format — expected tfs_... prefix",
      );
    }

    // --- Hash the secret for DB lookup ---
    const secretHash = crypto
      .createHash("sha256")
      .update(keySecret)
      .digest("hex");
    const apiKey = await this.apiKeyRepository.findByKeyHash(secretHash);

    if (!apiKey) {
      this.warn("key_not_found", clientIp);
      throw new UnauthorizedException("Invalid API key credentials");
    }

    // --- Verify keyId matches stored apiKeyId ---
    const storedKeyId = apiKey.getApiKeyId();
    if (!storedKeyId || storedKeyId !== keyId) {
      this.warn("key_id_mismatch", clientIp);
      throw new UnauthorizedException("API key ID does not match secret");
    }

    // --- Check active / revoked / expired ---
    if (!apiKey.getIsActive()) {
      this.warn("key_inactive", clientIp);
      throw new UnauthorizedException("API key is inactive");
    }
    if (apiKey.getRevokedAt()) {
      this.warn("key_revoked", clientIp);
      throw new UnauthorizedException("API key has been revoked");
    }
    const expiresAt = apiKey.getExpiresAt();
    if (expiresAt && expiresAt < new Date()) {
      this.warn("key_expired", clientIp);
      throw new UnauthorizedException("API key has expired");
    }

    // --- Validate encryption key against stored encrypted value ---
    // Skipped for TFO Collector (custom header scheme) — collector does not carry the per-key encryption key
    const storedEncryptKey = apiKey.getEncryptKey();
    if (!skipEncryptionCheck && storedEncryptKey) {
      try {
        const decryptedKey = this.encryptionService.decrypt(storedEncryptKey);
        if (decryptedKey !== encryptionKey) {
          this.warn("encryption_key_mismatch", clientIp);
          throw new UnauthorizedException("Invalid encryption key");
        }
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
        this.warn("decryption_error", clientIp);
        throw new UnauthorizedException("Encryption key validation failed");
      }
    }

    // --- Attach resolved API key info (organizationId from DB, not headers) ---
    (request as IngestionAuthenticatedRequest).apiKey = {
      id: apiKey.getId().getValue(),
      organizationId: apiKey.getOrganizationId(),
      workspaceId: apiKey.getWorkspaceId(),
      permissions: apiKey.getPermissions(),
      scopes: apiKey.getScopes(),
    };

    // --- Rate limiting (after all auth checks pass) ---
    const rateResult = await this.rateLimiter.check(
      apiKey.getId().getValue(),
      apiKey.getRateLimit(),
    );

    response.setHeader("X-RateLimit-Limit", String(rateResult.limit));
    response.setHeader("X-RateLimit-Remaining", String(rateResult.remaining));
    response.setHeader("X-RateLimit-Reset", String(rateResult.resetAt));

    if (!rateResult.allowed) {
      response.setHeader("Retry-After", String(rateResult.resetAt - Math.floor(Date.now() / 1000)));
      throw new HttpException("Rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }

    // Fire-and-forget usage tracking
    this.apiKeyRepository
      .updateLastUsed(apiKey.getId().getValue(), clientIp)
      .catch(() => {});

    return true;
  }

  private warn(reason: string, clientIp: string): void {
    this.logger.warn(`Auth failure: ${reason} | ip=${clientIp}`);
  }

  private getHeader(request: Request, name: string): string | null {
    const value = request.headers[name];
    return typeof value === "string" ? value : null;
  }

  private isValidKeyId(key: string): boolean {
    return /^tfk_[A-Za-z0-9]{32,64}$/.test(key);
  }

  private isValidKeySecret(key: string): boolean {
    return /^tfs_[A-Za-z0-9]{32,64}$/.test(key);
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || "unknown";
  }
}
