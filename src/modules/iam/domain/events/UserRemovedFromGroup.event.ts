import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class UserRemovedFromGroupEvent extends DomainEvent {
  constructor(
    public readonly groupId: string,
    public readonly userId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'user.removed-from-group';
  }
}
