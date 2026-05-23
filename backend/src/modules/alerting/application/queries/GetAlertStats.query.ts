export class GetAlertStatsQuery {
  constructor(
    public readonly organizationId: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}
