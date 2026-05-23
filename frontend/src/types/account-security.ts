/**
 * Account Security Types
 * Type definitions for MFA, password management, device sessions, and SSO
 */

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
