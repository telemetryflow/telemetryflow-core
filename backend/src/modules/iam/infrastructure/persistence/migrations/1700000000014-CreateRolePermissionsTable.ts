/**
 * IAM Migration: Create Role Permissions Junction Table
 * Timestamp: 1700000000014 (IAM module range)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateRolePermissionsTable1700000000014 extends BaseMigration {
  name = "CreateRolePermissionsTable1700000000014";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating role_permissions junction table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "role_permissions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "role_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "permission_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
    );

    // Foreign keys
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "role_permissions",
      new TableForeignKey({
        name: "FK_role_permissions_role",
        columnNames: ["role_id"],
        referencedTableName: "roles",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "role_permissions",
      new TableForeignKey({
        name: "FK_role_permissions_permission",
        columnNames: ["permission_id"],
        referencedTableName: "permissions",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // Indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "role_permissions",
      new TableIndex({
        name: "IDX_role_permissions_unique",
        columnNames: ["role_id", "permission_id"],
        isUnique: true,
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "role_permissions",
      new TableIndex({
        name: "IDX_role_permissions_role",
        columnNames: ["role_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "role_permissions",
      new TableIndex({
        name: "IDX_role_permissions_permission",
        columnNames: ["permission_id"],
      }),
    );

    this.log("Role permissions junction table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping role_permissions table...");
    await queryRunner.dropTable("role_permissions", true, true, true);
    this.log("Role permissions table dropped");
  }
}
