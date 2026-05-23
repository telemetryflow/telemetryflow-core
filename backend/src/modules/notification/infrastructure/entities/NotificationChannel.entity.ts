import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * NotificationChannel Entity
 *
 * Represents a configured notification channel (email, slack, discord,
 * teams, pagerduty, opsgenie, webhook) for an organization.
 * Stores channel-specific configuration such as webhook URLs,
 * API keys, and integration settings.
 */
@Entity("ntf_channels")
@Index(["organizationId", "name"], { unique: true })
@Index(["organizationId", "type"])
@Index(["organizationId", "enabled"])
export class NotificationChannelEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  @Index()
  organizationId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  type: string;

  @Column({ type: "jsonb" })
  config: Record<string, unknown>;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: false })
  verified: boolean;

  @Column({ name: "last_tested_at", type: "timestamptz", nullable: true })
  lastTestedAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
