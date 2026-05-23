/**
 * IAM types for TelemetryFlow Platform
 */

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  avatar: string | null;
  tenantId: string | null;
  organizationId: string | null;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserProfile;
}

export interface LoginRequest {
  email: string;
  password: string;
  username?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** @deprecated Backend auto-creates org; no longer required from frontend */
  regionId?: string;
  /** @deprecated Backend auto-creates org; no longer required from frontend */
  organizationId?: string;
}

// ─── Device & Session types (Requirements 8.x, 9.x) ─────────────────────────

export interface DeviceInfo {
  id: string;
  name: string | null;
  browser: string;
  os: string;
  lastIpAddress: string;
  lastLocation: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  isVerified: boolean;
  isTrusted: boolean;
  isCurrent?: boolean;
}

export interface SessionInfo {
  id: string;
  deviceId: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string | null;
  lastActivityAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// ─── Organization types (Requirements 13.x) ──────────────────────────────────

export interface OrganizationDetail {
  id: string;
  name: string;
  creatorUserId: string;
  defaultApiKeyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isOrganizationCreator: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyHint: string;
  keyType: 'test' | 'secret' | 'standard' | 'service';
  permissions: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface InviteMemberRequest {
  email: string;
  role: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
}

// ─── Error response types (Requirements 11.x) ────────────────────────────────

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: {
    code: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
  path: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  error: {
    code: 'VALIDATION_ERROR';
    details: Record<string, string[]>;
  };
}

export interface RegisterResponse {
  message: string;
  userId: string;
  email: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
  verified: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface MFAVerifyRequest {
  code: string;
  sessionToken: string;
}

export interface MFAEnableResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface LoginWithMFAResponse extends TokenResponse {
  mfaRequired?: boolean;
  sessionToken?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MFASetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  avatar?: string;
  timezone: string;
  locale: string;
  lastLoginAt?: string;
  loginCount: number;
  mfaEnabled: boolean;
  emailVerified: boolean;
  organizationId?: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  workspaceId?: string;
  tenantId?: string;
  roleId?: string;
  /** Send a verification email after account creation. Default: false */
  sendEmailVerification?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  timezone?: string;
  locale?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  regionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAMPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IAMListParams {
  page?: number;
  limit?: number;
  search?: string;
}
