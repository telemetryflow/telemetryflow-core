import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetWorkspaceHandler } from '../GetWorkspace.handler';
import { GetWorkspaceQuery } from '../../queries/GetWorkspace.query';
import { IWorkspaceRepository } from '../../../domain/repositories/IWorkspaceRepository';
import { Workspace } from '../../../domain/aggregates/Workspace';
import { WorkspaceId } from '../../../domain/value-objects/WorkspaceId';
import { OrganizationId } from '../../../domain/value-objects/OrganizationId';

describe('GetWorkspaceHandler', () => {
  let handler: GetWorkspaceHandler;
  let repository: jest.Mocked<IWorkspaceRepository>;
  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWorkspaceHandler,
        { provide: 'IWorkspaceRepository', useValue: mockRepository },
      ],
    }).compile();
    handler = module.get<GetWorkspaceHandler>(GetWorkspaceHandler);
    repository = module.get('IWorkspaceRepository');
  });
  it('should return workspace', async () => {
    const query = new GetWorkspaceQuery('ws-1');
    const mockWorkspace = new Workspace(
      WorkspaceId.create('ws-1'),
      'Development',
      'dev',
      OrganizationId.create('org-1'),
      'Dev workspace',
    );
    repository.findById.mockResolvedValue(mockWorkspace);
    const result = await handler.execute(query);
    expect(result.name).toBe('Development');
    expect(result.code).toBe('dev');
  it('should throw NotFoundException if workspace not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
});
