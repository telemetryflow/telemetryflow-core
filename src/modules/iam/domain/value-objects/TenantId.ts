import { v4 as uuidv4 } from 'uuid';

export class TenantId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TenantId cannot be empty');
    }
  }

  static create(id?: string): TenantId {
    return new TenantId(id || uuidv4());
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
