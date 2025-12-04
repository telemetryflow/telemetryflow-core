import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdatePermissionCommand } from '../commands/UpdatePermission.command';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { PermissionResponseDto } from '../dto/PermissionResponse.dto';

@CommandHandler(UpdatePermissionCommand)
export class UpdatePermissionHandler implements ICommandHandler<UpdatePermissionCommand> {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}
  async execute(command: UpdatePermissionCommand): Promise<PermissionResponseDto> {
    const permissionId = PermissionId.create(command.id);
    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    permission.update(command.name, command.description, command.resource, command.action);
    await this.permissionRepository.save(permission);
    return {
      id: permission.getId().getValue(),
      name: permission.getName(),
      description: permission.getDescription(),
      resource: permission.getResource(),
      action: permission.getAction(),
      createdAt: permission.getCreatedAt(),
      updatedAt: permission.getUpdatedAt(),
    };
  }
}
