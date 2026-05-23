import { DomainEvent } from '@/shared/domain/DomainEvent';

export interface ApiKeyRotatedEventProps {
  apiKeyId: string;
  name: string;
  organizationId: string;
  rotatedBy: string;
  previousKeyPrefix: string;
  newKeyPrefix: string;
}

export class ApiKeyRotatedEvent extends DomainEvent {
  readonly apiKeyId: string;
  readonly name: string;
  readonly organizationId: string;
  readonly rotatedBy: string;
  readonly previousKeyPrefix: string;
  readonly newKeyPrefix: string;

  constructor(props: ApiKeyRotatedEventProps) {
    super();
    this.apiKeyId = props.apiKeyId;
    this.name = props.name;
    this.organizationId = props.organizationId;
    this.rotatedBy = props.rotatedBy;
    this.previousKeyPrefix = props.previousKeyPrefix;
    this.newKeyPrefix = props.newKeyPrefix;
  }
}
