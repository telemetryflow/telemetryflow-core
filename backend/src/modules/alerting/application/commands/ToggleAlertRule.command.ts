export class EnableAlertRuleCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}

export class DisableAlertRuleCommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
  ) {}
}
