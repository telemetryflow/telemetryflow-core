import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class RoleCreatedEvent extends DomainEvent {
  constructor(
    public readonly roleId: string,
    public readonly name: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'RoleCreated';
  }
}
