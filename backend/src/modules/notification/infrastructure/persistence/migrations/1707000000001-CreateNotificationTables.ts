/**
 * Notification Migration: Create Notification Tables
 * Timestamp: 1707000000001 (Notification module range)
 *
 * Creates tables for:
 * - Notification logs (sent notification audit trail)
 * - Notification templates (email/slack/webhook templates)
 * - Notification channels (configured notification destinations)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateNotificationTables1707000000001 extends BaseMigration {
  name = "CreateNotificationTables1707000000001";
  moduleName = "notification";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating notification tables...");

    // Create notification_templates table
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "notification_templates",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "organization_id",
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
            name: "type",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "subject",
            type: "varchar",
            length: "500",
            isNullable: false,
          },
          {
            name: "body",
            type: "text",
            isNullable: false,
          },
          {
            name: "variables",
            type: "jsonb",
            default: "'[]'",
          },
          {
            name: "is_system",
            type: "boolean",
            default: false,
          },
          {
            name: "enabled",
            type: "boolean",
            default: true,
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

    // Create ntf_channels table
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "ntf_channels",
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
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
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
            name: "verified",
            type: "boolean",
            default: false,
          },
          {
            name: "last_tested_at",
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

    // Create notification_logs table
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "notification_logs",
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
            name: "type",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "channel",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "recipient",
            type: "varchar",
            length: "500",
            isNullable: false,
          },
          {
            name: "subject",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "template_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "template_data",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'pending'",
          },
          {
            name: "error_message",
            type: "text",
            isNullable: true,
          },
          {
            name: "retry_count",
            type: "int",
            default: 0,
          },
          {
            name: "sent_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "delivered_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "jsonb",
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
      "notification_templates",
      new TableForeignKey({
        name: "FK_notification_templates_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "ntf_channels",
      new TableForeignKey({
        name: "FK_ntf_channels_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "notification_logs",
      new TableForeignKey({
        name: "FK_notification_logs_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    // Indexes for notification_templates
    await this.createIndexIfNotExists(
      queryRunner,
      "notification_templates",
      new TableIndex({
        name: "IDX_notification_templates_organization_id",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "notification_templates",
      new TableIndex({
        name: "IDX_notification_templates_org_name",
        columnNames: ["organization_id", "name"],
        isUnique: true,
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "notification_templates",
      new TableIndex({
        name: "IDX_notification_templates_org_type",
        columnNames: ["organization_id", "type"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "notification_templates",
      new TableIndex({
        name: "IDX_notification_templates_is_system",
        columnNames: ["is_system"],
      }),
    );

    // Indexes for ntf_channels
    await this.createIndexIfNotExists(
      queryRunner,
      "ntf_channels",
      new TableIndex({
        name: "IDX_ntf_channels_organization_id",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "ntf_channels",
      new TableIndex({
        name: "IDX_ntf_channels_org_name",
        columnNames: ["organization_id", "name"],
        isUnique: true,
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "ntf_channels",
      new TableIndex({
        name: "IDX_ntf_channels_org_type",
        columnNames: ["organization_id", "type"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "ntf_channels",
      new TableIndex({
        name: "IDX_ntf_channels_org_enabled",
        columnNames: ["organization_id", "enabled"],
      }),
    );

    // Indexes for notification_logs
    await this.createIndexIfNotExists(
      queryRunner,
      "notification_logs",
      new TableIndex({
        name: "IDX_notification_logs_organization_id",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "notification_logs",
      new TableIndex({
        name: "IDX_notification_logs_org_status",
        columnNames: ["organization_id", "status"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "notification_logs",
      new TableIndex({
        name: "IDX_notification_logs_org_type",
        columnNames: ["organization_id", "type"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "notification_logs",
      new TableIndex({
        name: "IDX_notification_logs_org_created_at",
        columnNames: ["organization_id", "created_at"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "notification_logs",
      new TableIndex({
        name: "IDX_notification_logs_status",
        columnNames: ["status"],
      }),
    );

    // Comments
    await queryRunner.query(`
      COMMENT ON TABLE "notification_templates" IS 'Reusable notification templates (email, slack, webhook) with Handlebars content'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "ntf_channels" IS 'Configured notification channels (email, slack, discord, teams, pagerduty, opsgenie, webhook)'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "notification_logs" IS 'Audit trail of all sent notifications with delivery status tracking'
    `);

    this.log("Notification tables created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping notification tables...");
    await queryRunner.dropTable("notification_logs", true, true, true);
    await queryRunner.dropTable("ntf_channels", true, true, true);
    await queryRunner.dropTable("notification_templates", true, true, true);
    this.log("Notification tables dropped");
  }
}
