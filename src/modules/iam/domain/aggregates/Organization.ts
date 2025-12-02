import { AggregateRoot } from '../../../../shared/domain/base/AggregateRoot';
import { OrganizationId } from '../value-objects/OrganizationId';
import { RegionId } from '../value-objects/RegionId';
import { OrganizationCreatedEvent } from '../events/OrganizationCreated.event';
import { OrganizationUpdatedEvent } from '../events/OrganizationUpdated.event';
import { OrganizationDeletedEvent } from '../events/OrganizationDeleted.event';

export class Organization extends AggregateRoot<OrganizationId> {
  private constructor(
    id: OrganizationId,
    public name: string,
    public code: string,
    public description: string | null,
    public domain: string | null,
    public isActive: boolean,
    public regionId: RegionId,
  ) {
    super();
    this._id = id;
  }

  static create(
    name: string,
    code: string,
    regionId: RegionId,
    description?: string,
    domain?: string,
  ): Organization {
    const id = OrganizationId.create();
    const org = new Organization(id, name, code, description || null, domain || null, true, regionId);
    org.addDomainEvent(new OrganizationCreatedEvent(id.getValue(), name, code, regionId.getValue()));
    return org;
  }

  static reconstitute(
    id: OrganizationId,
    name: string,
    code: string,
    description: string | null,
    domain: string | null,
    isActive: boolean,
    regionId: RegionId,
  ): Organization {
    return new Organization(id, name, code, description, domain, isActive, regionId);
  }

  update(name: string, description?: string, domain?: string): void {
    this.name = name;
    this.description = description || null;
    this.domain = domain || null;
    this.addDomainEvent(new OrganizationUpdatedEvent(this.id.getValue(), name));
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  delete(): void {
    this.addDomainEvent(new OrganizationDeletedEvent(this.id.getValue()));
  }
}
