/**
 * IAM Seed: Regions
 * Order: 01 (base entity, no dependencies)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

export class RegionsSeed extends BaseSeed {
  name = "RegionsSeed";
  moduleName = "iam";
  order = 1;
  dependencies = [];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding regions...");

    const regions = [
      {
        code: "ap-southeast-3",
        name: "Asia Pacific (Jakarta)",
        description: "Asia Pacific region",
      },
      {
        code: "ap-southeast-1",
        name: "Asia Pacific (Singapore)",
        description: "Asia Pacific region",
      },
    ];

    let inserted = 0;
    for (const region of regions) {
      const wasInserted = await this.insertIfNotExists(
        dataSource,
        "regions",
        {
          code: region.code,
          name: region.name,
          description: region.description,
          is_active: true,
        },
        "code",
      );

      if (wasInserted) {
        this.logSuccess(`Created region: ${region.code}`);
        inserted++;
      } else {
        this.logSkip(`Region exists: ${region.code}`);
      }
    }

    this.log(
      `Regions seeded: ${inserted} created, ${regions.length - inserted} skipped`,
    );
  }
}
