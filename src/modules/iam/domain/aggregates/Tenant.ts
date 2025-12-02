import { AggregateRoot } from '../../../../shared/domain/base/AggregateRoot';
import { TenantId } from '../value-objects/TenantId';
import { WorkspaceId } from '../value-objects/WorkspaceId';
import { TenantCreatedEvent } from '../events/TenantCreated.event';
import { TenantUpdatedEvent } from '../events/TenantUpdated.event';
import { TenantDeletedEvent } from '../events/TenantDeleted.event';

export class Tenant extends AggregateRoot<TenantId> {
  private constructor(
    id: TenantId,
    private name: string,
    private code: string,
    private workspaceId: WorkspaceId,
    private domain: string | undefined,
    private isActive: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {
    super();
    this._id = id;
  }

  static create(
    name: string,
    code: string,
    workspaceId: WorkspaceId,
    domain?: string,
  ): Tenant {
    const id = TenantId.create();
    const tenant = new Tenant(
      id,
      name,
      code,
      workspaceId,
      domain,
      true,
      new Date(),
      new Date(),
      null,
    );
    tenant.addDomainEvent(new TenantCreatedEvent(id.getValue(), name, code, workspaceId.getValue()));
    return tenant;
  }

  static reconstitute(
    id: TenantId,
    name: string,
    code: string,
    workspaceId: WorkspaceId,
    domain: string | undefined,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Tenant {
    return new Tenant(id, name, code, workspaceId, domain, isActive, createdAt, updatedAt, deletedAt);
  }

  update(name?: string, domain?: string): void {
    if (name) this.name = name;
    if (domain !== undefined) this.domain = domain;
    this.updatedAt = new Date();
    this.addDomainEvent(new TenantUpdatedEvent(this.id.getValue(), this.name));
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
    this.addDomainEvent(new TenantDeletedEvent(this.id.getValue(), this.name));
  }

  // Getters
  getId(): TenantId { return this.id; }
  getName(): string { return this.name; }
  getCode(): string { return this.code; }
  getWorkspaceId(): WorkspaceId { return this.workspaceId; }
  getDomain(): string | undefined { return this.domain; }
  getIsActive(): boolean { return this.isActive; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getDeletedAt(): Date | null { return this.deletedAt; }
  isDeleted(): boolean { return this.deletedAt !== null; }
}
