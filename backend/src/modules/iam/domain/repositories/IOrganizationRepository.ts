import { Organization } from '../aggregates/Organization';
import { OrganizationId } from '../value-objects/OrganizationId';
import { RegionId } from '../value-objects/RegionId';

export interface IOrganizationRepository {
  save(organization: Organization): Promise<void>;
  findById(id: OrganizationId): Promise<Organization | null>;
  findByCode(code: string): Promise<Organization | null>;
  findByRegion(regionId: RegionId): Promise<Organization[]>;
  findAll(): Promise<Organization[]>;
  delete(id: OrganizationId): Promise<void>;
}
