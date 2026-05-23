/**
 * Migration: Create LLM Tables
 * Creates tables for LLM providers, conversations, messages, and context snapshots
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateLLMTables1721000000001 extends BaseMigration {
  name = "CreateLLMTables1721000000001";
  moduleName = "llm";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating LLM tables...");

    // =====================================================
    // Table: llm_providers
    // =====================================================
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "llm_providers",
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
            name: "provider_type",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "encrypted_api_key",
            type: "text",
            isNullable: false,
          },
          {
            name: "api_key_hint",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "base_url",
            type: "varchar",
            length: "512",
            isNullable: true,
          },
          {
            name: "model_id",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "model_config",
            type: "jsonb",
            default: "'{}'",
          },
          {
            name: "is_default",
            type: "boolean",
            default: false,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
          },
          {
            name: "last_used_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "usage_count",
            type: "bigint",
            default: 0,
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

    // Indexes for llm_providers
    await this.createIndexIfNotExists(
      queryRunner,
      "llm_providers",
      new TableIndex({
        name: "IDX_llm_providers_org_id",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "llm_providers",
      new TableIndex({
        name: "IDX_llm_providers_org_default",
        columnNames: ["organization_id", "is_default"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "llm_providers",
      new TableIndex({
        name: "IDX_llm_providers_org_name",
        columnNames: ["organization_id", "name"],
        isUnique: true,
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "llm_providers",
      new TableIndex({
        name: "IDX_llm_providers_org_type",
        columnNames: ["organization_id", "provider_type"],
      }),
    );

    // =====================================================
    // Table: llm_conversations
    // =====================================================
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "llm_conversations",
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
            name: "user_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "provider_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "title",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "context_type",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "context_id",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "message_count",
            type: "int",
            default: 0,
          },
          {
            name: "total_tokens_used",
            type: "bigint",
            default: 0,
          },
          {
            name: "last_message_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "is_archived",
            type: "boolean",
            default: false,
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

    // Indexes for llm_conversations
    await this.createIndexIfNotExists(
      queryRunner,
      "llm_conversations",
      new TableIndex({
        name: "IDX_llm_conversations_org_user",
        columnNames: ["organization_id", "user_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "llm_conversations",
      new TableIndex({
        name: "IDX_llm_conversations_context",
        columnNames: ["context_type", "context_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "llm_conversations",
      new TableIndex({
        name: "IDX_llm_conversations_provider",
        columnNames: ["provider_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "llm_conversations",
      new TableIndex({
        name: "IDX_llm_conversations_last_message",
        columnNames: ["organization_id", "user_id", "last_message_at"],
      }),
    );

    // =====================================================
    // Table: llm_messages
    // =====================================================
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "llm_messages",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "conversation_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "role",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "content",
            type: "text",
            isNullable: false,
          },
          {
            name: "tokens_used",
            type: "int",
            isNullable: true,
          },
          {
            name: "model_id",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "latency_ms",
            type: "int",
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
        ],
      }),
    );

    // Indexes for llm_messages
    await this.createIndexIfNotExists(
      queryRunner,
      "llm_messages",
      new TableIndex({
        name: "IDX_llm_messages_conversation",
        columnNames: ["conversation_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "llm_messages",
      new TableIndex({
        name: "IDX_llm_messages_created",
        columnNames: ["conversation_id", "created_at"],
      }),
    );

    // =====================================================
    // Table: llm_context_snapshots
    // =====================================================
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "llm_context_snapshots",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "message_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "context_type",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "context_data",
            type: "jsonb",
            isNullable: false,
          },
          {
            name: "summary",
            type: "text",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
    );

    // Index for llm_context_snapshots
    await this.createIndexIfNotExists(
      queryRunner,
      "llm_context_snapshots",
      new TableIndex({
        name: "IDX_llm_context_snapshots_message",
        columnNames: ["message_id"],
      }),
    );

    // =====================================================
    // Foreign Keys
    // =====================================================

    // llm_providers -> organizations
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "llm_providers",
      new TableForeignKey({
        name: "FK_llm_providers_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    // llm_conversations -> organizations
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "llm_conversations",
      new TableForeignKey({
        name: "FK_llm_conversations_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    // llm_conversations -> users
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "llm_conversations",
      new TableForeignKey({
        name: "FK_llm_conversations_user",
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // llm_conversations -> llm_providers
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "llm_conversations",
      new TableForeignKey({
        name: "FK_llm_conversations_provider",
        columnNames: ["provider_id"],
        referencedTableName: "llm_providers",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );

    // llm_messages -> llm_conversations
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "llm_messages",
      new TableForeignKey({
        name: "FK_llm_messages_conversation",
        columnNames: ["conversation_id"],
        referencedTableName: "llm_conversations",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // llm_context_snapshots -> llm_messages
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "llm_context_snapshots",
      new TableForeignKey({
        name: "FK_llm_context_snapshots_message",
        columnNames: ["message_id"],
        referencedTableName: "llm_messages",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    this.log("LLM tables created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping LLM tables...");

    // Drop foreign keys first
    await queryRunner
      .dropForeignKey(
        "llm_context_snapshots",
        "FK_llm_context_snapshots_message",
      )
      .catch(() => {});
    await queryRunner
      .dropForeignKey("llm_messages", "FK_llm_messages_conversation")
      .catch(() => {});
    await queryRunner
      .dropForeignKey("llm_conversations", "FK_llm_conversations_provider")
      .catch(() => {});
    await queryRunner
      .dropForeignKey("llm_conversations", "FK_llm_conversations_user")
      .catch(() => {});
    await queryRunner
      .dropForeignKey("llm_conversations", "FK_llm_conversations_organization")
      .catch(() => {});
    await queryRunner
      .dropForeignKey("llm_providers", "FK_llm_providers_organization")
      .catch(() => {});

    // Drop tables
    await queryRunner.dropTable("llm_context_snapshots", true, true, true);
    await queryRunner.dropTable("llm_messages", true, true, true);
    await queryRunner.dropTable("llm_conversations", true, true, true);
    await queryRunner.dropTable("llm_providers", true, true, true);

    this.log("LLM tables dropped successfully");
  }
}
