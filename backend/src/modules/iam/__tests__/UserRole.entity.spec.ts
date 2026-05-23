import { UserRoleEntity } from '../infrastructure/persistence/entities/UserRole.entity';

describe('UserRoleEntity', () => {
  describe('creation', () => {
    it('should create a user role entity', () => {
      const userRole = new UserRoleEntity();
      userRole.user_id = 'user-123';
      userRole.role_id = 'role-123';

      expect(userRole.user_id).toBe('user-123');
      expect(userRole.role_id).toBe('role-123');
    });

    it('should have correct property types', () => {
      const userRole = new UserRoleEntity();
      userRole.user_id = 'user-123';
      userRole.role_id = 'role-123';

      expect(typeof userRole.user_id).toBe('string');
      expect(typeof userRole.role_id).toBe('string');
    });
  });

  describe('relationships', () => {
    it('should allow setting user and role ids', () => {
      const userRole = new UserRoleEntity();
      const userId = 'test-user-id';
      const roleId = 'test-role-id';

      userRole.user_id = userId;
      userRole.role_id = roleId;

      expect(userRole.user_id).toBe(userId);
      expect(userRole.role_id).toBe(roleId);
    });
  });
});
