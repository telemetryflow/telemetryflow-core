export class RoleRevokedEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
  ) {}
}
