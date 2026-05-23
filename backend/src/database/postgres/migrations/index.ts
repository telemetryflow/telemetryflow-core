/**
 * PostgreSQL Migrations Index (Legacy)
 *
 * Note: Migrations have been moved to modular locations:
 * - IAM: backend/modules/iam/infrastructure/persistence/migrations/
 * - Auth: backend/modules/auth/infrastructure/persistence/migrations/
 *
 * This file is kept for reference. Use the modular migration-runner.ts instead.
 */

// Migration metadata (for reference only - actual migrations are in module directories)
export const migrationsReference = {
  iam: [
    "1700000000001-CreateRegionsTable",
    "1700000000002-CreateOrganizationsTable",
    "1700000000003-CreateWorkspacesTable",
    "1700000000004-CreateTenantsTable",
    "1700000000005-CreateGroupsTable",
    "1700000000010-CreateUsersTable",
    "1700000000011-CreateRolesTable",
    "1700000000012-CreatePermissionsTable",
    "1700000000013-CreateUserRolesTable",
    "1700000000014-CreateRolePermissionsTable",
    "1700000000015-CreateUserPermissionsTable",
  ],
  auth: [
    "1706000000001-CreateAuthTokensTable",
    "1706000000002-CreateUserSessionsTable",
    "1706000000003-CreateKnownDevicesTable",
  ],
  "api-keys": ["1708000000001-CreateApiKeysTable"],
  sso: ["1709000000001-CreateSsoTables"],
};
