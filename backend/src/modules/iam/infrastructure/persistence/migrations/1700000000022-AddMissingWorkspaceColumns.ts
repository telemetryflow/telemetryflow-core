/**
 * IAM Migration: Add Missing Workspace Columns
 * Timestamp: 1700000000022 (IAM module range)
 *
 * Adds datasource_config column to workspaces table that exists in WorkspaceEntity
 * but was not included in the original CreateWorkspacesTable migration.
 */

import { QueryRunner, TableColumn } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class AddMissingWorkspaceColumns1700000000022 extends BaseMigration {
  name = "AddMissingWorkspaceColumns1700000000022";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Adding missing columns to workspaces table...");

    const table = await queryRunner.getTable("workspaces");
    if (!table) {
      this.log("Workspaces table not found, skipping");
      return;
    }

    if (!table.findColumnByName("datasource_config")) {
      await queryRunner.addColumn(
        "workspaces",
        new TableColumn({
          name: "datasource_config",
          type: "jsonb",
          isNullable: true,
        }),
      );
      this.log("Added datasource_config column to workspaces");
    } else {
      this.log("datasource_config already exists, skipping");
    }

    this.log("Workspaces table updated successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Removing added columns from workspaces table...");

    const table = await queryRunner.getTable("workspaces");
    if (!table) return;

    if (table.findColumnByName("datasource_config")) {
      await queryRunner.dropColumn("workspaces", "datasource_config");
    }
  }
}
