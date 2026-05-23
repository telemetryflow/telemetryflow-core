import { AggregateRoot } from "../../../../shared/domain/base/AggregateRoot";
import { WorkspaceId } from "../value-objects/WorkspaceId";
import { OrganizationId } from "../value-objects/OrganizationId";
import { WorkspaceCreatedEvent } from "../events/WorkspaceCreated.event";

export class Workspace extends AggregateRoot<WorkspaceId> {
  private constructor(
    id: WorkspaceId,
    private name: string,
    private code: string,
    private description: string | null,
    private organizationId: OrganizationId,
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
    organizationId: OrganizationId,
    description?: string,
  ): Workspace {
    const id = WorkspaceId.create();
    const workspace = new Workspace(
      id,
      name,
      code,
      description || null,
      organizationId,
      true,
      new Date(),
      new Date(),
      null,
    );
    workspace.addDomainEvent(
      new WorkspaceCreatedEvent(
        id.getValue(),
        name,
        code,
        organizationId.getValue(),
      ),
    );
    return workspace;
  }

  static reconstitute(
    id: WorkspaceId,
    name: string,
    code: string,
    description: string | null,
    organizationId: OrganizationId,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Workspace {
    return new Workspace(
      id,
      name,
      code,
      description,
      organizationId,
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

  getId(): WorkspaceId {
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
  getOrganizationId(): OrganizationId {
    return this.organizationId;
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
