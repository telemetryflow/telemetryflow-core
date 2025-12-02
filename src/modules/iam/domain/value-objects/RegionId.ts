import { v4 as uuidv4 } from 'uuid';

export class RegionId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('RegionId cannot be empty');
    }
  }

  static create(id?: string): RegionId {
    return new RegionId(id || uuidv4());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: RegionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
