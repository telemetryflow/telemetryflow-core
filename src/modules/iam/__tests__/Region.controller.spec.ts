import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegionController } from '../presentation/controllers/Region.controller';

describe('RegionController', () => {
  let controller: RegionController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus = { execute: jest.fn() };
    const mockQueryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegionController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    controller = module.get<RegionController>(RegionController);
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
