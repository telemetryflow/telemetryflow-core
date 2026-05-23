/**
 * IAM Module Migrations Index
 *
 * Exports all IAM migrations in execution order.
 * Timestamp range: 1700000000001 - 1700999999999
 */

import { MigrationInterface } from 'typeorm';

// Import all migrations
import { CreateRegionsTable1700000000001 } from './1700000000001-CreateRegionsTable';
import { CreateOrganizationsTable1700000000002 } from './1700000000002-CreateOrganizationsTable';
import { CreateWorkspacesTable1700000000003 } from './1700000000003-CreateWorkspacesTable';
import { CreateTenantsTable1700000000004 } from './1700000000004-CreateTenantsTable';
import { CreateGroupsTable1700000000005 } from './1700000000005-CreateGroupsTable';
import { CreateUsersTable1700000000010 } from './1700000000010-CreateUsersTable';
import { CreateRolesTable1700000000011 } from './1700000000011-CreateRolesTable';
import { CreatePermissionsTable1700000000012 } from './1700000000012-CreatePermissionsTable';
import { CreateUserRolesTable1700000000013 } from './1700000000013-CreateUserRolesTable';
import { CreateRolePermissionsTable1700000000014 } from './1700000000014-CreateRolePermissionsTable';
import { CreateUserPermissionsTable1700000000015 } from './1700000000015-CreateUserPermissionsTable';
import { AddUserRegistrationColumns1700000000016 } from './1700000000016-AddUserRegistrationColumns';
import { AddMissingControllerPermissions1700000000017 } from './1700000000017-AddMissingControllerPermissions';
import { AddMonitoringControllerPermissions1700000000018 } from './1700000000018-AddMonitoringControllerPermissions';
import { AddDeletedAtToRegions1700000000019 } from './1700000000019-AddDeletedAtToRegions';
import { AddMissingUserColumns1700000000020 } from './1700000000020-AddMissingUserColumns';
import { AddDataMaskingPermissions1700000000021 } from './1700000000021-AddDataMaskingPermissions';
import { AddMissingWorkspaceColumns1700000000022 } from './1700000000022-AddMissingWorkspaceColumns';

/**
 * All IAM module migrations in execution order
 */
export const IAMMigrations: (new () => MigrationInterface)[] = [
  CreateRegionsTable1700000000001,
  CreateOrganizationsTable1700000000002,
  CreateWorkspacesTable1700000000003,
  CreateTenantsTable1700000000004,
  CreateGroupsTable1700000000005,
  CreateUsersTable1700000000010,
  CreateRolesTable1700000000011,
  CreatePermissionsTable1700000000012,
  CreateUserRolesTable1700000000013,
  CreateRolePermissionsTable1700000000014,
  CreateUserPermissionsTable1700000000015,
  AddUserRegistrationColumns1700000000016,
  AddMissingControllerPermissions1700000000017,
  AddMonitoringControllerPermissions1700000000018,
  AddDeletedAtToRegions1700000000019,
  AddMissingUserColumns1700000000020,
  AddDataMaskingPermissions1700000000021,
  AddMissingWorkspaceColumns1700000000022,
];

/**
 * IAM Module migration configuration
 */
export const IAMMigrationConfig = {
  moduleName: 'iam',
  database: 'postgres' as const,
  migrations: IAMMigrations,
};

// Re-export individual migrations for direct import if needed
export {
  CreateRegionsTable1700000000001,
  CreateOrganizationsTable1700000000002,
  CreateWorkspacesTable1700000000003,
  CreateTenantsTable1700000000004,
  CreateGroupsTable1700000000005,
  CreateUsersTable1700000000010,
  CreateRolesTable1700000000011,
  CreatePermissionsTable1700000000012,
  CreateUserRolesTable1700000000013,
  CreateRolePermissionsTable1700000000014,
  CreateUserPermissionsTable1700000000015,
  AddUserRegistrationColumns1700000000016,
  AddMissingControllerPermissions1700000000017,
  AddMonitoringControllerPermissions1700000000018,
  AddDeletedAtToRegions1700000000019,
  AddMissingUserColumns1700000000020,
  AddDataMaskingPermissions1700000000021,
  AddMissingWorkspaceColumns1700000000022,
};
