import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateRoleCommand } from '../commands/UpdateRole.command';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleResponseDto } from '../dto/RoleResponse.dto';
import { CacheService } from '../../../cache/cache.service';
import { LoggerService } from '../../../../logger/logger.service';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  private readonly context = UpdateRoleHandler.name;
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}
  async execute(command: UpdateRoleCommand): Promise<RoleResponseDto> {
    const roleId = RoleId.create(command.id);
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    role.update(command.name, command.description);
    await this.roleRepository.save(role);
    // Invalidate all permission caches since role permissions may have changed
    // This affects all users with this role
    const deletedCount = await this.cacheService.delPattern('rbac:permissions:*');
    this.logger.log(
      `✓ Invalidated ${deletedCount} permission cache entries after role update (role: ${command.id})`,
      this.context,
    );
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
