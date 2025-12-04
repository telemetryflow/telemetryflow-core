import { RolePermissionEntity } from '../infrastructure/persistence/entities/RolePermission.entity';

describe('RolePermissionEntity', () => {
  describe('creation', () => {
    it('should create a role permission entity', () => {
      const rolePermission = new RolePermissionEntity();
      rolePermission.role_id = 'role-123';
      rolePermission.permission_id = 'permission-123';

      expect(rolePermission.role_id).toBe('role-123');
      expect(rolePermission.permission_id).toBe('permission-123');
    });

    it('should have correct property types', () => {
      const rolePermission = new RolePermissionEntity();
      rolePermission.role_id = 'role-123';
      rolePermission.permission_id = 'permission-123';

      expect(typeof rolePermission.role_id).toBe('string');
      expect(typeof rolePermission.permission_id).toBe('string');
    });
  });

  describe('relationships', () => {
    it('should allow setting role and permission ids', () => {
      const rolePermission = new RolePermissionEntity();
      const roleId = 'test-role-id';
      const permissionId = 'test-permission-id';

      rolePermission.role_id = roleId;
      rolePermission.permission_id = permissionId;

      expect(rolePermission.role_id).toBe(roleId);
      expect(rolePermission.permission_id).toBe(permissionId);
    });
  });
});
