export class AlertTriggeredEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly alertRuleId: string,
    public readonly alertInstanceId: string,
    public readonly organizationId: string,
    public readonly severity: string,
    public readonly title: string,
    public readonly description: string,
    public readonly currentValue: number,
    public readonly threshold: number,
    public readonly labels: Record<string, string>,
  ) {
    this.occurredAt = new Date();
  }
}
