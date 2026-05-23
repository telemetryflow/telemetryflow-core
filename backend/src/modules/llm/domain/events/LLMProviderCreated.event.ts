/**
 * LLMProviderCreated Domain Event
 * Fired when a new LLM provider is created
 */

export class LLMProviderCreatedEvent {
  readonly eventName = "llm.provider.created";
  readonly occurredAt: Date;

  constructor(
    public readonly providerId: string,
    public readonly organizationId: string,
    public readonly providerName: string,
    public readonly providerType: string,
    public readonly createdBy: string,
  ) {
    this.occurredAt = new Date();
  }
}
