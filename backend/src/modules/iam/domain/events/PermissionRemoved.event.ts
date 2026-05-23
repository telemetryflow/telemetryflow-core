import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class PermissionRemovedEvent extends DomainEvent {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'PermissionRemoved';
  }
}
