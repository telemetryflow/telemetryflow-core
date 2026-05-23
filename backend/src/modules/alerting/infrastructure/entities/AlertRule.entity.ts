import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * AlertRule Entity
 * Updated: TASK-03 - Added TFQL support columns
 */
@Entity("alert_rules")
@Index(["organizationId", "enabled"])
@Index(["organizationId", "name"], { unique: true })
@Index(["sourceType"]) // New index for source filtering
@Index(["queryLanguage"]) // New index for query language filtering
@Index(["organizationId", "sourceType"]) // New composite index
export class AlertRuleEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  @Index()
  organizationId: string;

  @Column({ name: "workspace_id", type: "uuid", nullable: true })
  workspaceId: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ length: 20, default: "warning" })
  severity: string;

  @Column({ type: "jsonb", default: [] })
  conditions: object[];

  @Column({ name: "notification_channels", type: "jsonb", default: [] })
  notificationChannels: object[];

  @Column({ type: "jsonb", default: {} })
  labels: Record<string, string>;

  @Column({ type: "jsonb", default: {} })
  annotations: Record<string, string>;

  @Column({ default: true })
  enabled: boolean;

  @Column({ length: 20, default: "ok" })
  state: string;

  @Column({ name: "evaluation_interval", length: 20, default: "1m" })
  evaluationInterval: string;

  @Column({ name: "for_duration", length: 20, default: "5m" })
  forDuration: string;

  @Column({ name: "mute_timings", type: "jsonb", nullable: true })
  muteTimings: string[] | null;

  @Column({ name: "last_evaluated_at", type: "timestamptz", nullable: true })
  lastEvaluatedAt: Date | null;

  @Column({ name: "last_triggered_at", type: "timestamptz", nullable: true })
  lastTriggeredAt: Date | null;

  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // ==================== TFQL SUPPORT COLUMNS (TASK-03) ====================

  /**
   * Query language used for this alert rule
   * - condition: Legacy simple conditions (default)
   * - tfql: TelemetryFlow Query Language
   * - promql: Prometheus Query Language
   * - elasticsearch: Elasticsearch DSL
   * - sql: Direct SQL queries
   */
  @Column({
    name: "query_language",
    length: 20,
    default: "condition",
  })
  queryLanguage: string;

  /**
   * Raw query string when using TFQL/PromQL/etc.
   */
  @Column({
    name: "query_string",
    type: "text",
    nullable: true,
  })
  queryString: string | null;

  /**
   * Cached parsed AST for performance optimization
   */
  @Column({
    name: "parsed_ast",
    type: "jsonb",
    nullable: true,
  })
  parsedAst: Record<string, unknown> | null;

  /**
   * TFQL fetch target (metrics, logs, traces, etc.)
   */
  @Column({
    name: "query_target",
    length: 50,
    nullable: true,
  })
  queryTarget: string | null;

  /**
   * Alert source type
   * - prometheus: Traditional Prometheus alerts
   * - tfo-agent: TelemetryFlow Agent (host metrics)
   * - tfo-collector: TelemetryFlow OTEL Collector
   * - custom: Custom alert source
   */
  @Column({
    name: "source_type",
    length: 20,
    default: "prometheus",
  })
  sourceType: string;
}
