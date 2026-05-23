export class CreateWorkspaceCommand {
  constructor(
    public readonly name: string,
    public readonly code: string,
    public readonly organizationId: string,
    public readonly description?: string,
    public readonly datasourceConfig?: Record<string, any>,
  ) {}
}
