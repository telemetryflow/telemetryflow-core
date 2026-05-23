export class GetRetentionPolicyQuery {
  constructor(
    public readonly id: string,
    public readonly organizationId?: string,
  ) {}
}
