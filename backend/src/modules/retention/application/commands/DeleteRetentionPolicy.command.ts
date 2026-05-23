export class DeleteRetentionPolicyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId?: string,
  ) {}
}
