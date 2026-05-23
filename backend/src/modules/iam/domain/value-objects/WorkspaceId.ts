import { randomUUID } from 'crypto';

export class WorkspaceId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('WorkspaceId cannot be empty');
    }
  }

  static create(id?: string): WorkspaceId {
    return new WorkspaceId(id || randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: WorkspaceId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
