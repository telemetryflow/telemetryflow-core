export class CreateTenantCommand {
  constructor(
    public readonly name: string,
    public readonly code: string,
    public readonly workspaceId: string,
    public readonly domain?: string,
  ) {}
}
