import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateTenantHandler } from '../CreateTenant.handler';
import { CreateTenantCommand } from '../../commands/CreateTenant.command';
import { ITenantRepository } from '../../../domain/repositories/ITenantRepository';

describe('CreateTenantHandler', () => {
  let handler: CreateTenantHandler;
  let repository: jest.Mocked<ITenantRepository>;
  beforeEach(async () => {
    const mockRepository = {
      findByCode: jest.fn(),
      save: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTenantHandler,
        { provide: 'ITenantRepository', useValue: mockRepository },
      ],
    }).compile();
    handler = module.get<CreateTenantHandler>(CreateTenantHandler);
    repository = module.get('ITenantRepository');
  });
  it('should create tenant successfully', async () => {
    const command = new CreateTenantCommand('Default Tenant', 'default', 'ws-1', 'default.example.com');
    repository.findByCode.mockResolvedValue(null);
    const result = await handler.execute(command);
    expect(repository.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  it('should throw ConflictException if code exists', async () => {
    const command = new CreateTenantCommand('Default Tenant', 'default', 'ws-1');
    repository.findByCode.mockResolvedValue({} as any);
    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
});
