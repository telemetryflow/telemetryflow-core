import { AggregateRoot } from "../../../../shared/domain/base/AggregateRoot";
import { TenantId } from "../value-objects/TenantId";
import { WorkspaceId } from "../value-objects/WorkspaceId";
import { TenantCreatedEvent } from "../events/TenantCreated.event";

export class Tenant extends AggregateRoot<TenantId> {
  private constructor(
    id: TenantId,
    private name: string,
    private code: string,
    private description: string | null,
    private workspaceId: WorkspaceId,
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
    workspaceId: WorkspaceId,
    description?: string,
  ): Tenant {
    const id = TenantId.create();
    const tenant = new Tenant(
      id,
      name,
      code,
      description || null,
      workspaceId,
      true,
      new Date(),
      new Date(),
      null,
    );
    tenant.addDomainEvent(
      new TenantCreatedEvent(id.getValue(), name, code, workspaceId.getValue()),
    );
    return tenant;
  }

  static reconstitute(
    id: TenantId,
    name: string,
    code: string,
    description: string | null,
    workspaceId: WorkspaceId,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Tenant {
    return new Tenant(
      id,
      name,
      code,
      description,
      workspaceId,
      isActive,
      createdAt,
      updatedAt,
      deletedAt,
    );
  }

  updateDetails(name?: string, description?: string): void {
    if (name) this.name = name;
    if (description !== undefined) this.description = description || null;
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

  getId(): TenantId {
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
  getWorkspaceId(): WorkspaceId {
    return this.workspaceId;
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
