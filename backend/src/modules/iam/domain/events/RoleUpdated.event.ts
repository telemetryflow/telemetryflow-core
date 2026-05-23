import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class RoleUpdatedEvent extends DomainEvent {
  constructor(
    public readonly roleId: string,
    public readonly name?: string,
    public readonly description?: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'RoleUpdated';
  }
}
