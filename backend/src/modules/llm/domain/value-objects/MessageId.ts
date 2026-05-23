/**
 * MessageId Value Object
 * Unique identifier for a Chat Message
 */

import { randomUUID } from "crypto";

export class MessageId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(value: string): MessageId {
    if (!value || value.trim().length === 0) {
      throw new Error("MessageId cannot be empty");
    }
    return new MessageId(value);
  }

  static generate(): MessageId {
    return new MessageId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.value;
  }
}
