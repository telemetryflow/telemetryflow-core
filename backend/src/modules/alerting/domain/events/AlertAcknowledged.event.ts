export class AlertAcknowledgedEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly alertRuleId: string,
    public readonly alertInstanceId: string,
    public readonly organizationId: string,
    public readonly acknowledgedBy: string,
    public readonly comment?: string,
  ) {
    this.occurredAt = new Date();
  }
}
