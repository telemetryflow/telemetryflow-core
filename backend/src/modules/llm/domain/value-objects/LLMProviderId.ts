/**
 * LLMProviderId Value Object
 * Unique identifier for an LLM Provider
 */

import { randomUUID } from "crypto";

export class LLMProviderId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(value: string): LLMProviderId {
    if (!value || value.trim().length === 0) {
      throw new Error("LLMProviderId cannot be empty");
    }
    return new LLMProviderId(value);
  }

  static generate(): LLMProviderId {
    return new LLMProviderId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: LLMProviderId): boolean {
    return this.value === other.value;
  }
}
