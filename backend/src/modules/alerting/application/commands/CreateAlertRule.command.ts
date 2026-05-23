import {
  AlertSeverity,
  AlertConditionProps,
  NotificationChannelRef,
} from "../../domain";

export class CreateAlertRuleCommand {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly createdBy: string,
    public readonly description?: string,
    public readonly severity?: AlertSeverity,
    public readonly conditions?: AlertConditionProps[],
    public readonly notificationChannels?: NotificationChannelRef[],
    public readonly labels?: Record<string, string>,
    public readonly annotations?: Record<string, string>,
    public readonly evaluationInterval?: string,
    public readonly forDuration?: string,
    public readonly workspaceId?: string,
    public readonly muteTimings?: string[],
    public readonly queryLanguage?: string,
    public readonly queryString?: string,
    public readonly queryTarget?: string,
    public readonly sourceType?: string,
  ) {}
}
