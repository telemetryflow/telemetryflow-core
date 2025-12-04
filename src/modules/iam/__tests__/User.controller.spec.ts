import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserController } from '../presentation/controllers/User.controller';

describe('UserController', () => {
  let controller: UserController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus = { execute: jest.fn() };
    const mockQueryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      commandBus.execute.mockResolvedValue('user-123');

      const result = await controller.create(dto);
      expect(result).toEqual({ id: 'user-123' });
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('list', () => {
    it('should return all users', async () => {
      const result = [{ id: 'user-123', email: 'test@example.com' }];
      queryBus.execute.mockResolvedValue(result);

      expect(await controller.list()).toEqual(result);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should return a user by id', async () => {
      const result = { id: 'user-123', email: 'test@example.com' };
      queryBus.execute.mockResolvedValue(result);

      expect(await controller.get('user-123')).toEqual(result);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const dto = { firstName: 'Jane' };
      commandBus.execute.mockResolvedValue(undefined);

      await controller.update('user-123', dto);
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.delete('user-123');
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.assignRole('user-123', { roleId: 'role-123' });
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('revokeRole', () => {
    it('should revoke role from user', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.revokeRole('user-123', 'role-123');
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });
  });
});
