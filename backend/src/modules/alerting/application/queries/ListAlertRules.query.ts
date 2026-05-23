export class ListAlertRulesQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 20,
    public readonly enabled?: boolean,
    public readonly severity?: string,
    public readonly state?: string,
    public readonly search?: string,
    public readonly graphId?: string,
  ) {}
}
