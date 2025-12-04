import { Test, TestingModule } from '@nestjs/testing';
import { CreateRoleHandler } from '../application/handlers/CreateRole.handler';
import { CreateRoleCommand } from '../application/commands/CreateRole.command';
import { IRoleRepository } from '../domain/repositories/IRoleRepository';
import { ConflictException } from '@nestjs/common';

describe('CreateRoleHandler', () => {
  let handler: CreateRoleHandler;
  let repository: jest.Mocked<IRoleRepository>;

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      existsByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRoleHandler,
        {
          provide: 'IRoleRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<CreateRoleHandler>(CreateRoleHandler);
    repository = module.get('IRoleRepository');
  });

  it('should create a role successfully', async () => {
    const command = new CreateRoleCommand('Admin', 'Admin role', [], null);
    
    repository.existsByName.mockResolvedValue(false);
    repository.save.mockResolvedValue(undefined);

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.name).toBe('Admin');
    expect(repository.existsByName).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when role name exists', async () => {
    const command = new CreateRoleCommand('Admin', 'Admin role', [], null);
    
    repository.existsByName.mockResolvedValue(true);

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
