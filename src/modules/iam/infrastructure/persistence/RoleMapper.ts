import { Role } from '../../domain/aggregates/Role';
import { RoleId } from '../../domain/value-objects/RoleId';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { TenantId } from '../../domain/value-objects/TenantId';
import { RoleEntity } from './entities/RoleEntity';

export class RoleMapper {
  static toDomain(entity: any): Role {
    const permissionIds = (entity.permissions || []).map(p => PermissionId.create(p.id));
    const tenantId = entity.tenant_id ? TenantId.create(entity.tenant_id) : null;

    return Role.reconstitute(
      RoleId.create(entity.id),
      entity.name,
      entity.description,
      permissionIds,
      tenantId,
      entity.is_system ?? false,
      entity.created_at || new Date(),
      entity.updated_at || new Date(),
      entity.deleted_at || null,
    );
  }

  static toEntity(role: Role): RoleEntity {
    const entity = new RoleEntity();
    entity.id = role.getId().getValue();
    entity.name = role.getName();
    entity.description = role.getDescription();
    entity.is_system = role.getIsSystem();
    entity.created_at = role.getCreatedAt();
    entity.updated_at = role.getUpdatedAt();
    entity.deleted_at = role.getDeletedAt();
    return entity;
  }
}
