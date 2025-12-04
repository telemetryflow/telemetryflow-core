export class RevokeRoleFromUserCommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
  ) {}
}
