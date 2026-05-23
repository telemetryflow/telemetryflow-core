import { DataType } from '../../domain/aggregates/RetentionPolicy';

export class GetRetentionStatisticsQuery {
  constructor(
    public readonly organizationId?: string,
    public readonly dataType?: DataType,
  ) {}
}
