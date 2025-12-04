import { Region } from '../../domain/aggregates/Region';
import { RegionId } from '../../domain/value-objects/RegionId';
import { RegionEntity } from './entities/RegionEntity';

export class RegionMapper {
  static toDomain(entity: RegionEntity): Region {
    return Region.reconstitute(
      RegionId.create(entity.id),
      entity.name,
      entity.code,
      entity.description,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      null,
    );
  }

  static toEntity(region: Region): RegionEntity {
    const entity = new RegionEntity();
    entity.id = region.getId().getValue();
    entity.name = region.getName();
    entity.code = region.getCode();
    entity.description = region.getDescription();
    entity.isActive = region.getIsActive();
    entity.createdAt = region.getCreatedAt();
    entity.updatedAt = region.getUpdatedAt();
    return entity;
  }
}
