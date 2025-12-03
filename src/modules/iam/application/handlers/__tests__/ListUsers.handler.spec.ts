import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ListUsersHandler } from '../ListUsers.handler';
import { ListUsersQuery } from '../../queries/ListUsers.query';
import { UserEntity } from '../../../infrastructure/persistence/entities/User.entity';
import { UserResponseDto } from '../../dto/UserResponse.dto';

describe('ListUsersHandler', () => {
  let handler: ListUsersHandler;
  let repository: jest.Mocked<Repository<UserEntity>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<UserEntity>>;
  beforeEach(async () => {
    // Mock QueryBuilder
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;
    // Mock Repository
    const mockRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListUsersHandler,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();
    handler = module.get<ListUsersHandler>(ListUsersHandler);
    repository = module.get(getRepositoryToken(UserEntity));
  });
  afterEach(() => {
    jest.clearAllMocks();
  describe('execute', () => {
    it('should return list of users without filters', async () => {
      // Arrange
      const mockUsers: Partial<UserEntity>[] = [
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          avatar: null,
          mfa_enabled: false,
          isActive: true,
          emailVerified: false,
          createdAt: new Date('2024-01-01'),
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          mfa_enabled: true,
          emailVerified: true,
          createdAt: new Date('2024-01-02'),
      ];
      queryBuilder.getMany.mockResolvedValue(mockUsers as UserEntity[]);
      const query = new ListUsersQuery();
      // Act
      const result: UserResponseDto[] = await handler.execute(query);
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[1].email).toBe('user2@example.com');
    });
    it('should filter deleted users by default', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      await handler.execute(query);
      expect(queryBuilder.where).toHaveBeenCalledWith('user.deletedAt IS NULL');
    it('should filter by email when provided', async () => {
      const email = 'specific@example.com';
      const query = new ListUsersQuery(email);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.email = :email', { email });
    it('should not add email filter when email not provided', async () => {
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    it('should return empty array when no users found', async () => {
      const result = await handler.execute(query);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    it('should correctly map user entity to response DTO', async () => {
      const mockUser: Partial<UserEntity> = {
        id: 'user-123',
        email: 'map@example.com',
        firstName: 'Map',
        lastName: 'Test',
        avatar: 'avatar-url',
        mfa_enabled: true,
        isActive: true,
        emailVerified: true,
        createdAt: new Date('2024-01-15'),
      };
      queryBuilder.getMany.mockResolvedValue([mockUser as UserEntity]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        mfaEnabled: true,
        createdAt: mockUser.createdAt,
      });
    it('should handle null avatar correctly', async () => {
        id: 'user-1',
        email: 'noavatar@example.com',
        firstName: 'No',
        lastName: 'Avatar',
        avatar: null,
        mfa_enabled: false,
        emailVerified: false,
        createdAt: new Date(),
      expect(result[0].avatar).toBeNull();
    it('should map mfa_enabled to mfaEnabled', async () => {
          id: 'user-mfa-on',
          email: 'mfa-on@example.com',
          firstName: 'MFA',
          lastName: 'Enabled',
          createdAt: new Date(),
          id: 'user-mfa-off',
          email: 'mfa-off@example.com',
          lastName: 'Disabled',
      expect(result[0].mfaEnabled).toBe(true);
      expect(result[1].mfaEnabled).toBe(false);
    it('should handle large result sets', async () => {
      const mockUsers: Partial<UserEntity>[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        firstName: `First${i}`,
        lastName: `Last${i}`,
      }));
      expect(result).toHaveLength(1000);
      expect(result[0].id).toBe('user-0');
      expect(result[999].id).toBe('user-999');
    it('should preserve user order from database', async () => {
          id: 'user-c',
          email: 'c@example.com',
          firstName: 'C',
          lastName: 'User',
          createdAt: new Date('2024-01-03'),
          id: 'user-a',
          email: 'a@example.com',
          firstName: 'A',
          id: 'user-b',
          email: 'b@example.com',
          firstName: 'B',
      expect(result[0].id).toBe('user-c');
      expect(result[1].id).toBe('user-a');
      expect(result[2].id).toBe('user-b');
    it('should handle users with special characters in names', async () => {
        email: 'special@example.com',
        firstName: "Jean-Pierre O'Connor",
        lastName: 'Müller-Schmidt',
      expect(result[0].firstName).toBe("Jean-Pierre O'Connor");
      expect(result[0].lastName).toBe('Müller-Schmidt');
    it('should handle repository errors gracefully', async () => {
      queryBuilder.getMany.mockRejectedValue(new Error('Database connection failed'));
      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow('Database connection failed');
    it('should handle query builder errors gracefully', async () => {
      const query = new ListUsersQuery('test@example.com');
      queryBuilder.andWhere.mockImplementation(() => {
        throw new Error('Invalid query syntax');
      await expect(handler.execute(query)).rejects.toThrow('Invalid query syntax');
    it('should filter by exact email match', async () => {
      const targetEmail = 'exact@example.com';
          email: 'exact@example.com',
          firstName: 'Exact',
          lastName: 'Match',
      const query = new ListUsersQuery(targetEmail);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.email = :email', { email: targetEmail });
    it('should handle users with different active states', async () => {
          id: 'user-active',
          email: 'active@example.com',
          firstName: 'Active',
          id: 'user-inactive',
          email: 'inactive@example.com',
          firstName: 'Inactive',
          isActive: false,
      expect(result[0].isActive).toBe(true);
      expect(result[1].isActive).toBe(false);
    it('should handle users with different email verification states', async () => {
          id: 'user-verified',
          email: 'verified@example.com',
          firstName: 'Verified',
          id: 'user-unverified',
          email: 'unverified@example.com',
          firstName: 'Unverified',
      expect(result[0].emailVerified).toBe(true);
      expect(result[1].emailVerified).toBe(false);
    it('should create query builder with correct alias', async () => {
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    it('should handle concurrent list requests', async () => {
          email: 'concurrent@example.com',
          firstName: 'Concurrent',
          lastName: 'Test',
      const query1 = new ListUsersQuery();
      const query2 = new ListUsersQuery('specific@example.com');
      const [result1, result2] = await Promise.all([
        handler.execute(query1),
        handler.execute(query2),
      ]);
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(repository.createQueryBuilder).toHaveBeenCalledTimes(2);
});
