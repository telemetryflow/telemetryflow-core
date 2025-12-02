import { Role } from '../../domain/aggregates/Role';
import { RoleId } from '../../domain/value-objects/RoleId';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { TenantId } from '../../domain/value-objects/TenantId';
import { RoleEntity } from './entities/RoleEntity';

export class RoleMapper {
  static toDomain(entity: RoleEntity): Role {
    const permissionIds = entity.permissions?.map(p => PermissionId.create(p.id)) || [];
    const tenantId = entity.tenantId ? TenantId.create(entity.tenantId) : null;

    return Role.reconstitute(
      RoleId.create(entity.id),
      entity.name,
      entity.description,
      permissionIds,
      tenantId,
      entity.isSystem,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toEntity(role: Role): RoleEntity {
    const entity = new RoleEntity();
    entity.id = role.getId().getValue();
    entity.name = role.getName();
    entity.description = role.getDescription();
    entity.tenantId = role.getTenantId()?.getValue() || null;
    entity.isSystem = role.getIsSystem();
    entity.createdAt = role.getCreatedAt();
    entity.updatedAt = role.getUpdatedAt();
    entity.deletedAt = role.getDeletedAt();
    return entity;
  }
}
