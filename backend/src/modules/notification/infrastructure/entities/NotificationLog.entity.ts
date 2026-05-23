import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * NotificationLog Entity
 *
 * Stores records of all sent notifications across all channels
 * (email, slack, webhook, sms) for audit trail and delivery tracking.
 */
@Entity("notification_logs")
@Index(["organizationId", "status"])
@Index(["organizationId", "type"])
@Index(["organizationId", "createdAt"])
export class NotificationLogEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  @Index()
  organizationId: string;

  @Column({ length: 20 })
  type: string;

  @Column({ length: 255 })
  channel: string;

  @Column({ length: 500 })
  recipient: string;

  @Column({ length: 500, nullable: true })
  subject: string | null;

  @Column({ name: "template_name", length: 255, nullable: true })
  templateName: string | null;

  @Column({ name: "template_data", type: "jsonb", nullable: true })
  templateData: Record<string, unknown> | null;

  @Column({ length: 20, default: "pending" })
  @Index()
  status: string;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage: string | null;

  @Column({ name: "retry_count", type: "int", default: 0 })
  retryCount: number;

  @Column({ name: "sent_at", type: "timestamptz", nullable: true })
  sentAt: Date | null;

  @Column({ name: "delivered_at", type: "timestamptz", nullable: true })
  deliveredAt: Date | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
