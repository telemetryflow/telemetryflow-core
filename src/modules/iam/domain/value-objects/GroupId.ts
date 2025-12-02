import { v4 as uuidv4 } from 'uuid';

export class GroupId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('GroupId cannot be empty');
    }
  }

  static create(id?: string): GroupId {
    return new GroupId(id || uuidv4());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GroupId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
