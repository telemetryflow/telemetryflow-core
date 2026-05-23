/**
 * LLMProvider TypeORM Entity
 */

import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("llm_providers")
@Index(["organizationId"])
@Index(["organizationId", "isDefault"])
@Index(["organizationId", "name"], { unique: true })
@Index(["organizationId", "providerType"])
export class LLMProviderEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "organization_id" })
  organizationId: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 50, name: "provider_type" })
  providerType: string;

  @Column({ type: "text", name: "encrypted_api_key" })
  encryptedApiKey: string;

  @Column({ type: "varchar", length: 20, name: "api_key_hint" })
  apiKeyHint: string;

  @Column({ type: "varchar", length: 512, nullable: true, name: "base_url" })
  baseUrl: string | null;

  @Column({ type: "varchar", length: 100, name: "model_id" })
  modelId: string;

  @Column({ type: "jsonb", default: {}, name: "model_config" })
  modelConfig: Record<string, unknown>;

  @Column({ type: "boolean", default: false, name: "is_default" })
  isDefault: boolean;

  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive: boolean;

  @Column({ type: "timestamptz", nullable: true, name: "last_used_at" })
  lastUsedAt: Date | null;

  @Column({ type: "bigint", default: 0, name: "usage_count" })
  usageCount: number;

  @Column({ type: "uuid", name: "created_by" })
  createdBy: string;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}
