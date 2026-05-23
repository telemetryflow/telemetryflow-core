import { DataType } from '../../domain/aggregates/RetentionPolicy';

export class CreateRetentionPolicyCommand {
  constructor(
    public readonly name: string,
    public readonly dataType: DataType,
    public readonly retentionDays: number,
    public readonly organizationId?: string,
    public readonly description?: string,
    public readonly archiveEnabled?: boolean,
    public readonly archiveDestination?: string,
    public readonly filters?: Record<string, string>,
  ) {}
}
