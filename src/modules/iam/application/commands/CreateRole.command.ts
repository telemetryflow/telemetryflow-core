export class CreateRoleCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly permissionIds: string[] = [],
    public readonly tenantId?: string,
  ) {}
}
