import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("alert_instances")
@Index(["organizationId", "status"])
@Index(["alertRuleId", "status"])
@Index(["fingerprint"], { unique: true, where: "status != 'resolved'" })
export class AlertInstanceEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "alert_rule_id", type: "uuid" })
  @Index()
  alertRuleId: string;

  @Column({ name: "organization_id", type: "uuid" })
  @Index()
  organizationId: string;

  @Column({ name: "workspace_id", type: "uuid", nullable: true })
  workspaceId: string | null;

  @Column({ length: 20, default: "firing" })
  status: string;

  @Column({ length: 20, default: "warning" })
  severity: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "current_value", type: "double precision" })
  currentValue: number;

  @Column({ type: "double precision" })
  threshold: number;

  @Column({ type: "jsonb", default: {} })
  labels: Record<string, string>;

  @Column({ type: "jsonb", default: {} })
  annotations: Record<string, string>;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt: Date;

  @Column({ name: "ends_at", type: "timestamptz", nullable: true })
  endsAt: Date | null;

  @Column({ name: "acknowledged_at", type: "timestamptz", nullable: true })
  acknowledgedAt: Date | null;

  @Column({ name: "acknowledged_by", type: "uuid", nullable: true })
  acknowledgedBy: string | null;

  @Column({ name: "acknowledge_comment", type: "text", nullable: true })
  acknowledgeComment: string | null;

  @Column({ name: "resolved_at", type: "timestamptz", nullable: true })
  resolvedAt: Date | null;

  @Column({ name: "resolved_by", length: 100, nullable: true })
  resolvedBy: string | null;

  @Column({ type: "text", nullable: true })
  resolution: string | null;

  @Column({ name: "notifications_sent", type: "jsonb", default: [] })
  notificationsSent: string[];

  @Column({ length: 255 })
  fingerprint: string;

  @Column({ name: "silenced_until", type: "timestamptz", nullable: true })
  silencedUntil: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
