/**
 * IAM Migration: Add Missing Controller Permissions
 * Timestamp: 1700000000017 (IAM module range)
 *
 * Adds controller-aligned permission aliases that were missing from the DB:
 *
 * IAM menu group:
 *   users:write, roles:write, groups:write, permissions:write, audit:read
 *
 * Tenancy menu group (singular aliases used by IAM module controllers):
 *   region:read, region:write, region:delete
 *   organization:read, organization:write, organization:delete
 *   workspace:read, workspace:write, workspace:delete
 *   tenant:read, tenant:write, tenant:delete
 *
 * Also assigns these permissions to appropriate roles in role_permissions.
 */

import { QueryRunner } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

const NEW_PERMISSIONS = [
  // IAM menu group
  {
    name: "users:write",
    description: "Create and update users",
    resource: "users",
    action: "write",
  },
  {
    name: "roles:write",
    description: "Create and update roles",
    resource: "roles",
    action: "write",
  },
  {
    name: "groups:write",
    description: "Create and update groups",
    resource: "groups",
    action: "write",
  },
  {
    name: "permissions:write",
    description: "Create and update permissions",
    resource: "permissions",
    action: "write",
  },
  {
    name: "audit:read",
    description: "View audit logs",
    resource: "audit",
    action: "read",
  },
  // Tenancy menu group — singular aliases
  {
    name: "region:read",
    description: "View regions",
    resource: "region",
    action: "read",
  },
  {
    name: "region:write",
    description: "Create and update regions",
    resource: "region",
    action: "write",
  },
  {
    name: "region:delete",
    description: "Delete regions",
    resource: "region",
    action: "delete",
  },
  {
    name: "organization:read",
    description: "View organizations",
    resource: "organization",
    action: "read",
  },
  {
    name: "organization:write",
    description: "Create and update organizations",
    resource: "organization",
    action: "write",
  },
  {
    name: "organization:delete",
    description: "Delete organizations",
    resource: "organization",
    action: "delete",
  },
  {
    name: "workspace:read",
    description: "View workspaces",
    resource: "workspace",
    action: "read",
  },
  {
    name: "workspace:write",
    description: "Create and update workspaces",
    resource: "workspace",
    action: "write",
  },
  {
    name: "workspace:delete",
    description: "Delete workspaces",
    resource: "workspace",
    action: "delete",
  },
  {
    name: "tenant:read",
    description: "View tenants",
    resource: "tenant",
    action: "read",
  },
  {
    name: "tenant:write",
    description: "Create and update tenants",
    resource: "tenant",
    action: "write",
  },
  {
    name: "tenant:delete",
    description: "Delete tenants",
    resource: "tenant",
    action: "delete",
  },
];

// Role → permissions to assign (only new ones)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  "Super Administrator": [
    "users:write",
    "roles:write",
    "groups:write",
    "permissions:write",
    "audit:read",
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
  ],
  Administrator: [
    "users:write",
    "roles:write",
    "groups:write",
    "permissions:write",
    "audit:read",
    "region:read",
    "organization:read",
    "organization:write",
    "workspace:read",
    "workspace:write",
    "workspace:delete",
    "tenant:read",
    "tenant:write",
    "tenant:delete",
  ],
  Developer: [
    "users:write",
    "groups:write",
    "region:read",
    "organization:read",
    "workspace:read",
    "workspace:write",
    "tenant:read",
  ],
  Viewer: [
    "audit:read",
    "region:read",
    "organization:read",
    "workspace:read",
    "tenant:read",
  ],
  Demo: ["organization:read", "workspace:read", "tenant:read"],
};

export class AddMissingControllerPermissions1700000000017 extends BaseMigration {
  name = "AddMissingControllerPermissions1700000000017";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Adding missing controller-aligned permissions...");

    // 1. Insert new permissions (skip if already exists)
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

    // 2. Assign permissions to roles
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

    this.log("Missing controller permissions added successfully.");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Removing controller-aligned permission assignments...");

    for (const perm of NEW_PERMISSIONS) {
      // Remove role_permissions first
      await queryRunner.query(
        `DELETE FROM role_permissions
         WHERE permission_id = (SELECT id FROM permissions WHERE name = $1 LIMIT 1)`,
        [perm.name],
      );
      // Remove permission
      await queryRunner.query(`DELETE FROM permissions WHERE name = $1`, [
        perm.name,
      ]);
    }

    this.log("Rollback complete.");
  }
}
