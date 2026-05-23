import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

/**
 * Domain Event: User self-registered (distinct from admin-created UserCreatedEvent)
 */
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly regionId: string,
    public readonly organizationId: string | null,
  ) {
    super();
  }

  getEventName(): string {
    return 'UserRegistered';
  }
}
