export class WorkspaceCreatedEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly organizationId: string,
  ) {}
}
