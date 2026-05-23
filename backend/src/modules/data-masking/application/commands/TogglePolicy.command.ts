export class TogglePolicyCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly enabled: boolean,
    public readonly updatedBy: string,
  ) {}
}
