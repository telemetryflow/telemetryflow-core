import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetOrganizationHandler } from '../GetOrganization.handler';
import { GetOrganizationQuery } from '../../queries/GetOrganization.query';
import { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository';
import { Organization } from '../../../domain/aggregates/Organization';
import { OrganizationId } from '../../../domain/value-objects/OrganizationId';
import { RegionId } from '../../../domain/value-objects/RegionId';

describe('GetOrganizationHandler', () => {
  let handler: GetOrganizationHandler;
  let repository: jest.Mocked<IOrganizationRepository>;
  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrganizationHandler,
        { provide: 'IOrganizationRepository', useValue: mockRepository },
      ],
    }).compile();
    handler = module.get<GetOrganizationHandler>(GetOrganizationHandler);
    repository = module.get('IOrganizationRepository');
  });
  it('should return organization', async () => {
    const query = new GetOrganizationQuery('org-1');
    const mockOrg = {
      id: OrganizationId.create('org-1'),
      name: 'DevOpsCorner',
      code: 'devopscorner',
      description: 'DevOpsCorner Indonesia',
      domain: 'devopscorner.id',
      isActive: true,
      regionId: RegionId.create('region-1'),
    } as Organization;
    repository.findById.mockResolvedValue(mockOrg);
    const result = await handler.execute(query);
    expect(result.name).toBe('DevOpsCorner');
    expect(result.code).toBe('devopscorner');
  it('should throw NotFoundException if organization not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
});
