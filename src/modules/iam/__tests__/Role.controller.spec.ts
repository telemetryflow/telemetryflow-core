import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RoleController } from '../presentation/controllers/Role.controller';
import { CreateRoleDto } from '../presentation/dto/Role.dto';

describe('RoleController', () => {
  let controller: RoleController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('create', () => {
    it('should create a role', async () => {
      const dto: CreateRoleDto = {
        name: 'Admin',
        description: 'Admin role',
        permissionIds: [],
      };

      const expectedResult = {
        id: '123',
        name: 'Admin',
        description: 'Admin role',
        permissionIds: [],
        isSystemRole: false,
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      commandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(result).toEqual(expectedResult);
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('list', () => {
    it('should list roles', async () => {
      const expectedResult = [
        {
          id: '123',
          name: 'Admin',
          description: 'Admin role',
          permissionIds: [],
          isSystemRole: false,
          tenantId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      queryBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.list({});

      expect(result).toEqual(expectedResult);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
    });
  });
});
