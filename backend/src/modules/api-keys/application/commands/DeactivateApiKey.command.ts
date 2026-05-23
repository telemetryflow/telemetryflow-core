export class DeactivateApiKeyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}
