import { DataType } from '../../domain/aggregates/RetentionPolicy';

export class EnforceRetentionCommand {
  constructor(
    public readonly dataType?: DataType,
    public readonly organizationId?: string,
    public readonly dryRun?: boolean,
  ) {}
}
