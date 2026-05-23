/**
 * Alerting Migration: Create Alerting Tables
 * Timestamp: 1710000000001 (Alerting module range)
 *
 * Creates tables for:
 * - Alert rules (conditions, thresholds, notification configs)
 * - Alert instances (active/resolved alerts)
 * - Notification channels (email, slack, webhook, etc.)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateAlertingTables1710000000001 extends BaseMigration {
  name = "CreateAlertingTables1710000000001";
  moduleName = "alerting";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating alerting tables...");

    // Create notification_channels table first (referenced by alert_rules)
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "notification_channels",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "organization_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "type",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "config",
            type: "jsonb",
            isNullable: false,
          },
          {
            name: "enabled",
            type: "boolean",
            default: true,
          },
          {
            name: "send_resolved",
            type: "boolean",
            default: true,
          },
          {
            name: "send_reminder",
            type: "boolean",
            default: false,
          },
          {
            name: "reminder_interval",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "last_used_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "last_error",
            type: "text",
            isNullable: true,
          },
          {
            name: "error_count",
            type: "int",
            default: 0,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
    );

    // Create alert_rules table
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "alert_rules",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "organization_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "workspace_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "severity",
            type: "varchar",
            length: "20",
            default: "'warning'",
          },
          {
            name: "conditions",
            type: "jsonb",
            default: "'[]'",
          },
          {
            name: "notification_channels",
            type: "jsonb",
            default: "'[]'",
          },
          {
            name: "labels",
            type: "jsonb",
            default: "'{}'",
          },
          {
            name: "annotations",
            type: "jsonb",
            default: "'{}'",
          },
          {
            name: "enabled",
            type: "boolean",
            default: true,
          },
          {
            name: "state",
            type: "varchar",
            length: "20",
            default: "'ok'",
          },
          {
            name: "evaluation_interval",
            type: "varchar",
            length: "20",
            default: "'1m'",
          },
          {
            name: "for_duration",
            type: "varchar",
            length: "20",
            default: "'5m'",
          },
          {
            name: "mute_timings",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "last_evaluated_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "last_triggered_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "created_by",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
    );

    // Create alert_instances table
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "alert_instances",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "alert_rule_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "organization_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "workspace_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'firing'",
          },
          {
            name: "severity",
            type: "varchar",
            length: "20",
            default: "'warning'",
          },
          {
            name: "title",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: false,
          },
          {
            name: "current_value",
            type: "double precision",
            isNullable: false,
          },
          {
            name: "threshold",
            type: "double precision",
            isNullable: false,
          },
          {
            name: "labels",
            type: "jsonb",
            default: "'{}'",
          },
          {
            name: "annotations",
            type: "jsonb",
            default: "'{}'",
          },
          {
            name: "starts_at",
            type: "timestamptz",
            isNullable: false,
          },
          {
            name: "ends_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "acknowledged_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "acknowledged_by",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "acknowledge_comment",
            type: "text",
            isNullable: true,
          },
          {
            name: "resolved_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "resolved_by",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "resolution",
            type: "text",
            isNullable: true,
          },
          {
            name: "notifications_sent",
            type: "jsonb",
            default: "'[]'",
          },
          {
            name: "fingerprint",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "silenced_until",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
    );

    // Foreign keys
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "notification_channels",
      new TableForeignKey({
        name: "FK_notification_channels_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "alert_rules",
      new TableForeignKey({
        name: "FK_alert_rules_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "alert_rules",
      new TableForeignKey({
        name: "FK_alert_rules_created_by",
        columnNames: ["created_by"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "alert_instances",
      new TableForeignKey({
        name: "FK_alert_instances_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "alert_instances",
      new TableForeignKey({
        name: "FK_alert_instances_alert_rule",
        columnNames: ["alert_rule_id"],
        referencedTableName: "alert_rules",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // Indexes for notification_channels
    await this.createIndexIfNotExists(
      queryRunner,
      "notification_channels",
      new TableIndex({
        name: "IDX_notification_channels_organization_id",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "notification_channels",
      new TableIndex({
        name: "IDX_notification_channels_org_name",
        columnNames: ["organization_id", "name"],
        isUnique: true,
      }),
    );

    // Indexes for alert_rules
    await this.createIndexIfNotExists(
      queryRunner,
      "alert_rules",
      new TableIndex({
        name: "IDX_alert_rules_organization_id",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "alert_rules",
      new TableIndex({
        name: "IDX_alert_rules_org_enabled",
        columnNames: ["organization_id", "enabled"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "alert_rules",
      new TableIndex({
        name: "IDX_alert_rules_org_name",
        columnNames: ["organization_id", "name"],
        isUnique: true,
      }),
    );

    // Indexes for alert_instances
    await this.createIndexIfNotExists(
      queryRunner,
      "alert_instances",
      new TableIndex({
        name: "IDX_alert_instances_organization_id",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "alert_instances",
      new TableIndex({
        name: "IDX_alert_instances_org_status",
        columnNames: ["organization_id", "status"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "alert_instances",
      new TableIndex({
        name: "IDX_alert_instances_alert_rule_id",
        columnNames: ["alert_rule_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "alert_instances",
      new TableIndex({
        name: "IDX_alert_instances_rule_status",
        columnNames: ["alert_rule_id", "status"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "alert_instances",
      new TableIndex({
        name: "IDX_alert_instances_fingerprint_active",
        columnNames: ["fingerprint"],
        where: "status != 'resolved'",
      }),
    );

    // Comments
    await queryRunner.query(`
      COMMENT ON TABLE "notification_channels" IS 'Notification channels for alerts (email, slack, webhook, etc.)'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "alert_rules" IS 'Alert rules with conditions and notification configurations'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "alert_instances" IS 'Active and historical alert instances'
    `);

    this.log("Alerting tables created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping alerting tables...");
    await queryRunner.dropTable("alert_instances", true, true, true);
    await queryRunner.dropTable("alert_rules", true, true, true);
    await queryRunner.dropTable("notification_channels", true, true, true);
    this.log("Alerting tables dropped");
  }
}
