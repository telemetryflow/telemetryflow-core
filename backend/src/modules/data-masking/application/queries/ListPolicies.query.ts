export class ListPoliciesQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 20,
    public readonly workspaceId?: string,
    public readonly enabled?: boolean,
    public readonly search?: string,
  ) {}
}
