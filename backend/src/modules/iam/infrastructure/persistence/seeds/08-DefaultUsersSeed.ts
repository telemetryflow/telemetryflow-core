/**
 * IAM Seed: Default Users
 * Order: 08 (depends on organizations, tenants, roles)
 */

import { DataSource } from "typeorm";
import { randomUUID } from "crypto";
import * as argon2 from "argon2";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

export class DefaultUsersSeed extends BaseSeed {
  name = "DefaultUsersSeed";
  moduleName = "iam";
  order = 8;
  dependencies = ["OrganizationsSeed", "TenantsSeed", "RolesSeed"];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding default users...");

    // Get organization
    const organization = await this.findRecord<{ organization_id: string }>(
      dataSource,
      "organizations",
      { code: "DEVOPSCORNER" },
    );

    // Get tenant
    const tenant = await this.findRecord<{ tenant_id: string }>(
      dataSource,
      "tenants",
      { code: "DEVOPSCORNER" },
    );

    // Get Super Administrator role
    const superAdminRole = await this.findRecord<{ id: string }>(
      dataSource,
      "roles",
      { name: "Super Administrator" },
    );

    // Get Administrator role
    const adminRole = await this.findRecord<{ id: string }>(
      dataSource,
      "roles",
      { name: "Administrator" },
    );

    // Get Developer role
    const developerRole = await this.findRecord<{ id: string }>(
      dataSource,
      "roles",
      { name: "Developer" },
    );

    // Get Viewer role
    const viewerRole = await this.findRecord<{ id: string }>(
      dataSource,
      "roles",
      { name: "Viewer" },
    );

    // Get Demo role
    const demoRole = await this.findRecord<{ id: string }>(
      dataSource,
      "roles",
      { name: "Demo" },
    );

    if (!organization || !tenant || !superAdminRole || !adminRole) {
      this.logError(
        "Required entities not found. Run prerequisite seeds first.",
      );
      return;
    }

    // Per-role passwords (should be changed on first login in production)
    const passwords = {
      superAdmin: await argon2.hash("SuperAdmin@654123"),
      admin: await argon2.hash("Admin@654123"),
      developer: await argon2.hash("Developer@654123"),
      viewer: await argon2.hash("Viewer@654123"),
      demo: await argon2.hash("Demo@654123"),
      // Team-specific passwords
      platform: await argon2.hash("Platform@654123"),
      sre: await argon2.hash("SRE@654123"),
      devops: await argon2.hash("DevOps@654123"),
      backend: await argon2.hash("Backend@654123"),
      frontend: await argon2.hash("Frontend@654123"),
      qa: await argon2.hash("QA@654123"),
      product: await argon2.hash("Product@654123"),
      security: await argon2.hash("Security@654123"),
      data: await argon2.hash("Data@654123"),
    };

    const users = [
      // ==================== Default 5-Tier Users ====================
      {
        email: "superadmin.telemetryflow@telemetryflow.id",
        firstName: "Super",
        lastName: "Admin",
        roleId: superAdminRole.id,
        password: passwords.superAdmin,
        timezone: "UTC",
        locale: "en-US",
      },
      {
        email: "administrator.telemetryflow@telemetryflow.id",
        firstName: "Admin",
        lastName: "User",
        roleId: adminRole.id,
        password: passwords.admin,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      {
        email: "developer.telemetryflow@telemetryflow.id",
        firstName: "Developer",
        lastName: "User",
        roleId: developerRole?.id,
        password: passwords.developer,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      {
        email: "viewer.telemetryflow@telemetryflow.id",
        firstName: "Viewer",
        lastName: "User",
        roleId: viewerRole?.id,
        password: passwords.viewer,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      {
        email: "demo.telemetryflow@telemetryflow.id",
        firstName: "Demo",
        lastName: "User",
        roleId: demoRole?.id,
        password: passwords.demo,
        timezone: "UTC",
        locale: "en-US",
      },
      // ==================== Platform Engineering Team ====================
      {
        email: "platform.engineer01@telemetryflow.id",
        firstName: "Platform",
        lastName: "Engineer 01",
        roleId: adminRole.id,
        password: passwords.platform,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      {
        email: "platform.engineer02@telemetryflow.id",
        firstName: "Platform",
        lastName: "Engineer 02",
        roleId: developerRole?.id,
        password: passwords.platform,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      {
        email: "platform.engineer03@telemetryflow.id",
        firstName: "Platform",
        lastName: "Engineer 03",
        roleId: developerRole?.id,
        password: passwords.platform,
        timezone: "Asia/Singapore",
        locale: "en-SG",
      },
      // ==================== SRE Team ====================
      {
        email: "sre.team01@telemetryflow.id",
        firstName: "SRE",
        lastName: "Team 01",
        roleId: adminRole.id,
        password: passwords.sre,
        timezone: "Asia/Singapore",
        locale: "en-SG",
      },
      {
        email: "sre.team02@telemetryflow.id",
        firstName: "SRE",
        lastName: "Team 02",
        roleId: developerRole?.id,
        password: passwords.sre,
        timezone: "America/New_York",
        locale: "en-US",
      },
      {
        email: "sre.team03@telemetryflow.id",
        firstName: "SRE",
        lastName: "Team 03",
        roleId: developerRole?.id,
        password: passwords.sre,
        timezone: "Europe/London",
        locale: "en-GB",
      },
      // ==================== DevOps Team ====================
      {
        email: "devops.team01@telemetryflow.id",
        firstName: "DevOps",
        lastName: "Team 01",
        roleId: developerRole?.id,
        password: passwords.devops,
        timezone: "America/New_York",
        locale: "en-US",
      },
      {
        email: "devops.team02@telemetryflow.id",
        firstName: "DevOps",
        lastName: "Team 02",
        roleId: developerRole?.id,
        password: passwords.devops,
        timezone: "America/Los_Angeles",
        locale: "en-US",
      },
      {
        email: "devops.team03@telemetryflow.id",
        firstName: "DevOps",
        lastName: "Team 03",
        roleId: developerRole?.id,
        password: passwords.devops,
        timezone: "Europe/Berlin",
        locale: "de-DE",
      },
      // ==================== Backend Team ====================
      {
        email: "backend.dev01@telemetryflow.id",
        firstName: "Backend",
        lastName: "Developer 01",
        roleId: developerRole?.id,
        password: passwords.backend,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      {
        email: "backend.dev02@telemetryflow.id",
        firstName: "Backend",
        lastName: "Developer 02",
        roleId: developerRole?.id,
        password: passwords.backend,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      // ==================== Frontend Team ====================
      {
        email: "frontend.dev01@telemetryflow.id",
        firstName: "Frontend",
        lastName: "Developer 01",
        roleId: developerRole?.id,
        password: passwords.frontend,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      {
        email: "frontend.dev02@telemetryflow.id",
        firstName: "Frontend",
        lastName: "Developer 02",
        roleId: developerRole?.id,
        password: passwords.frontend,
        timezone: "Asia/Singapore",
        locale: "en-SG",
      },
      // ==================== QA Team ====================
      {
        email: "qa.engineer01@telemetryflow.id",
        firstName: "QA",
        lastName: "Engineer 01",
        roleId: viewerRole?.id,
        password: passwords.qa,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      {
        email: "qa.engineer02@telemetryflow.id",
        firstName: "QA",
        lastName: "Engineer 02",
        roleId: viewerRole?.id,
        password: passwords.qa,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
      // ==================== Product Team ====================
      {
        email: "product.manager01@telemetryflow.id",
        firstName: "Product",
        lastName: "Manager 01",
        roleId: viewerRole?.id,
        password: passwords.product,
        timezone: "Europe/London",
        locale: "en-GB",
      },
      {
        email: "product.owner01@telemetryflow.id",
        firstName: "Product",
        lastName: "Owner 01",
        roleId: viewerRole?.id,
        password: passwords.product,
        timezone: "Europe/Berlin",
        locale: "de-DE",
      },
      // ==================== Security Team ====================
      {
        email: "security.analyst01@telemetryflow.id",
        firstName: "Security",
        lastName: "Analyst 01",
        roleId: adminRole.id,
        password: passwords.security,
        timezone: "UTC",
        locale: "en-US",
      },
      // ==================== Data Team ====================
      {
        email: "data.engineer01@telemetryflow.id",
        firstName: "Data",
        lastName: "Engineer 01",
        roleId: developerRole?.id,
        password: passwords.data,
        timezone: "Asia/Jakarta",
        locale: "id-ID",
      },
    ];

    let inserted = 0;
    for (const user of users) {
      const exists = await this.recordExists(dataSource, "users", {
        email: user.email,
      });

      if (!exists) {
        const userId = randomUUID();

        // Create user (use per-user password if set, fallback to admin password)
        await dataSource.query(
          `INSERT INTO "users" (
            "id", "email", "password", "firstName", "lastName",
            "organization_id", "tenant_id", "isActive", "emailVerified",
            "force_password_change", "timezone", "locale"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            userId,
            user.email,
            user.password || passwords.admin,
            user.firstName,
            user.lastName,
            organization.organization_id,
            tenant.tenant_id,
            true,
            true, // Pre-verified for seed users
            true, // Force password change on first login
            user.timezone || "UTC",
            user.locale || "en-US",
          ],
        );

        // Assign role if exists
        if (user.roleId) {
          await dataSource.query(
            `INSERT INTO "user_roles" ("user_id", "role_id") VALUES ($1, $2)`,
            [userId, user.roleId],
          );
        }

        this.logSuccess(`Created user: ${user.email}`);
        inserted++;
      } else {
        this.logSkip(`User exists: ${user.email}`);
      }
    }

    this.log(
      `Default users seeded: ${inserted} created, ${users.length - inserted} skipped`,
    );
    if (inserted > 0) {
      this.log(
        "Default passwords: SuperAdmin@654123, Admin@654123, Developer@654123, Viewer@654123, Demo@654123",
      );
      this.log(
        "Team passwords: Platform@654123, SRE@654123, DevOps@654123, Backend@654123, Frontend@654123, QA@654123, Product@654123, Security@654123, Data@654123",
      );
      this.log("All users should change passwords on first login!");
    }
  }
}
