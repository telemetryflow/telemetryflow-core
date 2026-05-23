export class SilenceAlertCommand {
  constructor(
    public readonly alertInstanceId: string,
    public readonly organizationId: string,
    public readonly silenceUntil: Date,
    public readonly userId: string,
    public readonly comment?: string,
  ) {}
}
