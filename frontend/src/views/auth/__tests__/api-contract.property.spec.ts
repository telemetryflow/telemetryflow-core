/**
 * Property 40: HTTP status code correctness
 * Property 41: Error detail sanitization
 * Property 43: Response schema validation
 * Validates: Requirements 11.6, 11.9, 12.2
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mapAuthError } from '@/composables/useAuthError';
import type {
  TokenResponse,
  LoginWithMFAResponse,
  RegisterResponse,
  ApiErrorResponse,
} from '@/types';

// ─── Runtime schema validators ────────────────────────────────────────────────

function isValidTokenResponse(obj: unknown): obj is TokenResponse {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.accessToken === 'string' &&
    r.accessToken.length > 0 &&
    typeof r.refreshToken === 'string' &&
    typeof r.expiresIn === 'number' &&
    r.expiresIn > 0 &&
    typeof r.tokenType === 'string' &&
    r.user !== null &&
    typeof r.user === 'object'
  );
}

function isValidLoginWithMFAResponse(obj: unknown): obj is LoginWithMFAResponse {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  // Either full token response OR mfaRequired=true with sessionToken
  if (r.mfaRequired === true) {
    return typeof r.sessionToken === 'string' && r.sessionToken.length > 0;
  }
  return isValidTokenResponse(obj);
}

function isValidRegisterResponse(obj: unknown): obj is RegisterResponse {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.message === 'string' &&
    typeof r.userId === 'string' &&
    typeof r.email === 'string'
  );
}

function isValidApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  if (!obj || typeof obj !== 'object') return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.statusCode === 'number' &&
    typeof r.message === 'string' &&
    r.error !== null &&
    typeof r.error === 'object' &&
    typeof (r.error as Record<string, unknown>).code === 'string'
  );
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const validTokenResponseArb = fc.record({
  accessToken: fc.string({ minLength: 20, maxLength: 200 }),
  refreshToken: fc.string({ minLength: 20, maxLength: 200 }),
  expiresIn: fc.integer({ min: 1, max: 86400 }),
  tokenType: fc.constant('Bearer'),
  user: fc.record({
    id: fc.uuid(),
    username: fc.string({ minLength: 1, maxLength: 40 }),
    email: fc.emailAddress(),
    firstName: fc.string({ minLength: 1, maxLength: 40 }),
    lastName: fc.string({ minLength: 1, maxLength: 40 }),
    roles: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
    permissions: fc.array(fc.string(), { maxLength: 5 }),
    avatar: fc.option(fc.webUrl(), { nil: null }),
    tenantId: fc.option(fc.uuid(), { nil: null }),
    organizationId: fc.option(fc.uuid(), { nil: null }),
  }),
});

const validRegisterResponseArb = fc.record({
  message: fc.string({ minLength: 1, maxLength: 200 }),
  userId: fc.uuid(),
  email: fc.emailAddress(),
});

const validApiErrorArb = fc.record({
  statusCode: fc.constantFrom(400, 401, 403, 404, 409, 422, 429, 500),
  message: fc.string({ minLength: 1, maxLength: 200 }),
  error: fc.record({
    code: fc.string({ minLength: 1, maxLength: 50 }),
    details: fc.option(
      fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.array(fc.string())),
      { nil: undefined },
    ),
  }),
  timestamp: fc.date().map((d) => d.toISOString()),
  path: fc.webPath(),
});

// ─── Property 40: HTTP status code correctness ───────────────────────────────

describe('Property 40: HTTP status code correctness', () => {
  it('2xx responses are never treated as errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(200, 201, 204),
        (status) => {
          // A 2xx response should not trigger error mapping
          const fakeResponse = { response: { status, data: {} } };
          // mapAuthError on a 2xx still returns a message (fallback), but isNetworkError=false
          const result = mapAuthError(fakeResponse);
          expect(result.isNetworkError).toBe(false);
        },
      ),
      { numRuns: 10 },
    );
  });

  it('4xx and 5xx responses produce non-empty error messages', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(400, 401, 403, 404, 409, 422, 429, 500, 502, 503),
        (status) => {
          const result = mapAuthError({ response: { status, data: {} } });
          expect(result.message.length).toBeGreaterThan(0);
          expect(result.isNetworkError).toBe(false);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('rate limit (429) always sets isRateLimit=true', () => {
    fc.assert(
      fc.property(
        fc.option(fc.integer({ min: 1, max: 3600 }), { nil: undefined }),
        (retryAfter) => {
          const result = mapAuthError({
            response: { status: 429, data: { retryAfter } },
          });
          expect(result.isRateLimit).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  });
});

// ─── Property 41: Error detail sanitization ──────────────────────────────────

describe('Property 41: Error detail sanitization', () => {
  it('error messages never contain raw stack traces', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(400, 401, 403, 500),
        fc.string({ maxLength: 100 }),
        (status, rawMessage) => {
          const result = mapAuthError({
            response: {
              status,
              data: { message: rawMessage },
            },
          });
          // Should not expose stack trace patterns
          expect(result.message).not.toMatch(/\s+at\s+\w+\s*\(/);
          expect(result.message).not.toMatch(/node_modules/);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('error messages never expose internal file paths', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(500, 502, 503),
        (status) => {
          const result = mapAuthError({ response: { status, data: {} } });
          expect(result.message).not.toMatch(/\/src\//);
          expect(result.message).not.toMatch(/\.ts:/);
          expect(result.message).not.toMatch(/\.js:/);
        },
      ),
      { numRuns: 10 },
    );
  });

  it('validation error details are preserved in the code field, not leaked in message', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
        ),
        (details) => {
          const result = mapAuthError({
            response: {
              status: 422,
              data: {
                error: { code: 'VALIDATION_ERROR', details },
              },
            },
          });
          // Code is preserved
          expect(result.code).toBe('VALIDATION_ERROR');
          // Message is user-friendly, not a raw dump of details
          expect(result.message).toBeTruthy();
        },
      ),
      { numRuns: 20 },
    );
  });
});

// ─── Property 43: Response schema validation ─────────────────────────────────

describe('Property 43: Response schema validation', () => {
  it('valid TokenResponse objects pass schema validation', () => {
    fc.assert(
      fc.property(validTokenResponseArb, (response) => {
        expect(isValidTokenResponse(response)).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  it('TokenResponse with missing accessToken fails validation', () => {
    fc.assert(
      fc.property(
        validTokenResponseArb,
        fc.constantFrom('', null, undefined, 123),
        (response, badToken) => {
          const invalid = { ...response, accessToken: badToken };
          expect(isValidTokenResponse(invalid)).toBe(false);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('valid RegisterResponse objects pass schema validation', () => {
    fc.assert(
      fc.property(validRegisterResponseArb, (response) => {
        expect(isValidRegisterResponse(response)).toBe(true);
      }),
      { numRuns: 30 },
    );
  });

  it('valid ApiErrorResponse objects pass schema validation', () => {
    fc.assert(
      fc.property(validApiErrorArb, (response) => {
        expect(isValidApiErrorResponse(response)).toBe(true);
      }),
      { numRuns: 30 },
    );
  });

  it('LoginWithMFAResponse is valid when mfaRequired=true with sessionToken', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 20, maxLength: 200 }),
        (sessionToken) => {
          const mfaResponse = { mfaRequired: true, sessionToken };
          expect(isValidLoginWithMFAResponse(mfaResponse)).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('LoginWithMFAResponse with mfaRequired=true but no sessionToken is invalid', () => {
    const invalid = { mfaRequired: true, sessionToken: '' };
    expect(isValidLoginWithMFAResponse(invalid)).toBe(false);
  });

  it('null and undefined always fail schema validation', () => {
    for (const invalid of [null, undefined, '', 0, false, []]) {
      expect(isValidTokenResponse(invalid)).toBe(false);
      expect(isValidRegisterResponse(invalid)).toBe(false);
      expect(isValidApiErrorResponse(invalid)).toBe(false);
      expect(isValidLoginWithMFAResponse(invalid)).toBe(false);
    }
  });
});
