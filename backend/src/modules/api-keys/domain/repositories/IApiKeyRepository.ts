import { ApiKey } from '../aggregates/ApiKey';

export interface ApiKeyFilter {
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  isActive?: boolean;
  name?: string;
  keyPrefix?: string;
  createdBy?: string;
}

export interface FindByOrganizationOptions {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  keyType?: string;
  search?: string;
}

export interface PaginatedApiKeys {
  items: ApiKey[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IApiKeyRepository {
  /**
   * Save an API key
   */
  save(apiKey: ApiKey): Promise<void>;

  /**
   * Find API key by ID
   */
  findById(id: string): Promise<ApiKey | null>;

  /**
   * Find API key by hash (for authentication)
   */
  findByKeyHash(keyHash: string): Promise<ApiKey | null>;

  /**
   * Find API key by name within organization
   */
  findByName(name: string, organizationId: string): Promise<ApiKey | null>;

  /**
   * List API keys with filters and pagination
   */
  findAll(filter: ApiKeyFilter, page: number, limit: number): Promise<PaginatedApiKeys>;

  /**
   * Find API keys by organization with filtering options
   */
  findByOrganization(
    organizationId: string,
    options?: FindByOrganizationOptions,
  ): Promise<{ items: ApiKey[]; total: number }>;

  /**
   * Delete an API key (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Count API keys by organization
   */
  countByOrganization(organizationId: string): Promise<number>;

  /**
   * Find all active API keys expiring within given days
   */
  findExpiringKeys(days: number): Promise<ApiKey[]>;

  /**
   * Update last used timestamp and IP for an API key
   */
  updateLastUsed(id: string, ip: string, usedAt?: Date): Promise<void>;

  /**
   * Check if a key name already exists within an organization
   */
  existsByName(organizationId: string, name: string): Promise<boolean>;
}

export const API_KEY_REPOSITORY = Symbol('API_KEY_REPOSITORY');
