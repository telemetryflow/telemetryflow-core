import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RemovePermissionCommand } from '../commands/RemovePermission.command';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { RoleResponseDto } from '../dto/RoleResponse.dto';

@CommandHandler(RemovePermissionCommand)
export class RemovePermissionHandler implements ICommandHandler<RemovePermissionCommand> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}
  async execute(command: RemovePermissionCommand): Promise<RoleResponseDto> {
    const roleId = RoleId.create(command.roleId);
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const permissionId = PermissionId.create(command.permissionId);
    role.removePermission(permissionId);
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
