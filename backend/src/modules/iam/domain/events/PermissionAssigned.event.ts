import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class PermissionAssignedEvent extends DomainEvent {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'PermissionAssigned';
  }
}
