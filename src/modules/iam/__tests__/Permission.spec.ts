import { Permission } from '../domain/aggregates/Permission';
import { PermissionId } from '../domain/value-objects/PermissionId';

describe('Permission Aggregate', () => {
  describe('create', () => {
    it('should create a permission with valid data', () => {
      const permission = Permission.create('user:read', 'Read user data', 'user', 'read');
      
      expect(permission.getName()).toBe('user:read');
      expect(permission.getDescription()).toBe('Read user data');
      expect(permission.getResource()).toBe('user');
      expect(permission.getAction()).toBe('read');
    });
  });

  describe('update', () => {
    it('should update permission fields', () => {
      const permission = Permission.create('user:read', 'Old description', 'user', 'read');
      
      permission.update('user:write', 'New description', 'user', 'write');
      
      expect(permission.getName()).toBe('user:write');
      expect(permission.getDescription()).toBe('New description');
      expect(permission.getAction()).toBe('write');
    });
  });

  describe('delete', () => {
    it('should soft delete permission', () => {
      const permission = Permission.create('user:read', 'Read user data', 'user', 'read');
      
      permission.delete();
      
      expect(permission.isDeleted()).toBe(true);
      expect(permission.getDeletedAt()).not.toBeNull();
    });
  });
});
