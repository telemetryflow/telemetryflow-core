import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetRoleQuery } from '../queries/GetRole.query';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleResponseDto } from '../dto/RoleResponse.dto';

@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}
  async execute(query: GetRoleQuery): Promise<RoleResponseDto> {
    const roleId = RoleId.create(query.id);
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const permissionIds = role.getPermissions();
    const permissions = await Promise.all(
      permissionIds.map(async (pid) => {
        const perm = await this.permissionRepository.findById(pid);
        return perm?.getName() || '';
      })
    );
    return {
      id: role.getId().getValue(),
      name: role.getName(),
      description: role.getDescription(),
      permissions: permissions.filter(p => p),
      tenantId: role.getTenantId()?.getValue(),
      isSystem: role.getIsSystem(),
      createdAt: role.getCreatedAt(),
      updatedAt: role.getUpdatedAt(),
    };
  }
}
