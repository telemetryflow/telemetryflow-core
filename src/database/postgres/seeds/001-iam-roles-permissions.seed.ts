import { DataSource } from 'typeorm';
import { RoleEntity } from '../../../modules/iam/infrastructure/persistence/entities/Role.entity';
import { PermissionEntity } from '../../../modules/iam/infrastructure/persistence/entities/PermissionEntity';
import { TenantEntity } from '../../../modules/iam/infrastructure/persistence/entities/Tenant.entity';
import { WorkspaceEntity } from '../../../modules/iam/infrastructure/persistence/entities/Workspace.entity';
import { RegionEntity } from '../../../modules/iam/infrastructure/persistence/entities/RegionEntity';
import { OrganizationEntity } from '../../../modules/iam/infrastructure/persistence/entities/Organization.entity';

export async function seedIAMRolesPermissions(dataSource: DataSource): Promise<void> {
  console.log('🔐 Seeding IAM roles and permissions...');

  const permissionRepo = dataSource.getRepository(PermissionEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);
  const organizationRepo = dataSource.getRepository(OrganizationEntity);
  const tenantRepo = dataSource.getRepository(TenantEntity);
  const workspaceRepo = dataSource.getRepository(WorkspaceEntity);
  const regionRepo = dataSource.getRepository(RegionEntity);

  // Check if seed data already exists
  const existingPermissions = await permissionRepo.count();
  if (existingPermissions > 0) {
    console.log('   ⚠️  IAM seed data already exists. Skipping...');
    return;
  }

  // 1. CREATE DEFAULT REGION
  const region = regionRepo.create({
    name: 'ap-southeast-3',
    code: 'APS3',
    description: 'Asia Pacific (Jakarta)',
    isActive: true,
  });
  await regionRepo.save(region);
  console.log('   ✓ Created default region');

  // 2. CREATE DEFAULT ORGANIZATION
  const organization = organizationRepo.create({
    name: 'DevOpsCorner',
    code: 'DEVOPSCORNER',
    description: 'DevOpsCorner organization',
    domain: 'devopscorner.id',
    is_active: true,
    region_id: region.id,
  });
  await organizationRepo.save(organization);
  console.log('   ✓ Created default organization');

  // 3. CREATE DEFAULT WORKSPACE
  const workspace = workspaceRepo.create({
    name: 'TelemetryFlow POC',
    code: 'TELEMETRYFLOW-POC',
    description: 'Default workspace for OTEL collector',
    organization_id: organization.organization_id,
    isActive: true,
  });
  await workspaceRepo.save(workspace);
  console.log('   ✓ Created default workspace');

  // 4. CREATE DEFAULT TENANT
  const tenant = tenantRepo.create({
    name: 'DevOpsCorner',
    code: 'DEVOPSCORNER',
    domain: 'devopscorner.id',
    workspace_id: workspace.workspace_id,
    isActive: true,
  });
  await tenantRepo.save(tenant);
  console.log('   ✓ Created default tenant');

  // 5. CREATE PERMISSIONS
  const permissionDefinitions = [
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

  for (const permDef of permissionDefinitions) {
    const permission = permissionRepo.create(permDef);
    await permissionRepo.save(permission);
  }
  console.log(`   ✓ Created ${permissionDefinitions.length} permissions`);

  // 6. CREATE ROLES (5-Tier RBAC)
  const roleDefinitions = [
    { name: 'Super Administrator', tier: 1, description: 'Platform management across all organizations' },
    { name: 'Administrator', tier: 2, description: 'Full CRUD within organization' },
    { name: 'Developer', tier: 3, description: 'Create/Read/Update (no delete)' },
    { name: 'Viewer', tier: 4, description: 'Read-only access' },
    { name: 'Demo', tier: 5, description: 'Demo access in demo organization' },
  ];

  for (const roleDef of roleDefinitions) {
    const role = roleRepo.create(roleDef);
    await roleRepo.save(role);
  }
  console.log(`   ✓ Created ${roleDefinitions.length} roles (5-Tier RBAC)`);

  console.log('   ✅ IAM roles and permissions seeded successfully');
}
