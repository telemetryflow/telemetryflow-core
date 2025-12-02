import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class GroupUpdatedEvent extends DomainEvent {
  constructor(
    public readonly groupId: string,
    public readonly name?: string,
    public readonly description?: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'group.updated';
  }
}
