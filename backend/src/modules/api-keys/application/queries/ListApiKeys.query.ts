export class ListApiKeysQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 20,
    public readonly isActive?: boolean,
    public readonly keyType?: string,
    public readonly search?: string,
    public readonly workspaceId?: string,
    public readonly tenantId?: string,
    public readonly name?: string,
    public readonly keyPrefix?: string,
    public readonly createdBy?: string,
    public readonly limit: number = 20,
  ) {}
}
