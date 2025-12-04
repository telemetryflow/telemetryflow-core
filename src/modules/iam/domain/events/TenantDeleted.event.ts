import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class TenantDeletedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'TenantDeletedEvent';
  }
}
