import { DomainEvent } from '../../../../shared/domain/base/DomainEvent';

export class RegionCreatedEvent extends DomainEvent {
  constructor(
    public readonly regionId: string,
    public readonly name: string,
    public readonly code: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'region.created';
  }
}
