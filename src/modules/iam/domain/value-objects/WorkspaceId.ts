import { v4 as uuidv4 } from 'uuid';

export class WorkspaceId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('WorkspaceId cannot be empty');
    }
  }

  static create(id?: string): WorkspaceId {
    return new WorkspaceId(id || uuidv4());
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
