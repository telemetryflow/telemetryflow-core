import { randomUUID } from 'crypto';

export class RegionId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('RegionId cannot be empty');
    }
  }

  static create(id?: string): RegionId {
    return new RegionId(id || randomUUID());
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
