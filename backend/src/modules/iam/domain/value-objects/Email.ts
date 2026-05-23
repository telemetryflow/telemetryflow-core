import { ValueObject } from '../../../../shared/domain/base/ValueObject';

export class Email extends ValueObject<string> {
  private constructor(value: string) { super(value); }

  static fromString(value: string): Email {
    return new Email(value.toLowerCase().trim());
  }

  static create(value: string): Email {
    return new Email(value.toLowerCase().trim());
  }
  
  protected validate(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
  }
}
