import { DomainEvent } from "@/shared/domain/DomainEvent";

export interface ApiKeyDeletedEventProps {
  apiKeyId: string;
  name: string;
  organizationId: string;
  deletedBy: string;
}

export class ApiKeyDeletedEvent extends DomainEvent {
  readonly apiKeyId: string;
  readonly name: string;
  readonly organizationId: string;
  readonly deletedBy: string;

  constructor(props: ApiKeyDeletedEventProps) {
    super();
    this.apiKeyId = props.apiKeyId;
    this.name = props.name;
    this.organizationId = props.organizationId;
    this.deletedBy = props.deletedBy;
  }
}
