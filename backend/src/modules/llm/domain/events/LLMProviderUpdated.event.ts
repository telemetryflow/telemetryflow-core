/**
 * LLMProviderUpdated Domain Event
 * Fired when an LLM provider is updated
 */

export class LLMProviderUpdatedEvent {
  readonly eventName = "llm.provider.updated";
  readonly occurredAt: Date;

  constructor(
    public readonly providerId: string,
    public readonly organizationId: string,
    public readonly providerName: string,
  ) {
    this.occurredAt = new Date();
  }
}
