import { v4 as uuidv4 } from 'uuid';

/**
 * API Key ID Value Object
 */
export class ApiKeyId {
  private constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('ApiKeyId cannot be empty');
    }
  }

  static create(): ApiKeyId {
    return new ApiKeyId(uuidv4());
  }

  static fromString(value: string): ApiKeyId {
    return new ApiKeyId(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ApiKeyId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
