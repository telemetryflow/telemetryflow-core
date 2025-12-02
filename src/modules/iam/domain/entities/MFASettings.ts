export class MFASettings {
  constructor(
    public enabled: boolean,
    public secret?: string,
    public backupCodes?: string[],
  ) {}

  static createEnabled(secret: string, backupCodes: string[] = []): MFASettings {
    return new MFASettings(true, secret, backupCodes);
  }

  static createDisabled(): MFASettings {
    return new MFASettings(false);
  }
}
