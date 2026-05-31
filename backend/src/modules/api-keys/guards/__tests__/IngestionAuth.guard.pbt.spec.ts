/**
 * Property-based tests for IngestionAuthGuard Basic Auth parsing.
 * Uses fast-check to validate correctness properties across arbitrary inputs.
 */
import * as fc from "fast-check";
import * as crypto from "crypto";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import {
  IngestionAuthGuard,
  TFO_ENCRYPTION_KEY_HEADER,
} from "../IngestionAuth.guard";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const ALNUM_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");

/** Generates a valid keyId: tfk_ + 32–64 alphanumeric chars */
const validKeyIdArb = fc
  .integer({ min: 32, max: 64 })
  .chain((len) =>
    fc.string({
      unit: fc.constantFrom(...ALNUM_CHARS),
      minLength: len,
      maxLength: len,
    }),
  )
  .map((s) => `tfk_${s}`);

/** Generates a valid keySecret: tfs_ + 32–64 alphanumeric chars */
const validKeySecretArb = fc
  .integer({ min: 32, max: 64 })
  .chain((len) =>
    fc.string({
      unit: fc.constantFrom(...ALNUM_CHARS),
      minLength: len,
      maxLength: len,
    }),
  )
  .map((s) => `tfs_${s}`);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeContext(headers: Record<string, string>): ExecutionContext {
  const res: any = { setHeader: jest.fn() };
  const req: any = {
    headers,
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
  };
  return { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as any;
}

function makeGuardWithKey(
  keyId: string,
  keySecret: string,
  encryptKey?: string,
) {
  const secretHash = crypto
    .createHash("sha256")
    .update(keySecret)
    .digest("hex");
  const apiKeyMock = {
    getId: () => ({ getValue: () => "uuid-1" }),
    getApiKeyId: () => keyId,
    getIsActive: () => true,
    getRevokedAt: () => undefined,
    getExpiresAt: () => undefined,
    getEncryptKey: () => encryptKey ?? undefined,
    getOrganizationId: () => "org-1",
    getWorkspaceId: () => undefined,
    getPermissions: () => ["*"],
    getScopes: () => [],
    getRateLimit: () => undefined,
  };
  const repo = {
    findByKeyHash: jest
      .fn()
      .mockImplementation((hash: string) =>
        hash === secretHash
          ? Promise.resolve(apiKeyMock)
          : Promise.resolve(null),
      ),
    updateLastUsed: jest.fn().mockResolvedValue(undefined),
  };
  const enc = { decrypt: jest.fn().mockReturnValue(encryptKey ?? "") };
  const rateLimiter = {
    check: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
      resetAt: 0,
    }),
  };
  return new IngestionAuthGuard(repo as any, enc as any, rateLimiter as any);
}

// ─── Properties ──────────────────────────────────────────────────────────────

describe("IngestionAuthGuard — property-based tests", () => {
  /**
   * Property 1: Basic Auth round-trip parsing
   * For any valid keyId/keySecret pair, encoding as base64(keyId:keySecret)
   * and presenting to the guard should succeed (canActivate returns true).
   */
  it("Property 1: valid keyId/keySecret round-trip always authenticates", async () => {
    await fc.assert(
      fc.asyncProperty(
        validKeyIdArb,
        validKeySecretArb,
        async (keyId, keySecret) => {
          const guard = makeGuardWithKey(keyId, keySecret);
          const encoded = Buffer.from(`${keyId}:${keySecret}`).toString(
            "base64",
          );
          const ctx = makeContext({
            authorization: `Basic ${encoded}`,
            [TFO_ENCRYPTION_KEY_HEADER]: "any-value",
          });
          const result = await guard.canActivate(ctx);
          expect(result).toBe(true);
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 2: Invalid format rejection
   * For any absent, non-Basic, or malformed Authorization header,
   * the guard must throw UnauthorizedException without logging the raw value.
   */
  it("Property 2: absent or non-Basic Authorization always throws 401", async () => {
    // Absent header
    await fc.assert(
      fc.asyncProperty(fc.constant(undefined), async () => {
        const guard = makeGuardWithKey(
          `tfk_${"a".repeat(32)}`,
          `tfs_${"b".repeat(32)}`,
        );
        const ctx = makeContext({ [TFO_ENCRYPTION_KEY_HEADER]: "key" });
        await expect(guard.canActivate(ctx)).rejects.toThrow(
          UnauthorizedException,
        );
      }),
      { numRuns: 10 },
    );

    // Non-Basic scheme
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 40 })
          .filter((s) => !s.startsWith("Basic ")),
        async (authValue) => {
          const guard = makeGuardWithKey(
            `tfk_${"a".repeat(32)}`,
            `tfs_${"b".repeat(32)}`,
          );
          const ctx = makeContext({
            authorization: authValue,
            [TFO_ENCRYPTION_KEY_HEADER]: "key",
          });
          await expect(guard.canActivate(ctx)).rejects.toThrow(
            UnauthorizedException,
          );
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 2b: Decoded values without ':' always throw 401
   */
  it('Property 2b: decoded Basic Auth without ":" separator always throws 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 1, maxLength: 80 })
          .filter((s) => !s.includes(":")),
        async (noColon) => {
          const guard = makeGuardWithKey(
            `tfk_${"a".repeat(32)}`,
            `tfs_${"b".repeat(32)}`,
          );
          const encoded = Buffer.from(noColon).toString("base64");
          const ctx = makeContext({
            authorization: `Basic ${encoded}`,
            [TFO_ENCRYPTION_KEY_HEADER]: "key",
          });
          await expect(guard.canActivate(ctx)).rejects.toThrow(
            UnauthorizedException,
          );
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 3: Encryption key validation
   * For any API key record with a non-null encryptKey, the correct key passes
   * and any different value fails.
   */
  it("Property 3: correct encryption key passes, any other value fails", async () => {
    await fc.assert(
      fc.asyncProperty(
        validKeyIdArb,
        validKeySecretArb,
        fc.string({ minLength: 8, maxLength: 64 }),
        fc.string({ minLength: 8, maxLength: 64 }),
        async (keyId, keySecret, correctKey, wrongKey) => {
          fc.pre(correctKey !== wrongKey);

          const secretHash = crypto
            .createHash("sha256")
            .update(keySecret)
            .digest("hex");
          const apiKeyMock = {
            getId: () => ({ getValue: () => "uuid-1" }),
            getApiKeyId: () => keyId,
            getIsActive: () => true,
            getRevokedAt: () => undefined,
            getExpiresAt: () => undefined,
            getEncryptKey: () => "encrypted-blob",
            getOrganizationId: () => "org-1",
            getWorkspaceId: () => undefined,
            getPermissions: () => ["*"],
            getScopes: () => [],
            getRateLimit: () => undefined,
          };
          const repo = {
            findByKeyHash: jest
              .fn()
              .mockImplementation((hash: string) =>
                hash === secretHash
                  ? Promise.resolve(apiKeyMock)
                  : Promise.resolve(null),
              ),
            updateLastUsed: jest.fn().mockResolvedValue(undefined),
          };

          // Correct key → passes
          const encCorrect = { decrypt: jest.fn().mockReturnValue(correctKey) };
          const rateLimiterMock = {
            check: jest.fn().mockResolvedValue({
              allowed: true,
              remaining: 99,
              limit: 100,
              resetAt: 0,
            }),
          };
          const guardCorrect = new IngestionAuthGuard(
            repo as any,
            encCorrect as any,
            rateLimiterMock as any,
          );
          const encoded = Buffer.from(`${keyId}:${keySecret}`).toString(
            "base64",
          );
          const ctxCorrect = makeContext({
            authorization: `Basic ${encoded}`,
            [TFO_ENCRYPTION_KEY_HEADER]: correctKey,
          });
          expect(await guardCorrect.canActivate(ctxCorrect)).toBe(true);

          // Wrong key → fails
          const encWrong = { decrypt: jest.fn().mockReturnValue(correctKey) }; // stored = correctKey
          const guardWrong = new IngestionAuthGuard(
            repo as any,
            encWrong as any,
            rateLimiterMock as any,
          );
          const ctxWrong = makeContext({
            authorization: `Basic ${encoded}`,
            [TFO_ENCRYPTION_KEY_HEADER]: wrongKey, // presented = wrongKey
          });
          await expect(guardWrong.canActivate(ctxWrong)).rejects.toThrow(
            UnauthorizedException,
          );
        },
      ),
      { numRuns: 30 },
    );
  });
});
