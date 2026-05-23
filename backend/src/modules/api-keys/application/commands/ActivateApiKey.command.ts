export class ActivateApiKeyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}
