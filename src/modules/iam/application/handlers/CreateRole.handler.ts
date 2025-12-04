import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateRoleCommand } from '../commands/CreateRole.command';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { Role } from '../../domain/aggregates/Role';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { TenantId } from '../../domain/value-objects/TenantId';
import { RoleResponseDto } from '../dto/RoleResponse.dto';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}
  async execute(command: CreateRoleCommand): Promise<RoleResponseDto> {
    const tenantId = command.tenantId ? TenantId.create(command.tenantId) : null;
    
    const exists = await this.roleRepository.existsByName(command.name, tenantId);
    if (exists) {
      throw new ConflictException('Role name already exists');
    }
    const permissionIds = command.permissionIds.map(id => PermissionId.create(id));
    const role = Role.create(command.name, command.description, permissionIds, tenantId);
    await this.roleRepository.save(role);
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
