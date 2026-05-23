/**
 * IAM Migration: Create User Roles Junction Table
 * Timestamp: 1700000000013 (IAM module range)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateUserRolesTable1700000000013 extends BaseMigration {
  name = "CreateUserRolesTable1700000000013";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating user_roles junction table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "user_roles",
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
            name: "role_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "tenant_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "assigned_by",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "assigned_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: true,
          },
        ],
      }),
    );

    // Foreign keys
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "user_roles",
      new TableForeignKey({
        name: "FK_user_roles_user",
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "user_roles",
      new TableForeignKey({
        name: "FK_user_roles_role",
        columnNames: ["role_id"],
        referencedTableName: "roles",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "user_roles",
      new TableForeignKey({
        name: "FK_user_roles_tenant",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["tenant_id"],
        onDelete: "CASCADE",
      }),
    );

    // Indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "user_roles",
      new TableIndex({
        name: "IDX_user_roles_user_role",
        columnNames: ["user_id", "role_id"],
        isUnique: true,
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "user_roles",
      new TableIndex({
        name: "IDX_user_roles_user",
        columnNames: ["user_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "user_roles",
      new TableIndex({
        name: "IDX_user_roles_role",
        columnNames: ["role_id"],
      }),
    );

    this.log("User roles junction table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping user_roles table...");
    await queryRunner.dropTable("user_roles", true, true, true);
    this.log("User roles table dropped");
  }
}
