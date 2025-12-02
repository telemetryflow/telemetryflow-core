import { Group } from '../../domain/aggregates/Group';
import { GroupId } from '../../domain/value-objects/GroupId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { GroupEntity } from './entities/GroupEntity';

export class GroupMapper {
  static toDomain(entity: GroupEntity): Group {
    return Group.reconstitute(
      GroupId.create(entity.id),
      entity.name,
      entity.description,
      [],
      entity.organizationId ? OrganizationId.create(entity.organizationId) : null,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toEntity(group: Group): GroupEntity {
    const entity = new GroupEntity();
    entity.id = group.getId().getValue();
    entity.name = group.getName();
    entity.description = group.getDescription();
    entity.organizationId = group.getOrganizationId()?.getValue();
    entity.createdAt = group.getCreatedAt();
    entity.updatedAt = group.getUpdatedAt();
    entity.deletedAt = group.getDeletedAt();
    return entity;
  }
}
