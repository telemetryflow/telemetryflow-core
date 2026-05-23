import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreatePermissionCommand } from '../commands/CreatePermission.command';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { Permission } from '../../domain/aggregates/Permission';
import { PermissionResponseDto } from '../dto/PermissionResponse.dto';

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler implements ICommandHandler<CreatePermissionCommand> {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}
  async execute(command: CreatePermissionCommand): Promise<PermissionResponseDto> {
    const existing = await this.permissionRepository.findByName(command.name);
    if (existing) {
      throw new ConflictException('Permission already exists');
    }
    const permission = Permission.create(
      command.name,
      command.description,
      command.resource,
      command.action,
    );
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
