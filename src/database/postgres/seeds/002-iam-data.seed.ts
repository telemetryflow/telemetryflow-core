import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';

export async function seedIAMData(dataSource: DataSource) {
  console.log('\n🔐 Seeding IAM Data...\n');

  const regionRepo = dataSource.getRepository('RegionEntity');
  const organizationRepo = dataSource.getRepository('OrganizationEntity');
  const workspaceRepo = dataSource.getRepository('WorkspaceEntity');
  const tenantRepo = dataSource.getRepository('TenantEntity');
  const permissionRepo = dataSource.getRepository('PermissionEntity');
  const roleRepo = dataSource.getRepository('RoleEntity');
  const userRepo = dataSource.getRepository('UserEntity');

  // 1. Seed Regions
  console.log('📍 Seeding regions...');
  const regions = [
    { name: 'ap-southeast-3', code: 'APS3', description: 'Asia Pacific (Jakarta)', isActive: true },
    { name: 'us-east-1', code: 'USE1', description: 'US East (N. Virginia)', isActive: true },
    { name: 'eu-west-1', code: 'EUW1', description: 'EU West (Ireland)', isActive: true },
  ];

  for (const r of regions) {
    const existing = await regionRepo.findOne({ where: { code: r.code } });
    if (!existing) {
      await regionRepo.save(regionRepo.create(r));
      console.log(`   ✓ Created region: ${r.name}`);
    }
  }

  const apSoutheast3 = await regionRepo.findOne({ where: { code: 'APS3' } });

  // 2. Seed Organization
  console.log('\n🏢 Seeding organizations...');
  let devopsCornerOrg = await organizationRepo.findOne({ where: { code: 'DEVOPSCORNER' } });
  if (!devopsCornerOrg) {
    devopsCornerOrg = await organizationRepo.save(organizationRepo.create({
      name: 'DevOpsCorner',
      code: 'DEVOPSCORNER',
      description: 'DevOpsCorner organization',
      domain: 'devopscorner.id',
      isActive: true,
      region_id: apSoutheast3.id,
    }));
    console.log('   ✓ Created organization: DevOpsCorner');
  }

  // 3. Seed Workspace
  console.log('\n💼 Seeding workspaces...');
  let telemetryflowPoc = await workspaceRepo.findOne({ where: { code: 'TELEMETRYFLOW-POC' } });
  if (!telemetryflowPoc) {
    telemetryflowPoc = await workspaceRepo.save(workspaceRepo.create({
      name: 'TelemetryFlow POC',
      code: 'TELEMETRYFLOW-POC',
      description: 'Default workspace for OTEL collector',
      organization_id: devopsCornerOrg.id,
      isActive: true,
    }));
    console.log('   ✓ Created workspace: TelemetryFlow POC');
  }

  // 4. Seed Tenant
  console.log('\n🏷️  Seeding tenants...');
  let tenant = await tenantRepo.findOne({ where: { code: 'DEVOPSCORNER' } });
  if (!tenant) {
    tenant = await tenantRepo.save(tenantRepo.create({
      name: 'DevOpsCorner',
      code: 'DEVOPSCORNER',
      domain: 'devopscorner.id',
      workspace_id: telemetryflowPoc.id,
      isActive: true,
    }));
    console.log('   ✓ Created tenant: DevOpsCorner');
  }

  // 5. Seed Permissions
  console.log('\n🔑 Seeding permissions...');
  const permissions = [
    { name: 'users:create', description: 'Create users' },
    { name: 'users:read', description: 'Read users' },
    { name: 'users:update', description: 'Update users' },
    { name: 'users:delete', description: 'Delete users' },
    { name: 'roles:create', description: 'Create roles' },
    { name: 'roles:read', description: 'Read roles' },
    { name: 'roles:update', description: 'Update roles' },
    { name: 'roles:delete', description: 'Delete roles' },
    { name: 'permissions:read', description: 'Read permissions' },
    { name: 'tenants:create', description: 'Create tenants' },
    { name: 'tenants:read', description: 'Read tenants' },
    { name: 'tenants:update', description: 'Update tenants' },
    { name: 'tenants:delete', description: 'Delete tenants' },
    { name: 'organizations:create', description: 'Create organizations' },
    { name: 'organizations:read', description: 'Read organizations' },
    { name: 'organizations:update', description: 'Update organizations' },
    { name: 'organizations:delete', description: 'Delete organizations' },
    { name: 'workspaces:create', description: 'Create workspaces' },
    { name: 'workspaces:read', description: 'Read workspaces' },
    { name: 'workspaces:update', description: 'Update workspaces' },
    { name: 'workspaces:delete', description: 'Delete workspaces' },
    { name: 'platform:manage', description: 'Manage platform' },
  ];

  for (const p of permissions) {
    const existing = await permissionRepo.findOne({ where: { name: p.name } });
    if (!existing) {
      await permissionRepo.save(permissionRepo.create(p));
      console.log(`   ✓ Created permission: ${p.name}`);
    }
  }

  // 6. Seed Roles (5-Tier RBAC)
  console.log('\n👥 Seeding roles (5-Tier RBAC)...');
  const roles = [
    { name: 'Super Administrator', tier: 1, description: 'Platform management across all organizations' },
    { name: 'Administrator', tier: 2, description: 'Full CRUD within organization' },
    { name: 'Developer', tier: 3, description: 'Create/Read/Update (no delete)' },
    { name: 'Viewer', tier: 4, description: 'Read-only access' },
    { name: 'Demo', tier: 5, description: 'Demo access in demo organization' },
  ];

  for (const r of roles) {
    const existing = await roleRepo.findOne({ where: { name: r.name } });
    if (!existing) {
      await roleRepo.save(roleRepo.create(r));
      console.log(`   ✓ Created role: ${r.name} (Tier ${r.tier})`);
    }
  }

  // 7. Seed Users
  console.log('\n👤 Seeding users...');
  const users = [
    { email: 'superadmin.telemetryflow@telemetryflow.id', password: 'SuperAdmin@123456', role: 'Super Administrator', firstName: 'Super', lastName: 'Admin' },
    { email: 'administrator.telemetryflow@telemetryflow.id', password: 'Admin@123456', role: 'Administrator', firstName: 'Admin', lastName: 'User' },
    { email: 'developer.telemetryflow@telemetryflow.id', password: 'Developer@123456', role: 'Developer', firstName: 'Developer', lastName: 'User' },
    { email: 'viewer.telemetryflow@telemetryflow.id', password: 'Viewer@123456', role: 'Viewer', firstName: 'Viewer', lastName: 'User' },
    { email: 'demo.telemetryflow@telemetryflow.id', password: 'Demo@123456', role: 'Demo', firstName: 'Demo', lastName: 'User' },
  ];

  for (const u of users) {
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (!existing) {
      const hashedPassword = await argon2.hash(u.password);
      await userRepo.save(userRepo.create({
        email: u.email,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: true,
        tenant_id: tenant.id,
      }));
      console.log(`   ✓ Created user: ${u.email} (${u.role})`);
    }
  }

  console.log('\n✅ IAM Data Seeding Complete!\n');
}

// Main execution
if (require.main === module) {
  import('dotenv').then(({ config }) => {
    config();
    
    import('typeorm').then(async ({ DataSource }) => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT, 10),
        username: process.env.POSTGRES_USERNAME,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        entities: ['src/modules/iam/infrastructure/persistence/entities/**/*.ts'],
        synchronize: false,
      });

      try {
        await dataSource.initialize();
        await seedIAMData(dataSource);
        await dataSource.destroy();
        process.exit(0);
      } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
      }
    });
  });
}
