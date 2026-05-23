import { DomainEvent } from '@/shared/domain/DomainEvent';

export interface ApiKeyRevokedEventProps {
  apiKeyId: string;
  name: string;
  organizationId: string;
  revokedBy: string;
  reason?: string;
}

export class ApiKeyRevokedEvent extends DomainEvent {
  readonly apiKeyId: string;
  readonly name: string;
  readonly organizationId: string;
  readonly revokedBy: string;
  readonly reason?: string;

  constructor(props: ApiKeyRevokedEventProps) {
    super();
    this.apiKeyId = props.apiKeyId;
    this.name = props.name;
    this.organizationId = props.organizationId;
    this.revokedBy = props.revokedBy;
    this.reason = props.reason;
  }
}
