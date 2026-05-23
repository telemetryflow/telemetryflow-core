import {
  AlertInstance,
  AlertInstanceStatus,
  AlertSeverity,
} from "../../domain";

export class AlertInstanceResponseDto {
  id: string;
  alertRuleId: string;
  organizationId: string;
  workspaceId?: string;
  status: AlertInstanceStatus;
  severity: AlertSeverity;
  title: string;
  description: string;
  currentValue: number;
  threshold: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: Date;
  endsAt?: Date;
  duration: number;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  acknowledgeComment?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  fingerprint: string;
  silencedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(instance: AlertInstance): AlertInstanceResponseDto {
    const dto = new AlertInstanceResponseDto();
    dto.id = instance.getId();
    dto.alertRuleId = instance.getAlertRuleId();
    dto.organizationId = instance.getOrganizationId();
    dto.workspaceId = instance.getWorkspaceId();
    dto.status = instance.getStatus();
    dto.severity = instance.getSeverity();
    dto.title = instance.getTitle();
    dto.description = instance.getDescription();
    dto.currentValue = instance.getCurrentValue();
    dto.threshold = instance.getThreshold();
    dto.labels = instance.getLabels();
    dto.annotations = instance.getAnnotations();
    dto.startsAt = instance.getStartsAt();
    dto.endsAt = instance.getEndsAt();
    dto.duration = instance.getDuration();
    dto.acknowledgedAt = instance.getAcknowledgedAt();
    dto.acknowledgedBy = instance.getAcknowledgedBy();
    dto.acknowledgeComment = instance.getAcknowledgeComment();
    dto.resolvedAt = instance.getResolvedAt();
    dto.resolvedBy = instance.getResolvedBy();
    dto.resolution = instance.getResolution();
    dto.fingerprint = instance.getFingerprint();
    dto.silencedUntil = instance.getSilencedUntil();
    dto.createdAt = instance.getCreatedAt();
    dto.updatedAt = instance.getUpdatedAt();
    return dto;
  }
}

export class AlertStatsResponseDto {
  total: number;
  firing: number;
  acknowledged: number;
  resolved: number;
  silenced: number;
  bySeverity: {
    critical: number;
    warning: number;
    info: number;
  };
}
