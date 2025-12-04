import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListWorkspacesQuery } from '../queries/ListWorkspaces.query';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { WorkspaceResponseDto } from '../dto/WorkspaceResponse.dto';

@QueryHandler(ListWorkspacesQuery)
export class ListWorkspacesHandler implements IQueryHandler<ListWorkspacesQuery> {
  constructor(
    @Inject('IWorkspaceRepository')
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}
  async execute(query: ListWorkspacesQuery): Promise<WorkspaceResponseDto[]> {
    const workspaces = query.organizationId
      ? await this.workspaceRepository.findByOrganization(OrganizationId.create(query.organizationId))
      : await this.workspaceRepository.findAll();
    return workspaces.map(w => ({
      id: w.id.getValue(),
      name: w.name,
      code: w.code,
      description: w.description,
      datasourceConfig: w.datasourceConfig,
      isActive: w.isActive,
      organizationId: w.organizationId.getValue(),
    }));
  }
}
