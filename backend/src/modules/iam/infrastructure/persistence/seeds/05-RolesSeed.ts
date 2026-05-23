/**
 * IAM Seed: Roles (5-Tier RBAC)
 * Order: 05 (base entity for RBAC)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

export class RolesSeed extends BaseSeed {
  name = "RolesSeed";
  moduleName = "iam";
  order = 5;
  dependencies = [];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding roles (5-Tier RBAC)...");

    // 5-Tier RBAC Roles
    const roles = [
      {
        name: "Super Administrator",
        description:
          "Platform management across all organizations. Full access to all resources.",
        is_system: true,
      },
      {
        name: "Administrator",
        description:
          "Full CRUD within organization. Can manage users, roles, and resources.",
        is_system: true,
      },
      {
        name: "Developer",
        description:
          "Create/Read/Update access (no delete). Can work with most resources.",
        is_system: true,
      },
      {
        name: "Viewer",
        description:
          "Read-only access. Can view resources but cannot modify them.",
        is_system: true,
      },
      {
        name: "Demo",
        description:
          "Demo access in demo organization. Limited read-only access.",
        is_system: true,
      },
    ];

    let inserted = 0;
    for (const role of roles) {
      const wasInserted = await this.insertIfNotExists(
        dataSource,
        "roles",
        {
          name: role.name,
          description: role.description,
          is_system: role.is_system,
          is_active: true,
        },
        "name",
      );

      if (wasInserted) {
        this.logSuccess(`Created role: ${role.name}`);
        inserted++;
      } else {
        this.logSkip(`Role exists: ${role.name}`);
      }
    }

    this.log(
      `Roles seeded: ${inserted} created, ${roles.length - inserted} skipped`,
    );
  }
}
