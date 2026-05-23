import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PermissionController } from '../presentation/controllers/Permission.controller';

describe('PermissionController', () => {
  let controller: PermissionController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: QueryBus, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  it('should create a permission', async () => {
    const dto = { name: 'user:read', description: 'Read users', resource: 'user', action: 'read' };
    const expected = { id: '123', ...dto, createdAt: new Date(), updatedAt: new Date() };
    
    commandBus.execute.mockResolvedValue(expected);
    const result = await controller.create(dto);
    
    expect(result).toEqual(expected);
  });

  it('should list permissions', async () => {
    queryBus.execute.mockResolvedValue([]);
    const result = await controller.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});
