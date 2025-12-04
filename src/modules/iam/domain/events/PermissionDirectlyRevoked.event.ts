import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class PermissionDirectlyRevokedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly permissionId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'PermissionDirectlyRevoked';
  }
}
