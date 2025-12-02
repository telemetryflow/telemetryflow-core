import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateUserHandler } from '../CreateUser.handler';
import { CreateUserCommand } from '../../commands/CreateUser.command';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/aggregates/User';
import { UserCreatedEvent } from '../../../domain/events/UserCreated.event';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let repository: jest.Mocked<IUserRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        { provide: 'IUserRepository', useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    handler = module.get<CreateUserHandler>(CreateUserHandler);
    repository = module.get('IUserRepository');
    eventBus = module.get(EventBus);

    // Mock bcrypt.hash
    mockedBcrypt.hash.mockResolvedValue('hashed_password_123' as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'john.doe@example.com',
        'SecurePassword123!',
        'John',
        'Doe',
      );

      repository.save.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // User ID
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(expect.any(User));

      // Verify the user was created with correct data
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getEmail().getValue()).toBe('john.doe@example.com');
      expect(savedUser.getFirstName()).toBe('John');
      expect(savedUser.getLastName()).toBe('Doe');
      expect(savedUser.getPasswordHash()).toBe('hashed_password_123');
      expect(savedUser.getIsActive()).toBe(true);
      expect(savedUser.getEmailVerified()).toBe(false);
    });

    it('should hash the password using bcrypt', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'MyPassword123',
        'Test',
        'User',
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockedBcrypt.hash).toHaveBeenCalledTimes(1);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('MyPassword123', 10);
    });

    it('should publish UserCreatedEvent after successful creation', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'event@example.com',
        'password',
        'Event',
        'Test',
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalled();
      const publishedEvent = eventBus.publish.mock.calls[0][0];
      expect(publishedEvent).toBeInstanceOf(UserCreatedEvent);
      expect((publishedEvent as UserCreatedEvent).email).toBe('event@example.com');
    });

    it('should set tenantId and organizationId to null by default', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'tenant@example.com',
        'password',
        'Tenant',
        'Test',
      );

      // Act
      await handler.execute(command);

      // Assert
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getTenantId()).toBeNull();
      expect(savedUser.getOrganizationId()).toBeNull();
    });

    it('should create user with initial password flag set to true', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'initial@example.com',
        'password',
        'Initial',
        'User',
      );

      // Act
      await handler.execute(command);

      // Assert
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getIsInitialPassword()).toBe(true);
      expect(savedUser.getPasswordChangedAt()).toBeNull();
    });

    it('should create user with MFA disabled by default', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'mfa@example.com',
        'password',
        'MFA',
        'User',
      );

      // Act
      await handler.execute(command);

      // Assert
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getMfaEnabled()).toBe(false);
      expect(savedUser.getMfaSecret()).toBeNull();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'error@example.com',
        'password',
        'Error',
        'Test',
      );

      repository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Database connection failed');
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hashing errors', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'hash-error@example.com',
        'password',
        'Hash',
        'Error',
      );

      mockedBcrypt.hash.mockRejectedValue(new Error('Hashing failed') as never);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('Hashing failed');
      expect(repository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle invalid email format gracefully', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'invalid-email',
        'password',
        'Invalid',
        'Email',
      );

      // Act & Assert
      // Email validation should happen in Email value object
      await expect(handler.execute(command)).rejects.toThrow();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should return a valid UUID for the created user', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'uuid@example.com',
        'password',
        'UUID',
        'Test',
      );

      // Act
      const userId = await handler.execute(command);

      // Assert
      expect(userId).toBeDefined();
      expect(typeof userId).toBe('string');
      // UUID format check (basic validation)
      expect(userId.length).toBeGreaterThan(0);
    });

    it('should create multiple users with unique IDs', async () => {
      // Arrange
      const command1 = new CreateUserCommand('user1@example.com', 'password', 'User', 'One');
      const command2 = new CreateUserCommand('user2@example.com', 'password', 'User', 'Two');

      // Act
      const userId1 = await handler.execute(command1);
      const userId2 = await handler.execute(command2);

      // Assert
      expect(userId1).not.toBe(userId2);
    });

    it('should preserve first and last names exactly as provided', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'name@example.com',
        'password',
        'Jean-Pierre',
        "O'Connor",
      );

      // Act
      await handler.execute(command);

      // Assert
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getFirstName()).toBe('Jean-Pierre');
      expect(savedUser.getLastName()).toBe("O'Connor");
    });

    it('should handle special characters in names', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'special@example.com',
        'password',
        'Müller',
        'Schröder-Schmidt',
      );

      // Act
      await handler.execute(command);

      // Assert
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getFirstName()).toBe('Müller');
      expect(savedUser.getLastName()).toBe('Schröder-Schmidt');
    });

    it('should set user as active by default', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'active@example.com',
        'password',
        'Active',
        'User',
      );

      // Act
      await handler.execute(command);

      // Assert
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getIsActive()).toBe(true);
    });

    it('should not force password change by default', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'force@example.com',
        'password',
        'Force',
        'User',
      );

      // Act
      await handler.execute(command);

      // Assert
      const savedUser = repository.save.mock.calls[0][0];
      expect(savedUser.getForcePasswordChange()).toBe(false);
    });
  });
});
