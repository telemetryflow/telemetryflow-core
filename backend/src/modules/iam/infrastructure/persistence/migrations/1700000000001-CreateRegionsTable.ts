/**
 * IAM Migration: Create Regions Table
 * Timestamp: 1700000000001 (IAM module range)
 */

import { QueryRunner, Table, TableIndex } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateRegionsTable1700000000001 extends BaseMigration {
  name = "CreateRegionsTable1700000000001";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating regions table...");

    // Ensure uuid-ossp extension exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "regions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "code",
            type: "varchar",
            length: "50",
            isNullable: false,
            isUnique: true,
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
      "regions",
      new TableIndex({
        name: "IDX_regions_code",
        columnNames: ["code"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "regions",
      new TableIndex({
        name: "IDX_regions_is_active",
        columnNames: ["is_active"],
      }),
    );

    this.log("Regions table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping regions table...");
    await queryRunner.dropTable("regions", true, true, true);
    this.log("Regions table dropped");
  }
}
