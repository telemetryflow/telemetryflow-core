import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class TenantCreatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly workspaceId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'TenantCreatedEvent';
  }
}
