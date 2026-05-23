import { Organization } from '../../domain/aggregates/Organization';
import { OrganizationEntity } from './entities/Organization.entity';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { RegionId } from '../../domain/value-objects/RegionId';

export class OrganizationMapper {
  static toDomain(entity: OrganizationEntity): Organization {
    return Organization.reconstitute(
      OrganizationId.create(entity.organization_id),
      entity.name,
      entity.code,
      entity.description,
      entity.domain,
      entity.is_active,
      RegionId.create(entity.region_id),
    );
  }

  static toPersistence(organization: Organization): Partial<OrganizationEntity> {
    return {
      organization_id: organization.id.getValue(),
      name: organization.name,
      code: organization.code,
      description: organization.description,
      domain: organization.domain,
      is_active: organization.isActive,
      region_id: organization.regionId.getValue(),
    };
  }
}
