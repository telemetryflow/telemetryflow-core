export class UpdateWorkspaceCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly datasourceConfig?: Record<string, any>,
  ) {}
}
