import { AggregateRoot } from '../../../../shared/domain/base/AggregateRoot';
import { RegionId } from '../value-objects/RegionId';
import { RegionCreatedEvent } from '../events/RegionCreated.event';
import { RegionUpdatedEvent } from '../events/RegionUpdated.event';

export class Region extends AggregateRoot<RegionId> {
  private constructor(
    id: RegionId,
    private name: string,
    private code: string,
    private description: string,
    private isActive: boolean,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {
    super();
    this._id = id;
  }

  static create(name: string, code: string, description: string): Region {
    const region = new Region(
      RegionId.create(),
      name,
      code,
      description,
      true,
      new Date(),
      new Date(),
      null,
    );
    region.addDomainEvent(new RegionCreatedEvent(region.id.getValue(), name, code));
    return region;
  }

  static reconstitute(
    id: RegionId,
    name: string,
    code: string,
    description: string,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Region {
    return new Region(id, name, code, description, isActive, createdAt, updatedAt, deletedAt);
  }

  update(name?: string, description?: string): void {
    if (name) this.name = name;
    if (description) this.description = description;
    this.updatedAt = new Date();
    this.addDomainEvent(new RegionUpdatedEvent(this.id.getValue(), name, description));
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

  getId(): RegionId { return this.id; }
  getName(): string { return this.name; }
  getCode(): string { return this.code; }
  getDescription(): string { return this.description; }
  getIsActive(): boolean { return this.isActive; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getDeletedAt(): Date | null { return this.deletedAt; }
  isDeleted(): boolean { return this.deletedAt !== null; }
}
