import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';

export async function seedIAMRolesPermissions(dataSource: DataSource): Promise<void> {
  console.log('🔐 Seeding 5-Tier RBAC System...');

  // 1. CREATE REGIONS
  const regions = [
    { id: '7996a839-8f5e-4888-a2c9-d9d57aa16c70', name: 'ap-southeast-3', code: 'APS3', description: 'Asia Pacific (Jakarta)' },
    { id: 'b8a7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', name: 'us-east-1', code: 'USE1', description: 'US East (N. Virginia)' },
    { id: 'c9b8a7d6-f5e4-4b3a-ad9c-8f7e6d5c4b3a', name: 'eu-west-1', code: 'EUW1', description: 'EU West (Ireland)' },
  ];

  for (const region of regions) {
    await dataSource.query(`
      INSERT INTO regions (region_id, name, code, description, "isActive")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (code) DO NOTHING
    `, [region.id, region.name, region.code, region.description, true]);
  }

  // 2. CREATE ORGANIZATIONS
  const regionId = '7996a839-8f5e-4888-a2c9-d9d57aa16c70';
  const organizations = [
    { id: 'dd085b41-103b-4458-8253-fa942c3aacf7', name: 'DevOpsCorner', code: 'DEVOPSCORNER', description: 'DevOpsCorner Organization', domain: 'devopscorner.id' },
    { id: '811a6697-169b-4b01-823a-066edae34b55', name: 'TelemetryFlow', code: 'TELEMETRYFLOW', description: 'TelemetryFlow Organization', domain: 'telemetryflow.id' },
    { id: '10756297-4ada-4c28-b0e0-644706b7c97d', name: 'Demo', code: 'DEMO', description: 'Demo Organization', domain: 'demo.telemetryflow.id' },
  ];

  for (const org of organizations) {
    await dataSource.query(`
      INSERT INTO organizations (organization_id, name, code, description, domain, region_id, "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (code) DO NOTHING
    `, [org.id, org.name, org.code, org.description, org.domain, regionId, true]);
  }

  // 3. CREATE WORKSPACES
  const workspaces = [
    { id: '7996a839-8f5e-4888-a2c9-d9d57aa16c70', name: 'DevOpsCorner Workspace', code: 'DEVOPSCORNER-WS', description: 'DevOpsCorner default workspace', organizationId: 'dd085b41-103b-4458-8253-fa942c3aacf7' },
    { id: 'b8a7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', name: 'TelemetryFlow Workspace', code: 'TELEMETRYFLOW-WS', description: 'TelemetryFlow default workspace', organizationId: '811a6697-169b-4b01-823a-066edae34b55' },
    { id: 'c9b8a7d6-f5e4-4b3a-ad9c-8f7e6d5c4b3a', name: 'Demo Workspace', code: 'DEMO-WS', description: 'Demo workspace', organizationId: '10756297-4ada-4c28-b0e0-644706b7c97d' },
  ];

  for (const ws of workspaces) {
    await dataSource.query(`
      INSERT INTO workspaces (id, name, code, description, organization_id, "isActive")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (code) DO NOTHING
    `, [ws.id, ws.name, ws.code, ws.description, ws.organizationId, true]);
  }

  // 4. CREATE TENANTS
  const tenants = [
    { id: '7996a839-8f5e-4888-a2c9-d9d57aa16c70', name: 'DevOpsCorner', code: 'DEVOPSCORNER', domain: 'devopscorner.id', workspaceId: '7996a839-8f5e-4888-a2c9-d9d57aa16c70' },
    { id: 'b8a7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', name: 'TelemetryFlow', code: 'TELEMETRYFLOW', domain: 'telemetryflow.id', workspaceId: 'b8a7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d' },
    { id: 'c9b8a7d6-f5e4-4b3a-ad9c-8f7e6d5c4b3a', name: 'Demo', code: 'DEMO', domain: 'demo.telemetryflow.id', workspaceId: 'c9b8a7d6-f5e4-4b3a-ad9c-8f7e6d5c4b3a' },
  ];

  for (const tenant of tenants) {
    await dataSource.query(`
      INSERT INTO tenants (id, name, code, domain, workspace_id, "isActive")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (code) DO NOTHING
    `, [tenant.id, tenant.name, tenant.code, tenant.domain, tenant.workspaceId, true]);
  }

  // 5. CREATE PERMISSIONS
  const permissions = [
    { name: 'platform:manage', description: 'Manage platform', resource: 'platform', action: 'manage' },
    { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
    { name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
    { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
    { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
    { name: 'roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
    { name: 'roles:read', description: 'Read roles', resource: 'roles', action: 'read' },
    { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
    { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
    { name: 'permissions:read', description: 'Read permissions', resource: 'permissions', action: 'read' },
    { name: 'tenants:create', description: 'Create tenants', resource: 'tenants', action: 'create' },
    { name: 'tenants:read', description: 'Read tenants', resource: 'tenants', action: 'read' },
    { name: 'tenants:update', description: 'Update tenants', resource: 'tenants', action: 'update' },
    { name: 'tenants:delete', description: 'Delete tenants', resource: 'tenants', action: 'delete' },
    { name: 'organizations:create', description: 'Create organizations', resource: 'organizations', action: 'create' },
    { name: 'organizations:read', description: 'Read organizations', resource: 'organizations', action: 'read' },
    { name: 'organizations:update', description: 'Update organizations', resource: 'organizations', action: 'update' },
    { name: 'organizations:delete', description: 'Delete organizations', resource: 'organizations', action: 'delete' },
    { name: 'workspaces:create', description: 'Create workspaces', resource: 'workspaces', action: 'create' },
    { name: 'workspaces:read', description: 'Read workspaces', resource: 'workspaces', action: 'read' },
    { name: 'workspaces:update', description: 'Update workspaces', resource: 'workspaces', action: 'update' },
    { name: 'workspaces:delete', description: 'Delete workspaces', resource: 'workspaces', action: 'delete' },
  ];

  for (const perm of permissions) {
    await dataSource.query(`
      INSERT INTO permissions (id, name, description, resource, action)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name) DO NOTHING
    `, [randomUUID(), perm.name, perm.description, perm.resource, perm.action]);
  }

  // 6. CREATE 5-TIER RBAC ROLES
  const roles = [
    { name: 'Super Administrator', tier: 1, description: 'Platform management across all organizations' },
    { name: 'Administrator', tier: 2, description: 'Full CRUD within organization' },
    { name: 'Developer', tier: 3, description: 'Create/Read/Update (no delete)' },
    { name: 'Viewer', tier: 4, description: 'Read-only access' },
    { name: 'Demo', tier: 5, description: 'Demo access in demo organization' },
  ];

  for (const role of roles) {
    await dataSource.query(`
      INSERT INTO roles (id, name, description, tier, "isSystem")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name) DO NOTHING
    `, [randomUUID(), role.name, role.description, role.tier, true]);
  }

  // 7. ASSIGN PERMISSIONS TO ROLES
  const roleIds = await dataSource.query(`SELECT id, name FROM roles`);
  const superAdminId = roleIds.find(r => r.name === 'Super Administrator')?.id;
  const adminId = roleIds.find(r => r.name === 'Administrator')?.id;
  const developerId = roleIds.find(r => r.name === 'Developer')?.id;
  const viewerId = roleIds.find(r => r.name === 'Viewer')?.id;
  const demoId = roleIds.find(r => r.name === 'Demo')?.id;

  // Super Admin: ALL permissions
  await dataSource.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT $1, id FROM permissions
    ON CONFLICT DO NOTHING
  `, [superAdminId]);

  // Administrator: All except platform:manage
  await dataSource.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT $1, id FROM permissions WHERE name != 'platform:manage'
    ON CONFLICT DO NOTHING
  `, [adminId]);

  // Developer: Create/Read/Update only
  const developerPermissions = [
    'organizations:read', 'permissions:read', 'roles:read', 'users:read',
    'tenants:create', 'tenants:read', 'tenants:update',
    'workspaces:create', 'workspaces:read', 'workspaces:update'
  ];
  
  for (const permName of developerPermissions) {
    await dataSource.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT $1, id FROM permissions WHERE name = $2
      ON CONFLICT DO NOTHING
    `, [developerId, permName]);
  }

  // Viewer: Read-only
  const viewerPermissions = [
    'organizations:read', 'permissions:read', 'roles:read', 
    'users:read', 'tenants:read', 'workspaces:read'
  ];
  
  for (const permName of viewerPermissions) {
    await dataSource.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT $1, id FROM permissions WHERE name = $2
      ON CONFLICT DO NOTHING
    `, [viewerId, permName]);
  }

  // Demo: Same as Developer
  for (const permName of developerPermissions) {
    await dataSource.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT $1, id FROM permissions WHERE name = $2
      ON CONFLICT DO NOTHING
    `, [demoId, permName]);
  }

  // 8. CREATE DEFAULT USERS
  const users = [
    { email: 'superadmin.telemetryflow@telemetryflow.id', password: 'SuperAdmin@123456', role: 'Super Administrator', firstName: 'Super', lastName: 'Administrator', orgId: '811a6697-169b-4b01-823a-066edae34b55' },
    { email: 'administrator.telemetryflow@telemetryflow.id', password: 'Admin@123456', role: 'Administrator', firstName: 'Admin', lastName: 'TelemetryFlow', orgId: '811a6697-169b-4b01-823a-066edae34b55' },
    { email: 'developer.telemetryflow@telemetryflow.id', password: 'Developer@123456', role: 'Developer', firstName: 'Developer', lastName: 'TelemetryFlow', orgId: '811a6697-169b-4b01-823a-066edae34b55' },
    { email: 'viewer.telemetryflow@telemetryflow.id', password: 'Viewer@123456', role: 'Viewer', firstName: 'Viewer', lastName: 'TelemetryFlow', orgId: '811a6697-169b-4b01-823a-066edae34b55' },
    { email: 'demo.telemetryflow@telemetryflow.id', password: 'Demo@123456', role: 'Demo', firstName: 'Demo', lastName: 'User', orgId: '10756297-4ada-4c28-b0e0-644706b7c97d' },
  ];

  for (const user of users) {
    const existing = await dataSource.query(`SELECT id FROM users WHERE email = $1`, [user.email]);
    
    if (existing.length === 0) {
      const userId = randomUUID();
      const hashedPassword = await argon2.hash(user.password);
      const roleId = roleIds.find(r => r.name === user.role)?.id;

      await dataSource.query(`
        INSERT INTO users (id, email, password, "firstName", "lastName", "isActive", organization_id, "emailVerified")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, user.email, hashedPassword, user.firstName, user.lastName, true, user.orgId, true]);

      await dataSource.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [userId, roleId]);

      console.log(`   ✓ Created user: ${user.email} (${user.role})`);
    }
  }

  console.log('   ✅ 5-Tier RBAC System seeded successfully');
}
