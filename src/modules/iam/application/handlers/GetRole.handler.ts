import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetRoleQuery } from '../queries/GetRole.query';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleResponseDto } from '../dto/RoleResponse.dto';

@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(query: GetRoleQuery): Promise<RoleResponseDto> {
    const roleId = RoleId.create(query.id);
    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      id: role.getId().getValue(),
      name: role.getName(),
      description: role.getDescription(),
      permissions: role.getPermissions().map(p => p.getValue()),
      tenantId: role.getTenantId()?.getValue(),
      isSystem: role.getIsSystem(),
      createdAt: role.getCreatedAt(),
      updatedAt: role.getUpdatedAt(),
    };
  }
}
