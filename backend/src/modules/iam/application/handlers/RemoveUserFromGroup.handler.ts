import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RemoveUserFromGroupCommand } from '../commands/RemoveUserFromGroup.command';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { GroupId } from '../../domain/value-objects/GroupId';
import { UserId } from '../../domain/value-objects/UserId';
import { GroupResponseDto } from '../dto/GroupResponse.dto';

@CommandHandler(RemoveUserFromGroupCommand)
export class RemoveUserFromGroupHandler implements ICommandHandler<RemoveUserFromGroupCommand> {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}
  async execute(command: RemoveUserFromGroupCommand): Promise<GroupResponseDto> {
    const groupId = GroupId.create(command.groupId);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    const userId = UserId.create(command.userId);
    group.removeUser(userId);
    await this.groupRepository.save(group);
    return {
      id: group.getId().getValue(),
      name: group.getName(),
      description: group.getDescription(),
      userIds: group.getUserIds().map(u => u.getValue()),
      organizationId: group.getOrganizationId()?.getValue(),
      createdAt: group.getCreatedAt(),
      updatedAt: group.getUpdatedAt(),
    };
  }
}
