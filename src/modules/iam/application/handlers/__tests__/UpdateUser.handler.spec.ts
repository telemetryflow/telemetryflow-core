import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserHandler } from '../UpdateUser.handler';
import { UpdateUserCommand } from '../../commands/UpdateUser.command';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/aggregates/User';
import { UserId } from '../../../domain/value-objects/UserId';
import { Email } from '../../../domain/value-objects/Email';

describe('UpdateUserHandler', () => {
  let handler: UpdateUserHandler;
  let repository: jest.Mocked<IUserRepository>;
  let mockUser: User;
  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserHandler,
        { provide: 'IUserRepository', useValue: mockRepository },
      ],
    }).compile();
    handler = module.get<UpdateUserHandler>(UpdateUserHandler);
    repository = module.get('IUserRepository');
    // Create a mock user for testing
    mockUser = User.create(
      Email.create('test@example.com'),
      'hashed_password',
      'John',
      'Doe',
      null,
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  describe('execute', () => {
    it('should find user by ID', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');
      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);
      // Act
      await handler.execute(command);
      // Assert
      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledWith(expect.any(UserId));
    });
    it('should throw error if user not found', async () => {
      const userId = 'non-existent-user';
      repository.findById.mockResolvedValue(null);
      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('User not found');
      expect(repository.save).not.toHaveBeenCalled();
    it('should save user after retrieval', async () => {
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    it('should handle firstName update', async () => {
      const command = new UpdateUserCommand(userId, 'UpdatedFirstName');
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      // Note: Currently handler doesn't implement property updates (see TODO in handler)
    it('should handle lastName update', async () => {
      const command = new UpdateUserCommand(userId, undefined, 'UpdatedLastName');
    it('should handle both firstName and lastName update', async () => {
      const command = new UpdateUserCommand(userId, 'NewFirst', 'NewLast');
    it('should handle repository findById errors', async () => {
      repository.findById.mockRejectedValue(new Error('Database connection failed'));
      await expect(handler.execute(command)).rejects.toThrow('Database connection failed');
    it('should handle repository save errors', async () => {
      repository.save.mockRejectedValue(new Error('Save failed'));
      await expect(handler.execute(command)).rejects.toThrow('Save failed');
    it('should handle updates with special characters in names', async () => {
      const command = new UpdateUserCommand(userId, 'Jean-Pierre', "O'Connor");
    it('should handle updates with international characters', async () => {
      const command = new UpdateUserCommand(userId, 'Müller', 'Schröder');
    it('should handle empty string names', async () => {
      const command = new UpdateUserCommand(userId, '', '');
    it('should handle update with only firstName provided', async () => {
      const command = new UpdateUserCommand(userId, 'OnlyFirst');
    it('should handle update with only lastName provided', async () => {
      const command = new UpdateUserCommand(userId, undefined, 'OnlyLast');
    it('should handle update with very long names', async () => {
      const longName = 'A'.repeat(500);
      const command = new UpdateUserCommand(userId, longName, longName);
    it('should handle concurrent updates gracefully', async () => {
      const command1 = new UpdateUserCommand(userId, 'First1', 'Last1');
      const command2 = new UpdateUserCommand(userId, 'First2', 'Last2');
      await Promise.all([
        handler.execute(command1),
        handler.execute(command2),
      ]);
      expect(repository.findById).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalledTimes(2);
    it('should preserve user properties not included in update', async () => {
      const command = new UpdateUserCommand(userId, 'NewFirst');
      const userWithProperties = User.reconstitute(
        UserId.generate(),
        Email.create('test@example.com'),
        'hashed_password',
        'John',
        'Doe',
        true, // mfaEnabled
        'secret',
        false,
        new Date(),
        'tenant-123',
        'org-456',
        true,
        null,
      );
      repository.findById.mockResolvedValue(userWithProperties);
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getMfaEnabled()).toBe(true);
      expect(savedUser.getTenantId()).toBe('tenant-123');
      expect(savedUser.getOrganizationId()).toBe('org-456');
    it('should handle null user ID gracefully', async () => {
      const command = new UpdateUserCommand(null as any, 'First', 'Last');
      await expect(handler.execute(command)).rejects.toThrow();
    it('should handle undefined values in command', async () => {
      const command = new UpdateUserCommand(userId);
  describe('edge cases', () => {
    it('should handle deleted user appropriately', async () => {
      const command = new UpdateUserCommand(userId, 'New', 'Name');
      const deletedUser = User.reconstitute(
        Email.create('deleted@example.com'),
        'password',
        'Deleted',
        'User',
        new Date(), // deletedAt is set
      repository.findById.mockResolvedValue(deletedUser);
      // Assert - Handler should still proceed (business logic decision)
    it('should handle inactive user', async () => {
      const inactiveUser = User.create(
        Email.create('inactive@example.com'),
        'Inactive',
      inactiveUser.deactivate();
      repository.findById.mockResolvedValue(inactiveUser);
});
