export class GetApiKeyQuery {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}
