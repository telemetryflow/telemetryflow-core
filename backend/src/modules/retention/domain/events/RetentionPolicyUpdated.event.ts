import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { RetentionPolicyProps } from '../aggregates/RetentionPolicy';

export class RetentionPolicyUpdatedEvent extends DomainEvent {
  constructor(
    public readonly policyId: string,
    public readonly oldProps: RetentionPolicyProps,
    public readonly newProps: RetentionPolicyProps,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.policyId;
  }
}
