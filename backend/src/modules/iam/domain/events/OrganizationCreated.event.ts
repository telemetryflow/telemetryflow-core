import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class OrganizationCreatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly regionId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'OrganizationCreated';
  }
}
