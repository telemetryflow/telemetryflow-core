import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class GroupCreatedEvent extends DomainEvent {
  constructor(
    public readonly groupId: string,
    public readonly name: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'group.created';
  }
}
