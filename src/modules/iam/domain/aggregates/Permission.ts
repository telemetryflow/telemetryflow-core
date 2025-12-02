import { AggregateRoot } from '../../../../shared/domain/base/AggregateRoot';
import { PermissionId } from '../value-objects/PermissionId';
import { PermissionCreatedEvent } from '../events/PermissionCreated.event';
import { PermissionUpdatedEvent } from '../events/PermissionUpdated.event';

export class Permission extends AggregateRoot<PermissionId> {
  private constructor(
    id: PermissionId,
    private name: string,
    private description: string,
    private resource: string,
    private action: string,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {
    super();
    this._id = id;
  }

  static create(
    name: string,
    description: string,
    resource: string,
    action: string,
  ): Permission {
    const permission = new Permission(
      PermissionId.create(),
      name,
      description,
      resource,
      action,
      new Date(),
      new Date(),
      null,
    );
    permission.addDomainEvent(new PermissionCreatedEvent(permission.id.getValue(), name));
    return permission;
  }

  static reconstitute(
    id: PermissionId,
    name: string,
    description: string,
    resource: string,
    action: string,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Permission {
    return new Permission(id, name, description, resource, action, createdAt, updatedAt, deletedAt);
  }

  update(name?: string, description?: string, resource?: string, action?: string): void {
    if (name) this.name = name;
    if (description) this.description = description;
    if (resource) this.resource = resource;
    if (action) this.action = action;
    this.updatedAt = new Date();
    this.addDomainEvent(new PermissionUpdatedEvent(this.id.getValue(), name, description));
  }

  delete(): void {
    this.deletedAt = new Date();
  }

  getId(): PermissionId { return this.id; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getResource(): string { return this.resource; }
  getAction(): string { return this.action; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getDeletedAt(): Date | null { return this.deletedAt; }
  isDeleted(): boolean { return this.deletedAt !== null; }
}
