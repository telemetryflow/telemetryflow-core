import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListTenantsQuery } from '../queries/ListTenants.query';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';
import { TenantResponseDto } from '../dto/TenantResponse.dto';

@QueryHandler(ListTenantsQuery)
export class ListTenantsHandler implements IQueryHandler<ListTenantsQuery> {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}
  async execute(query: ListTenantsQuery): Promise<TenantResponseDto[]> {
    const tenants = query.workspaceId
      ? await this.tenantRepository.findByWorkspace(WorkspaceId.create(query.workspaceId))
      : await this.tenantRepository.findAll();
    return tenants.map(t => ({
      id: t.getId().getValue(),
      name: t.getName(),
      code: t.getCode(),
      domain: t.getDomain(),
      isActive: t.getIsActive(),
      workspaceId: t.getWorkspaceId().getValue(),
    }));
  }
}
