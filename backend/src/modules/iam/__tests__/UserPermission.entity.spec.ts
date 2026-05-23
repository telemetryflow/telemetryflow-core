import { UserPermissionEntity } from '../infrastructure/persistence/entities/UserPermission.entity';

describe('UserPermissionEntity', () => {
  describe('creation', () => {
    it('should create a user permission entity', () => {
      const userPermission = new UserPermissionEntity();
      userPermission.user_id = 'user-123';
      userPermission.permission_id = 'permission-123';

      expect(userPermission.user_id).toBe('user-123');
      expect(userPermission.permission_id).toBe('permission-123');
    });

    it('should have correct property types', () => {
      const userPermission = new UserPermissionEntity();
      userPermission.user_id = 'user-123';
      userPermission.permission_id = 'permission-123';

      expect(typeof userPermission.user_id).toBe('string');
      expect(typeof userPermission.permission_id).toBe('string');
    });
  });

  describe('relationships', () => {
    it('should allow setting user and permission ids', () => {
      const userPermission = new UserPermissionEntity();
      const userId = 'test-user-id';
      const permissionId = 'test-permission-id';

      userPermission.user_id = userId;
      userPermission.permission_id = permissionId;

      expect(userPermission.user_id).toBe(userId);
      expect(userPermission.permission_id).toBe(permissionId);
    });
  });
});
