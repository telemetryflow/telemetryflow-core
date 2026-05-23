/**
 * IAM Migration: Create Groups Table
 * Timestamp: 1700000000005 (IAM module range)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateGroupsTable1700000000005 extends BaseMigration {
  name = "CreateGroupsTable1700000000005";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating groups table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "groups",
        columns: [
          {
            name: "id",
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
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "tenant_id",
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
      "groups",
      new TableForeignKey({
        name: "FK_groups_tenant",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["tenant_id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "groups",
      new TableIndex({
        name: "IDX_groups_tenant",
        columnNames: ["tenant_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "groups",
      new TableIndex({
        name: "IDX_groups_name_tenant",
        columnNames: ["name", "tenant_id"],
        isUnique: true,
      }),
    );

    this.log("Groups table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping groups table...");
    await queryRunner.dropTable("groups", true, true, true);
    this.log("Groups table dropped");
  }
}
