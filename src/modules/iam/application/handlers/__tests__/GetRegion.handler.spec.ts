import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetRegionHandler } from '../GetRegion.handler';
import { GetRegionQuery } from '../../queries/GetRegion.query';
import { IRegionRepository } from '../../../domain/repositories/IRegionRepository';
import { Region } from '../../../domain/aggregates/Region';
import { RegionId } from '../../../domain/value-objects/RegionId';

describe('GetRegionHandler', () => {
  let handler: GetRegionHandler;
  let repository: jest.Mocked<IRegionRepository>;
  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRegionHandler,
        { provide: 'IRegionRepository', useValue: mockRepository },
      ],
    }).compile();
    handler = module.get<GetRegionHandler>(GetRegionHandler);
    repository = module.get('IRegionRepository');
  });
  it('should return region', async () => {
    const query = new GetRegionQuery('region-1');
    const mockRegion = {
      getId: () => RegionId.create('region-1'),
      getName: () => 'US East',
      getCode: () => 'us-east-1',
      getDescription: () => 'US East Region',
      getIsActive: () => true,
      getCreatedAt: () => new Date(),
      getUpdatedAt: () => new Date(),
    } as Region;
    repository.findById.mockResolvedValue(mockRegion);
    const result = await handler.execute(query);
    expect(result.name).toBe('US East');
    expect(result.code).toBe('us-east-1');
  it('should throw NotFoundException if region not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
});
