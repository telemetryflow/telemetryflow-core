import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListRolesQuery } from '../queries/ListRoles.query';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { TenantId } from '../../domain/value-objects/TenantId';
import { RoleResponseDto } from '../dto/RoleResponse.dto';

@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}
  async execute(query: ListRolesQuery): Promise<RoleResponseDto[]> {
    const tenantId = query.tenantId ? TenantId.create(query.tenantId) : undefined;
    const roles = await this.roleRepository.findAll(tenantId, query.includeSystem);
    const result = [];
    for (const role of roles) {
      const permissionIds = role.getPermissions();
      const permissions = await Promise.all(
        permissionIds.map(async (pid) => {
          const perm = await this.permissionRepository.findById(pid);
          return perm?.getName() || '';
        })
      );
      result.push({
        id: role.getId().getValue(),
        name: role.getName(),
        description: role.getDescription(),
        permissions: permissions.filter(p => p),
        tenantId: role.getTenantId()?.getValue(),
        isSystem: role.getIsSystem(),
        createdAt: role.getCreatedAt(),
        updatedAt: role.getUpdatedAt(),
      });
    }
    return result;
  }
}
