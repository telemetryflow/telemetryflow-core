/**
 * API Key Prefix Value Object
 * - tfk_ = Test/Development key
 * - tfs_ = Production/Secret key
 */
export enum KeyPrefixType {
  KEY_ID = 'tfk_',
  SECRET_ID = 'tfs_',
}

export class KeyPrefix {
  private constructor(private readonly value: KeyPrefixType) {}

  static key(): KeyPrefix {
    return new KeyPrefix(KeyPrefixType.KEY_ID);
  }

  static secret(): KeyPrefix {
    return new KeyPrefix(KeyPrefixType.SECRET_ID);
  }

  static fromString(value: string): KeyPrefix {
    if (value === KeyPrefixType.KEY_ID || value === 'tfk_') {
      return new KeyPrefix(KeyPrefixType.KEY_ID);
    }
    if (value === KeyPrefixType.SECRET_ID || value === 'tfs_') {
      return new KeyPrefix(KeyPrefixType.SECRET_ID);
    }
    throw new Error(`Invalid key prefix: ${value}. Must be 'tfk_' or 'tfs_'`);
  }

  getValue(): KeyPrefixType {
    return this.value;
  }

  isTest(): boolean {
    return this.value === KeyPrefixType.KEY_ID;
  }

  isSecret(): boolean {
    return this.value === KeyPrefixType.SECRET_ID;
  }

  toString(): string {
    return this.value;
  }

  equals(other: KeyPrefix): boolean {
    return this.value === other.value;
  }
}
