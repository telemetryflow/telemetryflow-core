import { DomainEvent } from "../../../../shared/domain/base/DomainEvent";

export class WorkspaceCreatedEvent extends DomainEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly organizationId: string,
  ) {
    super();
  }

  getEventName(): string {
    return "tenancy.workspace.created";
  }
}
