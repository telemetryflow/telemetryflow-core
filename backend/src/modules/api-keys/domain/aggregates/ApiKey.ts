import { AggregateRoot } from '@/shared/domain/base/AggregateRoot';
import { ApiKeyId } from '../value-objects/ApiKeyId';
import { KeyPrefix, KeyPrefixType } from '../value-objects/KeyPrefix';
import { ApiKeyCreatedEvent } from '../events/ApiKeyCreated.event';
import { ApiKeyRotatedEvent } from '../events/ApiKeyRotated.event';
import { ApiKeyRevokedEvent } from '../events/ApiKeyRevoked.event';
import * as crypto from 'crypto';

export interface ApiKeyProps {
  name: string;
  description?: string;
  keyType: string;
  apiKeyId?: string;
  apiKeySecret: string;
  keyPrefix: KeyPrefix;
  keyHint: string;
  encryptKey?: string;
  isSystem: boolean;
  permissions: string[];
  scopes: string[];
  rateLimit?: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  usageCount: number;
  isActive: boolean;
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
}

export interface CreateApiKeyProps {
  name: string;
  description?: string;
  keyType: 'test' | 'secret' | 'standard' | 'service';
  permissions: string[];
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: Date;
  organizationId: string;
  workspaceId?: string;
  tenantId?: string;
  createdBy: string;
}

export interface ApiKeyCreatedKeys {
  apiKey: ApiKey;
  rawKeyId: string;
  rawKeySecret: string;
  rawEncryptionKey: string;
}

/** @deprecated Use ApiKeyCreatedKeys instead */
export interface ApiKeyWithRawKey {
  apiKey: ApiKey;
  rawKey: string;
}

export interface ReconstituteApiKeyProps {
  id?: ApiKeyId;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  keyType: string;
  apiKeyId?: string;
  keyPrefix: KeyPrefix | string;
  apiKeySecret: string;
  keyHint: string;
  encryptKey?: string;
  isSystem?: boolean;
  permissions: string[];
  scopes: string[];
  rateLimit?: number;
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  usageCount: number;
  createdBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  revocationReason?: string;
  rotatedAt?: Date;
  rotatedBy?: string;
  rotationCount?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ApiKey extends AggregateRoot<ApiKeyId> {
  private props: ApiKeyProps;

  private constructor(id: ApiKeyId, props: ApiKeyProps) {
    super();
    this._id = id;
    this.props = props;
  }

  /**
   * Generate a key identifier (tfk_ prefix + 32 hex chars)
   */
  private static generateApiKeyId(): string {
    return `${KeyPrefixType.KEY_ID}${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate a key secret (tfs_ prefix + 64 hex chars)
   */
  private static generateApiKeySecret(): string {
    return `${KeyPrefixType.SECRET_ID}${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate a per-key encryption key (64 hex chars / 32 bytes)
   */
  private static generateEncryptKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new API Key with 3 keys:
   * - apiKeyId     (tfk_ prefix): public identifier
   * - apiKeySecret (tfs_ prefix): authentication secret
   * - encryptKey:  per-key encryption key
   *
   * All 3 are returned only once at creation time.
   */
  static create(props: CreateApiKeyProps): ApiKeyCreatedKeys {
    const id = ApiKeyId.create();

    // Generate the 3 keys
    const rawKeyId = ApiKey.generateApiKeyId();
    const rawKeySecret = ApiKey.generateApiKeySecret();
    const rawEncryptionKey = ApiKey.generateEncryptKey();

    const keyPrefix = KeyPrefix.secret(); // Always tfs_ for the hashed secret
    const keyHint = rawKeySecret.slice(-4);

    // Hash the secret for storage (one-way) using a slow password hash
    const secretSalt = crypto.randomBytes(16).toString('hex');
    const secretHash = crypto.scryptSync(rawKeySecret, secretSalt, 64).toString('hex');
    const apiKeySecret = `${secretSalt}:${secretHash}`;

    const now = new Date();
    const apiKey = new ApiKey(id, {
      name: props.name,
      description: props.description,
      keyType: props.keyType,
      apiKeyId: rawKeyId,
      keyPrefix,
      apiKeySecret,
      keyHint,
      encryptKey: undefined, // Will be set by handler after encryption
      isSystem: false,
      permissions: props.permissions,
      scopes: props.scopes || [],
      rateLimit: props.rateLimit,
      expiresAt: props.expiresAt,
      lastUsedAt: undefined,
      lastUsedIp: undefined,
      usageCount: 0,
      isActive: true,
      organizationId: props.organizationId,
      workspaceId: props.workspaceId,
      tenantId: props.tenantId,
      createdBy: props.createdBy,
      createdAt: now,
      updatedAt: now,
      revokedAt: undefined,
      revokedBy: undefined,
      revocationReason: undefined,
      rotatedAt: undefined,
      rotatedBy: undefined,
      rotationCount: 0,
      metadata: undefined,
    });

    apiKey.addDomainEvent(
      new ApiKeyCreatedEvent({
        apiKeyId: id.getValue(),
        name: props.name,
        keyPrefix: keyPrefix.getValue(),
        organizationId: props.organizationId,
        workspaceId: props.workspaceId,
        createdBy: props.createdBy,
        permissions: props.permissions,
        expiresAt: props.expiresAt,
      }),
    );

    return { apiKey, rawKeyId, rawKeySecret, rawEncryptionKey };
  }

  /**
   * Reconstitute from persistence
   * Supports both (id, props) and single-object signatures
   */
  static reconstitute(
    idOrProps: string | ReconstituteApiKeyProps,
    maybeProps?: Omit<ApiKeyProps, 'keyPrefix'> & { keyPrefix: string },
  ): ApiKey {
    if (typeof idOrProps === 'string') {
      // Legacy two-argument signature: reconstitute(id: string, props)
      const props = maybeProps!;
      return new ApiKey(ApiKeyId.fromString(idOrProps), {
        ...props,
        keyType: (props as any).keyType || 'standard',
        keyHint: (props as any).keyHint || '',
        rotationCount: (props as any).rotationCount || 0,
        isSystem: (props as any).isSystem ?? false,
        keyPrefix: KeyPrefix.fromString(props.keyPrefix),
      });
    }

    // Single-object signature: reconstitute({ id, ...props })
    const { id, keyPrefix, ...rest } = idOrProps;
    const resolvedId = id || ApiKeyId.create();
    const resolvedPrefix =
      typeof keyPrefix === 'string' ? KeyPrefix.fromString(keyPrefix) : keyPrefix;

    return new ApiKey(resolvedId, {
      ...rest,
      keyPrefix: resolvedPrefix,
      keyHint: rest.keyHint || '',
      rotationCount: rest.rotationCount || 0,
      isSystem: rest.isSystem ?? false,
    });
  }

  /**
   * Validate a raw API key secret against this key's stored hash
   */
  validateKey(rawKey: string): boolean {
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    return hash === this.props.apiKeySecret;
  }

  /**
   * Record usage of the API key
   */
  recordUsage(ipAddress?: string): void {
    this.props.lastUsedAt = new Date();
    this.props.lastUsedIp = ipAddress;
    this.props.usageCount += 1;
    this.props.updatedAt = new Date();
  }

  /**
   * Rotate the API key (generate new secret + encryption key)
   * Returns the new raw keys
   */
  rotate(rotatedBy: string): { rawKeySecret: string; rawEncryptionKey: string } {
    const previousPrefix = this.props.keyPrefix.getValue();

    // Generate new secret and encryption key
    const rawKeySecret = ApiKey.generateApiKeySecret();
    const rawEncryptionKey = ApiKey.generateEncryptKey();
    const keyHint = rawKeySecret.slice(-4);
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(rawKeySecret, salt, 64).toString('hex');
    const apiKeySecret = `${salt}:${derivedKey}`;

    this.props.apiKeySecret = apiKeySecret;
    this.props.keyHint = keyHint;
    this.props.encryptKey = undefined; // Will be re-set by handler
    this.props.rotatedAt = new Date();
    this.props.rotatedBy = rotatedBy;
    this.props.rotationCount = (this.props.rotationCount || 0) + 1;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ApiKeyRotatedEvent({
        apiKeyId: this.id.getValue(),
        name: this.props.name,
        organizationId: this.props.organizationId,
        rotatedBy,
        previousKeyPrefix: previousPrefix,
        newKeyPrefix: this.props.keyPrefix.getValue(),
      }),
    );

    return { rawKeySecret, rawEncryptionKey };
  }

  /**
   * Revoke the API key
   */
  revoke(revokedBy: string, reason?: string): void {
    if (this.props.isSystem) {
      throw new Error('System API keys cannot be revoked');
    }

    if (!this.props.isActive) {
      throw new Error('API key is already revoked');
    }

    this.props.isActive = false;
    this.props.revokedAt = new Date();
    this.props.revokedBy = revokedBy;
    this.props.revocationReason = reason;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ApiKeyRevokedEvent({
        apiKeyId: this.id.getValue(),
        name: this.props.name,
        organizationId: this.props.organizationId,
        revokedBy,
        reason,
      }),
    );
  }

  /**
   * Activate the API key
   */
  activate(): void {
    if (this.props.isActive) {
      return;
    }

    this.props.isActive = true;
    this.props.revokedAt = undefined;
    this.props.revokedBy = undefined;
    this.props.revocationReason = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate the API key (soft revoke without reason tracking)
   */
  deactivate(): void {
    if (this.props.isSystem) {
      throw new Error('System API keys cannot be deactivated');
    }
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Update API key properties
   */
  update(props: {
    name?: string;
    description?: string;
    permissions?: string[];
    scopes?: string[];
    rateLimit?: number;
    expiresAt?: Date | null;
    metadata?: Record<string, unknown>;
  }): void {
    if (props.name !== undefined) {
      this.props.name = props.name;
    }
    if (props.description !== undefined) {
      this.props.description = props.description;
    }
    if (props.permissions !== undefined) {
      this.props.permissions = props.permissions;
    }
    if (props.scopes !== undefined) {
      this.props.scopes = props.scopes;
    }
    if (props.rateLimit !== undefined) {
      this.props.rateLimit = props.rateLimit;
    }
    if (props.expiresAt !== undefined) {
      this.props.expiresAt = props.expiresAt || undefined;
    }
    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Set the encrypted encryption key (called by handler after encrypting)
   */
  setEncryptKey(encrypted: string): void {
    this.props.encryptKey = encrypted;
  }

  /**
   * Check if the API key is expired
   */
  isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false;
    }
    return new Date() > this.props.expiresAt;
  }

  /**
   * Check if the API key is valid for use
   */
  isValid(): boolean {
    return this.props.isActive && !this.isExpired();
  }

  /**
   * Check if the API key has a specific permission
   */
  hasPermission(permission: string): boolean {
    if (this.props.permissions.includes('*')) {
      return true;
    }

    if (this.props.permissions.includes(permission)) {
      return true;
    }

    const parts = permission.split(':');
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcardPermission = [...parts.slice(0, i), '*'].join(':');
      if (this.props.permissions.includes(wildcardPermission)) {
        return true;
      }
    }

    return false;
  }

  // Getters
  getId(): ApiKeyId {
    return this.id;
  }

  getName(): string {
    return this.props.name;
  }

  getDescription(): string | undefined {
    return this.props.description;
  }

  getKeyType(): string {
    return this.props.keyType;
  }

  getApiKeyId(): string | undefined {
    return this.props.apiKeyId;
  }

  getKeyPrefix(): KeyPrefix {
    return this.props.keyPrefix;
  }

  getApiKeySecret(): string {
    return this.props.apiKeySecret;
  }

  getKeyHint(): string {
    return this.props.keyHint;
  }

  getKeySuffix(): string {
    return this.props.keyHint;
  }

  getDisplayKey(): string {
    return `${this.props.keyPrefix.getValue()}...${this.props.keyHint}`;
  }

  getEncryptKey(): string | undefined {
    return this.props.encryptKey;
  }

  getIsSystem(): boolean {
    return this.props.isSystem;
  }

  getPermissions(): string[] {
    return [...this.props.permissions];
  }

  getScopes(): string[] {
    return [...this.props.scopes];
  }

  getRateLimit(): number | undefined {
    return this.props.rateLimit;
  }

  getExpiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  getLastUsedAt(): Date | undefined {
    return this.props.lastUsedAt;
  }

  getLastUsedIp(): string | undefined {
    return this.props.lastUsedIp;
  }

  getUsageCount(): number {
    return this.props.usageCount;
  }

  getIsActive(): boolean {
    return this.props.isActive;
  }

  getOrganizationId(): string {
    return this.props.organizationId;
  }

  getWorkspaceId(): string | undefined {
    return this.props.workspaceId;
  }

  getTenantId(): string | undefined {
    return this.props.tenantId;
  }

  getCreatedBy(): string {
    return this.props.createdBy;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  getRevokedAt(): Date | undefined {
    return this.props.revokedAt;
  }

  getRevokedBy(): string | undefined {
    return this.props.revokedBy;
  }

  getRevokedReason(): string | undefined {
    return this.props.revocationReason;
  }

  getRevocationReason(): string | undefined {
    return this.props.revocationReason;
  }

  getRotatedAt(): Date | undefined {
    return this.props.rotatedAt;
  }

  getRotatedBy(): string | undefined {
    return this.props.rotatedBy;
  }

  getRotationCount(): number {
    return this.props.rotationCount || 0;
  }

  getMetadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }
}
