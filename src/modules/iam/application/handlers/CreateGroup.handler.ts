import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateGroupCommand } from '../commands/CreateGroup.command';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { Group } from '../../domain/aggregates/Group';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { GroupResponseDto } from '../dto/GroupResponse.dto';

@CommandHandler(CreateGroupCommand)
export class CreateGroupHandler implements ICommandHandler<CreateGroupCommand> {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}
  async execute(command: CreateGroupCommand): Promise<GroupResponseDto> {
    const organizationId = command.organizationId ? OrganizationId.create(command.organizationId) : null;
    const group = Group.create(command.name, command.description, organizationId);
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
