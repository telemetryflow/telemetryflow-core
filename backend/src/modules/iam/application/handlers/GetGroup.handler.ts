import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetGroupQuery } from '../queries/GetGroup.query';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { GroupId } from '../../domain/value-objects/GroupId';
import { GroupResponseDto } from '../dto/GroupResponse.dto';

@QueryHandler(GetGroupQuery)
export class GetGroupHandler implements IQueryHandler<GetGroupQuery> {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}
  async execute(query: GetGroupQuery): Promise<GroupResponseDto> {
    const groupId = GroupId.create(query.id);
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
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
