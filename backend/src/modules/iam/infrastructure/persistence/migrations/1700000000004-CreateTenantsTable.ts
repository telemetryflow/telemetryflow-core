/**
 * IAM Migration: Create Tenants Table
 * Timestamp: 1700000000004 (IAM module range)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateTenantsTable1700000000004 extends BaseMigration {
  name = "CreateTenantsTable1700000000004";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating tenants table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "tenants",
        columns: [
          {
            name: "tenant_id",
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
            name: "domain",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "workspace_id",
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
      "tenants",
      new TableForeignKey({
        name: "FK_tenants_workspace",
        columnNames: ["workspace_id"],
        referencedTableName: "workspaces",
        referencedColumnNames: ["workspace_id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "tenants",
      new TableIndex({
        name: "IDX_tenants_workspace",
        columnNames: ["workspace_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "tenants",
      new TableIndex({
        name: "IDX_tenants_code_workspace",
        columnNames: ["code", "workspace_id"],
        isUnique: true,
      }),
    );

    this.log("Tenants table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping tenants table...");
    await queryRunner.dropTable("tenants", true, true, true);
    this.log("Tenants table dropped");
  }
}
