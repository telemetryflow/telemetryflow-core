export class GetPolicyQuery {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}
