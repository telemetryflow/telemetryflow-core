import { randomUUID } from 'crypto';

export class PermissionId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('PermissionId cannot be empty');
    }
  }

  static create(id?: string): PermissionId {
    return new PermissionId(id || randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PermissionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
