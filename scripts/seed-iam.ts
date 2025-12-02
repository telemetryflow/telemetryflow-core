import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USERNAME || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'telemetryflow_core',
  entities: ['src/modules/iam/infrastructure/persistence/entities/**/*.entity.ts'],
  synchronize: true,
});

export async function seedIAMData(ds?: DataSource) {
  const connection = ds || dataSource;
  
  if (!ds) {
    await connection.initialize();
    console.log('✓ Connected to database');
  }

  // Get repositories dynamically
  const entities = connection.entityMetadatas;
  const RegionEntity = entities.find(e => e.name === 'Region')?.target;
  const TenantEntity = entities.find(e => e.name === 'Tenant')?.target;
  const OrganizationEntity = entities.find(e => e.name === 'Organization')?.target;
  const WorkspaceEntity = entities.find(e => e.name === 'Workspace')?.target;
  const UserEntity = entities.find(e => e.name === 'User')?.target;
  const RoleEntity = entities.find(e => e.name === 'Role')?.target;
  const PermissionEntity = entities.find(e => e.name === 'Permission')?.target;
  const GroupEntity = entities.find(e => e.name === 'Group')?.target;

  if (!RegionEntity || !TenantEntity || !UserEntity) {
    throw new Error('Required entities not found');
  }

  const regionRepo = connection.getRepository(RegionEntity);
  const tenantRepo = connection.getRepository(TenantEntity);
  const orgRepo = connection.getRepository(OrganizationEntity);
  const workspaceRepo = connection.getRepository(WorkspaceEntity);
  const userRepo = connection.getRepository(UserEntity);
  const roleRepo = connection.getRepository(RoleEntity);
  const permissionRepo = connection.getRepository(PermissionEntity);
  const groupRepo = connection.getRepository(GroupEntity);

  // Seed Regions
  const regions = [
    { code: 'us-east-1', name: 'US East (N. Virginia)', isActive: true },
    { code: 'eu-west-1', name: 'EU West (Ireland)', isActive: true },
    { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', isActive: true },
  ];

  for (const r of regions) {
    const existing = await regionRepo.findOne({ where: { code: r.code } });
    if (!existing) {
      await regionRepo.save(regionRepo.create(r));
    }
  }
  console.log('✓ Regions seeded');

  // Seed Tenant
  let tenant = await tenantRepo.findOne({ where: { name: 'ACME Corp' } });
  if (!tenant) {
    tenant = await tenantRepo.save(tenantRepo.create({
      name: 'ACME Corp',
      slug: 'acme-corp',
      isActive: true,
    }));
  }
  console.log('✓ Tenant seeded');

  // Seed Organization
  let org = await orgRepo.findOne({ where: { name: 'Engineering' } });
  if (!org) {
    org = await orgRepo.save(orgRepo.create({
      name: 'Engineering',
      slug: 'engineering',
      tenantId: tenant.id,
      isActive: true,
    }));
  }
  console.log('✓ Organization seeded');

  // Seed Workspace
  let workspace = await workspaceRepo.findOne({ where: { name: 'Production' } });
  if (!workspace) {
    workspace = await workspaceRepo.save(workspaceRepo.create({
      name: 'Production',
      slug: 'production',
      organizationId: org.id,
      tenantId: tenant.id,
      isActive: true,
    }));
  }
  console.log('✓ Workspace seeded');

  // Seed Roles (5-Tier RBAC)
  const roles = [
    { name: 'super_administrator', description: 'Super Administrator - Global platform management', tenantId: tenant.id },
    { name: 'administrator', description: 'Administrator - Organization-scoped full access', tenantId: tenant.id },
    { name: 'developer', description: 'Developer - Create/Read/Update (no delete)', tenantId: tenant.id },
    { name: 'viewer', description: 'Viewer - Read-only access', tenantId: tenant.id },
    { name: 'demo', description: 'Demo - Developer access in demo org only', tenantId: tenant.id },
  ];

  for (const r of roles) {
    const existing = await roleRepo.findOne({ where: { name: r.name, tenantId: tenant.id } });
    if (!existing) {
      await roleRepo.save(roleRepo.create(r));
    }
  }
  console.log('✓ Roles seeded (5-Tier RBAC)');

  // Seed Permissions (RBAC permissions)
  const permissions = [
    // IAM Permissions
    { name: 'iam:users:read', description: 'Read users', resource: 'users', action: 'read', tenantId: tenant.id },
    { name: 'iam:users:create', description: 'Create users', resource: 'users', action: 'create', tenantId: tenant.id },
    { name: 'iam:users:update', description: 'Update users', resource: 'users', action: 'update', tenantId: tenant.id },
    { name: 'iam:users:delete', description: 'Delete users', resource: 'users', action: 'delete', tenantId: tenant.id },
    { name: 'iam:roles:read', description: 'Read roles', resource: 'roles', action: 'read', tenantId: tenant.id },
    { name: 'iam:roles:create', description: 'Create roles', resource: 'roles', action: 'create', tenantId: tenant.id },
    { name: 'iam:roles:update', description: 'Update roles', resource: 'roles', action: 'update', tenantId: tenant.id },
    { name: 'iam:roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete', tenantId: tenant.id },
    { name: 'iam:permissions:read', description: 'Read permissions', resource: 'permissions', action: 'read', tenantId: tenant.id },
    { name: 'iam:organizations:read', description: 'Read organizations', resource: 'organizations', action: 'read', tenantId: tenant.id },
    { name: 'iam:organizations:update', description: 'Update organizations', resource: 'organizations', action: 'update', tenantId: tenant.id },
    { name: 'iam:tenants:read', description: 'Read tenants', resource: 'tenants', action: 'read', tenantId: tenant.id },
    { name: 'iam:tenants:create', description: 'Create tenants', resource: 'tenants', action: 'create', tenantId: tenant.id },
    { name: 'iam:tenants:update', description: 'Update tenants', resource: 'tenants', action: 'update', tenantId: tenant.id },
    { name: 'iam:tenants:delete', description: 'Delete tenants', resource: 'tenants', action: 'delete', tenantId: tenant.id },
    { name: 'iam:workspaces:read', description: 'Read workspaces', resource: 'workspaces', action: 'read', tenantId: tenant.id },
    { name: 'iam:workspaces:create', description: 'Create workspaces', resource: 'workspaces', action: 'create', tenantId: tenant.id },
    { name: 'iam:workspaces:update', description: 'Update workspaces', resource: 'workspaces', action: 'update', tenantId: tenant.id },
    { name: 'iam:workspaces:delete', description: 'Delete workspaces', resource: 'workspaces', action: 'delete', tenantId: tenant.id },
    { name: 'iam:regions:read', description: 'Read regions', resource: 'regions', action: 'read', tenantId: tenant.id },
    // Platform Permissions
    { name: 'platform:manage', description: 'Manage platform', resource: 'platform', action: 'manage', tenantId: tenant.id },
    { name: 'system:admin', description: 'System administration', resource: 'system', action: 'admin', tenantId: tenant.id },
  ];

  for (const p of permissions) {
    const existing = await permissionRepo.findOne({ where: { name: p.name, tenantId: tenant.id } });
    if (!existing) {
      await permissionRepo.save(permissionRepo.create(p));
    }
  }
  console.log('✓ Permissions seeded');

  // Seed Users (5-Tier RBAC)
  const hashedPassword = await argon2.hash('Password123!');
  const users = [
    { email: 'super.administrator@telemetryflow.local', username: 'super_admin', password: hashedPassword, firstName: 'Super', lastName: 'Administrator', tenantId: tenant.id, isActive: true },
    { email: 'admin.telemetryflow@telemetryflow.local', username: 'admin', password: hashedPassword, firstName: 'Admin', lastName: 'User', tenantId: tenant.id, isActive: true },
    { email: 'developer.telemetryflow@telemetryflow.local', username: 'developer', password: hashedPassword, firstName: 'Developer', lastName: 'User', tenantId: tenant.id, isActive: true },
    { email: 'viewer.telemetryflow@telemetryflow.local', username: 'viewer', password: hashedPassword, firstName: 'Viewer', lastName: 'User', tenantId: tenant.id, isActive: true },
    { email: 'demo.telemetryflow@telemetryflow.local', username: 'demo', password: hashedPassword, firstName: 'Demo', lastName: 'User', tenantId: tenant.id, isActive: true },
  ];

  for (const u of users) {
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (!existing) {
      await userRepo.save(userRepo.create(u));
    }
  }
  console.log('✓ Users seeded (5-Tier RBAC)');

  // Seed Groups
  const groups = [
    { name: 'Admins', description: 'Administrator group', tenantId: tenant.id },
    { name: 'Developers', description: 'Developer group', tenantId: tenant.id },
  ];

  for (const g of groups) {
    const existing = await groupRepo.findOne({ where: { name: g.name, tenantId: tenant.id } });
    if (!existing) {
      await groupRepo.save(groupRepo.create(g));
    }
  }
  console.log('✓ Groups seeded');

  if (!ds) {
    await connection.destroy();
  }

  console.log('\n✅ IAM seeding complete!');
  console.log('\n5-Tier RBAC System:');
  console.log('  Tier 1: Super Administrator (Global)');
  console.log('  Tier 2: Administrator (Organization-scoped)');
  console.log('  Tier 3: Developer (Create/Read/Update)');
  console.log('  Tier 4: Viewer (Read-only)');
  console.log('  Tier 5: Demo (Demo org only)');
  console.log('\nDefault credentials (all users):');
  console.log('  Password: Password123!');
  console.log('\nUsers:');
  console.log('  super.administrator@telemetryflow.local - Super Admin');
  console.log('  admin.telemetryflow@telemetryflow.local - Administrator');
  console.log('  developer.telemetryflow@telemetryflow.local - Developer');
  console.log('  viewer.telemetryflow@telemetryflow.local - Viewer');
  console.log('  demo.telemetryflow@telemetryflow.local - Demo');
}

// Run if called directly
if (require.main === module) {
  seedIAMData().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}
