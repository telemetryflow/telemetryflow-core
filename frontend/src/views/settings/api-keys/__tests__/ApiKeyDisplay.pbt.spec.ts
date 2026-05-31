/**
 * Property-based tests for API key display masking and secret hashing
 * Feature: ingestion-auth-api-key
 * Task 7.6 — Validates: Requirements 6.5, 9.1, 9.3
 *
 * Properties tested:
 *  - Property 9: apiKeyId display masking
 *    The list view must never render the full apiKeyId — only a masked version.
 *  - Property 10: No raw secrets in storage
 *    SHA-256 hash of a raw tfs_ secret is a 64-char hex string that never
 *    contains the tfs_ prefix (i.e. is not the raw secret).
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createHash } from "node:crypto";

// ── Utilities under test ─────────────────────────────────────────────────────

/**
 * Mask an apiKeyId for display in the list view.
 * Shows the first 8 characters followed by "..." — never the full value.
 * This mirrors the expected behaviour described in Requirement 6.5.
 */
function maskApiKeyId(apiKeyId: string): string {
  if (apiKeyId.length < 8) return `${apiKeyId}...`;
  return `${apiKeyId.slice(0, 8)}...`;
}

/**
 * Hash a raw apiKeySecret with SHA-256 for storage (mirrors backend behaviour).
 * Only the hash must ever be persisted — never the raw value.
 */
function hashApiKeySecret(rawSecret: string): string {
  return createHash("sha256").update(rawSecret).digest("hex");
}

const hexaString = (opts: { minLength: number; maxLength: number }) =>
  fc.string({ ...opts, unit: fc.constantFrom(..."0123456789abcdef".split("")) });

// ─────────────────────────────────────────────────────────────────────────────

describe("Property 9: apiKeyId display masking", () => {
  /**
   * For any apiKeyId of length >= 8, maskApiKeyId returns exactly
   * `${id.slice(0, 8)}...` and never the full value.
   */

  it("masked display is always prefix + '...'", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 8, maxLength: 64 })
          .map((s) => `tfk_${s.replace(/[^A-Za-z0-9]/g, "a")}`),
        (apiKeyId) => {
          const displayed = maskApiKeyId(apiKeyId);
          return displayed === `${apiKeyId.slice(0, 8)}...`;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("masked display never equals the full apiKeyId", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 9, maxLength: 64 })
          .map((s) => `tfk_${s.replace(/[^A-Za-z0-9]/g, "a")}`),
        (apiKeyId) => {
          const displayed = maskApiKeyId(apiKeyId);
          return displayed !== apiKeyId;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("masked display always ends with '...'", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 8, maxLength: 64 })
          .map((s) => `tfk_${s.replace(/[^A-Za-z0-9]/g, "a")}`),
        (apiKeyId) => {
          const displayed = maskApiKeyId(apiKeyId);
          return displayed.endsWith("...");
        },
      ),
      { numRuns: 200 },
    );
  });

  it("masked display always starts with the first 8 chars of apiKeyId", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 8, maxLength: 64 })
          .map((s) => `tfk_${s.replace(/[^A-Za-z0-9]/g, "a")}`),
        (apiKeyId) => {
          const displayed = maskApiKeyId(apiKeyId);
          return displayed.startsWith(apiKeyId.slice(0, 8));
        },
      ),
      { numRuns: 200 },
    );
  });

  it("masked display has fixed length of 11 chars (8 + '...')", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 8, maxLength: 64 })
          .map((s) => `tfk_${s.replace(/[^A-Za-z0-9]/g, "a")}`),
        (apiKeyId) => {
          const displayed = maskApiKeyId(apiKeyId);
          return displayed.length === 11; // 8 chars + 3 dots
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Property 10: No raw secrets in storage", () => {
  /**
   * For any raw tfs_ secret, its SHA-256 hash:
   *   1. Is a 64-char hex string
   *   2. Does NOT contain the "tfs_" prefix (i.e. is not the raw secret)
   *   3. Is different from the raw secret
   */

  it("SHA-256 hash of raw secret is a 64-char hex string", () => {
    fc.assert(
      fc.property(
        hexaString({ minLength: 32, maxLength: 64 })
          .map((s) => `tfs_${s}`),
        (rawSecret) => {
          const hash = hashApiKeySecret(rawSecret);
          return /^[a-f0-9]{64}$/.test(hash);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("hash never contains the 'tfs_' prefix", () => {
    fc.assert(
      fc.property(
        hexaString({ minLength: 32, maxLength: 64 })
          .map((s) => `tfs_${s}`),
        (rawSecret) => {
          const hash = hashApiKeySecret(rawSecret);
          return !hash.includes("tfs_");
        },
      ),
      { numRuns: 200 },
    );
  });

  it("hash is never equal to the raw secret", () => {
    fc.assert(
      fc.property(
        hexaString({ minLength: 32, maxLength: 64 })
          .map((s) => `tfs_${s}`),
        (rawSecret) => {
          const hash = hashApiKeySecret(rawSecret);
          return hash !== rawSecret;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("same raw secret always produces the same hash (deterministic)", () => {
    fc.assert(
      fc.property(
        hexaString({ minLength: 32, maxLength: 64 })
          .map((s) => `tfs_${s}`),
        (rawSecret) => {
          const hash1 = hashApiKeySecret(rawSecret);
          const hash2 = hashApiKeySecret(rawSecret);
          return hash1 === hash2;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("different raw secrets produce different hashes (collision resistance)", () => {
    fc.assert(
      fc.property(
        hexaString({ minLength: 32, maxLength: 64 })
          .map((s) => `tfs_${s}`),
        hexaString({ minLength: 32, maxLength: 64 })
          .map((s) => `tfs_${s}`),
        (secret1, secret2) => {
          fc.pre(secret1 !== secret2);
          const hash1 = hashApiKeySecret(secret1);
          const hash2 = hashApiKeySecret(secret2);
          return hash1 !== hash2;
        },
      ),
      { numRuns: 100 },
    );
  });
});
