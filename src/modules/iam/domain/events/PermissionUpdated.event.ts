import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class PermissionUpdatedEvent extends DomainEvent {
  constructor(
    public readonly permissionId: string,
    public readonly name?: string,
    public readonly description?: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'permission.updated';
  }
}
