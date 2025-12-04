export class UpdateTenantCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly domain?: string,
  ) {}
}
