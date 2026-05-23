/**
 * ConversationId Value Object
 * Unique identifier for a Chat Conversation
 */

import { randomUUID } from "crypto";

export class ConversationId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(value: string): ConversationId {
    if (!value || value.trim().length === 0) {
      throw new Error("ConversationId cannot be empty");
    }
    return new ConversationId(value);
  }

  static generate(): ConversationId {
    return new ConversationId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ConversationId): boolean {
    return this.value === other.value;
  }
}
