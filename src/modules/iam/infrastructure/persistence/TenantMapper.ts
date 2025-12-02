import { Tenant } from '../../domain/aggregates/Tenant';
import { TenantEntity } from './entities/Tenant.entity';
import { TenantId } from '../../domain/value-objects/TenantId';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';

export class TenantMapper {
  static toDomain(entity: TenantEntity): Tenant {
    return Tenant.reconstitute(
      TenantId.create(entity.tenant_id),
      entity.name,
      entity.code,
      WorkspaceId.create(entity.workspace_id),
      entity.domain,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toPersistence(tenant: Tenant): Partial<TenantEntity> {
    return {
      tenant_id: tenant.getId().getValue(),
      name: tenant.getName(),
      code: tenant.getCode(),
      domain: tenant.getDomain(),
      isActive: tenant.getIsActive(),
      workspace_id: tenant.getWorkspaceId().getValue(),
      createdAt: tenant.getCreatedAt(),
      updatedAt: tenant.getUpdatedAt(),
      deletedAt: tenant.getDeletedAt(),
    };
  }
}
