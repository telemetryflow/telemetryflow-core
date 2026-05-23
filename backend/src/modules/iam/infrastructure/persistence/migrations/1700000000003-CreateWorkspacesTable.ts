/**
 * IAM Migration: Create Workspaces Table
 * Timestamp: 1700000000003 (IAM module range)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateWorkspacesTable1700000000003 extends BaseMigration {
  name = "CreateWorkspacesTable1700000000003";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating workspaces table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "workspaces",
        columns: [
          {
            name: "workspace_id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "code",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "organization_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "deleted_at",
            type: "timestamp",
            isNullable: true,
          },
        ],
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "workspaces",
      new TableForeignKey({
        name: "FK_workspaces_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "workspaces",
      new TableIndex({
        name: "IDX_workspaces_organization",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "workspaces",
      new TableIndex({
        name: "IDX_workspaces_code_org",
        columnNames: ["code", "organization_id"],
        isUnique: true,
      }),
    );

    this.log("Workspaces table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping workspaces table...");
    await queryRunner.dropTable("workspaces", true, true, true);
    this.log("Workspaces table dropped");
  }
}
