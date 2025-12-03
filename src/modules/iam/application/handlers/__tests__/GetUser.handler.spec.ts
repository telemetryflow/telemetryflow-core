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
      const query = new GetUserQuery('non-existent-user-id');
      repository.findById.mockResolvedValue(null);
      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow('User not found');
    it('should call repository with correct UserId', async () => {
      const userId = 'test-user-123';
      const query = new GetUserQuery(userId);
        Email.create('test@example.com'),
        'password',
        'Test',
        'User',
      await handler.execute(query);
      expect(repository.findById).toHaveBeenCalledTimes(1);
      expect(repository.findById).toHaveBeenCalledWith(expect.any(UserId));
    it('should return UserResponseDto with all required fields', async () => {
      const user = User.reconstitute(
        UserId.generate(),
        Email.create('complete@example.com'),
        'Complete',
        true, // mfaEnabled
        'mfa_secret',
        false,
        new Date('2024-01-15'),
        'tenant-123',
        'org-456',
        new Date('2024-01-20'),
        true,
        new Date('2024-01-01'),
      const query = new GetUserQuery(user.getId().getValue());
      const result: UserResponseDto = await handler.execute(query);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('lastName');
      expect(result).toHaveProperty('mfaEnabled');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('emailVerified');
      expect(result).toHaveProperty('createdAt');
    it('should correctly map MFA status', async () => {
        Email.create('mfa@example.com'),
        'MFA',
      user.enableMFA('secret_123');
      expect(result.mfaEnabled).toBe(true);
    it('should correctly map active status', async () => {
        Email.create('active@example.com'),
        'Active',
    it('should correctly map inactive status', async () => {
        Email.create('inactive@example.com'),
        'Inactive',
      user.deactivate();
      expect(result.isActive).toBe(false);
    it('should correctly map email verification status', async () => {
        Email.create('verified@example.com'),
        'Verified',
      user.verifyEmail();
      expect(result.emailVerified).toBe(true);
    it('should handle special characters in names', async () => {
        Email.create('special@example.com'),
        'Jean-Pierre',
        "O'Connor",
      expect(result.firstName).toBe('Jean-Pierre');
      expect(result.lastName).toBe("O'Connor");
    it('should handle international characters in names', async () => {
        Email.create('intl@example.com'),
        'Müller',
        'Schröder',
      expect(result.firstName).toBe('Müller');
      expect(result.lastName).toBe('Schröder');
    it('should set avatar to null in response', async () => {
        Email.create('avatar@example.com'),
        'Avatar',
      expect(result.avatar).toBeNull();
    it('should return createdAt timestamp', async () => {
      const createdDate = new Date('2024-01-01T10:00:00Z');
        Email.create('timestamp@example.com'),
        'Time',
        createdDate,
        new Date(),
      expect(result.createdAt).toEqual(createdDate);
    it('should handle repository errors gracefully', async () => {
      const query = new GetUserQuery('error-user-id');
      repository.findById.mockRejectedValue(new Error('Database connection failed'));
      await expect(handler.execute(query)).rejects.toThrow('Database connection failed');
    it('should handle invalid user ID format', async () => {
      const query = new GetUserQuery('invalid-uuid-format');
      // UserId.fromString should handle validation
      await expect(handler.execute(query)).rejects.toThrow();
    it('should not expose sensitive information', async () => {
        Email.create('sensitive@example.com'),
        'hashed_password_should_not_be_exposed',
        'Sensitive',
        'mfa_secret_should_not_be_exposed',
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('mfaSecret');
      expect(result).not.toHaveProperty('forcePasswordChange');
      expect(result).not.toHaveProperty('isInitialPassword');
      expect(result).not.toHaveProperty('passwordChangedAt');
    it('should handle deleted user appropriately', async () => {
        Email.create('deleted@example.com'),
        'Deleted',
        new Date(), // deletedAt is set
      // Handler returns the user even if deleted (business decision)
      expect(result.email).toBe('deleted@example.com');
    it('should handle concurrent requests for same user', async () => {
      const userId = UserId.generate().getValue();
        Email.create('concurrent@example.com'),
        'Concurrent',
      const query1 = new GetUserQuery(userId);
      const query2 = new GetUserQuery(userId);
      const [result1, result2] = await Promise.all([
        handler.execute(query1),
        handler.execute(query2),
      ]);
      expect(result1).toEqual(result2);
      expect(repository.findById).toHaveBeenCalledTimes(2);
    it('should handle users with minimum required data', async () => {
        Email.create('minimal@example.com'),
        'Min',
      expect(result.email).toBe('minimal@example.com');
      expect(result.firstName).toBe('Min');
      expect(result.lastName).toBe('User');
});
