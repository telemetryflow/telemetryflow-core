import { DataSource } from 'typeorm';
import { RoleEntity } from '../../../modules/iam/infrastructure/persistence/entities/RoleEntity';
import { PermissionEntity } from '../../../modules/iam/infrastructure/persistence/entities/PermissionEntity';
import { TenantEntity } from '../../../modules/iam/infrastructure/persistence/entities/Tenant.entity';
import { WorkspaceEntity } from '../../../modules/iam/infrastructure/persistence/entities/Workspace.entity';
import { RegionEntity } from '../../../modules/iam/infrastructure/persistence/entities/RegionEntity';
import { OrganizationEntity } from '../../../modules/iam/infrastructure/persistence/entities/Organization.entity';
import { randomUUID } from 'crypto';

export async function seedIAMRolesPermissions(dataSource: DataSource): Promise<void> {
  console.log('🔐 Seeding IAM roles and permissions...');

  const permissionRepo = dataSource.getRepository(PermissionEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);
  const organizationRepo = dataSource.getRepository(OrganizationEntity);
  const tenantRepo = dataSource.getRepository(TenantEntity);
  const workspaceRepo = dataSource.getRepository(WorkspaceEntity);
  const regionRepo = dataSource.getRepository(RegionEntity);

  // 1. CREATE DEFAULT REGION
  let region = await regionRepo.findOneBy({ code: 'APS3' });
  if (!region) {
    region = regionRepo.create({
      name: 'ap-southeast-3',
      code: 'APS3',
      description: 'Asia Pacific (Jakarta)',
      isActive: true,
    });
    await regionRepo.save(region);
    console.log('   ✓ Created default region');
  }

  // 2. CREATE DEFAULT ORGANIZATION
  let organization = await organizationRepo.findOne({ where: { code: 'DEVOPSCORNER' } });
  if (!organization) {
    organization = organizationRepo.create({
      name: 'DevOpsCorner',
      code: 'DEVOPSCORNER',
      description: 'DevOpsCorner organization',
      domain: 'devopscorner.id',
      is_active: true,
      region_id: region.id,
    });
    await organizationRepo.save(organization);
    console.log('   ✓ Created default organization');
  }

  // 3. CREATE DEFAULT WORKSPACE
  let workspace = await workspaceRepo.findOne({ where: { code: 'TELEMETRYFLOW-POC' } });
  if (!workspace) {
    workspace = workspaceRepo.create({
      workspace_id: randomUUID(),
      name: 'TelemetryFlow POC',
      code: 'TELEMETRYFLOW-POC',
      description: 'Default workspace for OTEL collector',
      organization_id: organization.organization_id,
      isActive: true,
    });
    await workspaceRepo.save(workspace);
    console.log('   ✓ Created default workspace');
  }

  // 4. CREATE DEFAULT TENANT
  let tenant = await tenantRepo.findOne({ where: { code: 'DEVOPSCORNER' } });
  if (!tenant) {
    tenant = tenantRepo.create({
      name: 'DevOpsCorner',
      code: 'DEVOPSCORNER',
      domain: 'devopscorner.id',
      workspace_id: workspace.workspace_id,
      isActive: true,
    });
    await tenantRepo.save(tenant);
    console.log('   ✓ Created default tenant');
  }

  // 5. CREATE PERMISSIONS
  const permissionCount = await dataSource.query('SELECT COUNT(*) as count FROM permissions');
  if (parseInt(permissionCount[0].count) === 0) {
    const permissionDefinitions = [
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
      { name: 'platform:manage', description: 'Manage platform', resource: 'platform', action: 'manage' },
    ];

    for (const permDef of permissionDefinitions) {
      const permission = permissionRepo.create({
        id: randomUUID(),
        ...permDef,
      });
      await permissionRepo.save(permission);
    }
    console.log(`   ✓ Created ${permissionDefinitions.length} permissions`);
  }

  // 6. CREATE ROLES (5-Tier RBAC)
  const roleCount = await dataSource.query('SELECT COUNT(*) as count FROM roles');
  if (parseInt(roleCount[0].count) === 0) {
    const roleDefinitions = [
      { name: 'Super Administrator', description: 'Platform management across all organizations' },
      { name: 'Administrator', description: 'Full CRUD within organization' },
      { name: 'Developer', description: 'Create/Read/Update (no delete)' },
      { name: 'Viewer', description: 'Read-only access' },
      { name: 'Demo', description: 'Demo access in demo organization' },
    ];

    for (const roleDef of roleDefinitions) {
      const role = roleRepo.create({
        id: randomUUID(),
        ...roleDef,
      });
      await roleRepo.save(role);
    }
    console.log(`   ✓ Created ${roleDefinitions.length} roles (5-Tier RBAC)`);
  }

  console.log('   ✅ IAM roles and permissions seeded successfully');
}
