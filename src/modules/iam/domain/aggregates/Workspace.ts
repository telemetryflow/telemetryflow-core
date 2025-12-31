import { AggregateRoot } from '../../../../shared/domain/base/AggregateRoot';
import { WorkspaceId } from '../value-objects/WorkspaceId';
import { OrganizationId } from '../value-objects/OrganizationId';
import { WorkspaceCreatedEvent } from '../events/WorkspaceCreated.event';
import { WorkspaceUpdatedEvent } from '../events/WorkspaceUpdated.event';
import { WorkspaceDeletedEvent } from '../events/WorkspaceDeleted.event';

export class Workspace extends AggregateRoot<WorkspaceId> {
  private constructor(
    id: WorkspaceId,
    public name: string,
    public code: string,
    public organizationId: OrganizationId,
    public description?: string,
    public datasourceConfig?: Record<string, any>,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    super();
    this._id = id;
  }

  static create(
    name: string,
    code: string,
    organizationId: OrganizationId,
    description?: string,
    datasourceConfig?: Record<string, any>,
  ): Workspace {
    const workspace = new Workspace(
      WorkspaceId.create(),
      name,
      code,
      organizationId,
      description,
      datasourceConfig,
    );
    workspace.addDomainEvent(new WorkspaceCreatedEvent(workspace.id.getValue(), name, code, organizationId.getValue()));
    return workspace;
  }

  static reconstitute(
    id: WorkspaceId,
    name: string,
    code: string,
    organizationId: OrganizationId,
    description?: string,
    datasourceConfig?: Record<string, any>,
    isActive: boolean = true,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): Workspace {
    return new Workspace(id, name, code, organizationId, description, datasourceConfig, isActive, createdAt, updatedAt);
  }

  update(name?: string, description?: string, datasourceConfig?: Record<string, any>): void {
    if (name) this.name = name;
    if (description !== undefined) this.description = description;
    if (datasourceConfig !== undefined) this.datasourceConfig = datasourceConfig;
    this.updatedAt = new Date();
    this.addDomainEvent(new WorkspaceUpdatedEvent(this.id.getValue(), this.name));
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
    this.addDomainEvent(new WorkspaceDeletedEvent(this.id.getValue(), this.name));
  }

  // Alias for compatibility with tests
  getUncommittedEvents(): any[] {
    return this.domainEvents;
  }
}
