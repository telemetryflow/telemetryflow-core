import { Role } from '../domain/aggregates/Role';
import { PermissionId } from '../domain/value-objects/PermissionId';

describe('Role Aggregate', () => {
  describe('create', () => {
    it('should create a role with valid data', () => {
      const role = Role.create('Admin', 'Administrator role', [], null);

      expect(role).toBeDefined();
      expect(role.getName()).toBe('Admin');
      expect(role.getDescription()).toBe('Administrator role');
    });

    it('should create a role with permissions', () => {
      const permissionId = PermissionId.create();
      const role = Role.create('Admin', 'Admin role', [permissionId], null);

      expect(role.getPermissions()).toContain(permissionId);
    });
  });

  describe('addPermission', () => {
    it('should add permission to role', () => {
      const role = Role.create('Admin', 'Admin role', [], null);
      const permissionId = PermissionId.create();

      role.addPermission(permissionId);

      expect(role.getPermissions()).toContain(permissionId);
    });

    it('should throw error when adding duplicate permission', () => {
      const role = Role.create('Admin', 'Admin role', [], null);
      const permissionId = PermissionId.create();

      role.addPermission(permissionId);

      expect(() => role.addPermission(permissionId)).toThrow('Permission already assigned to role');
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
