/**
 * IAM Seed: Tenants
 * Order: 04 (depends on workspaces)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

export class TenantsSeed extends BaseSeed {
  name = "TenantsSeed";
  moduleName = "iam";
  order = 4;
  dependencies = ["WorkspacesSeed"];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding tenants...");

    // Get default workspace
    const workspace = await this.findRecord<{ workspace_id: string }>(
      dataSource,
      "workspaces",
      { code: "DEVOPSCORNER-WORKSPACE" },
    );

    if (!workspace) {
      this.logError(
        "Default workspace (DEVOPSCORNER-WORKSPACE) not found. Run WorkspacesSeed first.",
      );
      return;
    }

    const tenants = [
      {
        code: "DEVOPSCORNER",
        name: "DevOpsCorner",
        description: "DevOpsCorner tenant - Default demo tenant",
        domain: "devopscorner.id",
      },
      {
        code: "DEMO",
        name: "Demo Tenant",
        description: "Demo tenant for testing purposes",
        domain: "demo.telemetryflow.id",
      },
    ];

    let inserted = 0;
    for (const tenant of tenants) {
      // Check if exists by code + workspace
      const exists = await this.recordExists(dataSource, "tenants", {
        code: tenant.code,
        workspace_id: workspace.workspace_id,
      });

      if (!exists) {
        await dataSource.query(
          `INSERT INTO "tenants" ("code", "name", "description", "domain", "workspace_id", "is_active")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            tenant.code,
            tenant.name,
            tenant.description,
            tenant.domain,
            workspace.workspace_id,
            true,
          ],
        );
        this.logSuccess(`Created tenant: ${tenant.code}`);
        inserted++;
      } else {
        this.logSkip(`Tenant exists: ${tenant.code}`);
      }
    }

    this.log(
      `Tenants seeded: ${inserted} created, ${tenants.length - inserted} skipped`,
    );
  }
}
