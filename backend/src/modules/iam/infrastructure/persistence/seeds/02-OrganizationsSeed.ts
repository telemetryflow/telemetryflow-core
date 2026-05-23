/**
 * IAM Seed: Organizations
 * Order: 02 (depends on regions)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

export class OrganizationsSeed extends BaseSeed {
  name = "OrganizationsSeed";
  moduleName = "iam";
  order = 2;
  dependencies = ["RegionsSeed"];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding organizations...");

    // Get default region (Jakarta)
    const region = await this.findRecord<{ id: string }>(
      dataSource,
      "regions",
      {
        code: "ap-southeast-3",
      },
    );

    if (!region) {
      this.logError(
        "Default region (ap-southeast-3) not found. Run RegionsSeed first.",
      );
      return;
    }

    const organizations = [
      {
        code: "DEVOPSCORNER",
        name: "DevOpsCorner",
        description: "DevOpsCorner organization - Default demo organization",
        domain: "devopscorner.id",
      },
      {
        code: "TELEMETRYFLOW",
        name: "TelemetryFlow",
        description: "TelemetryFlow organization",
        domain: "telemetryflow.id",
      },
    ];

    let inserted = 0;
    for (const org of organizations) {
      const wasInserted = await this.insertIfNotExists(
        dataSource,
        "organizations",
        {
          code: org.code,
          name: org.name,
          description: org.description,
          domain: org.domain,
          region_id: region.id,
          is_active: true,
        },
        "code",
      );

      if (wasInserted) {
        this.logSuccess(`Created organization: ${org.code}`);
        inserted++;
      } else {
        this.logSkip(`Organization exists: ${org.code}`);
      }
    }

    this.log(
      `Organizations seeded: ${inserted} created, ${organizations.length - inserted} skipped`,
    );
  }
}
