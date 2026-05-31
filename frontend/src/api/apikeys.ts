/**
 * API Keys API client
 * TASK-09: Frontend API client for API Keys module
 *
 * Supports both mock and real API modes via TELEMETRYFLOW_USE_MOCK.
 * Real mode uses iamClient (NestJS backend at /api/v2/api-keys).
 */
import { config } from "@/config";
import { iamClient } from "./iam";
import type {
  ApiKey,
  ApiKeyResponse,
  ApiKeyCreatedResponse,
  ApiKeyRotatedResponse,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ListApiKeysQuery,
  PaginatedApiKeys,
  ApiKeyType,
} from "@/types/apikey";
import { transformApiKey } from "@/types/apikey";

// ==================== ENDPOINTS ====================
// Relative to iamClient baseURL (config.iamApiUrl/api/v2)

const ENDPOINTS = {
  BASE: "/api-keys",
  SINGLE: (id: string) => `/api-keys/${id}`,
  REVOKE: (id: string) => `/api-keys/${id}/revoke`,
  ROTATE: (id: string) => `/api-keys/${id}/rotate`,
  ACTIVATE: (id: string) => `/api-keys/${id}/activate`,
  DEACTIVATE: (id: string) => `/api-keys/${id}/deactivate`,
} as const;

// Legacy export for backwards compat
export const API_KEYS_ENDPOINTS = ENDPOINTS;

// ==================== BACKEND RESPONSE TYPES ====================

interface BackendPaginatedResponse {
  items: ApiKeyResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BackendCreatedResponse extends ApiKeyResponse {
  rawApiKeyId: string;
  rawApiKeySecret: string;
  rawEncryptKey: string;
}

interface BackendRotatedResponse extends ApiKeyResponse {
  rawApiKeySecret: string;
  rawEncryptKey: string;
}

// ==================== MOCK DATA ====================

// Only 2 organizations: DEVOPSCORNER and TELEMETRYFLOW (IDs match IAM mock)
const MOCK_ORG_IDS = ["org-devopscorner", "org-telemetryflow"];
const MOCK_ORG_WORKSPACE_MAP: Record<string, string[]> = {
  "org-devopscorner": ["ws-devopscorner"],
  "org-telemetryflow": ["ws-telemetryflow"],
};

/**
 * Generate 4 deterministic seed API keys: 2 per organization
 * - org-001 (DEVOPSCORNER):   System key + Production key
 * - org-002 (TELEMETRYFLOW):  System key + Production key
 */
function generateMockApiKeys(): ApiKey[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const keys: ApiKey[] = [
    // ── DEVOPSCORNER: System Key ──
    {
      id: "apikey-devops-system",
      organizationId: "org-devopscorner",
      workspaceId: "ws-devopscorner",
      name: "TFO Platform Key — DevOpsCorner",
      description: "System API key for TFO-Agent and TFO-Collector M2M auth. Cannot be deleted.",
      keyType: "service",
      apiKeyId: "tfk_cd370b538e591cb26f69de626aecb95e",
      keyPrefix: "tfs_",
      keyHint: "afde",
      isSystem: true,
      permissions: ["read:telemetry", "write:telemetry", "read:metrics", "write:metrics", "read:logs", "write:logs"],
      scopes: ["metrics", "logs", "traces", "agents", "collector"],
      rateLimit: 5000,
      createdAt: now - 60 * day,
      updatedAt: now - 2 * day,
      lastUsedAt: now - 3600000,
      lastUsedIp: "10.0.1.10",
      usageCount: 128450,
      isActive: true,
      isExpired: false,
      rotationCount: 1,
      rotatedAt: now - 15 * day,
      rotatedBy: "superadmin",
      createdBy: "superadmin",
      metadata: { organization_code: "DEVOPSCORNER", environment: "system" },
    },

    // ── DEVOPSCORNER: Production Key ──
    {
      id: "apikey-devops-prod",
      organizationId: "org-devopscorner",
      workspaceId: "ws-devopscorner",
      name: "DevOpsCorner Production API Key",
      description: "API key for DevOpsCorner production environment",
      keyType: "service",
      apiKeyId: "tfk_d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6",
      keyPrefix: "tfs_",
      keyHint: "f2a4",
      isSystem: false,
      permissions: ["read:telemetry", "write:telemetry", "read:metrics", "write:metrics"],
      scopes: ["metrics", "logs", "traces"],
      rateLimit: 1000,
      createdAt: now - 45 * day,
      updatedAt: now - 5 * day,
      lastUsedAt: now - 7200000,
      lastUsedIp: "10.0.1.20",
      usageCount: 54230,
      isActive: true,
      isExpired: false,
      rotationCount: 0,
      createdBy: "superadmin",
      metadata: { organization_code: "DEVOPSCORNER", environment: "production" },
    },

    // ── TELEMETRYFLOW: System Key ──
    {
      id: "apikey-tflow-system",
      organizationId: "org-telemetryflow",
      workspaceId: "ws-telemetryflow",
      name: "TFO Platform Key — TelemetryFlow",
      description: "System API key for TFO-Agent and TFO-Collector M2M auth. Cannot be deleted.",
      keyType: "service",
      apiKeyId: "tfk_e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8",
      keyPrefix: "tfs_",
      keyHint: "f4a6",
      isSystem: true,
      permissions: ["read:telemetry", "write:telemetry", "read:metrics", "write:metrics", "read:logs", "write:logs"],
      scopes: ["metrics", "logs", "traces", "agents", "collector"],
      rateLimit: 5000,
      createdAt: now - 55 * day,
      updatedAt: now - 1 * day,
      lastUsedAt: now - 1800000,
      lastUsedIp: "10.0.2.10",
      usageCount: 97320,
      isActive: true,
      isExpired: false,
      rotationCount: 2,
      rotatedAt: now - 10 * day,
      rotatedBy: "superadmin",
      createdBy: "superadmin",
      metadata: { organization_code: "TELEMETRYFLOW", environment: "system" },
    },

    // ── TELEMETRYFLOW: Production Key ──
    {
      id: "apikey-tflow-prod",
      organizationId: "org-telemetryflow",
      workspaceId: "ws-telemetryflow",
      name: "TelemetryFlow Production API Key",
      description: "API key for TelemetryFlow production environment",
      keyType: "service",
      apiKeyId: "tfk_f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0",
      keyPrefix: "tfs_",
      keyHint: "f6a8",
      isSystem: false,
      permissions: ["read:telemetry", "write:telemetry", "read:metrics", "write:metrics"],
      scopes: ["metrics", "logs", "traces"],
      rateLimit: 1000,
      createdAt: now - 40 * day,
      updatedAt: now - 3 * day,
      lastUsedAt: now - 5400000,
      lastUsedIp: "10.0.2.20",
      usageCount: 41890,
      isActive: true,
      isExpired: false,
      rotationCount: 0,
      createdBy: "superadmin",
      metadata: { organization_code: "TELEMETRYFLOW", environment: "production" },
    },
  ];

  return keys.sort((a, b) => b.createdAt - a.createdAt);
}

function generateRawApiKeyId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return "tfk_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateRawApiKeySecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "tfs_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateRawEncryptKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ==================== API CLIENT ====================

export const apiKeysApi = {
  /**
   * Create a new API key
   * Returns the raw key (shown only once)
   */
  async createApiKey(
    data: CreateApiKeyRequest,
  ): Promise<{ apiKey: ApiKey; rawApiKeyId: string; rawApiKeySecret: string; rawEncryptKey: string }> {
    if (config.useMock) {
      await delay(500);

      const keyType = data.keyType || "standard";
      const rawApiKeyId = generateRawApiKeyId();
      const rawApiKeySecret = generateRawApiKeySecret();
      const rawEncryptKey = generateRawEncryptKey();
      const now = Date.now();

      const apiKey: ApiKey = {
        id: `apikey-${now}`,
        organizationId: "org-devopscorner",
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description,
        keyType,
        apiKeyId: rawApiKeyId,
        keyPrefix: "tfs_",
        keyHint: rawApiKeySecret.slice(-4),
        isSystem: false,
        permissions: data.permissions || ["read:telemetry"],
        scopes: data.scopes || ["metrics", "logs", "traces"],
        rateLimit: data.rateLimit || 1000,
        createdAt: now,
        updatedAt: now,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).getTime() : undefined,
        usageCount: 0,
        isActive: true,
        isExpired: false,
        rotationCount: 0,
        createdBy: "user-current",
      };

      return { apiKey, rawApiKeyId, rawApiKeySecret, rawEncryptKey };
    }

    // Real API call
    const payload = {
      name: data.name,
      description: data.description,
      keyType: data.keyType || "standard",
      workspaceId: data.workspaceId,
      permissions: data.permissions,
      scopes: data.scopes,
      rateLimit: data.rateLimit,
      expiresAt: data.expiresAt,
    };

    const res = await iamClient.post<BackendCreatedResponse>(ENDPOINTS.BASE, payload);
    return {
      apiKey: transformApiKey(res),
      rawApiKeyId: res.rawApiKeyId,
      rawApiKeySecret: res.rawApiKeySecret,
      rawEncryptKey: res.rawEncryptKey,
    };
  },

  /**
   * List API keys with pagination and filters.
   */
  async listApiKeys(query: ListApiKeysQuery = {}): Promise<PaginatedApiKeys> {
    if (config.useMock) {
      await delay();

      let keys = generateMockApiKeys();
      if (query.isActive !== undefined)
        keys = keys.filter((k) => k.isActive === query.isActive);
      if (query.keyType)
        keys = keys.filter((k) => k.keyType === query.keyType);
      if (query.search) {
        const s = query.search.toLowerCase();
        keys = keys.filter(
          (k) =>
            k.name.toLowerCase().includes(s) ||
            k.description?.toLowerCase().includes(s),
        );
      }
      const page = query.page || 1;
      const pageSize = query.pageSize || 20;
      const total = keys.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const start = (page - 1) * pageSize;
      return {
        data: keys.slice(start, start + pageSize),
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    }

    // Real API call — strict mode, no mock fallback
    const params: Record<string, unknown> = {};
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.isActive !== undefined) params.isActive = query.isActive;
    if (query.keyType) params.keyType = query.keyType;
    if (query.search) params.search = query.search;

    const res = await iamClient.get<BackendPaginatedResponse>(ENDPOINTS.BASE, { params });
    const items = (res.items || []).map(transformApiKey);

    return {
      data: items,
      total: res.total,
      page: res.page,
      pageSize: res.pageSize,
      totalPages: res.totalPages,
      hasNext: res.page < res.totalPages,
      hasPrevious: res.page > 1,
    };
  },

  /**
   * Get a single API key by ID
   */
  async getApiKey(id: string): Promise<ApiKey> {
    if (config.useMock) {
      await delay(200);
      const keys = generateMockApiKeys();
      return keys.find((k) => k.id === id) || { ...keys[0], id };
    }

    const res = await iamClient.get<ApiKeyResponse>(ENDPOINTS.SINGLE(id));
    return transformApiKey(res);
  },

  /**
   * Update an API key
   */
  async updateApiKey(id: string, data: UpdateApiKeyRequest): Promise<ApiKey> {
    if (config.useMock) {
      await delay();
      const keys = generateMockApiKeys();
      const key = keys[0];
      return {
        ...key,
        id,
        name: data.name || key.name,
        description: data.description || key.description,
        permissions: data.permissions || key.permissions,
        scopes: data.scopes || key.scopes,
        rateLimit: data.rateLimit || key.rateLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).getTime() : key.expiresAt,
        updatedAt: Date.now(),
      };
    }

    // Real API call
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.permissions) payload.permissions = data.permissions;
    if (data.scopes) payload.scopes = data.scopes;
    if (data.rateLimit !== undefined) payload.rateLimit = data.rateLimit;
    if (data.expiresAt !== undefined) payload.expiresAt = data.expiresAt;

    const res = await iamClient.patch<ApiKeyResponse>(ENDPOINTS.SINGLE(id), payload);
    return transformApiKey(res);
  },

  /**
   * Rotate an API key (generates new key, keeps same ID)
   * Returns the new raw key (shown only once)
   */
  async rotateApiKey(id: string): Promise<{ apiKey: ApiKey; rawApiKeySecret: string; rawEncryptKey: string }> {
    if (config.useMock) {
      await delay(500);
      const keys = generateMockApiKeys();
      const key = keys[0];
      const rawApiKeySecret = generateRawApiKeySecret();
      const rawEncryptKey = generateRawEncryptKey();

      return {
        apiKey: {
          ...key,
          id,
          keyHint: rawApiKeySecret.slice(-4),
          rotatedAt: Date.now(),
          rotatedBy: "user-current",
          rotationCount: key.rotationCount + 1,
          updatedAt: Date.now(),
        },
        rawApiKeySecret,
        rawEncryptKey,
      };
    }

    // Real API call
    const res = await iamClient.post<BackendRotatedResponse>(ENDPOINTS.ROTATE(id));
    return {
      apiKey: transformApiKey(res),
      rawApiKeySecret: res.rawApiKeySecret,
      rawEncryptKey: res.rawEncryptKey,
    };
  },

  /**
   * Activate an API key
   */
  async activateApiKey(id: string): Promise<ApiKey> {
    if (config.useMock) {
      await delay();
      const keys = generateMockApiKeys();
      return { ...keys[0], id, isActive: true, updatedAt: Date.now() };
    }

    const res = await iamClient.post<ApiKeyResponse>(ENDPOINTS.ACTIVATE(id));
    return transformApiKey(res);
  },

  /**
   * Deactivate an API key (temporary - can be reactivated)
   */
  async deactivateApiKey(id: string): Promise<ApiKey> {
    if (config.useMock) {
      await delay();
      const keys = generateMockApiKeys();
      return { ...keys[0], id, isActive: false, updatedAt: Date.now() };
    }

    const res = await iamClient.post<ApiKeyResponse>(ENDPOINTS.DEACTIVATE(id));
    return transformApiKey(res);
  },

  /**
   * Revoke an API key (soft revoke — key remains in DB but cannot be used)
   */
  async revokeApiKey(id: string, reason?: string): Promise<void> {
    if (config.useMock) {
      await delay();
      return;
    }

    await iamClient.post(ENDPOINTS.REVOKE(id), reason ? { reason } : {});
  },

  /**
   * Delete an API key permanently (hard delete — removes from DB)
   * Only usable on non-system keys; typically called after revoking
   */
  async deleteApiKey(id: string): Promise<void> {
    if (config.useMock) {
      await delay();
      return;
    }

    await iamClient.delete(ENDPOINTS.SINGLE(id));
  },
};

export default apiKeysApi;
