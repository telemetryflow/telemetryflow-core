import { ValueObject } from '../../../../shared/domain/base/ValueObject';
import { randomUUID } from 'crypto';

export class UserId extends ValueObject<string> {
  private constructor(value: string) { super(value); }
  

  static fromString(value: string): UserId {
    return new UserId(value);
  }

  static create(value: string): UserId {
    return new UserId(value);
  }
  
  static generate(): UserId {
    return new UserId(randomUUID());
  }
  
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
  }
}
