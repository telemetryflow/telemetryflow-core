import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { DataType } from '../aggregates/RetentionPolicy';

export class RetentionPolicyCreatedEvent extends DomainEvent {
  constructor(
    public readonly policyId: string,
    public readonly name: string,
    public readonly dataType: DataType,
    public readonly retentionDays: number,
    public readonly organizationId?: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.policyId;
  }
}
