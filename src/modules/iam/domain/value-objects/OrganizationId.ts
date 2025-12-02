import { v4 as uuidv4 } from 'uuid';

export class OrganizationId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('OrganizationId cannot be empty');
    }
  }

  static create(id?: string): OrganizationId {
    return new OrganizationId(id || uuidv4());
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
