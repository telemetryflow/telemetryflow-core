import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeleteGroupCommand } from '../commands/DeleteGroup.command';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { GroupId } from '../../domain/value-objects/GroupId';

@CommandHandler(DeleteGroupCommand)
export class DeleteGroupHandler implements ICommandHandler<DeleteGroupCommand> {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}
  async execute(command: DeleteGroupCommand): Promise<void> {
    const groupId = GroupId.create(command.id);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    group.delete();
    await this.groupRepository.save(group);
  }
}
