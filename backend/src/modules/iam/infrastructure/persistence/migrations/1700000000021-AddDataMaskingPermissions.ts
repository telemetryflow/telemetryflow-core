/**
 * IAM Migration: Add PII Data Masking Permissions
 * Timestamp: 1700000000021 (IAM module range)
 *
 * Adds 4 permissions for the data-masking feature:
 *   data-masking:read   — View policies and built-in patterns
 *   data-masking:write  — Create / update policies, test rules
 *   data-masking:delete — Delete policies
 *   data-masking:manage — Enable / disable policies
 *
 * Role assignments:
 *   Super Administrator — read, write, delete, manage
 *   Administrator       — read, write, delete, manage
 *   Developer           — read, write
 *   Viewer              — read
 *   Demo                — (none — PII config is not a demo feature)
 */

import { QueryRunner } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

const NEW_PERMISSIONS = [
  {
    name: "data-masking:read",
    description: "View PII masking policies and built-in patterns",
    resource: "data-masking",
    action: "read",
  },
  {
    name: "data-masking:write",
    description: "Create and update PII masking policies and test rules",
    resource: "data-masking",
    action: "write",
  },
  {
    name: "data-masking:delete",
    description: "Delete PII masking policies",
    resource: "data-masking",
    action: "delete",
  },
  {
    name: "data-masking:manage",
    description: "Enable and disable PII masking policies",
    resource: "data-masking",
    action: "manage",
  },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  "Super Administrator": [
    "data-masking:read",
    "data-masking:write",
    "data-masking:delete",
    "data-masking:manage",
  ],
  Administrator: [
    "data-masking:read",
    "data-masking:write",
    "data-masking:delete",
    "data-masking:manage",
  ],
  Developer: ["data-masking:read", "data-masking:write"],
  Viewer: ["data-masking:read"],
  // Demo intentionally omitted — PII masking config must not be exposed to demo accounts
};

export class AddDataMaskingPermissions1700000000021 extends BaseMigration {
  name = "AddDataMaskingPermissions1700000000021";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Adding PII data-masking permissions...");

    // 1. Insert permissions (idempotent)
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

    // 2. Assign permissions to roles (idempotent)
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
          this.log(`Assigned ${permName} → ${roleName}`);
        }
      }
    }

    this.log("Data-masking permissions added successfully.");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Removing data-masking permission assignments and permissions...");

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
