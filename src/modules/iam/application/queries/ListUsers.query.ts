export class ListUsersQuery {
  constructor(
    public readonly page?: number,
    public readonly limit?: number,
    public readonly email?: string,
    public readonly organizationId?: string,
  ) {}
}
