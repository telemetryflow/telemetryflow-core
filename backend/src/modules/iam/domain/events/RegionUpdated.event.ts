import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class RegionUpdatedEvent extends DomainEvent {
  constructor(
    public readonly regionId: string,
    public readonly name?: string,
    public readonly description?: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'region.updated';
  }
}
