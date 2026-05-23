import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sso_providers')
@Index(['organizationId', 'providerName'], { unique: true })
export class SsoProviderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  @Index()
  organizationId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'provider_type', length: 50 })
  providerType: string;

  @Column({ name: 'provider_name', length: 50 })
  providerName: string;

  @Column({ default: false })
  enabled: boolean;

  // OAuth2/OIDC
  @Column({ name: 'client_id', length: 255, nullable: true })
  clientId: string | null;

  @Column({ name: 'client_secret', type: 'text', nullable: true })
  clientSecret: string | null;

  @Column({ name: 'authorization_url', type: 'text', nullable: true })
  authorizationUrl: string | null;

  @Column({ name: 'token_url', type: 'text', nullable: true })
  tokenUrl: string | null;

  @Column({ name: 'user_info_url', type: 'text', nullable: true })
  userInfoUrl: string | null;

  @Column({ type: 'jsonb', default: [] })
  scopes: string[];

  // SAML
  @Column({ name: 'entity_id', type: 'text', nullable: true })
  entityId: string | null;

  @Column({ name: 'sso_url', type: 'text', nullable: true })
  ssoUrl: string | null;

  @Column({ name: 'slo_url', type: 'text', nullable: true })
  sloUrl: string | null;

  @Column({ type: 'text', nullable: true })
  certificate: string | null;

  @Column({ name: 'private_key', type: 'text', nullable: true })
  privateKey: string | null;

  @Column({ name: 'signature_algorithm', length: 50, nullable: true })
  signatureAlgorithm: string | null;

  // Common
  @Column({ name: 'callback_url', type: 'text', nullable: true })
  callbackUrl: string | null;

  @Column({ name: 'allowed_domains', type: 'jsonb', default: [] })
  allowedDomains: string[];

  @Column({ name: 'auto_create_users', default: false })
  autoCreateUsers: boolean;

  @Column({ name: 'default_role_id', type: 'uuid', nullable: true })
  defaultRoleId: string | null;

  @Column({ name: 'attribute_mapping', type: 'jsonb', nullable: true })
  attributeMapping: Record<string, string> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
