import { ApiKey } from '../../domain';

export class ApiKeyResponseDto {
  id: string;
  name: string;
  description?: string;
  apiKeyId?: string;
  displayKey: string;
  keyPrefix: string;
  keyHint: string;
  keyType: string;
  isSystem: boolean;
  permissions: string[];
  scopes: string[];
  rateLimit?: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  usageCount: number;
  isActive: boolean;
  isExpired: boolean;
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
  revocationReason?: string;
  rotatedAt?: Date;
  rotatedBy?: string;
  rotationCount: number;
  metadata?: Record<string, unknown>;

  static fromDomain(apiKey: ApiKey): ApiKeyResponseDto {
    const dto = new ApiKeyResponseDto();
    dto.id = apiKey.getId().getValue();
    dto.name = apiKey.getName();
    dto.description = apiKey.getDescription();
    dto.apiKeyId = apiKey.getApiKeyId();
    dto.displayKey = apiKey.getDisplayKey();
    dto.keyPrefix = apiKey.getKeyPrefix().getValue();
    dto.keyHint = apiKey.getKeyHint();
    dto.keyType = apiKey.getKeyType();
    dto.isSystem = apiKey.getIsSystem();
    dto.permissions = apiKey.getPermissions();
    dto.scopes = apiKey.getScopes();
    dto.rateLimit = apiKey.getRateLimit();
    dto.expiresAt = apiKey.getExpiresAt();
    dto.lastUsedAt = apiKey.getLastUsedAt();
    dto.lastUsedIp = apiKey.getLastUsedIp();
    dto.usageCount = apiKey.getUsageCount();
    dto.isActive = apiKey.getIsActive();
    dto.isExpired = apiKey.isExpired();
    dto.organizationId = apiKey.getOrganizationId();
    dto.workspaceId = apiKey.getWorkspaceId();
    dto.tenantId = apiKey.getTenantId();
    dto.createdBy = apiKey.getCreatedBy();
    dto.createdAt = apiKey.getCreatedAt();
    dto.updatedAt = apiKey.getUpdatedAt();
    dto.revokedAt = apiKey.getRevokedAt();
    dto.revokedBy = apiKey.getRevokedBy();
    dto.revocationReason = apiKey.getRevocationReason();
    dto.rotatedAt = apiKey.getRotatedAt();
    dto.rotatedBy = apiKey.getRotatedBy();
    dto.rotationCount = apiKey.getRotationCount();
    dto.metadata = apiKey.getMetadata();
    return dto;
  }
}

export class ApiKeyCreatedResponseDto extends ApiKeyResponseDto {
  /** TELEMETRYFLOW_API_KEY_ID — only shown once at creation time */
  rawApiKeyId: string;
  /** TELEMETRYFLOW_API_KEY_SECRET — only shown once at creation time */
  rawApiKeySecret: string;
  /** ENCRYPTION_KEY — only shown once at creation time */
  rawEncryptKey: string;

  static fromDomainWithKeys(
    apiKey: ApiKey,
    rawKeyId: string,
    rawKeySecret: string,
    rawEncryptionKey: string,
  ): ApiKeyCreatedResponseDto {
    const dto = new ApiKeyCreatedResponseDto();
    Object.assign(dto, ApiKeyResponseDto.fromDomain(apiKey));
    dto.rawApiKeyId = rawKeyId;
    dto.rawApiKeySecret = rawKeySecret;
    dto.rawEncryptKey = rawEncryptionKey;
    return dto;
  }
}

export class ApiKeyRotatedResponseDto extends ApiKeyResponseDto {
  /** New TELEMETRYFLOW_API_KEY_SECRET — only shown once after rotation */
  rawApiKeySecret: string;
  /** New ENCRYPTION_KEY — only shown once after rotation */
  rawEncryptKey: string;

  static fromDomainWithKeys(
    apiKey: ApiKey,
    rawKeySecret: string,
    rawEncryptionKey: string,
  ): ApiKeyRotatedResponseDto {
    const dto = new ApiKeyRotatedResponseDto();
    Object.assign(dto, ApiKeyResponseDto.fromDomain(apiKey));
    dto.rawApiKeySecret = rawKeySecret;
    dto.rawEncryptKey = rawEncryptionKey;
    return dto;
  }
}

export class PaginatedApiKeysResponseDto {
  items: ApiKeyResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
