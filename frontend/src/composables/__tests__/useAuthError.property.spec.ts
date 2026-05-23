/**
 * Property 39: Error code mapping
 * Property 42: Consistent error UI
 * Validates: Requirements 11.2, 11.10
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mapAuthError, useAuthError } from '../useAuthError';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeAxiosError(status: number, code?: string, message?: string, retryAfter?: number) {
  return {
    response: {
      status,
      data: {
        message,
        error: code ? { code } : undefined,
        retryAfter,
      },
    },
  };
}

describe('Property 39: Error code mapping', () => {
  const { ERROR_CODE_MAP } = useAuthError();

  // ── Every registered error code maps to a non-empty string ───────────────
  it('every registered error code produces a non-empty user-facing message', () => {
    for (const [code, message] of Object.entries(ERROR_CODE_MAP)) {
      const result = mapAuthError(makeAxiosError(400, code));
      expect(result.message).toBeTruthy();
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.code).toBe(code);
      // Message should match the registered value
      expect(result.message).toBe(message);
    }
  });

  // ── Property: arbitrary unknown codes fall back to HTTP status message ────
  it('unknown error codes fall back to HTTP status message', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => !(s in ERROR_CODE_MAP)),
        fc.constantFrom(400, 401, 403, 404, 422, 429, 500),
        (unknownCode, status) => {
          const result = mapAuthError(makeAxiosError(status, unknownCode));
          expect(result.message).toBeTruthy();
          expect(result.isNetworkError).toBe(false);
        },
      ),
      { numRuns: 30 },
    );
  });

  // ── Property: null/undefined error → network error ────────────────────────
  it('null or undefined error is treated as network error', () => {
    for (const input of [null, undefined, '', 0, false]) {
      const result = mapAuthError(input);
      expect(result.isNetworkError).toBe(true);
      expect(result.message).toBeTruthy();
    }
  });

  // ── Property: error without response → network error ─────────────────────
  it('error without response property is treated as network error', () => {
    fc.assert(
      fc.property(
        fc.record({ message: fc.string() }),
        (err) => {
          const result = mapAuthError(err);
          expect(result.isNetworkError).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  });

  // ── Property: 429 status → isRateLimit = true ────────────────────────────
  it('HTTP 429 responses are flagged as rate limit errors', () => {
    fc.assert(
      fc.property(
        fc.option(fc.integer({ min: 1, max: 300 }), { nil: undefined }),
        (retryAfter) => {
          const result = mapAuthError(makeAxiosError(429, undefined, 'Too many requests', retryAfter));
          expect(result.isRateLimit).toBe(true);
          if (retryAfter !== undefined) {
            expect(result.retryAfter).toBe(retryAfter);
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  // ── Property: non-429 statuses → isRateLimit = false ─────────────────────
  it('non-429 HTTP statuses are not flagged as rate limit errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(400, 401, 403, 404, 500, 502, 503),
        (status) => {
          const result = mapAuthError(makeAxiosError(status));
          expect(result.isRateLimit).toBe(false);
        },
      ),
      { numRuns: 20 },
    );
  });
});

describe('Property 42: Consistent error UI', () => {
  // ── Property: all mapped errors have non-empty messages ───────────────────
  it('all error inputs produce a non-empty message string', () => {
    const inputs = [
      null,
      undefined,
      { response: { status: 400, data: { message: 'Bad request' } } },
      { response: { status: 401, data: { error: { code: 'AUTH_TOKEN_EXPIRED' } } } },
      { response: { status: 500, data: {} } },
      { message: 'Network Error' },
      {},
    ];

    for (const input of inputs) {
      const result = mapAuthError(input);
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  // ── Property: error messages never expose internal stack traces ───────────
  it('error messages do not contain stack trace indicators', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(400, 401, 403, 404, 422, 429, 500),
        fc.option(fc.string({ minLength: 1, maxLength: 40 }), { nil: undefined }),
        (status, code) => {
          const result = mapAuthError(makeAxiosError(status, code));
          expect(result.message).not.toMatch(/at\s+\w+\s*\(/); // no stack frames
          expect(result.message).not.toMatch(/Error:/);
          expect(result.message).not.toMatch(/undefined/i);
        },
      ),
      { numRuns: 30 },
    );
  });

  // ── Property: MappedError always has all required fields ─────────────────
  it('mapAuthError always returns a complete MappedError object', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(400, 401, 403, 404, 429, 500),
        (status) => {
          const result = mapAuthError(makeAxiosError(status));
          expect(typeof result.message).toBe('string');
          expect(typeof result.isNetworkError).toBe('boolean');
          expect(typeof result.isRateLimit).toBe('boolean');
          // code and retryAfter can be null
          expect('code' in result).toBe(true);
          expect('retryAfter' in result).toBe(true);
        },
      ),
      { numRuns: 30 },
    );
  });
});
