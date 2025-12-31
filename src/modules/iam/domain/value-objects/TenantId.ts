import { randomUUID } from 'crypto';

export class TenantId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId cannot be empty');
    }
  }

  static create(id?: string): TenantId {
    return new TenantId(id || randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
