/**
 * Auth API functions for TelemetryFlow Platform
 * Supports 5-Tier RBAC with Administrator and Demo as default users
 */

import { iamClient } from "./iam";
import { config } from "@/config";
import {
  authenticateUser,
  generateMockTokens,
  getUserProfile,
  MOCK_USER_CREDENTIALS,
} from "@/mocks";
import type {
  LoginRequest,
  TokenResponse,
  UserProfile,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  MFAVerifyRequest,
  MFAEnableResponse,
  LoginWithMFAResponse,
  ChangePasswordRequest,
} from "@/types";

// ==================== DEFAULT USERS ====================
// Two default users for quick access:
// - Administrator: Full organization access (Tier 2)
// - Demo: Limited demo access with auto-cleanup (Tier 5)

export const DEFAULT_USERS = {
  administrator: {
    username: "admin.telemetryflow",
    email: "administrator.telemetryflow@telemetryflow.id",
    password: "Admin@654123",
    tier: 2,
    description: "Full organization access without platform management",
  },
  demo: {
    username: "demo.telemetryflow",
    email: "demo.telemetryflow@telemetryflow.id",
    password: "Demo@654123",
    tier: 5,
    description: "Limited demo access with auto-cleanup every 6 hours",
  },
};

// All available mock users for login selection
export const AVAILABLE_USERS = [
  {
    label: "Super Admin",
    username: "superadmin.telemetryflow",
    email: "superadmin.telemetryflow@telemetryflow.id",
    password: "SuperAdmin@654123",
    tier: 1,
    description: "Full platform access across all regions",
  },
  {
    label: "Administrator",
    username: "admin.telemetryflow",
    email: "administrator.telemetryflow@telemetryflow.id",
    password: "Admin@654123",
    tier: 2,
    isDefault: true,
    description: "Organization-scoped admin access",
  },
  {
    label: "Developer",
    username: "developer.telemetryflow",
    email: "developer.telemetryflow@telemetryflow.id",
    password: "Developer@654123",
    tier: 3,
    description: "Developer access without delete permissions",
  },
  {
    label: "Viewer",
    username: "viewer.telemetryflow",
    email: "viewer.telemetryflow@telemetryflow.id",
    password: "Viewer@654123",
    tier: 4,
    description: "Read-only access to organization resources",
  },
  {
    label: "Demo",
    username: "demo.telemetryflow",
    email: "demo.telemetryflow@telemetryflow.id",
    password: "Demo@654123",
    tier: 5,
    isDefault: true,
    description: "Demo access with auto-cleanup",
  },
];

// Get credentials for a user by email or username
function getMockCredentials(
  identifier: string,
): { password: string; userId: string; roleId: string } | null {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  return MOCK_USER_CREDENTIALS[normalizedIdentifier] || null;
}

export const authApi = {
  /**
   * Login with username/email and password
   * Supports all 5-tier RBAC users from mock data
   */
  login: async (data: LoginRequest): Promise<LoginWithMFAResponse> => {
    // Mock mode - authenticate against iamMock data
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const identifier = data.email.toLowerCase().trim();
      const password = data.password;

      // Authenticate using iamMock
      const userProfile = authenticateUser(identifier, password);

      if (!userProfile) {
        // Check if identifier exists but password is wrong
        const credentials = getMockCredentials(identifier);
        if (credentials) {
          throw new Error("Invalid password");
        }
        throw new Error("Invalid username or email");
      }

      // Generate tokens
      const tokens = generateMockTokens(userProfile.id);

      // Set tokens in client
      iamClient.setTokens(tokens.accessToken, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: "Bearer",
        user: userProfile,
        mfaRequired: false,
      };
    }

    const response = await iamClient.post<LoginWithMFAResponse>(
      "/auth/login",
      data,
    );
    // Only store tokens if MFA is not required
    if (!response.mfaRequired && response.accessToken) {
      iamClient.setTokens(response.accessToken, response.refreshToken);
    }
    return response;
  },

  /**
   * Register a new user account
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        message:
          "Registration successful. Please check your email to verify your account.",
        userId: `usr_mock_${Date.now()}`,
        email: data.email,
      };
    }
    return iamClient.post<RegisterResponse>("/auth/register", data);
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (
    data: VerifyEmailRequest,
  ): Promise<VerifyEmailResponse> => {
    return iamClient.post<VerifyEmailResponse>("/auth/verify-email", data);
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email: string): Promise<{ message: string }> => {
    return iamClient.post<{ message: string }>("/auth/resend-verification", {
      email,
    });
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (
    data: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> => {
    return iamClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      data,
    );
  },

  /**
   * Reset password with token
   */
  resetPassword: async (
    data: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> => {
    return iamClient.post<ResetPasswordResponse>("/auth/reset-password", data);
  },

  /**
   * Verify MFA code during login
   */
  verifyMFA: async (data: MFAVerifyRequest): Promise<TokenResponse> => {
    const response = await iamClient.post<TokenResponse>(
      "/auth/mfa/verify",
      data,
    );
    // Store tokens after successful MFA verification
    iamClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Enable MFA for current user
   */
  enableMFA: async (): Promise<MFAEnableResponse> => {
    return iamClient.post<MFAEnableResponse>("/auth/mfa/enable");
  },

  /**
   * Disable MFA for current user
   */
  disableMFA: async (password: string): Promise<{ message: string }> => {
    return iamClient.post<{ message: string }>("/auth/mfa/disable", {
      password,
    });
  },

  /**
   * Confirm MFA setup with code
   */
  confirmMFA: async (
    code: string,
  ): Promise<{ message: string; backupCodes: string[] }> => {
    return iamClient.post<{ message: string; backupCodes: string[] }>(
      "/auth/mfa/confirm",
      { code },
    );
  },

  /**
   * Change password for authenticated user
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    return iamClient.post<{ message: string }>("/auth/change-password", data);
  },

  /**
   * Refresh access token
   */
  refresh: async (data: RefreshTokenRequest): Promise<TokenResponse> => {
    const response = await iamClient.post<TokenResponse>("/auth/refresh", data);
    // Update tokens
    iamClient.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Logout and invalidate tokens
   */
  logout: async (): Promise<void> => {
    // Mock mode - just clear tokens
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      iamClient.clearTokens();
      return;
    }

    const refreshToken = iamClient.getRefreshToken();
    if (refreshToken) {
      try {
        await iamClient.post("/auth/logout", { refreshToken });
      } catch {
        // Ignore errors during logout
      }
    }
    iamClient.clearTokens();
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    // Mock mode - re-compute profile from mock data to get fresh permissions
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const storedUser = localStorage.getItem("tfo-user");
      if (storedUser) {
        try {
          const cached = JSON.parse(storedUser) as UserProfile;
          // Re-compute from mock to always get up-to-date permissions
          const fresh = getUserProfile(cached.id);
          if (fresh) {
            localStorage.setItem("tfo-user", JSON.stringify(fresh));
            return fresh;
          }
        } catch {
          // Ignore parse errors
        }
      }
      // Default to Demo user if no stored user
      const demoProfile = authenticateUser(
        DEFAULT_USERS.demo.email,
        DEFAULT_USERS.demo.password,
      );
      if (demoProfile) {
        return demoProfile;
      }
      throw new Error("No authenticated user");
    }

    return iamClient.get<UserProfile>("/auth/me");
  },

  /**
   * Get available users for login (mock mode only)
   */
  getAvailableUsers: () => AVAILABLE_USERS,

  /**
   * Get default users
   */
  getDefaultUsers: () => DEFAULT_USERS,
};

export default authApi;
