/**
 * IAM Migration: Create User Permissions Junction Table
 * Timestamp: 1700000000015 (IAM module range)
 *
 * This table allows direct permission assignment to users,
 * bypassing role-based permissions for specific cases.
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateUserPermissionsTable1700000000015 extends BaseMigration {
  name = "CreateUserPermissionsTable1700000000015";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating user_permissions junction table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "user_permissions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "permission_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "tenant_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "granted_by",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "granted_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "is_denied",
            type: "boolean",
            default: false,
            comment: "If true, this is a deny permission (overrides grants)",
          },
        ],
      }),
    );

    // Foreign keys
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "user_permissions",
      new TableForeignKey({
        name: "FK_user_permissions_user",
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "user_permissions",
      new TableForeignKey({
        name: "FK_user_permissions_permission",
        columnNames: ["permission_id"],
        referencedTableName: "permissions",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "user_permissions",
      new TableForeignKey({
        name: "FK_user_permissions_tenant",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["tenant_id"],
        onDelete: "CASCADE",
      }),
    );

    // Indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "user_permissions",
      new TableIndex({
        name: "IDX_user_permissions_unique",
        columnNames: ["user_id", "permission_id", "tenant_id"],
        isUnique: true,
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "user_permissions",
      new TableIndex({
        name: "IDX_user_permissions_user",
        columnNames: ["user_id"],
      }),
    );

    this.log("User permissions junction table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping user_permissions table...");
    await queryRunner.dropTable("user_permissions", true, true, true);
    this.log("User permissions table dropped");
  }
}
