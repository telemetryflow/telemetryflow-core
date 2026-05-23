import {
  AlertRule,
  AlertRuleState,
  AlertSeverity,
  AlertConditionProps,
  NotificationChannelRef,
} from "../../domain";

export class AlertRuleResponseDto {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
  conditions: AlertConditionProps[];
  notificationChannels: NotificationChannelRef[];
  labels: Record<string, string>;
  annotations: Record<string, string>;
  enabled: boolean;
  state: AlertRuleState;
  evaluationInterval: string;
  forDuration: string;
  muteTimings?: string[];
  lastEvaluatedAt?: Date;
  lastTriggeredAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // TFQL support
  queryLanguage?: string;
  queryString?: string;
  queryTarget?: string;
  sourceType?: string;

  static fromDomain(alertRule: AlertRule): AlertRuleResponseDto {
    const dto = new AlertRuleResponseDto();
    dto.id = alertRule.getId();
    dto.organizationId = alertRule.getOrganizationId();
    dto.workspaceId = alertRule.getWorkspaceId();
    dto.name = alertRule.getName();
    dto.description = alertRule.getDescription();
    dto.severity = alertRule.getSeverity();
    dto.conditions = alertRule.getConditions();
    dto.notificationChannels = alertRule.getNotificationChannels();
    dto.labels = alertRule.getLabels();
    dto.annotations = alertRule.getAnnotations();
    dto.enabled = alertRule.isEnabled();
    dto.state = alertRule.getState();
    dto.evaluationInterval = alertRule.getEvaluationInterval();
    dto.forDuration = alertRule.getForDuration();
    dto.muteTimings = alertRule.getMuteTimings();
    dto.lastEvaluatedAt = alertRule.getLastEvaluatedAt();
    dto.lastTriggeredAt = alertRule.getLastTriggeredAt();
    dto.createdBy = alertRule.getCreatedBy();
    dto.createdAt = alertRule.getCreatedAt();
    dto.updatedAt = alertRule.getUpdatedAt();
    dto.queryLanguage = alertRule.getQueryLanguage();
    dto.queryString = alertRule.getQueryString();
    dto.queryTarget = alertRule.getQueryTarget();
    dto.sourceType = alertRule.getSourceType();
    return dto;
  }
}
