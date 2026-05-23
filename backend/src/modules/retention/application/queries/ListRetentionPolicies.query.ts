import { DataType } from '../../domain/aggregates/RetentionPolicy';

export class ListRetentionPoliciesQuery {
  constructor(
    public readonly organizationId?: string,
    public readonly dataType?: DataType,
    public readonly includeDefaults?: boolean,
  ) {}
}
