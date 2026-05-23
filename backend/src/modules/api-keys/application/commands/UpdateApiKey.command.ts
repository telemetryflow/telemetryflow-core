export class UpdateApiKeyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly permissions?: string[],
    public readonly scopes?: string[],
    public readonly rateLimit?: number,
    public readonly expiresAt?: Date | null,
  ) {}
}
