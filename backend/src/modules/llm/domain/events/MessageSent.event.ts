/**
 * MessageSent Domain Event
 * Fired when a message is sent in a conversation
 */

import type { MessageRole } from "../entities/Message";

export class MessageSentEvent {
  readonly eventName = "llm.message.sent";
  readonly occurredAt: Date;

  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly organizationId: string,
    public readonly role: MessageRole,
  ) {
    this.occurredAt = new Date();
  }
}
