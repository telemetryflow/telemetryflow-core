/**
 * Auth store - JWT authentication state management
 * Supports 5-tier RBAC: SUPER_ADMINISTRATOR, ADMINISTRATOR, DEVELOPER, VIEWER, DEMO
 *
 * Token storage strategy:
 * - Access tokens: stored in memory (this store's reactive state)
 * - Refresh tokens: managed by iamClient (localStorage or httpOnly cookies)
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "@/api/auth";
import { iamClient } from "@/api/iam";
import { config } from "@/config";
import type {
  UserProfile,
  RegisterRequest,
  ChangePasswordRequest,
  MFASetupData,
} from "@/types";

const USER_STORAGE_KEY = "tfo-user";

// 5-tier RBAC roles
export const UserRole = {
  SUPER_ADMINISTRATOR: "super_administrator",
  ADMINISTRATOR: "administrator",
  DEVELOPER: "developer",
  VIEWER: "viewer",
  DEMO: "demo",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const useAuthStore = defineStore("auth", () => {
  // ─── Core auth state ───────────────────────────────────────────────────────
  const isAuthenticated = ref(false);
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const user = ref<UserProfile | null>(null);
  const loginError = ref<string | null>(null);

  // Access token stored in memory (not localStorage) per security requirements
  const accessToken = ref<string | null>(null);

  // ─── MFA state ─────────────────────────────────────────────────────────────
  // When login returns mfaRequired=true, we hold the session token here
  // until the user completes MFA verification
  const mfaRequired = ref(false);
  const mfaSession = ref<string | null>(null);

  // ─── Organization state ────────────────────────────────────────────────────
  const organizationId = ref<string | null>(null);
  const organizationName = ref<string | null>(null);

  // ─── Getters ───────────────────────────────────────────────────────────────
  const currentUser = computed(() => user.value);
  const userRoles = computed(() => user.value?.roles || []);
  const userPermissions = computed(() => user.value?.permissions || []);
  const isMfaRequired = computed(() => mfaRequired.value);

  const displayName = computed(() => {
    if (user.value) {
      return (
        `${user.value.firstName} ${user.value.lastName}`.trim() ||
        user.value.email
      );
    }
    return null;
  });

  // ─── Role/permission helpers ───────────────────────────────────────────────
  function hasRole(role: string): boolean {
    return userRoles.value.includes(role);
  }

  function hasPermission(permission: string): boolean {
    return userPermissions.value.includes(permission);
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => userPermissions.value.includes(p));
  }

  function hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((p) => userPermissions.value.includes(p));
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────
  function _setAuthenticatedUser(
    userData: UserProfile,
    token: string | null,
  ): void {
    user.value = userData;
    isAuthenticated.value = true;
    accessToken.value = token;
    organizationId.value = userData.organizationId ?? null;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  }

  function _clearAuthState(): void {
    isAuthenticated.value = false;
    user.value = null;
    accessToken.value = null;
    mfaRequired.value = false;
    mfaSession.value = null;
    organizationId.value = null;
    organizationName.value = null;
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  /**
   * Login with username/email and password.
   * Returns true on full success, false on error.
   * When MFA is required, sets mfaRequired=true and returns false —
   * the caller should redirect to the MFA verification step.
   */
  async function login(identifier: string, password: string): Promise<boolean> {
    loginError.value = null;
    isLoading.value = true;

    try {
      const response = await authApi.login({ email: identifier, password });

      if (response.mfaRequired) {
        // Pending MFA — store session token for the verification step
        mfaRequired.value = true;
        mfaSession.value = response.sessionToken ?? null;
        return false;
      }

      _setAuthenticatedUser(response.user, response.accessToken ?? null);
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; error?: { code?: string } } };
        message?: string;
      };

      // Surface deactivated-account errors distinctly
      const code = err.response?.data?.error?.code;
      if (code === "AUTH_ACCOUNT_DEACTIVATED") {
        loginError.value = "account_deactivated";
      } else {
        loginError.value =
          err.response?.data?.message || err.message || "Login failed";
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ─── MFA verification ──────────────────────────────────────────────────────
  /**
   * Complete login by verifying the TOTP/backup code after mfaRequired=true.
   */
  async function verifyMFA(code: string): Promise<boolean> {
    if (!mfaSession.value) {
      loginError.value = "No pending MFA session";
      return false;
    }

    isLoading.value = true;
    loginError.value = null;

    try {
      const response = await authApi.verifyMFA({
        code,
        sessionToken: mfaSession.value,
      });

      mfaRequired.value = false;
      mfaSession.value = null;
      _setAuthenticatedUser(response.user, response.accessToken ?? null);
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message || err.message || "MFA verification failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ─── Registration ──────────────────────────────────────────────────────────
  /**
   * Register a new user account.
   * On success the backend creates an organization and sends a verification email.
   */
  async function register(data: RegisterRequest): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;

    try {
      await authApi.register(data);
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message || err.message || "Registration failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ─── Email verification ────────────────────────────────────────────────────
  async function verifyEmail(token: string): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;

    try {
      await authApi.verifyEmail({ token });
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message ||
        err.message ||
        "Email verification failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function resendVerification(email: string): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;

    try {
      await authApi.resendVerification(email);
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message ||
        err.message ||
        "Failed to resend verification email";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ─── Password management ───────────────────────────────────────────────────
  async function forgotPassword(email: string): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;

    try {
      await authApi.forgotPassword({ email });
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message ||
        err.message ||
        "Failed to send password reset email";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function resetPassword(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;

    try {
      await authApi.resetPassword({ token, password: newPassword });
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message || err.message || "Password reset failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message ||
        err.message ||
        "Password change failed";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ─── Token refresh ─────────────────────────────────────────────────────────
  /**
   * Refresh the access token using the stored refresh token.
   * Updates the in-memory accessToken on success.
   */
  async function refreshToken(): Promise<boolean> {
    const storedRefreshToken = iamClient.getRefreshToken();
    if (!storedRefreshToken) return false;

    try {
      const response = await authApi.refresh({
        refreshToken: storedRefreshToken,
      });
      accessToken.value = response.accessToken ?? null;
      if (response.user) {
        user.value = response.user;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      }
      return true;
    } catch {
      _clearAuthState();
      iamClient.clearTokens();
      return false;
    }
  }

  // ─── MFA setup / enable / disable ─────────────────────────────────────────
  /**
   * Initiate MFA setup — returns secret, QR code, and backup codes.
   */
  async function setupMFA(): Promise<MFASetupData | null> {
    isLoading.value = true;
    loginError.value = null;

    try {
      const response = await authApi.enableMFA();
      return {
        secret: response.secret,
        qrCode: response.qrCode,
        backupCodes: response.backupCodes,
      };
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message || err.message || "MFA setup failed";
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Confirm and enable MFA by verifying the initial TOTP code.
   */
  async function enableMFA(code: string): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;

    try {
      await authApi.confirmMFA(code);
      if (user.value) {
        // Reflect MFA enabled in local user state
        user.value = { ...user.value };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.value));
      }
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message || err.message || "Failed to enable MFA";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Disable MFA — requires password re-authentication.
   */
  async function disableMFA(password: string): Promise<boolean> {
    isLoading.value = true;
    loginError.value = null;

    try {
      await authApi.disableMFA(password);
      if (user.value) {
        user.value = { ...user.value };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user.value));
      }
      return true;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      loginError.value =
        err.response?.data?.message || err.message || "Failed to disable MFA";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ─── Logout ────────────────────────────────────────────────────────────────
  async function logout(): Promise<void> {
    isLoading.value = true;

    try {
      await authApi.logout();
    } catch {
      // Ignore errors during logout
    } finally {
      _clearAuthState();
      iamClient.clearTokens();
      // Deregister the token-refresh callback so there are no stale closures
      iamClient.setAccessTokenCallback(null);
      isLoading.value = false;
    }
  }

  // ─── Profile helpers ───────────────────────────────────────────────────────
  async function refreshUser(): Promise<void> {
    try {
      const profile = await authApi.getCurrentUser();
      user.value = profile;
      organizationId.value = profile.organizationId ?? null;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      await logout();
    }
  }

  /**
   * Initialize auth state from localStorage / existing tokens on app boot.
   *
   * Strategy: proactively refresh the access token before marking the user as
   * authenticated so that every subsequent API request (collectorClient, etc.)
   * fires with a valid Bearer token.  This eliminates the race condition where
   * components mount and call APIs while accessToken is still null.
   */
  async function initializeFromStorage(): Promise<void> {
    if (isInitialized.value) return;

    // Keep the store's accessToken ref in sync whenever iamClient silently
    // refreshes the token via the 401 response interceptor.
    iamClient.setAccessTokenCallback((newToken: string) => {
      accessToken.value = newToken;
    });

    const hasToken = iamClient.hasValidToken();

    if (hasToken) {
      if (config.useMock) {
        // In mock mode there is no real backend — restore from localStorage
        // cache directly (mock tokens never expire).
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser) as UserProfile;
            user.value = parsed;
            organizationId.value = parsed.organizationId ?? null;
            isAuthenticated.value = true;
          } catch {
            iamClient.clearTokens();
            localStorage.removeItem(USER_STORAGE_KEY);
          }
        } else {
          iamClient.clearTokens();
        }
      } else {
        // Real mode: proactively refresh to get a fresh access token before
        // any component fires an API request.  This writes the new accessToken
        // into both iamClient._accessToken and this store's accessToken ref,
        // eliminating the race condition where components mount with null token.
        const tokenOk = await refreshToken();

        if (tokenOk) {
          // refreshToken() already populated user.value if the backend returned
          // user data; fall back to localStorage cache otherwise.
          if (!user.value) {
            const storedUser = localStorage.getItem(USER_STORAGE_KEY);
            if (storedUser) {
              try {
                const parsed = JSON.parse(storedUser) as UserProfile;
                user.value = parsed;
                organizationId.value = parsed.organizationId ?? null;
              } catch {
                /* ignore malformed cache */
              }
            }
          }
          isAuthenticated.value = true;
        } else {
          // Refresh failed (expired / revoked) — clear so router redirects to login.
          iamClient.clearTokens();
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
    }

    isInitialized.value = true;
  }

  // ─── SSO login ─────────────────────────────────────────────────────────────
  /**
   * Complete SSO login using tokens received from the callback redirect.
   * The backend already exchanged the auth code — we just store the tokens
   * and fetch the user profile.
   */
  function loginWithSSOTokens(token: string, refreshTok: string): void {
    accessToken.value = token;
    localStorage.setItem("tfo-refresh-token", refreshTok);
  }

  // ─── Misc ──────────────────────────────────────────────────────────────────
  function clearError(): void {
    loginError.value = null;
  }

  /**
   * Set user data directly (e.g. after external MFA verification).
   */
  function setUser(userData: UserProfile): void {
    _setAuthenticatedUser(userData, accessToken.value);
  }

  return {
    // State
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
    loginError,
    accessToken,
    mfaRequired,
    mfaSession,
    organizationId,
    organizationName,

    // Getters
    currentUser,
    userRoles,
    userPermissions,
    displayName,
    isMfaRequired,

    // Role/permission helpers
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Actions
    login,
    verifyMFA,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshToken,
    setupMFA,
    enableMFA,
    disableMFA,
    logout,
    refreshUser,
    initializeFromStorage,
    clearError,
    setUser,
    loginWithSSOTokens,
  };
});
