import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateRegionHandler } from '../CreateRegion.handler';
import { CreateRegionCommand } from '../../commands/CreateRegion.command';
import { IRegionRepository } from '../../../domain/repositories/IRegionRepository';
import { Region } from '../../../domain/aggregates/Region';

describe('CreateRegionHandler', () => {
  let handler: CreateRegionHandler;
  let repository: jest.Mocked<IRegionRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findByCode: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRegionHandler,
        { provide: 'IRegionRepository', useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<CreateRegionHandler>(CreateRegionHandler);
    repository = module.get('IRegionRepository');
  });

  it('should create region successfully', async () => {
    const command = new CreateRegionCommand('US East', 'us-east-1', 'US East Region');
    repository.findByCode.mockResolvedValue(null);

    const result = await handler.execute(command);

    expect(repository.save).toHaveBeenCalled();
    expect(result.name).toBe('US East');
    expect(result.code).toBe('us-east-1');
  });

  it('should throw ConflictException if code exists', async () => {
    const command = new CreateRegionCommand('US East', 'us-east-1', 'US East Region');
    repository.findByCode.mockResolvedValue({} as Region);

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
