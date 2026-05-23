/**
 * ConversationStarted Domain Event
 * Fired when a new conversation is started
 */

import type { ContextType } from "../aggregates/Conversation";

export class ConversationStartedEvent {
  readonly eventName = "llm.conversation.started";
  readonly occurredAt: Date;

  constructor(
    public readonly conversationId: string,
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly contextType: ContextType,
  ) {
    this.occurredAt = new Date();
  }
}
