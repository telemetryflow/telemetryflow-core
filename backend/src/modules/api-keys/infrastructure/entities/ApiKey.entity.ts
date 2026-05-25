import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('api_keys')
@Index(['organizationId', 'isActive'])
@Index(['apiKeySecret'], { unique: true })
@Index(['keyPrefix'])
export class ApiKeyEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  @Index()
  organizationId: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'key_type', length: 50, default: 'standard' })
  keyType: string;

  @Column({ name: 'api_key_id', length: 128, nullable: true })
  apiKeyId: string | null;

  @Column({ name: 'key_prefix', length: 10 })
  keyPrefix: string;

  @Column({ name: 'api_key_secret', length: 256 })
  apiKeySecret: string;

  @Column({ name: 'key_hint', length: 20 })
  keyHint: string;

  @Column({ name: 'encrypt_key', type: 'text', nullable: true })
  encryptKey: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'jsonb', default: [] })
  permissions: string[];

  @Column({ type: 'jsonb', default: [] })
  scopes: string[];

  @Column({ name: 'rate_limit', type: 'int', nullable: true })
  rateLimit: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'last_used_ip', type: 'inet', nullable: true })
  lastUsedIp: string | null;

  @Column({ name: 'usage_count', type: 'bigint', default: 0 })
  usageCount: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedBy: string | null;

  @Column({ name: 'revocation_reason', type: 'text', nullable: true })
  revocationReason: string | null;

  @Column({ name: 'rotated_at', type: 'timestamptz', nullable: true })
  rotatedAt: Date | null;

  @Column({ name: 'rotated_by', type: 'uuid', nullable: true })
  rotatedBy: string | null;

  @Column({ name: 'rotation_count', type: 'int', default: 0 })
  rotationCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
