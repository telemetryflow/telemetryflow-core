import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateGroupCommand } from '../commands/UpdateGroup.command';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { GroupId } from '../../domain/value-objects/GroupId';
import { GroupResponseDto } from '../dto/GroupResponse.dto';

@CommandHandler(UpdateGroupCommand)
export class UpdateGroupHandler implements ICommandHandler<UpdateGroupCommand> {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}
  async execute(command: UpdateGroupCommand): Promise<GroupResponseDto> {
    const groupId = GroupId.create(command.id);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    group.update(command.name, command.description);
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
