/**
 * Message Entity
 * Represents a single message in a conversation
 */

import { MessageId } from "../value-objects";

export type MessageRole = "system" | "user" | "assistant";

export interface MessageProps {
  id: MessageId;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokensUsed?: number;
  modelId?: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateMessageParams {
  conversationId: string;
  role: MessageRole;
  content: string;
  tokensUsed?: number;
  modelId?: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
}

export class Message {
  private readonly props: MessageProps;

  private constructor(props: MessageProps) {
    this.props = Object.freeze(props);
  }

  static create(params: CreateMessageParams): Message {
    return new Message({
      id: MessageId.generate(),
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      tokensUsed: params.tokensUsed,
      modelId: params.modelId,
      latencyMs: params.latencyMs,
      metadata: params.metadata,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: MessageProps): Message {
    return new Message(props);
  }

  // Getters
  getId(): string {
    return this.props.id.getValue();
  }

  getIdObject(): MessageId {
    return this.props.id;
  }

  getConversationId(): string {
    return this.props.conversationId;
  }

  getRole(): MessageRole {
    return this.props.role;
  }

  getContent(): string {
    return this.props.content;
  }

  getTokensUsed(): number | undefined {
    return this.props.tokensUsed;
  }

  getModelId(): string | undefined {
    return this.props.modelId;
  }

  getLatencyMs(): number | undefined {
    return this.props.latencyMs;
  }

  getMetadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  isUserMessage(): boolean {
    return this.props.role === "user";
  }

  isAssistantMessage(): boolean {
    return this.props.role === "assistant";
  }

  isSystemMessage(): boolean {
    return this.props.role === "system";
  }
}
