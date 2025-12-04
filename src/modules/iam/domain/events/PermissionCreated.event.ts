import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class PermissionCreatedEvent extends DomainEvent {
  constructor(
    public readonly permissionId: string,
    public readonly name: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'permission.created';
  }
}
