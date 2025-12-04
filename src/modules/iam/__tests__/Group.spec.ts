import { Group } from '../domain/aggregates/Group';
import { UserId } from '../domain/value-objects/UserId';

describe('Group Aggregate', () => {
  describe('create', () => {
    it('should create a group', () => {
      const group = Group.create('Engineering', 'Engineering team', null);
      
      expect(group.getName()).toBe('Engineering');
      expect(group.getDescription()).toBe('Engineering team');
      expect(group.getUserIds()).toHaveLength(0);
    });
  });

  describe('addUser', () => {
    it('should add user to group', () => {
      const group = Group.create('Engineering', 'Team', null);
      const userId = UserId.generate();
      
      group.addUser(userId);
      
      expect(group.hasUser(userId)).toBe(true);
    });

    it('should throw error if user already in group', () => {
      const group = Group.create('Engineering', 'Team', null);
      const userId = UserId.generate();
      
      group.addUser(userId);
      
      expect(() => group.addUser(userId)).toThrow('User already in group');
    });
  });

  describe('removeUser', () => {
    it('should remove user from group', () => {
      const group = Group.create('Engineering', 'Team', null);
      const userId = UserId.generate();
      
      group.addUser(userId);
      group.removeUser(userId);
      
      expect(group.hasUser(userId)).toBe(false);
    });
  });
});
