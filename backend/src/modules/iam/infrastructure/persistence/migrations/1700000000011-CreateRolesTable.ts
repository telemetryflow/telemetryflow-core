/**
 * IAM Migration: Create Roles Table
 * Timestamp: 1700000000011 (IAM module range)
 */

import { QueryRunner, Table, TableIndex } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateRolesTable1700000000011 extends BaseMigration {
  name = "CreateRolesTable1700000000011";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating roles table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "roles",
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
            name: "is_system",
            type: "boolean",
            default: false,
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
      "roles",
      new TableIndex({
        name: "IDX_roles_name",
        columnNames: ["name"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "roles",
      new TableIndex({
        name: "IDX_roles_is_system",
        columnNames: ["is_system"],
      }),
    );

    this.log("Roles table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping roles table...");
    await queryRunner.dropTable("roles", true, true, true);
    this.log("Roles table dropped");
  }
}
