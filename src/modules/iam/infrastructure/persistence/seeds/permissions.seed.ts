import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

export async function seedPermissions(dataSource: DataSource): Promise<void> {
  const permissionRepository = dataSource.getRepository('permissions');

  const permissions = [
    // Platform (1)
    { name: 'platform:manage', description: 'Manage platform', resource: 'platform', action: 'manage' },

    // IAM (13)
    { name: 'user:create', description: 'Create users', resource: 'user', action: 'create' },
    { name: 'user:read', description: 'Read users', resource: 'user', action: 'read' },
    { name: 'user:update', description: 'Update users', resource: 'user', action: 'update' },
    { name: 'user:delete', description: 'Delete users', resource: 'user', action: 'delete' },
    { name: 'role:create', description: 'Create roles', resource: 'role', action: 'create' },
    { name: 'role:read', description: 'Read roles', resource: 'role', action: 'read' },
    { name: 'role:update', description: 'Update roles', resource: 'role', action: 'update' },
    { name: 'role:delete', description: 'Delete roles', resource: 'role', action: 'delete' },
    { name: 'permission:read', description: 'Read permissions', resource: 'permission', action: 'read' },
    { name: 'organization:create', description: 'Create organizations', resource: 'organization', action: 'create' },
    { name: 'organization:read', description: 'Read organizations', resource: 'organization', action: 'read' },
    { name: 'organization:update', description: 'Update organizations', resource: 'organization', action: 'update' },
    { name: 'organization:delete', description: 'Delete organizations', resource: 'organization', action: 'delete' },
    { name: 'tenant:create', description: 'Create tenants', resource: 'tenant', action: 'create' },
    { name: 'tenant:read', description: 'Read tenants', resource: 'tenant', action: 'read' },
    { name: 'tenant:update', description: 'Update tenants', resource: 'tenant', action: 'update' },
    { name: 'tenant:delete', description: 'Delete tenants', resource: 'tenant', action: 'delete' },
    { name: 'workspace:create', description: 'Create workspaces', resource: 'workspace', action: 'create' },
    { name: 'workspace:read', description: 'Read workspaces', resource: 'workspace', action: 'read' },
    { name: 'workspace:update', description: 'Update workspaces', resource: 'workspace', action: 'update' },
    { name: 'workspace:delete', description: 'Delete workspaces', resource: 'workspace', action: 'delete' },
    { name: 'region:read', description: 'Read regions', resource: 'region', action: 'read' },

    // Metrics (4)
    { name: 'metrics:read', description: 'Read metrics', resource: 'metrics', action: 'read' },
    { name: 'metrics:write', description: 'Write metrics', resource: 'metrics', action: 'write' },
    { name: 'metrics:delete', description: 'Delete metrics', resource: 'metrics', action: 'delete' },
    { name: 'metrics:export', description: 'Export metrics', resource: 'metrics', action: 'export' },

    // Logs (4)
    { name: 'logs:read', description: 'Read logs', resource: 'logs', action: 'read' },
    { name: 'logs:write', description: 'Write logs', resource: 'logs', action: 'write' },
    { name: 'logs:delete', description: 'Delete logs', resource: 'logs', action: 'delete' },
    { name: 'logs:export', description: 'Export logs', resource: 'logs', action: 'export' },

    // Traces (4)
    { name: 'traces:read', description: 'Read traces', resource: 'traces', action: 'read' },
    { name: 'traces:write', description: 'Write traces', resource: 'traces', action: 'write' },
    { name: 'traces:delete', description: 'Delete traces', resource: 'traces', action: 'delete' },
    { name: 'traces:export', description: 'Export traces', resource: 'traces', action: 'export' },

    // Dashboard (5)
    { name: 'dashboard:create', description: 'Create dashboards', resource: 'dashboard', action: 'create' },
    { name: 'dashboard:read', description: 'Read dashboards', resource: 'dashboard', action: 'read' },
    { name: 'dashboard:update', description: 'Update dashboards', resource: 'dashboard', action: 'update' },
    { name: 'dashboard:delete', description: 'Delete dashboards', resource: 'dashboard', action: 'delete' },
    { name: 'dashboard:share', description: 'Share dashboards', resource: 'dashboard', action: 'share' },

    // Alert (5)
    { name: 'alert:create', description: 'Create alerts', resource: 'alert', action: 'create' },
    { name: 'alert:read', description: 'Read alerts', resource: 'alert', action: 'read' },
    { name: 'alert:update', description: 'Update alerts', resource: 'alert', action: 'update' },
    { name: 'alert:delete', description: 'Delete alerts', resource: 'alert', action: 'delete' },
    { name: 'alert:acknowledge', description: 'Acknowledge alerts', resource: 'alert', action: 'acknowledge' },
    { name: 'alert-rule-group:create', description: 'Create alert rule groups', resource: 'alert-rule-group', action: 'create' },
    { name: 'alert-rule-group:read', description: 'Read alert rule groups', resource: 'alert-rule-group', action: 'read' },
    { name: 'alert-rule-group:update', description: 'Update alert rule groups', resource: 'alert-rule-group', action: 'update' },
    { name: 'alert-rule-group:delete', description: 'Delete alert rule groups', resource: 'alert-rule-group', action: 'delete' },

    // Monitor (4)
    { name: 'monitor:create', description: 'Create monitors', resource: 'monitor', action: 'create' },
    { name: 'monitor:read', description: 'Read monitors', resource: 'monitor', action: 'read' },
    { name: 'monitor:update', description: 'Update monitors', resource: 'monitor', action: 'update' },
    { name: 'monitor:delete', description: 'Delete monitors', resource: 'monitor', action: 'delete' },

    // Agent (4)
    { name: 'agent:create', description: 'Create agents', resource: 'agent', action: 'create' },
    { name: 'agent:read', description: 'Read agents', resource: 'agent', action: 'read' },
    { name: 'agent:update', description: 'Update agents', resource: 'agent', action: 'update' },
    { name: 'agent:register', description: 'Register agents', resource: 'agent', action: 'register' },

    // Uptime (4)
    { name: 'uptime:create', description: 'Create uptime checks', resource: 'uptime', action: 'create' },
    { name: 'uptime:read', description: 'Read uptime checks', resource: 'uptime', action: 'read' },
    { name: 'uptime:update', description: 'Update uptime checks', resource: 'uptime', action: 'update' },
    { name: 'uptime:check', description: 'Execute uptime checks', resource: 'uptime', action: 'check' },

    // Audit (2)
    { name: 'audit:read', description: 'Read audit logs', resource: 'audit', action: 'read' },
    { name: 'audit:export', description: 'Export audit logs', resource: 'audit', action: 'export' },

    // System (2)
    { name: 'system:admin', description: 'System administration', resource: 'system', action: 'admin' },
    { name: 'system:config', description: 'System configuration', resource: 'system', action: 'config' },
  ];

  for (const perm of permissions) {
    const existing = await permissionRepository.findOne({ where: { name: perm.name } });
    if (!existing) {
      await permissionRepository.save({
        id: randomUUID(),
        ...perm,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  console.log(`[IAM] ✓ Seeded ${permissions.length} permissions`);
}
