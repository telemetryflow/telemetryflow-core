import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeletePermissionCommand } from '../commands/DeletePermission.command';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';

@CommandHandler(DeletePermissionCommand)
export class DeletePermissionHandler implements ICommandHandler<DeletePermissionCommand> {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}
  async execute(command: DeletePermissionCommand): Promise<void> {
    const permissionId = PermissionId.create(command.id);
    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    permission.delete();
    await this.permissionRepository.save(permission);
  }
}
