export class RoleAssignedEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
  ) {}
}
