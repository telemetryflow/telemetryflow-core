import { Test, TestingModule } from '@nestjs/testing';
import { GetUserHandler } from '../GetUser.handler';
import { GetUserQuery } from '../../queries/GetUser.query';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/aggregates/User';
import { UserId } from '../../../domain/value-objects/UserId';
import { Email } from '../../../domain/value-objects/Email';
import { UserResponseDto } from '../../dto/UserResponse.dto';

describe('GetUserHandler', () => {
  let handler: GetUserHandler;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserHandler,
        { provide: 'IUserRepository', useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<GetUserHandler>(GetUserHandler);
    repository = module.get('IUserRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user data when user exists', async () => {
      // Arrange
      const userId = UserId.generate();
      const user = User.create(
        Email.create('john.doe@example.com'),
        'hashed_password',
        'John',
        'Doe',
        null,
        null,
      );

      const query = new GetUserQuery(userId.getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(user.getId().getValue());
      expect(result.email).toBe('john.doe@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.mfaEnabled).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.emailVerified).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const query = new GetUserQuery('non-existent-user-id');
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow('User not found');
    });

    it('should call repository with correct UserId', async () => {
      // Arrange
      const userId = 'test-user-123';
      const query = new GetUserQuery(userId);

      const user = User.create(
        Email.create('test@example.com'),
        'password',
        'Test',
        'User',
      );
      repository.findById.mockResolvedValue(user);

      // Act
      await handler.execute(query);

      // Assert
      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledWith(expect.any(UserId));
    });

    it('should return UserResponseDto with all required fields', async () => {
      // Arrange
      const user = User.reconstitute(
        UserId.generate(),
        Email.create('complete@example.com'),
        'hashed_password',
        'Complete',
        'User',
        true, // mfaEnabled
        'mfa_secret',
        false,
        new Date('2024-01-15'),
        false,
        'tenant-123',
        'org-456',
        new Date('2024-01-20'),
        true,
        true,
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        null,
      );

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result: UserResponseDto = await handler.execute(query);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('lastName');
      expect(result).toHaveProperty('mfaEnabled');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('emailVerified');
      expect(result).toHaveProperty('createdAt');
    });

    it('should correctly map MFA status', async () => {
      // Arrange
      const user = User.create(
        Email.create('mfa@example.com'),
        'password',
        'MFA',
        'User',
      );
      user.enableMFA('secret_123');

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.mfaEnabled).toBe(true);
    });

    it('should correctly map active status', async () => {
      // Arrange
      const user = User.create(
        Email.create('active@example.com'),
        'password',
        'Active',
        'User',
      );

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.isActive).toBe(true);
    });

    it('should correctly map inactive status', async () => {
      // Arrange
      const user = User.create(
        Email.create('inactive@example.com'),
        'password',
        'Inactive',
        'User',
      );
      user.deactivate();

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.isActive).toBe(false);
    });

    it('should correctly map email verification status', async () => {
      // Arrange
      const user = User.create(
        Email.create('verified@example.com'),
        'password',
        'Verified',
        'User',
      );
      user.verifyEmail();

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.emailVerified).toBe(true);
    });

    it('should handle special characters in names', async () => {
      // Arrange
      const user = User.create(
        Email.create('special@example.com'),
        'password',
        'Jean-Pierre',
        "O'Connor",
      );

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.firstName).toBe('Jean-Pierre');
      expect(result.lastName).toBe("O'Connor");
    });

    it('should handle international characters in names', async () => {
      // Arrange
      const user = User.create(
        Email.create('intl@example.com'),
        'password',
        'Müller',
        'Schröder',
      );

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.firstName).toBe('Müller');
      expect(result.lastName).toBe('Schröder');
    });

    it('should set avatar to null in response', async () => {
      // Arrange
      const user = User.create(
        Email.create('avatar@example.com'),
        'password',
        'Avatar',
        'User',
      );

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.avatar).toBeNull();
    });

    it('should return createdAt timestamp', async () => {
      // Arrange
      const createdDate = new Date('2024-01-01T10:00:00Z');
      const user = User.reconstitute(
        UserId.generate(),
        Email.create('timestamp@example.com'),
        'password',
        'Time',
        'User',
        false,
        null,
        false,
        null,
        true,
        null,
        null,
        null,
        true,
        false,
        createdDate,
        new Date(),
        null,
      );

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.createdAt).toEqual(createdDate);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new GetUserQuery('error-user-id');
      repository.findById.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid user ID format', async () => {
      // Arrange
      const query = new GetUserQuery('invalid-uuid-format');

      // Act & Assert
      // UserId.fromString should handle validation
      await expect(handler.execute(query)).rejects.toThrow();
    });

    it('should not expose sensitive information', async () => {
      // Arrange
      const user = User.reconstitute(
        UserId.generate(),
        Email.create('sensitive@example.com'),
        'hashed_password_should_not_be_exposed',
        'Sensitive',
        'User',
        true,
        'mfa_secret_should_not_be_exposed',
        true,
        new Date(),
        false,
        'tenant-123',
        'org-456',
        new Date(),
        true,
        false,
        new Date(),
        new Date(),
        null,
      );

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('mfaSecret');
      expect(result).not.toHaveProperty('forcePasswordChange');
      expect(result).not.toHaveProperty('isInitialPassword');
      expect(result).not.toHaveProperty('passwordChangedAt');
    });

    it('should handle deleted user appropriately', async () => {
      // Arrange
      const user = User.reconstitute(
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

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      // Handler returns the user even if deleted (business decision)
      expect(result).toBeDefined();
      expect(result.email).toBe('deleted@example.com');
    });

    it('should handle concurrent requests for same user', async () => {
      // Arrange
      const userId = UserId.generate().getValue();
      const user = User.create(
        Email.create('concurrent@example.com'),
        'password',
        'Concurrent',
        'User',
      );

      repository.findById.mockResolvedValue(user);

      const query1 = new GetUserQuery(userId);
      const query2 = new GetUserQuery(userId);

      // Act
      const [result1, result2] = await Promise.all([
        handler.execute(query1),
        handler.execute(query2),
      ]);

      // Assert
      expect(result1).toEqual(result2);
      expect(repository.findById).toHaveBeenCalledTimes(2);
    });

    it('should handle users with minimum required data', async () => {
      // Arrange
      const user = User.create(
        Email.create('minimal@example.com'),
        'password',
        'Min',
        'User',
      );

      const query = new GetUserQuery(user.getId().getValue());
      repository.findById.mockResolvedValue(user);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('minimal@example.com');
      expect(result.firstName).toBe('Min');
      expect(result.lastName).toBe('User');
    });
  });
});
