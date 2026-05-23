import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class OrganizationDeletedEvent extends DomainEvent {
  constructor(public readonly organizationId: string) {
    super();
  }

  getEventName(): string {
    return 'OrganizationDeleted';
  }
}
