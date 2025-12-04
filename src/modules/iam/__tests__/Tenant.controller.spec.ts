import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TenantController } from '../presentation/controllers/Tenant.controller';

describe('TenantController', () => {
  let controller: TenantController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus = { execute: jest.fn() };
    const mockQueryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have commandBus', () => {
    expect(commandBus).toBeDefined();
  });

  it('should have queryBus', () => {
    expect(queryBus).toBeDefined();
  });
});
