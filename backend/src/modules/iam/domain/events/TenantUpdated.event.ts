import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class TenantUpdatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'TenantUpdatedEvent';
  }
}
