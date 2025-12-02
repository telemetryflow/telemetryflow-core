import { Role } from '../domain/aggregates/Role';
import { RoleId } from '../domain/value-objects/RoleId';
import { PermissionId } from '../domain/value-objects/PermissionId';
import { TenantId } from '../domain/value-objects/TenantId';

describe('Role Aggregate', () => {
  describe('create', () => {
    it('should create a role with valid data', () => {
      const role = Role.create('Admin', 'Administrator role', [], null);

      expect(role.getName()).toBe('Admin');
      expect(role.getDescription()).toBe('Administrator role');
      expect(role.getPermissions()).toHaveLength(0);
      expect(role.getIsSystem()).toBe(false);
    });

    it('should create a system role', () => {
      const role = Role.create('SuperAdministrator', 'Root role', []);

      expect(role.getIsSystem()).toBe(false);
    });

    it('should create a tenant-scoped role', () => {
      const tenantId = TenantId.create();
      const role = Role.create('TenantAdmin', 'Tenant admin', [], tenantId);

      expect(role.getTenantId()).toEqual(tenantId);
    });
  });

  describe('addPermission', () => {
    it('should assign permission to role', () => {
      const role = Role.create('Admin', 'Admin role', [], null);
      const permissionId = PermissionId.create();

      role.addPermission(permissionId);

      expect(role.getPermissions()).toContain(permissionId);
    });

    it('should not duplicate permissions', () => {
      const role = Role.create('Admin', 'Admin role', [], null);
      const permissionId = PermissionId.create();

      role.addPermission(permissionId);
      role.addPermission(permissionId);

      expect(role.getPermissions()).toHaveLength(1);
    });
  });

  describe('removePermission', () => {
    it('should remove permission from role', () => {
      const permissionId = PermissionId.create();
      const role = Role.create('Admin', 'Admin role', [permissionId], null);

      role.removePermission(permissionId);

      expect(role.getPermissions()).not.toContain(permissionId);
    });
  });

  describe('update', () => {
    it('should update role name and description', () => {
      const role = Role.create('Admin', 'Old description', [], null);
      
      role.update('SuperAdmin', 'New description');
      
      expect(role.getName()).toBe('SuperAdmin');
      expect(role.getDescription()).toBe('New description');
    });
  });
});
