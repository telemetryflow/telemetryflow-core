import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListGroupsQuery } from '../queries/ListGroups.query';
import { IGroupRepository } from '../../domain/repositories/IGroupRepository';
import { GroupResponseDto } from '../dto/GroupResponse.dto';

@QueryHandler(ListGroupsQuery)
export class ListGroupsHandler implements IQueryHandler<ListGroupsQuery> {
  constructor(
    @Inject('IGroupRepository')
    private readonly groupRepository: IGroupRepository,
  ) {}
  async execute(query: ListGroupsQuery): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.findAll();
    return groups
      .filter(g => !query.organizationId || g.getOrganizationId()?.getValue() === query.organizationId)
      .map(group => ({
        id: group.getId().getValue(),
        name: group.getName(),
        description: group.getDescription(),
        userIds: group.getUserIds().map(u => u.getValue()),
        organizationId: group.getOrganizationId()?.getValue(),
        createdAt: group.getCreatedAt(),
        updatedAt: group.getUpdatedAt(),
      }));
  }
}
