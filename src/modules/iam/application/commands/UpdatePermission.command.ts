export class UpdatePermissionCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly resource?: string,
    public readonly action?: string,
  ) {}
}
