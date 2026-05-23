export class ResolveAlertCommand {
  constructor(
    public readonly alertInstanceId: string,
    public readonly organizationId: string,
    public readonly userId: string,
    public readonly resolution?: string,
  ) {}
}
