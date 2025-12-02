export class CreateOrganizationCommand {
  constructor(
    public readonly name: string,
    public readonly code: string,
    public readonly regionId: string,
    public readonly description?: string,
    public readonly domain?: string,
  ) {}
}
