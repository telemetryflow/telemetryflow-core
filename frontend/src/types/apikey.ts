/**
 * API Key Types
 * TASK-09: Frontend types for API Keys module
 *
 * Matches backend DTOs from api-keys module
 */

// ==================== ENUMS ====================

export type ApiKeyType = "standard" | "service";

export const API_KEY_TYPES: Record<
  ApiKeyType,
  { label: string; color: string; description: string }
> = {
  standard: {
    label: "Standard",
    color: "info",
    description: "Regular API key for application access",
  },
  service: {
    label: "Service",
    color: "warning",
    description: "Service account key for backend integrations",
  },
};

// ==================== CORE TYPES ====================

/**
 * API Key entity (without sensitive data)
 */
export interface ApiKey {
  id: string;
  organizationId: string;
  workspaceId?: string;

  // Basic info
  name: string;
  description?: string;
  keyType: ApiKeyType;

  // Security (never includes raw key or hash)
  apiKeyId?: string; // tfk_ prefix identifier (masked in responses)
  keyPrefix: string; // "tfk_" or "tfs_"
  keyHint: string; // Last 4 chars for identification
  isSystem: boolean; // System keys cannot be deleted/revoked

  // Permissions
  permissions: string[];
  scopes: string[];
  rateLimit: number;

  // Timestamps
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  lastUsedAt?: number;

  // Usage
  lastUsedIp?: string;
  usageCount: number;

  // Status
  isActive: boolean;
  isExpired: boolean;

  // Revocation
  revokedAt?: number;
  revokedBy?: string;
  revocationReason?: string;

  // Rotation
  rotatedAt?: number;
  rotatedBy?: string;
  rotationCount: number;

  // Metadata
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * API Key from backend response (camelCase — NestJS default)
 */
export interface ApiKeyResponse {
  id: string;
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  name: string;
  description?: string;
  keyType: ApiKeyType;
  apiKeyId?: string;
  displayKey: string;
  keyPrefix: string;
  keyHint: string;
  isSystem: boolean;
  permissions: string[];
  scopes: string[];
  rateLimit?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt?: string | Date;
  lastUsedAt?: string | Date;
  lastUsedIp?: string;
  usageCount: number;
  isActive: boolean;
  isExpired: boolean;
  revokedAt?: string | Date;
  revokedBy?: string;
  revocationReason?: string;
  rotatedAt?: string | Date;
  rotatedBy?: string;
  rotationCount: number;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

/**
 * API Key created response (includes all 3 raw keys - shown only once)
 */
export interface ApiKeyCreatedResponse extends ApiKeyResponse {
  rawApiKeyId: string;
  rawApiKeySecret: string;
  rawEncryptKey: string;
}

/**
 * API Key rotated response (includes new raw keys - shown only once)
 */
export interface ApiKeyRotatedResponse extends ApiKeyResponse {
  rawApiKeySecret: string;
  rawEncryptKey: string;
}

/**
 * Transform backend response (camelCase) to frontend ApiKey type
 */
export function transformApiKey(response: ApiKeyResponse): ApiKey {
  const toMs = (v: string | Date | undefined | null): number | undefined =>
    v ? new Date(v).getTime() : undefined;

  return {
    id: response.id,
    organizationId: response.organizationId,
    workspaceId: response.workspaceId,
    name: response.name,
    description: response.description,
    keyType: response.keyType,
    apiKeyId: response.apiKeyId,
    keyPrefix: response.keyPrefix,
    keyHint: response.keyHint,
    isSystem: response.isSystem ?? false,
    permissions: response.permissions || [],
    scopes: response.scopes || [],
    rateLimit: response.rateLimit ?? 0,
    createdAt: toMs(response.createdAt) ?? Date.now(),
    updatedAt: toMs(response.updatedAt) ?? Date.now(),
    expiresAt: toMs(response.expiresAt),
    lastUsedAt: toMs(response.lastUsedAt),
    lastUsedIp: response.lastUsedIp,
    usageCount: response.usageCount ?? 0,
    isActive: response.isActive ?? false,
    isExpired: response.isExpired ?? false,
    revokedAt: toMs(response.revokedAt),
    revokedBy: response.revokedBy,
    revocationReason: response.revocationReason,
    rotatedAt: toMs(response.rotatedAt),
    rotatedBy: response.rotatedBy,
    rotationCount: response.rotationCount ?? 0,
    createdBy: response.createdBy,
    metadata: response.metadata,
  };
}

// ==================== REQUEST TYPES ====================

/**
 * Create API Key request
 */
export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  keyType?: ApiKeyType;
  workspaceId?: string;
  permissions?: string[];
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: string; // ISO date string
}

/**
 * Update API Key request
 */
export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  permissions?: string[];
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: string; // ISO date string
}

/**
 * Revoke API Key request
 */
export interface RevokeApiKeyRequest {
  reason?: string;
}

/**
 * List API Keys query params
 */
export interface ListApiKeysQuery {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  keyType?: ApiKeyType;
  search?: string;
}

// ==================== RESPONSE TYPES ====================

/**
 * Paginated API Keys response
 */
export interface PaginatedApiKeysResponse {
  items: ApiKeyResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Paginated API Keys (transformed)
 */
export interface PaginatedApiKeys {
  data: ApiKey[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ==================== UI HELPER TYPES ====================

/**
 * API Key status for display
 */
export type ApiKeyStatus =
  | "active"
  | "inactive"
  | "expired"
  | "revoked"
  | "expiring";

export const API_KEY_STATUS: Record<
  ApiKeyStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "success" },
  inactive: { label: "Inactive", color: "default" },
  expired: { label: "Expired", color: "error" },
  revoked: { label: "Revoked", color: "error" },
  expiring: { label: "Expiring Soon", color: "warning" },
};

/**
 * Get API Key status
 */
export function getApiKeyStatus(key: ApiKey): ApiKeyStatus {
  if (key.revokedAt) return "revoked";
  if (key.isExpired) return "expired";
  if (!key.isActive) return "inactive";

  // Check if expiring in next 7 days
  if (key.expiresAt) {
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    if (key.expiresAt < sevenDaysFromNow) return "expiring";
  }

  return "active";
}

/**
 * Format API Key display (masked)
 */
export function formatApiKeyDisplay(key: ApiKey): string {
  return `${key.keyPrefix}...${key.keyHint.slice(-8)}`;
}

/**
 * Available permissions for API keys
 */
export const API_KEY_PERMISSIONS = [
  { value: "read:telemetry", label: "Read Telemetry" },
  { value: "write:telemetry", label: "Write Telemetry" },
  { value: "read:metrics", label: "Read Metrics" },
  { value: "write:metrics", label: "Write Metrics" },
  { value: "read:logs", label: "Read Logs" },
  { value: "write:logs", label: "Write Logs" },
  { value: "read:traces", label: "Read Traces" },
  { value: "write:traces", label: "Write Traces" },
  { value: "read:alerts", label: "Read Alerts" },
  { value: "write:alerts", label: "Write Alerts" },
] as const;

/**
 * Available scopes for API keys
 */
export const API_KEY_SCOPES = [
  { value: "metrics", label: "Metrics" },
  { value: "logs", label: "Logs" },
  { value: "traces", label: "Traces" },
  { value: "exemplars", label: "Exemplars" },
  { value: "alerts", label: "Alerts" },
  { value: "dashboards", label: "Dashboards" },
  { value: "agents", label: "TFO-Agents" },
  { value: "collector", label: "TFO-Collector" },
  { value: "virtual-machines", label: "Virtual Machine" },
  { value: "kubernetes", label: "Kubernetes" },
] as const;
