/**
 * IAM Migration: Create Organizations Table
 * Timestamp: 1700000000002 (IAM module range)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateOrganizationsTable1700000000002 extends BaseMigration {
  name = "CreateOrganizationsTable1700000000002";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating organizations table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "organizations",
        columns: [
          {
            name: "organization_id",
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
            isUnique: true,
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
            name: "region_id",
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
      "organizations",
      new TableForeignKey({
        name: "FK_organizations_region",
        columnNames: ["region_id"],
        referencedTableName: "regions",
        referencedColumnNames: ["id"],
        onDelete: "RESTRICT",
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "organizations",
      new TableIndex({
        name: "IDX_organizations_code",
        columnNames: ["code"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "organizations",
      new TableIndex({
        name: "IDX_organizations_region",
        columnNames: ["region_id"],
      }),
    );

    this.log("Organizations table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping organizations table...");
    await queryRunner.dropTable("organizations", true, true, true);
    this.log("Organizations table dropped");
  }
}
