/**
 * Account Security API client
 * Handles MFA configuration, password management, device sessions, and SSO settings
 * Uses collectorClient for real HTTP calls with config.useMock branching
 */

import { collectorClient } from "./collector";
import { config } from "@/config";

// ==================== TYPES ====================
// Note: Types are also available in @/types/account-security.ts

export interface SecurityOverview {
  mfaEnabled: boolean;
  mfaMethod: "totp" | "sms" | "email" | null;
  mfaVerifiedAt: number | null;
  passwordLastChanged: number;
  passwordStrength: "weak" | "fair" | "strong" | "excellent";
  passwordExpiresAt: number | null;
  recoveryEmail: string | null;
  recoveryEmailVerified: boolean;
  trustedDeviceCount: number;
  activeSessions: number;
  ssoConnected: boolean;
  ssoProvider: string | null;
  lastSecurityAudit: number | null;
  securityScore: number;
}

export interface MFAEnableResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  expiresAt: number;
}

export interface MFADisableRequest {
  password: string;
  mfaCode?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeResponse {
  message: string;
  passwordLastChanged: number;
  nextExpiryDate: number | null;
}

export interface TrustedDevice {
  id: string;
  name: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastUsedAt: number;
  createdAt: number;
  isCurrent: boolean;
  trusted: boolean;
}

export interface SSOConnectionStatus {
  provider: string;
  providerDisplayName: string;
  connected: boolean;
  connectedAt: number | null;
  email: string | null;
  avatarUrl: string | null;
  autoLogin: boolean;
}

// ==================== ENDPOINTS ====================

export const ACCOUNT_SECURITY_ENDPOINTS = {
  OVERVIEW: "/api/v2/account/security",
  MFA_ENABLE: "/api/v2/account/security/mfa/enable",
  MFA_DISABLE: "/api/v2/account/security/mfa/disable",
  PASSWORD: "/api/v2/account/security/password",
  DEVICES: "/api/v2/account/security/devices",
  DEVICE: (id: string) => `/api/v2/account/security/devices/${id}`,
  SSO: "/api/v2/account/security/sso",
} as const;

// ==================== MOCK DATA ====================

function generateMockSecurityOverview(): SecurityOverview {
  const now = Date.now();
  return {
    mfaEnabled: true,
    mfaMethod: "totp",
    mfaVerifiedAt: now - 30 * 24 * 60 * 60 * 1000,
    passwordLastChanged: now - 45 * 24 * 60 * 60 * 1000,
    passwordStrength: "strong",
    passwordExpiresAt: now + 45 * 24 * 60 * 60 * 1000,
    recoveryEmail: "recovery@telemetryflow.id",
    recoveryEmailVerified: true,
    trustedDeviceCount: 3,
    activeSessions: 2,
    ssoConnected: true,
    ssoProvider: "google",
    lastSecurityAudit: now - 7 * 24 * 60 * 60 * 1000,
    securityScore: 85,
  };
}

function generateMockMFAEnable(): MFAEnableResponse {
  return {
    secret: "JBSWY3DPEHPK3PXP4OZWF43VMZQQ5LTYNJXW433XNFZSWYLLMVSA",
    qrCodeUrl:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    backupCodes: [
      "A1B2-C3D4",
      "E5F6-G7H8",
      "I9J0-K1L2",
      "M3N4-O5P6",
      "Q7R8-S9T0",
      "U1V2-W3X4",
      "Y5Z6-A7B8",
      "C9D0-E1F2",
    ],
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
}

function generateMockDevices(): TrustedDevice[] {
  const now = Date.now();
  return [
    {
      id: "device-001",
      name: "MacBook Pro 16-inch",
      deviceType: "desktop",
      browser: "Chrome 120.0",
      os: "macOS Sonoma 14.2",
      ipAddress: "192.168.1.100",
      location: "Jakarta, Indonesia",
      lastUsedAt: now - 5 * 60 * 1000,
      createdAt: now - 90 * 24 * 60 * 60 * 1000,
      isCurrent: true,
      trusted: true,
    },
    {
      id: "device-002",
      name: "iPhone 15 Pro",
      deviceType: "mobile",
      browser: "Safari 17.2",
      os: "iOS 17.2",
      ipAddress: "10.0.0.50",
      location: "Jakarta, Indonesia",
      lastUsedAt: now - 2 * 60 * 60 * 1000,
      createdAt: now - 60 * 24 * 60 * 60 * 1000,
      isCurrent: false,
      trusted: true,
    },
    {
      id: "device-003",
      name: "Windows Workstation",
      deviceType: "desktop",
      browser: "Firefox 121.0",
      os: "Windows 11 23H2",
      ipAddress: "172.16.0.25",
      location: "Singapore",
      lastUsedAt: now - 3 * 24 * 60 * 60 * 1000,
      createdAt: now - 30 * 24 * 60 * 60 * 1000,
      isCurrent: false,
      trusted: true,
    },
    {
      id: "device-004",
      name: "iPad Air",
      deviceType: "tablet",
      browser: "Safari 17.1",
      os: "iPadOS 17.1",
      ipAddress: "203.0.113.42",
      location: "Bali, Indonesia",
      lastUsedAt: now - 14 * 24 * 60 * 60 * 1000,
      createdAt: now - 45 * 24 * 60 * 60 * 1000,
      isCurrent: false,
      trusted: false,
    },
  ];
}

function generateMockSSOConnections(): SSOConnectionStatus[] {
  const now = Date.now();
  return [
    {
      provider: "google",
      providerDisplayName: "Google Workspace",
      connected: true,
      connectedAt: now - 120 * 24 * 60 * 60 * 1000,
      email: "admin@telemetryflow.id",
      avatarUrl: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      autoLogin: true,
    },
    {
      provider: "microsoft",
      providerDisplayName: "Microsoft Entra ID",
      connected: false,
      connectedAt: null,
      email: null,
      avatarUrl: null,
      autoLogin: false,
    },
    {
      provider: "slack",
      providerDisplayName: "Slack",
      connected: true,
      connectedAt: now - 60 * 24 * 60 * 60 * 1000,
      email: "admin@devopscorner-workspace.slack.com",
      avatarUrl: null,
      autoLogin: false,
    },
    {
      provider: "cognito",
      providerDisplayName: "AWS Cognito",
      connected: false,
      connectedAt: null,
      email: null,
      avatarUrl: null,
      autoLogin: false,
    },
  ];
}

// ==================== API CLIENT ====================

export const accountSecurityApi = {
  /**
   * Get security overview for the current user account
   * Returns MFA status, password health, device count, and security score
   */
  async getSecurityOverview(): Promise<SecurityOverview> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockSecurityOverview();
    }

    const response = await collectorClient.get<SecurityOverview>(
      ACCOUNT_SECURITY_ENDPOINTS.OVERVIEW,
    );
    return response.data;
  },

  /**
   * Enable MFA for the current user
   * Returns TOTP secret, QR code URL, and backup codes
   */
  async enableMFA(): Promise<MFAEnableResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return generateMockMFAEnable();
    }

    const response = await collectorClient.post<MFAEnableResponse>(
      ACCOUNT_SECURITY_ENDPOINTS.MFA_ENABLE,
    );
    return response.data;
  },

  /**
   * Disable MFA for the current user
   * Requires current password and optionally the current MFA code
   */
  async disableMFA(data: MFADisableRequest): Promise<{ message: string }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { message: "MFA has been disabled successfully" };
    }

    const response = await collectorClient.post<{ message: string }>(
      ACCOUNT_SECURITY_ENDPOINTS.MFA_DISABLE,
      data,
    );
    return response.data;
  },

  /**
   * Change account password
   * Validates current password and enforces password policy
   */
  async changePassword(
    data: PasswordChangeRequest,
  ): Promise<PasswordChangeResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (data.newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (data.newPassword !== data.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const now = Date.now();
      return {
        message: "Password changed successfully",
        passwordLastChanged: now,
        nextExpiryDate: now + 90 * 24 * 60 * 60 * 1000,
      };
    }

    const response = await collectorClient.put<PasswordChangeResponse>(
      ACCOUNT_SECURITY_ENDPOINTS.PASSWORD,
      data,
    );
    return response.data;
  },

  /**
   * List all trusted/recognized devices for the current user
   */
  async getDevices(): Promise<TrustedDevice[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockDevices();
    }

    const response = await collectorClient.get<TrustedDevice[]>(
      ACCOUNT_SECURITY_ENDPOINTS.DEVICES,
    );
    return response.data;
  },

  /**
   * Remove a trusted device by ID
   * Revokes trust and forces re-authentication on that device
   */
  async removeDevice(id: string): Promise<{ message: string }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { message: "Device removed successfully" };
    }

    const response = await collectorClient.delete<{ message: string }>(
      ACCOUNT_SECURITY_ENDPOINTS.DEVICE(id),
    );
    return response.data;
  },

  /**
   * Get SSO connection status for all supported providers
   */
  async getSSOConnections(): Promise<SSOConnectionStatus[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockSSOConnections();
    }

    const response = await collectorClient.get<SSOConnectionStatus[]>(
      ACCOUNT_SECURITY_ENDPOINTS.SSO,
    );
    return response.data;
  },
};

export default accountSecurityApi;
