import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository('roles');
  const permissionRepo = dataSource.getRepository('permissions');

  // Define system roles
  const systemRoles = [
    {
      id: uuidv4(),
      name: 'super_administrator',
      description: 'Can manage all the SaaS Platform across all organizations and regions',
      isSystem: true,
      tenantId: null,
      permissions: [
        'platform:manage',
        'organization:create', 'organization:read', 'organization:update', 'organization:delete',
        'user:create', 'user:read', 'user:update', 'user:delete',
        'role:create', 'role:read', 'role:update', 'role:delete',
        'permission:read',
        'tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete',
        'workspace:create', 'workspace:read', 'workspace:update', 'workspace:delete',
        'region:read',
        'metrics:read', 'metrics:write', 'metrics:delete', 'metrics:export',
        'logs:read', 'logs:write', 'logs:delete', 'logs:export',
        'traces:read', 'traces:write', 'traces:delete', 'traces:export',
        'dashboard:create', 'dashboard:read', 'dashboard:update', 'dashboard:delete', 'dashboard:share',
        'alert:create', 'alert:read', 'alert:update', 'alert:delete', 'alert:acknowledge',
        'alert-rule-group:create', 'alert-rule-group:read', 'alert-rule-group:update', 'alert-rule-group:delete',
        'monitor:create', 'monitor:read', 'monitor:update', 'monitor:delete',
        'agent:create', 'agent:read', 'agent:update', 'agent:register',
        'uptime:create', 'uptime:read', 'uptime:update', 'uptime:check',
        'audit:read', 'audit:export',
        'system:admin', 'system:config',
      ],
    },
    {
      id: uuidv4(),
      name: 'administrator',
      description: 'Can manage all permissions within their organization across multiple regions',
      isSystem: true,
      tenantId: null,
      permissions: [
        'organization:read', 'organization:update',
        'user:create', 'user:read', 'user:update', 'user:delete',
        'role:create', 'role:read', 'role:update', 'role:delete',
        'permission:read',
        'tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete',
        'workspace:create', 'workspace:read', 'workspace:update', 'workspace:delete',
        'region:read',
        'metrics:read', 'metrics:write', 'metrics:delete', 'metrics:export',
        'logs:read', 'logs:write', 'logs:delete', 'logs:export',
        'traces:read', 'traces:write', 'traces:delete', 'traces:export',
        'dashboard:create', 'dashboard:read', 'dashboard:update', 'dashboard:delete', 'dashboard:share',
        'alert:create', 'alert:read', 'alert:update', 'alert:delete', 'alert:acknowledge',
        'alert-rule-group:create', 'alert-rule-group:read', 'alert-rule-group:update', 'alert-rule-group:delete',
        'monitor:create', 'monitor:read', 'monitor:update', 'monitor:delete',
        'agent:create', 'agent:read', 'agent:update', 'agent:register',
        'uptime:create', 'uptime:read', 'uptime:update', 'uptime:check',
        'audit:read', 'audit:export',
      ],
    },
    {
      id: uuidv4(),
      name: 'developer',
      description: 'Can create and update resources within their organization, but cannot delete',
      isSystem: true,
      tenantId: null,
      permissions: [
        'organization:read',
        'user:create',
        'user:read',
        'user:update',
        'role:read',
        'permission:read',
        'tenant:create',
        'tenant:read',
        'tenant:update',
        'workspace:create',
        'workspace:read',
        'workspace:update',
        'region:read',
        'metrics:read',
        'metrics:write',
        'logs:read',
        'logs:write',
        'traces:read',
        'traces:write',
        'dashboard:create',
        'dashboard:read',
        'dashboard:update',
        'alert:create',
        'alert:read',
        'alert:update',
        'alert-rule-group:create',
        'alert-rule-group:read',
        'alert-rule-group:update',
        'agent:create',
        'agent:read',
        'agent:update',
        'agent:register',
        'uptime:create',
        'uptime:read',
        'uptime:update',
        'uptime:check',
        'audit:read',
      ],
    },
    {
      id: uuidv4(),
      name: 'viewer',
      description: 'Read-only access to resources within their organization',
      isSystem: true,
      tenantId: null,
      permissions: [
        'organization:read',
        'user:read',
        'role:read',
        'permission:read',
        'tenant:read',
        'workspace:read',
        'region:read',
        'metrics:read',
        'logs:read',
        'traces:read',
        'dashboard:read',
        'alert:read',
        'alert-rule-group:read',
        'agent:read',
        'uptime:read',
        'uptime:check',
        'audit:read',
      ],
    },
    {
      id: uuidv4(),
      name: 'demo',
      description: 'Developer access limited to Demo Organization, Demo Workspace, and Demo Tenant only',
      isSystem: true,
      tenantId: null,
      permissions: [
        'organization:read',
        'user:create',
        'user:read',
        'user:update',
        'role:read',
        'permission:read',
        'tenant:create',
        'tenant:read',
        'tenant:update',
        'workspace:create',
        'workspace:read',
        'workspace:update',
        'region:read',
        'metrics:read',
        'metrics:write',
        'logs:read',
        'logs:write',
        'traces:read',
        'traces:write',
        'dashboard:create',
        'dashboard:read',
        'dashboard:update',
        'alert:create',
        'alert:read',
        'alert:update',
        'alert-rule-group:create',
        'alert-rule-group:read',
        'alert-rule-group:update',
        'agent:create',
        'agent:read',
        'agent:update',
        'agent:register',
        'uptime:create',
        'uptime:read',
        'uptime:update',
        'uptime:check',
        'audit:read',
      ],
    },
  ];

  console.log('[IAM] Seeding system roles...');

  for (const roleData of systemRoles) {
    // Check if role exists
    const existingRole = await roleRepo.findOne({
      where: { name: roleData.name },
    });

    if (existingRole) {
      console.log(`[IAM] Role ${roleData.name} already exists, skipping...`);
      continue;
    }

    // Create permissions if they don't exist
    const permissionEntities = [];
    for (const permName of roleData.permissions) {
      let permission = await permissionRepo.findOne({
        where: { name: permName },
      });

      if (!permission) {
        const [resource, action] = permName.split(':');
        permission = await permissionRepo.save({
          id: uuidv4(),
          name: permName,
          description: `${action} permission for ${resource}`,
          resource,
          action,
        });
      }

      permissionEntities.push(permission);
    }

    // Create role with permissions
    const role = roleRepo.create({
      id: roleData.id,
      name: roleData.name,
      description: roleData.description,
      isSystem: roleData.isSystem,
      tenantId: roleData.tenantId,
    });

    await roleRepo.save(role);

    // Assign permissions to role
    if (permissionEntities.length > 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into('role_permissions')
        .values(
          permissionEntities.map(p => ({
            role_id: role.id,
            permission_id: p.id,
          })),
        )
        .execute();
    }

    console.log(`[IAM] ✓ Created role: ${roleData.name} with ${permissionEntities.length} permissions`);
  }

  console.log('[IAM] ✓ System roles seeding completed');
}
