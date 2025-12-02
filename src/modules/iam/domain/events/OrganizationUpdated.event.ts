import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class OrganizationUpdatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'OrganizationUpdated';
  }
}
