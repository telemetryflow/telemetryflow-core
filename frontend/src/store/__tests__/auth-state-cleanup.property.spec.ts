/**
 * Property-Based Tests for Auth Store - Frontend State Cleanup on Logout
 * Feature: frontend-backend-auth-integration
 * Task 13.3: Write property test for state cleanup
 *
 * Property 31: Frontend state cleanup on logout
 * **Validates: Requirements 9.5, 9.6**
 *
 * For any authenticated state, after logout ALL frontend state must be cleaned up:
 * tokens cleared from memory, user data removed, session state reset.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import type { UserProfile, LoginWithMFAResponse } from '@/types';

// Mock the authApi module
vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    verifyMFA: vi.fn(),
    getCurrentUser: vi.fn(),
    register: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    refresh: vi.fn(),
    enableMFA: vi.fn(),
    disableMFA: vi.fn(),
    confirmMFA: vi.fn(),
  },
}));

// Mock the iamClient module
vi.mock('@/api/iam', () => ({
  iamClient: {
    getRefreshToken: vi.fn().mockReturnValue(null),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    hasValidToken: vi.fn().mockReturnValue(false),
    setAccessTokenCallback: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
  default: {
    getRefreshToken: vi.fn().mockReturnValue(null),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    hasValidToken: vi.fn().mockReturnValue(false),
    setAccessTokenCallback: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const userProfileArb = fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  roles: fc.array(
    fc.constantFrom('administrator', 'developer', 'viewer', 'demo', 'super_administrator'),
    { minLength: 1, maxLength: 3 },
  ),
  permissions: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
  avatar: fc.option(fc.webUrl(), { nil: null }),
  tenantId: fc.option(fc.uuid(), { nil: null }),
  organizationId: fc.option(fc.uuid(), { nil: null }),
});

const accessTokenArb = fc
  .string({ minLength: 20, maxLength: 200 })
  .filter(s => s.trim().length > 0);

// MFA session state: either no MFA pending, or MFA pending with a session token
const mfaStateArb = fc.oneof(
  fc.constant({ mfaRequired: false, sessionToken: undefined as string | undefined }),
  fc.record({ mfaRequired: fc.constant(true), sessionToken: fc.uuid() }),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Log in a user and return the store in an authenticated state. */
async function loginUser(
  userProfile: UserProfile,
  token: string,
): Promise<ReturnType<typeof useAuthStore>> {
  const { authApi } = await import('@/api/auth');

  const mockResponse: LoginWithMFAResponse = {
    accessToken: token,
    refreshToken: 'refresh-' + token,
    expiresIn: 900,
    tokenType: 'Bearer',
    user: userProfile,
    mfaRequired: false,
  };

  vi.mocked(authApi.login).mockResolvedValueOnce(mockResponse);
  vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

  const store = useAuthStore();
  await store.login(userProfile.email, 'any-password');
  return store;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Feature: frontend-backend-auth-integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  /**
   * Property 31: Frontend state cleanup on logout
   * **Validates: Requirements 9.5, 9.6**
   */
  describe('Property 31: Frontend state cleanup on logout', () => {
    it('after logout, isAuthenticated is false', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArb, accessTokenArb, async (userProfile, token) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          const store = await loginUser(userProfile, token);
          expect(store.isAuthenticated).toBe(true);

          await store.logout();

          expect(store.isAuthenticated).toBe(false);
        }),
        { numRuns: 50 },
      );
    });

    it('after logout, user is null', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArb, accessTokenArb, async (userProfile, token) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          const store = await loginUser(userProfile, token);
          expect(store.user).not.toBeNull();

          await store.logout();

          expect(store.user).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('after logout, accessToken is null (cleared from memory)', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArb, accessTokenArb, async (userProfile, token) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          const store = await loginUser(userProfile, token);
          expect(store.accessToken).toBe(token);

          await store.logout();

          expect(store.accessToken).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('after logout, mfaRequired is false', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArb, accessTokenArb, async (userProfile, token) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          const store = await loginUser(userProfile, token);
          await store.logout();

          expect(store.mfaRequired).toBe(false);
        }),
        { numRuns: 50 },
      );
    });

    it('after logout, mfaSession is null', async () => {
      const { authApi } = await import('@/api/auth');

      await fc.assert(
        fc.asyncProperty(userProfileArb, mfaStateArb, async (userProfile, mfaState) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          if (mfaState.mfaRequired) {
            // Simulate a pending MFA session then logout without completing MFA
            const mfaResponse: LoginWithMFAResponse = {
              accessToken: '',
              refreshToken: '',
              expiresIn: 0,
              tokenType: 'Bearer',
              user: userProfile,
              mfaRequired: true,
              sessionToken: mfaState.sessionToken,
            };
            vi.mocked(authApi.login).mockResolvedValueOnce(mfaResponse);
            vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

            const store = useAuthStore();
            await store.login(userProfile.email, 'any-password');
            expect(store.mfaSession).toBe(mfaState.sessionToken);

            await store.logout();
            expect(store.mfaSession).toBeNull();
          } else {
            // Normal login then logout
            const store = await loginUser(userProfile, 'test-token-' + userProfile.id);
            await store.logout();
            expect(store.mfaSession).toBeNull();
          }
        }),
        { numRuns: 50 },
      );
    });

    it('after logout, organizationId is null', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArb, accessTokenArb, async (userProfile, token) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          const store = await loginUser(userProfile, token);
          await store.logout();

          expect(store.organizationId).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('after logout, localStorage no longer contains user data', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArb, accessTokenArb, async (userProfile, token) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          const store = await loginUser(userProfile, token);
          // Confirm user data was stored during login
          expect(localStorage.getItem('tfo-user')).not.toBeNull();

          await store.logout();

          expect(localStorage.getItem('tfo-user')).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('after logout, iamClient.clearTokens() was called', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArb, accessTokenArb, async (userProfile, token) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          const { iamClient } = await import('@/api/iam');

          const store = await loginUser(userProfile, token);
          await store.logout();

          expect(vi.mocked(iamClient.clearTokens)).toHaveBeenCalled();
        }),
        { numRuns: 50 },
      );
    });

    it('all state fields are cleaned up simultaneously on logout (combined property)', async () => {
      await fc.assert(
        fc.asyncProperty(userProfileArb, accessTokenArb, async (userProfile, token) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          localStorage.clear();

          const { iamClient } = await import('@/api/iam');

          const store = await loginUser(userProfile, token);

          // Pre-conditions: authenticated state is set
          expect(store.isAuthenticated).toBe(true);
          expect(store.user).not.toBeNull();
          expect(store.accessToken).toBe(token);

          await store.logout();

          // All state must be cleared atomically
          expect(store.isAuthenticated).toBe(false);
          expect(store.user).toBeNull();
          expect(store.accessToken).toBeNull();
          expect(store.mfaRequired).toBe(false);
          expect(store.mfaSession).toBeNull();
          expect(store.organizationId).toBeNull();
          expect(localStorage.getItem('tfo-user')).toBeNull();
          expect(vi.mocked(iamClient.clearTokens)).toHaveBeenCalled();
        }),
        { numRuns: 50 },
      );
    });
  });
});
