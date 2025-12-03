import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetWorkspaceQuery } from '../queries/GetWorkspace.query';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';
import { WorkspaceResponseDto } from '../dto/WorkspaceResponse.dto';

@QueryHandler(GetWorkspaceQuery)
export class GetWorkspaceHandler implements IQueryHandler<GetWorkspaceQuery> {
  constructor(
    @Inject('IWorkspaceRepository')
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}
  async execute(query: GetWorkspaceQuery): Promise<WorkspaceResponseDto> {
    const id = WorkspaceId.create(query.id);
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return {
      id: workspace.id.getValue(),
      name: workspace.name,
      code: workspace.code,
      description: workspace.description,
      datasourceConfig: workspace.datasourceConfig,
      isActive: workspace.isActive,
      organizationId: workspace.organizationId.getValue(),
    };
  }
}
