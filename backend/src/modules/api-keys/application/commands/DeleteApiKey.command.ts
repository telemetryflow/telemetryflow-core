export class DeleteApiKeyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly deletedBy: string,
  ) {}
}
