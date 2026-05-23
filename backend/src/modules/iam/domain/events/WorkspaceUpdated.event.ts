export class WorkspaceUpdatedEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly name: string,
  ) {}
}
