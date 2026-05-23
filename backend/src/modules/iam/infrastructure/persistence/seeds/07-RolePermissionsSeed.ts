/**
 * IAM Seed: Role Permissions
 * Order: 07 (depends on roles and permissions)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

export class RolePermissionsSeed extends BaseSeed {
  name = "RolePermissionsSeed";
  moduleName = "iam";
  order = 7;
  dependencies = ["RolesSeed", "PermissionsSeed"];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding role permissions...");

    // Define role-permission mappings
    const rolePermissions: Record<string, string[]> = {
      "Super Administrator": [
        // All permissions
        "users:create",
        "users:read",
        "users:update",
        "users:delete",
        "users:write",
        "roles:create",
        "roles:read",
        "roles:update",
        "roles:delete",
        "roles:write",
        "permissions:read",
        "permissions:assign",
        "permissions:write",
        "organizations:create",
        "organizations:read",
        "organizations:update",
        "organizations:delete",
        "workspaces:create",
        "workspaces:read",
        "workspaces:update",
        "workspaces:delete",
        "tenants:create",
        "tenants:read",
        "tenants:update",
        "tenants:delete",
        "groups:create",
        "groups:read",
        "groups:update",
        "groups:delete",
        "groups:write",
        "regions:create",
        "regions:read",
        "regions:update",
        "regions:delete",
        "platform:manage",
        "platform:audit",
        "audit:read",
        // Tenancy aliases
        "region:read",
        "region:write",
        "region:delete",
        "organization:read",
        "organization:write",
        "organization:delete",
        "workspace:read",
        "workspace:write",
        "workspace:delete",
        "tenant:read",
        "tenant:write",
        "tenant:delete",
        "telemetry:read",
        "telemetry:write",
        "telemetry:manage",
        "dashboard:read",
        "dashboard:write",
        "dashboard:delete",
        // Monitoring
        "monitoring:agent:read",
        "monitoring:agent:write",
        "monitoring:agent:delete",
        "monitoring:vm:read",
        "monitoring:vm:write",
        "monitoring:vm:delete",
        "monitoring:kubernetes:read",
        "monitoring:kubernetes:write",
        "monitoring:kubernetes:delete",
        "monitoring:uptime:read",
        "monitoring:uptime:manage",
        "monitoring:uptime:write",
        "monitoring:status-page:read",
        "monitoring:status-page:manage",
        "monitoring:status-page:write",
        "monitoring:service-map:read",
        "monitoring:service-map:manage",
        "monitoring:service-map:write",
        "monitoring:service-map:delete",
        "monitoring:network-map:read",
        "monitoring:network-map:manage",
        "monitoring:network-map:write",
        "monitoring:network-map:delete",
        // DB Monitoring - full access
        "monitoring:db-inventory:read",
        "monitoring:db-inventory:write",
        "monitoring:db-inventory:delete",
        "monitoring:db-mysql:read",
        "monitoring:db-mysql:write",
        "monitoring:db-mysql:delete",
        "monitoring:db-mariadb:read",
        "monitoring:db-mariadb:write",
        "monitoring:db-mariadb:delete",
        "monitoring:db-percona:read",
        "monitoring:db-percona:write",
        "monitoring:db-percona:delete",
        "monitoring:db-postgresql:read",
        "monitoring:db-postgresql:write",
        "monitoring:db-postgresql:delete",
        "monitoring:db-clickhouse:read",
        "monitoring:db-clickhouse:write",
        "monitoring:db-clickhouse:delete",
        "monitoring:db-timescaledb:read",
        "monitoring:db-timescaledb:write",
        "monitoring:db-timescaledb:delete",
        "monitoring:db-mssql:read",
        "monitoring:db-mssql:write",
        "monitoring:db-mssql:delete",
        "monitoring:db-sqlite3:read",
        "monitoring:db-sqlite3:write",
        "monitoring:db-sqlite3:delete",
        "monitoring:db-mongodb-community:read",
        "monitoring:db-mongodb-community:write",
        "monitoring:db-mongodb-community:delete",
        "monitoring:db-mongodb-atlas:read",
        "monitoring:db-mongodb-atlas:write",
        "monitoring:db-mongodb-atlas:delete",
        "monitoring:db-aws-rds-mysql:read",
        "monitoring:db-aws-rds-mysql:write",
        "monitoring:db-aws-rds-mysql:delete",
        "monitoring:db-aws-rds-aurora:read",
        "monitoring:db-aws-rds-aurora:write",
        "monitoring:db-aws-rds-aurora:delete",
        "monitoring:db-aws-dynamodb:read",
        "monitoring:db-aws-dynamodb:write",
        "monitoring:db-aws-dynamodb:delete",
        "monitoring:db-cockroachdb:read",
        "monitoring:db-cockroachdb:write",
        "monitoring:db-cockroachdb:delete",
        "monitoring:db-aws-rds-postgresql:read",
        "monitoring:db-aws-rds-postgresql:write",
        "monitoring:db-aws-rds-postgresql:delete",
        "monitoring:db-qan:read",
        "monitoring:db-qan:write",
        // Alerts
        "alert:read",
        "alert:write",
        "alert:delete",
        "alert:manage",
        // Reports
        "reports:read",
        "reports:write",
        "reports:delete",
        // Notifications
        "notifications:read",
        "notifications:write",
        "notifications:delete",
        // API Keys
        "api-keys:read",
        "api-keys:write",
        "api-keys:delete",
        // Retention
        "retention:read",
        "retention:manage",
        // Subscription
        "subscription:read",
        "subscription:manage",
        // AI Assistant
        "ai-assistant:read",
        "ai-assistant:manage",
        // LLM
        "llm:read",
        "llm:chat",
        "llm:write",
        "llm:delete",
        "llm:insights",
        // Data Masking - full access
        "data-masking:read",
        "data-masking:write",
        "data-masking:delete",
        "data-masking:manage",
        // AI Intelligence - full access
        "ai-intelligence:read",
        "ai-intelligence:write",
        "ai-intelligence:delete",
        "ai-intelligence:manage",
      ],
      Administrator: [
        // Full CRUD within organization (no platform:manage, no regions CUD, no subscription:manage)
        "users:create",
        "users:read",
        "users:update",
        "users:delete",
        "users:write",
        "roles:read",
        "roles:update",
        "roles:write",
        "permissions:read",
        "permissions:assign",
        "permissions:write",
        "organizations:read",
        "organizations:update",
        "workspaces:create",
        "workspaces:read",
        "workspaces:update",
        "workspaces:delete",
        "tenants:create",
        "tenants:read",
        "tenants:update",
        "tenants:delete",
        "groups:create",
        "groups:read",
        "groups:update",
        "groups:delete",
        "groups:write",
        "regions:read",
        "platform:audit",
        "audit:read",
        // Tenancy aliases — read + limited write for admin
        "region:read",
        "organization:read",
        "organization:write",
        "workspace:read",
        "workspace:write",
        "workspace:delete",
        "tenant:read",
        "tenant:write",
        "tenant:delete",
        "telemetry:read",
        "telemetry:write",
        "telemetry:manage",
        "dashboard:read",
        "dashboard:write",
        "dashboard:delete",
        // Monitoring - full access
        "monitoring:agent:read",
        "monitoring:agent:write",
        "monitoring:agent:delete",
        "monitoring:vm:read",
        "monitoring:vm:write",
        "monitoring:vm:delete",
        "monitoring:kubernetes:read",
        "monitoring:kubernetes:write",
        "monitoring:kubernetes:delete",
        "monitoring:uptime:read",
        "monitoring:uptime:manage",
        "monitoring:uptime:write",
        "monitoring:status-page:read",
        "monitoring:status-page:manage",
        "monitoring:status-page:write",
        "monitoring:service-map:read",
        "monitoring:service-map:manage",
        "monitoring:service-map:write",
        "monitoring:service-map:delete",
        "monitoring:network-map:read",
        "monitoring:network-map:manage",
        "monitoring:network-map:write",
        "monitoring:network-map:delete",
        // DB Monitoring - full access
        "monitoring:db-inventory:read",
        "monitoring:db-inventory:write",
        "monitoring:db-inventory:delete",
        "monitoring:db-mysql:read",
        "monitoring:db-mysql:write",
        "monitoring:db-mysql:delete",
        "monitoring:db-mariadb:read",
        "monitoring:db-mariadb:write",
        "monitoring:db-mariadb:delete",
        "monitoring:db-percona:read",
        "monitoring:db-percona:write",
        "monitoring:db-percona:delete",
        "monitoring:db-postgresql:read",
        "monitoring:db-postgresql:write",
        "monitoring:db-postgresql:delete",
        "monitoring:db-clickhouse:read",
        "monitoring:db-clickhouse:write",
        "monitoring:db-clickhouse:delete",
        "monitoring:db-timescaledb:read",
        "monitoring:db-timescaledb:write",
        "monitoring:db-timescaledb:delete",
        "monitoring:db-mssql:read",
        "monitoring:db-mssql:write",
        "monitoring:db-mssql:delete",
        "monitoring:db-sqlite3:read",
        "monitoring:db-sqlite3:write",
        "monitoring:db-sqlite3:delete",
        "monitoring:db-mongodb-community:read",
        "monitoring:db-mongodb-community:write",
        "monitoring:db-mongodb-community:delete",
        "monitoring:db-mongodb-atlas:read",
        "monitoring:db-mongodb-atlas:write",
        "monitoring:db-mongodb-atlas:delete",
        "monitoring:db-aws-rds-mysql:read",
        "monitoring:db-aws-rds-mysql:write",
        "monitoring:db-aws-rds-mysql:delete",
        "monitoring:db-aws-rds-aurora:read",
        "monitoring:db-aws-rds-aurora:write",
        "monitoring:db-aws-rds-aurora:delete",
        "monitoring:db-aws-dynamodb:read",
        "monitoring:db-aws-dynamodb:write",
        "monitoring:db-aws-dynamodb:delete",
        "monitoring:db-cockroachdb:read",
        "monitoring:db-cockroachdb:write",
        "monitoring:db-cockroachdb:delete",
        "monitoring:db-aws-rds-postgresql:read",
        "monitoring:db-aws-rds-postgresql:write",
        "monitoring:db-aws-rds-postgresql:delete",
        "monitoring:db-qan:read",
        "monitoring:db-qan:write",
        // Alerts - full access
        "alert:read",
        "alert:write",
        "alert:delete",
        "alert:manage",
        // Reports - full access
        "reports:read",
        "reports:write",
        "reports:delete",
        // Notifications - full access
        "notifications:read",
        "notifications:write",
        "notifications:delete",
        // API Keys - full access
        "api-keys:read",
        "api-keys:write",
        "api-keys:delete",
        // Retention
        "retention:read",
        "retention:manage",
        // Subscription - read only
        "subscription:read",
        // AI Assistant
        "ai-assistant:read",
        "ai-assistant:manage",
        // LLM
        "llm:read",
        "llm:chat",
        "llm:write",
        "llm:delete",
        "llm:insights",
        // Data Masking - full access
        "data-masking:read",
        "data-masking:write",
        "data-masking:delete",
        "data-masking:manage",
        // AI Intelligence - full access
        "ai-intelligence:read",
        "ai-intelligence:write",
        "ai-intelligence:delete",
        "ai-intelligence:manage",
      ],
      Developer: [
        // Create/Read/Update (no delete, no manage for most)
        "users:create",
        "users:read",
        "users:update",
        "users:write",
        "roles:read",
        "permissions:read",
        "organizations:read",
        "workspaces:create",
        "workspaces:read",
        "workspaces:update",
        "tenants:read",
        "tenants:update",
        "groups:read",
        "groups:update",
        "groups:write",
        "regions:read",
        // Tenancy aliases — read only
        "region:read",
        "organization:read",
        "workspace:read",
        "workspace:write",
        "tenant:read",
        "telemetry:read",
        "telemetry:write",
        "dashboard:read",
        "dashboard:write",
        // Monitoring - read + write (no delete/manage)
        "monitoring:agent:read",
        "monitoring:agent:write",
        "monitoring:vm:read",
        "monitoring:vm:write",
        "monitoring:kubernetes:read",
        "monitoring:kubernetes:write",
        "monitoring:uptime:read",
        "monitoring:uptime:write",
        "monitoring:status-page:read",
        "monitoring:status-page:write",
        "monitoring:service-map:read",
        "monitoring:service-map:write",
        "monitoring:network-map:read",
        "monitoring:network-map:write",
        // DB Monitoring - read + write (no delete)
        "monitoring:db-inventory:read",
        "monitoring:db-inventory:write",
        "monitoring:db-mysql:read",
        "monitoring:db-mysql:write",
        "monitoring:db-mariadb:read",
        "monitoring:db-mariadb:write",
        "monitoring:db-percona:read",
        "monitoring:db-percona:write",
        "monitoring:db-postgresql:read",
        "monitoring:db-postgresql:write",
        "monitoring:db-clickhouse:read",
        "monitoring:db-clickhouse:write",
        "monitoring:db-timescaledb:read",
        "monitoring:db-timescaledb:write",
        "monitoring:db-mssql:read",
        "monitoring:db-mssql:write",
        "monitoring:db-sqlite3:read",
        "monitoring:db-sqlite3:write",
        "monitoring:db-mongodb-community:read",
        "monitoring:db-mongodb-community:write",
        "monitoring:db-mongodb-atlas:read",
        "monitoring:db-mongodb-atlas:write",
        "monitoring:db-aws-rds-mysql:read",
        "monitoring:db-aws-rds-mysql:write",
        "monitoring:db-aws-rds-aurora:read",
        "monitoring:db-aws-rds-aurora:write",
        "monitoring:db-aws-dynamodb:read",
        "monitoring:db-aws-dynamodb:write",
        "monitoring:db-cockroachdb:read",
        "monitoring:db-cockroachdb:write",
        "monitoring:db-aws-rds-postgresql:read",
        "monitoring:db-aws-rds-postgresql:write",
        "monitoring:db-qan:read",
        "monitoring:db-qan:write",
        // Alerts - read + write
        "alert:read",
        "alert:write",
        // Reports - read + write
        "reports:read",
        "reports:write",
        // Notifications - read only
        "notifications:read",
        // API Keys - read + write
        "api-keys:read",
        "api-keys:write",
        // Retention - read only
        "retention:read",
        // Subscription - read only
        "subscription:read",
        // AI Assistant - read only
        "ai-assistant:read",
        // LLM - chat + read + insights (no provider write/delete)
        "llm:read",
        "llm:chat",
        "llm:insights",
        // Data Masking - read + write only (no delete, no toggle)
        "data-masking:read",
        "data-masking:write",
        // AI Intelligence - read + write
        "ai-intelligence:read",
        "ai-intelligence:write",
      ],
      Viewer: [
        // Read-only across all resources
        "users:read",
        "roles:read",
        "permissions:read",
        "organizations:read",
        "workspaces:read",
        "tenants:read",
        "groups:read",
        "regions:read",
        // Tenancy aliases — read only
        "region:read",
        "organization:read",
        "workspace:read",
        "tenant:read",
        "telemetry:read",
        "dashboard:read",
        // Monitoring - read only
        "monitoring:agent:read",
        "monitoring:vm:read",
        "monitoring:kubernetes:read",
        "monitoring:uptime:read",
        "monitoring:status-page:read",
        "monitoring:service-map:read",
        "monitoring:network-map:read",
        // DB Monitoring - read only
        "monitoring:db-inventory:read",
        "monitoring:db-mysql:read",
        "monitoring:db-mariadb:read",
        "monitoring:db-percona:read",
        "monitoring:db-postgresql:read",
        "monitoring:db-clickhouse:read",
        "monitoring:db-timescaledb:read",
        "monitoring:db-mssql:read",
        "monitoring:db-sqlite3:read",
        "monitoring:db-mongodb-community:read",
        "monitoring:db-mongodb-atlas:read",
        "monitoring:db-aws-rds-mysql:read",
        "monitoring:db-aws-rds-aurora:read",
        "monitoring:db-aws-dynamodb:read",
        "monitoring:db-cockroachdb:read",
        "monitoring:db-aws-rds-postgresql:read",
        "monitoring:db-qan:read",
        // Alerts - read only
        "alert:read",
        // Reports - read only
        "reports:read",
        // Notifications - read only
        "notifications:read",
        // API Keys - read only
        "api-keys:read",
        // Retention - read only
        "retention:read",
        // Subscription - read only
        "subscription:read",
        // AI Assistant - read only
        "ai-assistant:read",
        // LLM - read + chat only
        "llm:read",
        "llm:chat",
        // Data Masking - read only
        "data-masking:read",
        // AI Intelligence - read only
        "ai-intelligence:read",
      ],
      Demo: [
        // Limited read-only (no IAM, no system admin features)
        "organizations:read",
        "workspaces:read",
        "tenants:read",
        // Tenancy aliases — limited read only
        "organization:read",
        "workspace:read",
        "tenant:read",
        "telemetry:read",
        "dashboard:read",
        // Monitoring - limited read
        "monitoring:vm:read",
        "monitoring:kubernetes:read",
        "monitoring:uptime:read",
        "monitoring:status-page:read",
        "monitoring:service-map:read",
        "monitoring:network-map:read",
        // DB Monitoring - limited read
        "monitoring:db-inventory:read",
        "monitoring:db-mysql:read",
        "monitoring:db-mariadb:read",
        "monitoring:db-percona:read",
        "monitoring:db-postgresql:read",
        "monitoring:db-clickhouse:read",
        "monitoring:db-timescaledb:read",
        "monitoring:db-mssql:read",
        "monitoring:db-sqlite3:read",
        "monitoring:db-mongodb-community:read",
        "monitoring:db-mongodb-atlas:read",
        "monitoring:db-aws-rds-mysql:read",
        "monitoring:db-aws-rds-aurora:read",
        "monitoring:db-aws-dynamodb:read",
        "monitoring:db-cockroachdb:read",
        "monitoring:db-aws-rds-postgresql:read",
        "monitoring:db-qan:read",
        // Alerts - read only
        "alert:read",
        // Reports - read only
        "reports:read",
        // AI Assistant - read only
        "ai-assistant:read",
        // LLM - read + chat only
        "llm:read",
        "llm:chat",
        // AI Intelligence - read only
        "ai-intelligence:read",
      ],
    };

    let totalInserted = 0;

    for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
      // Get role
      const role = await this.findRecord<{ id: string }>(dataSource, "roles", {
        name: roleName,
      });
      if (!role) {
        this.logError(`Role not found: ${roleName}`);
        continue;
      }

      let roleInserted = 0;
      for (const permName of permissionNames) {
        // Get permission
        const permission = await this.findRecord<{ id: string }>(
          dataSource,
          "permissions",
          { name: permName },
        );

        if (!permission) {
          this.logError(`Permission not found: ${permName}`);
          continue;
        }

        // Check if mapping exists
        const exists = await this.recordExists(dataSource, "role_permissions", {
          role_id: role.id,
          permission_id: permission.id,
        });

        if (!exists) {
          await dataSource.query(
            `INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2)`,
            [role.id, permission.id],
          );
          roleInserted++;
          totalInserted++;
        }
      }

      if (roleInserted > 0) {
        this.logSuccess(`${roleName}: ${roleInserted} permissions assigned`);
      } else {
        this.logSkip(`${roleName}: all permissions already assigned`);
      }
    }

    this.log(`Role permissions seeded: ${totalInserted} assignments created`);
  }
}
