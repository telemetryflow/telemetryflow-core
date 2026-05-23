import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';
import { API_KEY_REPOSITORY, IApiKeyRepository } from '../domain';

export const API_KEY_HEADER = 'x-api-key';
export const API_KEY_QUERY = 'api_key';

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKey: {
    id: string;
    organizationId: string;
    workspaceId?: string;
    permissions: string[];
    scopes: string[];
    rateLimit?: number;
  };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawKey = this.extractApiKey(request);

    if (!rawKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Validate key format
    if (!this.isValidKeyFormat(rawKey)) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Hash the raw key
    const keyHash = this.hashKey(rawKey);

    // Find the API key by hash
    const apiKey = await this.apiKeyRepository.findByKeyHash(keyHash);

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is active
    if (!apiKey.getIsActive()) {
      throw new UnauthorizedException('API key is inactive');
    }

    // Check if key is revoked
    if (apiKey.getRevokedAt()) {
      throw new UnauthorizedException('API key has been revoked');
    }

    // Check if key has expired
    const expiresAt = apiKey.getExpiresAt();
    if (expiresAt && expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Check required permissions
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    if (requiredPermissions?.length) {
      const hasPermission = requiredPermissions.every((permission) =>
        apiKey.getPermissions().includes(permission),
      );
      if (!hasPermission) {
        throw new UnauthorizedException('Insufficient API key permissions');
      }
    }

    // Attach API key info to request
    (request as ApiKeyAuthenticatedRequest).apiKey = {
      id: apiKey.getId().getValue(),
      organizationId: apiKey.getOrganizationId(),
      workspaceId: apiKey.getWorkspaceId(),
      permissions: apiKey.getPermissions(),
      scopes: apiKey.getScopes(),
      rateLimit: apiKey.getRateLimit(),
    };

    // Update last used (fire and forget)
    const clientIp = this.getClientIp(request);
    this.apiKeyRepository
      .updateLastUsed(apiKey.getId().getValue(), clientIp)
      .catch(() => {
        // Silently ignore update errors
      });

    return true;
  }

  private extractApiKey(request: Request): string | null {
    // Check header first
    const headerKey = request.headers[API_KEY_HEADER];
    if (headerKey && typeof headerKey === 'string') {
      return headerKey;
    }

    // Check query parameter
    const queryKey = request.query[API_KEY_QUERY];
    if (queryKey && typeof queryKey === 'string') {
      return queryKey;
    }

    // Check Authorization header (Bearer-like)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private isValidKeyFormat(key: string): boolean {
    // Key format: tfk_XXXXXXXX or tfs_XXXXXXXX
    return /^tf[ks]_[A-Za-z0-9]{32,64}$/.test(key);
  }

  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
