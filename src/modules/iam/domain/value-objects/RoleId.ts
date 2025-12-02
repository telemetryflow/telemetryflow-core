import { v4 as uuidv4 } from 'uuid';

export class RoleId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('RoleId cannot be empty');
    }
  }

  static create(id?: string): RoleId {
    return new RoleId(id || uuidv4());
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
