import { randomUUID } from 'crypto';

export class RoleId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('RoleId cannot be empty');
    }
  }

  static create(id?: string): RoleId {
    return new RoleId(id || randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RoleId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
