/**
 * PostgreSQL Seeds Index
 * 
 * Auto-exports all seed modules for programmatic access
 */

export * as IAMRolesPermissions from './1704240000001-seed-iam-roles-permissions';
export * as AuthTestUsers from './1704240000002-seed-auth-test-users';
export * as Groups from './1704240000003-seed-groups';

// Seed metadata
export const seeds = [
  { 
    id: '1704240000001', 
    name: 'seed-iam-roles-permissions', 
    description: 'Base IAM data (regions, orgs, workspaces, tenants, permissions, roles)',
    records: 30,
    dependencies: []
  },
  { 
    id: '1704240000002', 
    name: 'seed-auth-test-users', 
    description: '5-tier RBAC test users',
    records: 5,
    dependencies: ['1704240000001']
  },
  { 
    id: '1704240000003', 
    name: 'seed-groups', 
    description: 'User groups',
    records: 4,
    dependencies: ['1704240000001']
  },
];

/**
 * Default test credentials
 */
export const defaultCredentials = {
  password: 'TelemetryFlow@2024',
  users: [
    { email: 'superadmin.telemetryflow@telemetryflow.id', role: 'Super Administrator' },
    { email: 'administrator.telemetryflow@telemetryflow.id', role: 'Administrator' },
    { email: 'developer.telemetryflow@telemetryflow.id', role: 'Developer' },
    { email: 'viewer.telemetryflow@telemetryflow.id', role: 'Viewer' },
    { email: 'demo.telemetryflow@telemetryflow.id', role: 'Demo' },
  ],
};
