/**
 * IAM Migration: Create Permissions Table
 * Timestamp: 1700000000012 (IAM module range)
 */

import { QueryRunner, Table, TableIndex } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreatePermissionsTable1700000000012 extends BaseMigration {
  name = "CreatePermissionsTable1700000000012";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating permissions table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "permissions",
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
            length: "100",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "resource",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "action",
            type: "varchar",
            length: "50",
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
        ],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "permissions",
      new TableIndex({
        name: "IDX_permissions_name",
        columnNames: ["name"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "permissions",
      new TableIndex({
        name: "IDX_permissions_resource_action",
        columnNames: ["resource", "action"],
      }),
    );

    this.log("Permissions table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping permissions table...");
    await queryRunner.dropTable("permissions", true, true, true);
    this.log("Permissions table dropped");
  }
}
