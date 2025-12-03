import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetTenantHandler } from '../GetTenant.handler';
import { GetTenantQuery } from '../../queries/GetTenant.query';
import { ITenantRepository } from '../../../domain/repositories/ITenantRepository';
import { Tenant } from '../../../domain/aggregates/Tenant';
import { TenantId } from '../../../domain/value-objects/TenantId';
import { WorkspaceId } from '../../../domain/value-objects/WorkspaceId';

describe('GetTenantHandler', () => {
  let handler: GetTenantHandler;
  let repository: jest.Mocked<ITenantRepository>;
  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTenantHandler,
        { provide: 'ITenantRepository', useValue: mockRepository },
      ],
    }).compile();
    handler = module.get<GetTenantHandler>(GetTenantHandler);
    repository = module.get('ITenantRepository');
  });
  it('should return tenant', async () => {
    const query = new GetTenantQuery('tenant-1');
    const mockTenant = new Tenant(
      TenantId.create('tenant-1'),
      'Default Tenant',
      'default',
      WorkspaceId.create('ws-1'),
      'default.example.com',
    );
    repository.findById.mockResolvedValue(mockTenant);
    const result = await handler.execute(query);
    expect(result.name).toBe('Default Tenant');
    expect(result.code).toBe('default');
  it('should throw NotFoundException if tenant not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
});
