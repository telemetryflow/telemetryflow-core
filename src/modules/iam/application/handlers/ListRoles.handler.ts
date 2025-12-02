import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRolesQuery } from '../queries/ListRoles.query';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { TenantId } from '../../domain/value-objects/TenantId';
import { RoleResponseDto } from '../dto/RoleResponse.dto';

@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(query: ListRolesQuery): Promise<RoleResponseDto[]> {
    const tenantId = query.tenantId ? TenantId.create(query.tenantId) : undefined;
    const roles = await this.roleRepository.findAll(tenantId, query.includeSystem);

    return roles.map(role => ({
      id: role.getId().getValue(),
      name: role.getName(),
      description: role.getDescription(),
      permissions: role.getPermissions().map(p => p.getValue()),
      tenantId: role.getTenantId()?.getValue(),
      isSystem: role.getIsSystem(),
      createdAt: role.getCreatedAt(),
      updatedAt: role.getUpdatedAt(),
    }));
  }
}
