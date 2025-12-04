import { Permission } from '../../domain/aggregates/Permission';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { PermissionEntity } from './entities/PermissionEntity';

export class PermissionMapper {
  static toDomain(entity: PermissionEntity): Permission {
    return Permission.reconstitute(
      PermissionId.create(entity.id),
      entity.name,
      entity.description,
      entity.resource,
      entity.action,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toEntity(permission: Permission): PermissionEntity {
    const entity = new PermissionEntity();
    entity.id = permission.getId().getValue();
    entity.name = permission.getName();
    entity.description = permission.getDescription();
    entity.resource = permission.getResource();
    entity.action = permission.getAction();
    entity.createdAt = permission.getCreatedAt();
    entity.updatedAt = permission.getUpdatedAt();
    entity.deletedAt = permission.getDeletedAt();
    return entity;
  }
}
