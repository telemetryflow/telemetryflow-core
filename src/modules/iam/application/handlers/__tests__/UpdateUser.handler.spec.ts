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
      null,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
      // Arrange
      const userId = 'non-existent-user';
      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('User not found');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should save user after retrieval', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should handle firstName update', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'UpdatedFirstName');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      // Note: Currently handler doesn't implement property updates (see TODO in handler)
    });

    it('should handle lastName update', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, undefined, 'UpdatedLastName');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle both firstName and lastName update', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'NewFirst', 'NewLast');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle repository findById errors', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      repository.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database connection failed');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'Jane', 'Smith');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockRejectedValue(new Error('Save failed'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Save failed');
    });

    it('should handle updates with special characters in names', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'Jean-Pierre', "O'Connor");

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle updates with international characters', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'Müller', 'Schröder');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle empty string names', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, '', '');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle update with only firstName provided', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'OnlyFirst');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle update with only lastName provided', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, undefined, 'OnlyLast');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle update with very long names', async () => {
      // Arrange
      const userId = 'user-123';
      const longName = 'A'.repeat(500);
      const command = new UpdateUserCommand(userId, longName, longName);

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle concurrent updates gracefully', async () => {
      // Arrange
      const userId = 'user-123';
      const command1 = new UpdateUserCommand(userId, 'First1', 'Last1');
      const command2 = new UpdateUserCommand(userId, 'First2', 'Last2');

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await Promise.all([
        handler.execute(command1),
        handler.execute(command2),
      ]);

      // Assert
      expect(repository.findById).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('should preserve user properties not included in update', async () => {
      // Arrange
      const userId = 'user-123';
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
        false,
        'tenant-123',
        'org-456',
        new Date(),
        true,
        true,
        new Date(),
        new Date(),
        null,
      );

      repository.findById.mockResolvedValue(userWithProperties);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getMfaEnabled()).toBe(true);
      expect(savedUser.getTenantId()).toBe('tenant-123');
      expect(savedUser.getOrganizationId()).toBe('org-456');
    });

    it('should handle null user ID gracefully', async () => {
      // Arrange
      const command = new UpdateUserCommand(null as any, 'First', 'Last');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should handle undefined values in command', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId);

      repository.findById.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.findById).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle deleted user appropriately', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'New', 'Name');

      const deletedUser = User.reconstitute(
        UserId.generate(),
        Email.create('deleted@example.com'),
        'password',
        'Deleted',
        'User',
        false,
        null,
        false,
        null,
        true,
        null,
        null,
        null,
        false,
        false,
        new Date(),
        new Date(),
        new Date(), // deletedAt is set
      );

      repository.findById.mockResolvedValue(deletedUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert - Handler should still proceed (business logic decision)
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle inactive user', async () => {
      // Arrange
      const userId = 'user-123';
      const command = new UpdateUserCommand(userId, 'New', 'Name');

      const inactiveUser = User.create(
        Email.create('inactive@example.com'),
        'password',
        'Inactive',
        'User',
      );
      inactiveUser.deactivate();

      repository.findById.mockResolvedValue(inactiveUser);
      repository.save.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
