export class DeleteAlertRuleCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}
