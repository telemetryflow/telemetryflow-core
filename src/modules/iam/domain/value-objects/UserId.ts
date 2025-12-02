import { ValueObject } from '../../../../shared/domain/base/ValueObject';
import { v4 as uuid } from 'uuid';

export class UserId extends ValueObject<string> {
  private constructor(value: string) { super(value); }
  

  static fromString(value: string): UserId {
    return new UserId(value);
  }

  static create(value: string): UserId {
    return new UserId(value);
  }
  
  static generate(): UserId {
    return new UserId(uuid());
  }
  
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
  }
}
