export class AlertResolvedEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly alertRuleId: string,
    public readonly alertInstanceId: string,
    public readonly organizationId: string,
    public readonly resolvedBy: "auto" | "manual",
    public readonly resolvedByUserId?: string,
    public readonly resolution?: string,
  ) {
    this.occurredAt = new Date();
  }
}
