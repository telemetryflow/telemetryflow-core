/**
 * IAM Seed: Workspaces
 * Order: 03 (depends on organizations)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

export class WorkspacesSeed extends BaseSeed {
  name = "WorkspacesSeed";
  moduleName = "iam";
  order = 3;
  dependencies = ["OrganizationsSeed"];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding workspaces...");

    // Get both organizations
    const devopscornerOrg = await this.findRecord<{ organization_id: string }>(
      dataSource,
      "organizations",
      { code: "DEVOPSCORNER" },
    );

    const telemetryflowOrg = await this.findRecord<{ organization_id: string }>(
      dataSource,
      "organizations",
      { code: "TELEMETRYFLOW" },
    );

    if (!devopscornerOrg || !telemetryflowOrg) {
      this.logError(
        "Organizations (DEVOPSCORNER, TELEMETRYFLOW) not found. Run OrganizationsSeed first.",
      );
      return;
    }

    const workspaces = [
      {
        code: "DEVOPSCORNER-WORKSPACE",
        name: "DevOpsCorner Workspace",
        description: "Default workspace for DevOpsCorner organization",
        organizationId: devopscornerOrg.organization_id,
      },
      {
        code: "TELEMETRYFLOW-WORKSPACE",
        name: "TelemetryFlow Workspace",
        description: "Default workspace for TelemetryFlow organization",
        organizationId: telemetryflowOrg.organization_id,
      },
    ];

    let inserted = 0;
    for (const workspace of workspaces) {
      const exists = await this.recordExists(dataSource, "workspaces", {
        code: workspace.code,
        organization_id: workspace.organizationId,
      });

      if (!exists) {
        await dataSource.query(
          `INSERT INTO "workspaces" ("code", "name", "description", "organization_id", "is_active")
           VALUES ($1, $2, $3, $4, $5)`,
          [
            workspace.code,
            workspace.name,
            workspace.description,
            workspace.organizationId,
            true,
          ],
        );
        this.logSuccess(`Created workspace: ${workspace.code}`);
        inserted++;
      } else {
        this.logSkip(`Workspace exists: ${workspace.code}`);
      }
    }

    this.log(
      `Workspaces seeded: ${inserted} created, ${workspaces.length - inserted} skipped`,
    );
  }
}
