import { AggregateRoot } from "../../../../shared/domain/base/AggregateRoot";
import { OrganizationId } from "../value-objects/OrganizationId";
import { RegionId } from "../value-objects/RegionId";
import { OrganizationCreatedEvent } from "../events/OrganizationCreated.event";

export class Organization extends AggregateRoot<OrganizationId> {
  private constructor(
    id: OrganizationId,
    private name: string,
    private code: string,
    private description: string | null,
    private domain: string | null,
    private regionId: RegionId,
    private isActive: boolean,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
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
    const org = new Organization(
      id,
      name,
      code,
      description || null,
      domain || null,
      regionId,
      true,
      new Date(),
      new Date(),
      null,
    );
    org.addDomainEvent(
      new OrganizationCreatedEvent(
        id.getValue(),
        name,
        code,
        regionId.getValue(),
      ),
    );
    return org;
  }

  static reconstitute(
    id: OrganizationId,
    name: string,
    code: string,
    description: string | null,
    domain: string | null,
    regionId: RegionId,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Organization {
    return new Organization(
      id,
      name,
      code,
      description,
      domain,
      regionId,
      isActive,
      createdAt,
      updatedAt,
      deletedAt,
    );
  }

  updateDetails(name?: string, description?: string, domain?: string): void {
    if (name) this.name = name;
    if (description !== undefined) this.description = description || null;
    if (domain !== undefined) this.domain = domain || null;
    this.updatedAt = new Date();
  }

  changeRegion(regionId: RegionId): void {
    this.regionId = regionId;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  delete(): void {
    this.deletedAt = new Date();
  }

  getId(): OrganizationId {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getCode(): string {
    return this.code;
  }
  getDescription(): string | null {
    return this.description;
  }
  getDomain(): string | null {
    return this.domain;
  }
  getRegionId(): RegionId {
    return this.regionId;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  getUncommittedEvents(): any[] {
    return this.domainEvents;
  }
}
