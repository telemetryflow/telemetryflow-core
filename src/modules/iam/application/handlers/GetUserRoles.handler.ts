import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserRolesQuery } from '../queries/GetUserRoles.query';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleResponseDto } from '../dto/RoleResponse.dto';

@QueryHandler(GetUserRolesQuery)
export class GetUserRolesHandler implements IQueryHandler<GetUserRolesQuery> {
  constructor(
    @Inject('IUserRoleRepository')
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}
  async execute(query: GetUserRolesQuery): Promise<RoleResponseDto[]> {
    const userId = UserId.create(query.userId);
    const roleIds = await this.userRoleRepository.getUserRoles(userId);
    const roles = await Promise.all(
      roleIds.map(roleId => this.roleRepository.findById(roleId))
    );
    return roles
      .filter(role => role !== null)
      .map(role => ({
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
