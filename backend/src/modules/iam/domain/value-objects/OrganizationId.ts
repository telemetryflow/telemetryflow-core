import { randomUUID } from 'crypto';

export class OrganizationId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('OrganizationId cannot be empty');
    }
  }

  static create(id?: string): OrganizationId {
    return new OrganizationId(id || randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
