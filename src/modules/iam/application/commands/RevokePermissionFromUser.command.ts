export class RevokePermissionFromUserCommand {
  constructor(
    public readonly userId: string,
    public readonly permissionId: string,
  ) {}
}
