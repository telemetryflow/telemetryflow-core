import { RetentionPolicy, DataType } from '../../domain/aggregates/RetentionPolicy';
import { RetentionPolicyEntity } from './entities/RetentionPolicy.entity';

export class RetentionPolicyMapper {
  static toDomain(entity: RetentionPolicyEntity): RetentionPolicy {
    return RetentionPolicy.reconstitute({
      id: entity.id,
      name: entity.name,
      description: entity.description || undefined,
      dataType: entity.dataType as DataType,
      retentionDays: entity.retentionDays,
      archiveEnabled: entity.archiveEnabled,
      archiveDestination: entity.archiveDestination || undefined,
      filters: entity.filters || undefined,
      isDefault: entity.isDefault,
      isActive: entity.isActive,
      organizationId: entity.organizationId || undefined,
      lastEnforcedAt: entity.lastEnforcedAt || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: RetentionPolicy): Partial<RetentionPolicyEntity> {
    const props = domain.getProps();
    return {
      id: props.id,
      name: props.name,
      description: props.description || null,
      dataType: props.dataType,
      retentionDays: props.retentionDays,
      archiveEnabled: props.archiveEnabled,
      archiveDestination: props.archiveDestination || null,
      filters: props.filters || null,
      isDefault: props.isDefault,
      isActive: props.isActive,
      organizationId: props.organizationId || null,
      lastEnforcedAt: props.lastEnforcedAt || null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
