export class UpdateRetentionPolicyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId?: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly retentionDays?: number,
    public readonly archiveEnabled?: boolean,
    public readonly archiveDestination?: string,
    public readonly filters?: Record<string, string>,
    public readonly isActive?: boolean,
  ) {}
}
