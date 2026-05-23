export class RevokeApiKeyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly revokedBy: string,
    public readonly reason?: string,
  ) {}
}
