import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";
import {
  IngestionAuthGuard,
  TFO_ENCRYPTION_KEY_HEADER,
} from "../IngestionAuth.guard";
import { ApiKey } from "../../domain/aggregates/ApiKey";

// ─── Helpers ────────────────────────────────────────────────────────────────

const VALID_KEY_ID = `tfk_${"a".repeat(32)}`;
const VALID_KEY_SECRET = `tfs_${"b".repeat(32)}`;
const VALID_ENCRYPT_KEY = "my-encryption-key-value";

function makeBasicHeader(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

function makeApiKey(
  overrides: Partial<{
    apiKeyId: string;
    isActive: boolean;
    revokedAt: Date | undefined;
    expiresAt: Date | undefined;
    encryptKey: string | undefined;
  }> = {},
): Partial<ApiKey> {
  return {
    getId: () => ({ getValue: () => "key-uuid-1" }) as any,
    getApiKeyId: () => overrides.apiKeyId ?? VALID_KEY_ID,
    getIsActive: () => overrides.isActive ?? true,
    getRevokedAt: () => overrides.revokedAt ?? undefined,
    getExpiresAt: () => overrides.expiresAt ?? undefined,
    getEncryptKey: () => overrides.encryptKey ?? undefined,
    getOrganizationId: () => "org-1",
    getWorkspaceId: () => undefined,
    getPermissions: () => ["*"],
    getScopes: () => [],
    getRateLimit: () => undefined,
  } as Partial<ApiKey>;
}

function makeContext(
  headers: Record<string, string | undefined>,
  ip = "1.2.3.4",
): ExecutionContext {
  const res: any = {
    setHeader: jest.fn(),
  };
  const req: any = {
    headers: Object.fromEntries(
      Object.entries(headers).filter(([, v]) => v !== undefined),
    ),
    ip,
    socket: { remoteAddress: ip },
  };
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as any;
}

// ─── Guard factory ───────────────────────────────────────────────────────────

function makeGuard(apiKey: Partial<ApiKey> | null, decryptResult?: string) {
  const repo = {
    findByKeyHash: jest.fn().mockResolvedValue(apiKey),
    updateLastUsed: jest.fn().mockResolvedValue(undefined),
  };
  const enc = {
    decrypt: jest.fn().mockReturnValue(decryptResult ?? VALID_ENCRYPT_KEY),
  };
  const rateLimiter = {
    check: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
      resetAt: 0,
    }),
  };
  return {
    guard: new IngestionAuthGuard(repo as any, enc as any, rateLimiter as any),
    repo,
    enc,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("IngestionAuthGuard", () => {
  const validHeaders = () => ({
    authorization: makeBasicHeader(VALID_KEY_ID, VALID_KEY_SECRET),
    [TFO_ENCRYPTION_KEY_HEADER]: VALID_ENCRYPT_KEY,
  });

  // ── Happy path ──────────────────────────────────────────────────────────

  it("returns true and populates req.apiKey on valid credentials", async () => {
    const { guard, repo } = makeGuard(makeApiKey());
    const ctx = makeContext(validHeaders());
    const req = ctx.switchToHttp().getRequest();

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(req.apiKey).toMatchObject({
      id: "key-uuid-1",
      organizationId: "org-1",
      permissions: ["*"],
    });
    expect(repo.findByKeyHash).toHaveBeenCalledWith(
      hashSecret(VALID_KEY_SECRET),
    );
  });

  it("calls updateLastUsed fire-and-forget after successful auth", async () => {
    const { guard, repo } = makeGuard(makeApiKey());
    await guard.canActivate(makeContext(validHeaders()));
    // Give the fire-and-forget a tick to run
    await Promise.resolve();
    expect(repo.updateLastUsed).toHaveBeenCalledWith("key-uuid-1", "1.2.3.4");
  });

  // ── Missing / wrong Authorization header ───────────────────────────────

  it("throws 401 when Authorization header is missing", async () => {
    const { guard } = makeGuard(null);
    const headers = validHeaders();
    delete (headers as any).authorization;
    await expect(guard.canActivate(makeContext(headers))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("throws 401 when Authorization scheme is not Basic", async () => {
    const { guard } = makeGuard(null);
    await expect(
      guard.canActivate(
        makeContext({ ...validHeaders(), authorization: `Bearer sometoken` }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws 401 for malformed Base64 (non-UTF8 garbage)", async () => {
    const { guard } = makeGuard(null);
    // Craft a header that decodes to something without ':'
    const noColon = Buffer.from("nocolon").toString("base64");
    await expect(
      guard.canActivate(
        makeContext({ ...validHeaders(), authorization: `Basic ${noColon}` }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws 401 when decoded value has no ":" separator', async () => {
    const { guard } = makeGuard(null);
    const noColon = Buffer.from("nocolonseparator").toString("base64");
    await expect(
      guard.canActivate(
        makeContext({ ...validHeaders(), authorization: `Basic ${noColon}` }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Format validation ───────────────────────────────────────────────────

  it("throws 401 for invalid keyId format (wrong prefix)", async () => {
    const { guard } = makeGuard(null);
    const badId = `bad_${"a".repeat(32)}`;
    await expect(
      guard.canActivate(
        makeContext({
          ...validHeaders(),
          authorization: makeBasicHeader(badId, VALID_KEY_SECRET),
        }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws 401 for invalid keySecret format (wrong prefix)", async () => {
    const { guard } = makeGuard(null);
    const badSecret = `bad_${"b".repeat(32)}`;
    await expect(
      guard.canActivate(
        makeContext({
          ...validHeaders(),
          authorization: makeBasicHeader(VALID_KEY_ID, badSecret),
        }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Encryption key header ───────────────────────────────────────────────

  it("throws 401 when x-telemetryflow-encryption-key header is missing", async () => {
    const { guard } = makeGuard(null);
    const headers = validHeaders();
    delete (headers as any)[TFO_ENCRYPTION_KEY_HEADER];
    await expect(guard.canActivate(makeContext(headers))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ── DB lookup failures ──────────────────────────────────────────────────

  it("throws 401 when key hash is not found in DB", async () => {
    const { guard } = makeGuard(null);
    await expect(
      guard.canActivate(makeContext(validHeaders())),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws 401 when keyId does not match stored apiKeyId", async () => {
    const { guard } = makeGuard(
      makeApiKey({ apiKeyId: `tfk_${"z".repeat(32)}` }),
    );
    await expect(
      guard.canActivate(makeContext(validHeaders())),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Key state checks ────────────────────────────────────────────────────

  it("throws 401 when key is inactive", async () => {
    const { guard } = makeGuard(makeApiKey({ isActive: false }));
    await expect(
      guard.canActivate(makeContext(validHeaders())),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws 401 when key is revoked", async () => {
    const { guard } = makeGuard(makeApiKey({ revokedAt: new Date() }));
    await expect(
      guard.canActivate(makeContext(validHeaders())),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws 401 when key is expired", async () => {
    const past = new Date(Date.now() - 1000);
    const { guard } = makeGuard(makeApiKey({ expiresAt: past }));
    await expect(
      guard.canActivate(makeContext(validHeaders())),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ── Encryption key validation ───────────────────────────────────────────

  it("throws 401 when encryption key does not match stored value", async () => {
    const { guard } = makeGuard(
      makeApiKey({ encryptKey: "encrypted-blob" }),
      "different-key",
    );
    await expect(
      guard.canActivate(makeContext(validHeaders())),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws 401 when decryption throws an error", async () => {
    const repo = {
      findByKeyHash: jest
        .fn()
        .mockResolvedValue(makeApiKey({ encryptKey: "encrypted-blob" })),
      updateLastUsed: jest.fn(),
    };
    const enc = {
      decrypt: jest.fn().mockImplementation(() => {
        throw new Error("bad key");
      }),
    };
    const rateLimiter = {
      check: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 99,
        limit: 100,
        resetAt: 0,
      }),
    };
    const guard = new IngestionAuthGuard(
      repo as any,
      enc as any,
      rateLimiter as any,
    );
    await expect(
      guard.canActivate(makeContext(validHeaders())),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("passes when encryptKey is null (no encryption required)", async () => {
    const { guard } = makeGuard(makeApiKey({ encryptKey: undefined }));
    const result = await guard.canActivate(makeContext(validHeaders()));
    expect(result).toBe(true);
  });

  // ── Client IP extraction ────────────────────────────────────────────────

  it("extracts first IP from x-forwarded-for header", async () => {
    const { guard, repo } = makeGuard(makeApiKey());
    const ctx = makeContext(validHeaders(), "10.0.0.1");
    // Override headers to include x-forwarded-for
    const req = ctx.switchToHttp().getRequest();
    req.headers["x-forwarded-for"] = "203.0.113.1, 10.0.0.1";

    await guard.canActivate(ctx);
    await Promise.resolve();
    expect(repo.updateLastUsed).toHaveBeenCalledWith(
      "key-uuid-1",
      "203.0.113.1",
    );
  });
});
