import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("notification_channels")
@Index(["organizationId", "name"], { unique: true })
export class NotificationChannelEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  @Index()
  organizationId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ length: 50 })
  type: string; // email, slack, webhook, pagerduty, teams, opsgenie

  @Column({ type: "jsonb" })
  config: Record<string, unknown>;

  @Column({ default: true })
  enabled: boolean;

  @Column({ name: "is_default", default: false })
  isDefault: boolean;

  @Column({ name: "send_resolved", default: true })
  sendResolved: boolean;

  @Column({ name: "send_reminder", default: false })
  sendReminder: boolean;

  @Column({ name: "reminder_interval", length: 20, nullable: true })
  reminderInterval: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: "last_used_at", type: "timestamptz", nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: "last_error", type: "text", nullable: true })
  lastError: string | null;

  @Column({ name: "error_count", type: "int", default: 0 })
  errorCount: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
