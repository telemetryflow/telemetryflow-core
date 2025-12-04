import { Test, TestingModule } from '@nestjs/testing';
import { CreatePermissionHandler } from '../application/handlers/CreatePermission.handler';
import { CreatePermissionCommand } from '../application/commands/CreatePermission.command';
import { IPermissionRepository } from '../domain/repositories/IPermissionRepository';
import { ConflictException } from '@nestjs/common';

describe('CreatePermissionHandler', () => {
  let handler: CreatePermissionHandler;
  let repository: jest.Mocked<IPermissionRepository>;

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePermissionHandler,
        { provide: 'IPermissionRepository', useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<CreatePermissionHandler>(CreatePermissionHandler);
    repository = module.get('IPermissionRepository');
  });

  it('should create a permission successfully', async () => {
    const command = new CreatePermissionCommand('user:read', 'Read users', 'user', 'read');
    repository.findByName.mockResolvedValue(null);
    repository.save.mockResolvedValue(undefined);

    const result = await handler.execute(command);

    expect(result.name).toBe('user:read');
    expect(repository.findByName).toHaveBeenCalledWith('user:read');
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when permission exists', async () => {
    const command = new CreatePermissionCommand('user:read', 'Read users', 'user', 'read');
    repository.findByName.mockResolvedValue({} as any);

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
