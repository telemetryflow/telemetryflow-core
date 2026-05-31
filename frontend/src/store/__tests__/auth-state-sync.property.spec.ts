/**
 * Property-Based Tests for Auth Store - Frontend State Synchronization
 * Feature: frontend-backend-auth-integration
 * Task 13.2: Write property test for frontend state sync
 *
 * Property 4: Frontend state synchronization
 * **Validates: Requirements 1.6**
 *
 * For any successful authentication, the frontend Pinia store should be updated
 * with user data and tokens should be stored securely.
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

// Arbitraries for generating test data
const userProfileArb = fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  roles: fc.array(fc.constantFrom('administrator', 'developer', 'viewer', 'demo', 'super_administrator'), { minLength: 1, maxLength: 3 }),
  permissions: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
  avatar: fc.option(fc.webUrl(), { nil: null }),
  tenantId: fc.option(fc.uuid(), { nil: null }),
  organizationId: fc.option(fc.uuid(), { nil: null }),
});

const accessTokenArb = fc.string({ minLength: 20, maxLength: 200 }).filter(s => s.trim().length > 0);

describe('Feature: frontend-backend-auth-integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  /**
   * Property 4: Frontend state synchronization
   * **Validates: Requirements 1.6**
   */
  describe('Property 4: Frontend state synchronization', () => {
    it('after login with valid credentials, isAuthenticated becomes true', async () => {
      const { authApi } = await import('@/api/auth');

      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          accessTokenArb,
          async (userProfile, token) => {
            // Fresh store for each iteration
            setActivePinia(createPinia());
            vi.clearAllMocks();
            localStorage.clear();

            const mockResponse: LoginWithMFAResponse = {
              accessToken: token,
              refreshToken: 'refresh-' + token,
              expiresIn: 900,
              tokenType: 'Bearer',
              user: userProfile,
              mfaRequired: false,
            };

            vi.mocked(authApi.login).mockResolvedValueOnce(mockResponse);

            const store = useAuthStore();
            expect(store.isAuthenticated).toBe(false);

            const result = await store.login(userProfile.email, 'any-password');

            expect(result).toBe(true);
            expect(store.isAuthenticated).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('after login, user state matches the response user data', async () => {
      const { authApi } = await import('@/api/auth');

      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          accessTokenArb,
          async (userProfile, token) => {
            setActivePinia(createPinia());
            vi.clearAllMocks();
            localStorage.clear();

            const mockResponse: LoginWithMFAResponse = {
              accessToken: token,
              refreshToken: 'refresh-' + token,
              expiresIn: 900,
              tokenType: 'Bearer',
              user: userProfile,
              mfaRequired: false,
            };

            vi.mocked(authApi.login).mockResolvedValueOnce(mockResponse);

            const store = useAuthStore();
            await store.login(userProfile.email, 'any-password');

            // User state must match the response user data exactly
            expect(store.user).toEqual(userProfile);
            expect(store.user?.id).toBe(userProfile.id);
            expect(store.user?.email).toBe(userProfile.email);
            expect(store.user?.username).toBe(userProfile.username);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('after login, accessToken is set in memory', async () => {
      const { authApi } = await import('@/api/auth');

      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          accessTokenArb,
          async (userProfile, token) => {
            setActivePinia(createPinia());
            vi.clearAllMocks();
            localStorage.clear();

            const mockResponse: LoginWithMFAResponse = {
              accessToken: token,
              refreshToken: 'refresh-' + token,
              expiresIn: 900,
              tokenType: 'Bearer',
              user: userProfile,
              mfaRequired: false,
            };

            vi.mocked(authApi.login).mockResolvedValueOnce(mockResponse);

            const store = useAuthStore();
            expect(store.accessToken).toBeNull();

            await store.login(userProfile.email, 'any-password');

            // Access token must be set in memory (the store's reactive state)
            expect(store.accessToken).toBe(token);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('after logout, all auth state is cleared', async () => {
      const { authApi } = await import('@/api/auth');

      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          accessTokenArb,
          async (userProfile, token) => {
            setActivePinia(createPinia());
            vi.clearAllMocks();
            localStorage.clear();

            // First, log in
            const mockLoginResponse: LoginWithMFAResponse = {
              accessToken: token,
              refreshToken: 'refresh-' + token,
              expiresIn: 900,
              tokenType: 'Bearer',
              user: userProfile,
              mfaRequired: false,
            };

            vi.mocked(authApi.login).mockResolvedValueOnce(mockLoginResponse);
            vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);

            const store = useAuthStore();
            await store.login(userProfile.email, 'any-password');

            // Verify logged in
            expect(store.isAuthenticated).toBe(true);

            // Now logout
            await store.logout();

            // All auth state must be cleared
            expect(store.isAuthenticated).toBe(false);
            expect(store.user).toBeNull();
            expect(store.accessToken).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('MFA flow: when login returns mfaRequired=true, mfaRequired state is set and isAuthenticated remains false', async () => {
      const { authApi } = await import('@/api/auth');

      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          fc.uuid(), // mfa session token
          async (userProfile, mfaSessionToken) => {
            setActivePinia(createPinia());
            vi.clearAllMocks();
            localStorage.clear();

            const mockMfaResponse: LoginWithMFAResponse = {
              accessToken: '',
              refreshToken: '',
              expiresIn: 0,
              tokenType: 'Bearer',
              user: userProfile,
              mfaRequired: true,
              sessionToken: mfaSessionToken,
            };

            vi.mocked(authApi.login).mockResolvedValueOnce(mockMfaResponse);

            const store = useAuthStore();
            const result = await store.login(userProfile.email, 'any-password');

            // Login returns false when MFA is required (not fully authenticated yet)
            expect(result).toBe(false);

            // mfaRequired flag must be set
            expect(store.mfaRequired).toBe(true);

            // isAuthenticated must remain false until MFA is verified
            expect(store.isAuthenticated).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
