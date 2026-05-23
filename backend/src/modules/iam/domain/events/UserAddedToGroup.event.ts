import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class UserAddedToGroupEvent extends DomainEvent {
  constructor(
    public readonly groupId: string,
    public readonly userId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'user.added-to-group';
  }
}
