import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateWorkspaceHandler } from '../CreateWorkspace.handler';
import { CreateWorkspaceCommand } from '../../commands/CreateWorkspace.command';
import { IWorkspaceRepository } from '../../../domain/repositories/IWorkspaceRepository';

describe('CreateWorkspaceHandler', () => {
  let handler: CreateWorkspaceHandler;
  let repository: jest.Mocked<IWorkspaceRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findByCode: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkspaceHandler,
        { provide: 'IWorkspaceRepository', useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<CreateWorkspaceHandler>(CreateWorkspaceHandler);
    repository = module.get('IWorkspaceRepository');
  });

  it('should create workspace successfully', async () => {
    const command = new CreateWorkspaceCommand('Development', 'dev', 'org-1', 'Dev workspace');
    repository.findByCode.mockResolvedValue(null);

    const result = await handler.execute(command);

    expect(repository.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should throw ConflictException if code exists', async () => {
    const command = new CreateWorkspaceCommand('Development', 'dev', 'org-1');
    repository.findByCode.mockResolvedValue({} as any);

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
