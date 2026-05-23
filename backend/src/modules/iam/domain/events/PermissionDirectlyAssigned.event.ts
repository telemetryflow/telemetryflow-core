import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class PermissionDirectlyAssignedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly permissionId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'PermissionDirectlyAssigned';
  }
}
