import { Organization } from "../aggregates/Organization";
import { OrganizationId } from "../value-objects/OrganizationId";
import { RegionId } from "../value-objects/RegionId";

export interface IOrganizationRepository {
  findAll(regionId?: RegionId): Promise<Organization[]>;
  findById(id: OrganizationId): Promise<Organization | null>;
  findByCode(code: string): Promise<Organization | null>;
  save(organization: Organization): Promise<void>;
  delete(id: OrganizationId): Promise<void>;
}
