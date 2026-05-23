/**
 * EncryptedApiKey Value Object
 * Represents an encrypted LLM provider API key
 */

export class EncryptedApiKey {
  private constructor(
    private readonly encryptedValue: string,
    private readonly hint: string,
  ) {
    Object.freeze(this);
  }

  static create(encryptedValue: string, hint: string): EncryptedApiKey {
    if (!encryptedValue || encryptedValue.trim().length === 0) {
      throw new Error("Encrypted API key value cannot be empty");
    }
    if (!hint || hint.trim().length === 0) {
      throw new Error("API key hint cannot be empty");
    }
    return new EncryptedApiKey(encryptedValue, hint);
  }

  static generateHint(rawApiKey: string): string {
    if (rawApiKey.length <= 10) {
      return "***";
    }
    const prefix = rawApiKey.substring(0, 5);
    const suffix = rawApiKey.substring(rawApiKey.length - 4);
    return `${prefix}...${suffix}`;
  }

  getValue(): string {
    return this.encryptedValue;
  }

  getHint(): string {
    return this.hint;
  }

  equals(other: EncryptedApiKey): boolean {
    return this.encryptedValue === other.encryptedValue;
  }
}
