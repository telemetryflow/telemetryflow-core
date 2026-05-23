export class CreateApiKeyCommand {
  constructor(
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly keyType: 'test' | 'secret' | 'standard' | 'service',
    public readonly permissions: string[],
    public readonly scopes: string[],
    public readonly rateLimit: number | undefined,
    public readonly expiresAt: Date | undefined,
    public readonly organizationId: string,
    public readonly workspaceId: string | undefined,
    public readonly tenantId: string | undefined,
    public readonly createdBy: string,
  ) {}
}
