import { DomainEvent } from '@/shared/domain/DomainEvent';

export interface ApiKeyCreatedEventProps {
  apiKeyId: string;
  name: string;
  keyPrefix: string;
  organizationId: string;
  workspaceId?: string;
  createdBy: string;
  permissions: string[];
  expiresAt?: Date;
}

export class ApiKeyCreatedEvent extends DomainEvent {
  readonly apiKeyId: string;
  readonly name: string;
  readonly keyPrefix: string;
  readonly organizationId: string;
  readonly workspaceId?: string;
  readonly createdBy: string;
  readonly permissions: string[];
  readonly expiresAt?: Date;

  constructor(props: ApiKeyCreatedEventProps) {
    super();
    this.apiKeyId = props.apiKeyId;
    this.name = props.name;
    this.keyPrefix = props.keyPrefix;
    this.organizationId = props.organizationId;
    this.workspaceId = props.workspaceId;
    this.createdBy = props.createdBy;
    this.permissions = props.permissions;
    this.expiresAt = props.expiresAt;
  }
}
