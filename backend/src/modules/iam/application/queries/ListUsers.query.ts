export class ListUsersQuery {
  constructor(
    public readonly page?: number,
    public readonly limit?: number,
    public readonly email?: string,
    public readonly organizationId?: string,
    public readonly workspaceId?: string,
    public readonly tenantId?: string,
    public readonly search?: string,
    public readonly isActive?: boolean,
  ) {}
}
