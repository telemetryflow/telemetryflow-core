export class AssignPermissionToUserCommand {
  constructor(
    public readonly userId: string,
    public readonly permissionId: string,
  ) {}
}
