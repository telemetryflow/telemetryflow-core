/**
 * IAM Migration: Add Missing Monitoring Controller Permissions
 * Timestamp: 1700000000018 (IAM module range)
 *
 * Adds monitoring permissions used by controllers but missing from DB seeds:
 *   monitoring:agent:delete
 *   monitoring:kubernetes:delete
 *   monitoring:uptime:write
 *   monitoring:status-page:write
 *   monitoring:service-map:write
 *   monitoring:service-map:delete
 *   monitoring:network-map:write
 *   monitoring:network-map:delete
 *
 * Also assigns to roles:
 *   Super Administrator — all 8 permissions
 *   Administrator      — all 8 permissions
 *   Developer          — write permissions (no delete)
 */

import { QueryRunner } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

const NEW_PERMISSIONS = [
  {
    name: "monitoring:agent:delete",
    description: "Delete monitoring agents",
    resource: "monitoring:agent",
    action: "delete",
  },
  {
    name: "monitoring:kubernetes:delete",
    description: "Delete Kubernetes clusters",
    resource: "monitoring:kubernetes",
    action: "delete",
  },
  {
    name: "monitoring:uptime:write",
    description: "Create and update uptime monitors",
    resource: "monitoring:uptime",
    action: "write",
  },
  {
    name: "monitoring:status-page:write",
    description: "Create and update status pages",
    resource: "monitoring:status-page",
    action: "write",
  },
  {
    name: "monitoring:service-map:write",
    description: "Create and update service maps",
    resource: "monitoring:service-map",
    action: "write",
  },
  {
    name: "monitoring:service-map:delete",
    description: "Delete service map data",
    resource: "monitoring:service-map",
    action: "delete",
  },
  {
    name: "monitoring:network-map:write",
    description: "Create and update network maps",
    resource: "monitoring:network-map",
    action: "write",
  },
  {
    name: "monitoring:network-map:delete",
    description: "Delete network map data",
    resource: "monitoring:network-map",
    action: "delete",
  },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  "Super Administrator": [
    "monitoring:agent:delete",
    "monitoring:kubernetes:delete",
    "monitoring:uptime:write",
    "monitoring:status-page:write",
    "monitoring:service-map:write",
    "monitoring:service-map:delete",
    "monitoring:network-map:write",
    "monitoring:network-map:delete",
  ],
  Administrator: [
    "monitoring:agent:delete",
    "monitoring:kubernetes:delete",
    "monitoring:uptime:write",
    "monitoring:status-page:write",
    "monitoring:service-map:write",
    "monitoring:service-map:delete",
    "monitoring:network-map:write",
    "monitoring:network-map:delete",
  ],
  Developer: [
    "monitoring:uptime:write",
    "monitoring:status-page:write",
    "monitoring:service-map:write",
    "monitoring:network-map:write",
  ],
};

export class AddMonitoringControllerPermissions1700000000018 extends BaseMigration {
  name = "AddMonitoringControllerPermissions1700000000018";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Adding missing monitoring controller permissions...");

    for (const perm of NEW_PERMISSIONS) {
      const exists = await queryRunner.query(
        `SELECT id FROM permissions WHERE name = $1 LIMIT 1`,
        [perm.name],
      );
      if (exists.length > 0) {
        this.log(`Permission exists, skipping: ${perm.name}`);
        continue;
      }
      await queryRunner.query(
        `INSERT INTO permissions (name, description, resource, action, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        [perm.name, perm.description, perm.resource, perm.action],
      );
      this.log(`Created permission: ${perm.name}`);
    }

    for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
      const roleRow = await queryRunner.query(
        `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
        [roleName],
      );
      if (!roleRow.length) {
        this.log(`Role not found, skipping: ${roleName}`);
        continue;
      }
      const roleId = roleRow[0].id;

      for (const permName of permNames) {
        const permRow = await queryRunner.query(
          `SELECT id FROM permissions WHERE name = $1 LIMIT 1`,
          [permName],
        );
        if (!permRow.length) {
          this.log(`Permission not found, skipping assignment: ${permName}`);
          continue;
        }
        const permId = permRow[0].id;

        const assigned = await queryRunner.query(
          `SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2 LIMIT 1`,
          [roleId, permId],
        );
        if (!assigned.length) {
          await queryRunner.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
            [roleId, permId],
          );
        }
      }
      this.log(`Assigned permissions to role: ${roleName}`);
    }

    this.log("Monitoring controller permissions added successfully.");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Removing monitoring controller permission assignments...");

    for (const perm of NEW_PERMISSIONS) {
      await queryRunner.query(
        `DELETE FROM role_permissions
         WHERE permission_id = (SELECT id FROM permissions WHERE name = $1 LIMIT 1)`,
        [perm.name],
      );
      await queryRunner.query(`DELETE FROM permissions WHERE name = $1`, [
        perm.name,
      ]);
    }

    this.log("Rollback complete.");
  }
}
