import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteRoleCommand } from '../commands/DeleteRole.command';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
  ) {}
  async execute(command: DeleteRoleCommand): Promise<void> {
    const roleId = RoleId.create(command.id);
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    role.delete();
    await this.roleRepository.delete(roleId);
  }
}
