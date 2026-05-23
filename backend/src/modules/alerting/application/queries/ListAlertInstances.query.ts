import { AlertInstanceStatus } from "../../domain";

export class ListAlertInstancesQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly pageSize: number = 20,
    public readonly status?: AlertInstanceStatus | AlertInstanceStatus[],
    public readonly severity?: string,
    public readonly alertRuleId?: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}
