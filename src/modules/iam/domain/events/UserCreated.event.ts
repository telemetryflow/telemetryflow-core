import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'UserCreated';
  }
}
