/**
 * PostgreSQL Migrations Index
 * 
 * Auto-exports all migration modules for programmatic access
 */

export * as InitialSchema from './1704240000000-InitialSchema';
export * as CreateRegionsTable from './1704240000001-CreateRegionsTable';
export * as CreateOrganizationsTable from './1704240000002-CreateOrganizationsTable';
export * as CreateWorkspacesTable from './1704240000003-CreateWorkspacesTable';
export * as CreateTenantsTable from './1704240000004-CreateTenantsTable';
export * as CreateGroupsTable from './1704240000005-CreateGroupsTable';
export * as CreateUsersTable from './1704240000006-CreateUsersTable';
export * as CreateRBACTables from './1704240000007-CreateRBACTables';
export * as CreateJunctionTables from './1704240000008-CreateJunctionTables';

// Migration metadata
export const migrations = [
  { id: '1704240000000', name: 'InitialSchema', description: 'Deprecated - Use split migrations', tables: [] },
  { id: '1704240000001', name: 'CreateRegionsTable', description: 'Create regions table', tables: ['regions'] },
  { id: '1704240000002', name: 'CreateOrganizationsTable', description: 'Create organizations table', tables: ['organizations'] },
  { id: '1704240000003', name: 'CreateWorkspacesTable', description: 'Create workspaces table', tables: ['workspaces'] },
  { id: '1704240000004', name: 'CreateTenantsTable', description: 'Create tenants table', tables: ['tenants'] },
  { id: '1704240000005', name: 'CreateGroupsTable', description: 'Create groups table', tables: ['groups'] },
  { id: '1704240000006', name: 'CreateUsersTable', description: 'Create users table', tables: ['users'] },
  { id: '1704240000007', name: 'CreateRBACTables', description: 'Create roles and permissions tables', tables: ['roles', 'permissions'] },
  { id: '1704240000008', name: 'CreateJunctionTables', description: 'Create junction tables', tables: ['user_roles', 'user_permissions', 'role_permissions'] },
];
