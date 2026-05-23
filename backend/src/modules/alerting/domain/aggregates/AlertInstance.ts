import { v4 as uuidv4 } from "uuid";
import { AlertSeverity } from "../value-objects";
import { AlertResolvedEvent, AlertAcknowledgedEvent } from "../events";

export enum AlertInstanceStatus {
  FIRING = "firing",
  ACKNOWLEDGED = "acknowledged",
  RESOLVED = "resolved",
  SILENCED = "silenced",
}

export interface AlertInstanceProps {
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
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  acknowledgeComment?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  notificationsSent: string[];
  fingerprint: string;
  silencedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AlertInstance {
  private _domainEvents: unknown[] = [];

  private constructor(private props: AlertInstanceProps) {}

  static create(params: {
    alertRuleId: string;
    organizationId: string;
    severity: AlertSeverity;
    title: string;
    description: string;
    currentValue: number;
    threshold: number;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    workspaceId?: string;
  }): AlertInstance {
    const now = new Date();
    const labels = params.labels || {};

    // Generate fingerprint from labels and rule ID
    const fingerprint = AlertInstance.generateFingerprint(
      params.alertRuleId,
      labels,
    );

    return new AlertInstance({
      id: uuidv4(),
      alertRuleId: params.alertRuleId,
      organizationId: params.organizationId,
      workspaceId: params.workspaceId,
      status: AlertInstanceStatus.FIRING,
      severity: params.severity,
      title: params.title,
      description: params.description,
      currentValue: params.currentValue,
      threshold: params.threshold,
      labels,
      annotations: params.annotations || {},
      startsAt: now,
      notificationsSent: [],
      fingerprint,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AlertInstanceProps): AlertInstance {
    return new AlertInstance(props);
  }

  private static generateFingerprint(
    alertRuleId: string,
    labels: Record<string, string>,
  ): string {
    const sortedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${alertRuleId}:${sortedLabels}`;
  }

  // Getters
  get domainEvents(): unknown[] {
    return [...this._domainEvents];
  }

  get id(): string {
    return this.props.id;
  }

  getId(): string {
    return this.props.id;
  }

  getAlertRuleId(): string {
    return this.props.alertRuleId;
  }

  getOrganizationId(): string {
    return this.props.organizationId;
  }

  getWorkspaceId(): string | undefined {
    return this.props.workspaceId;
  }

  getStatus(): AlertInstanceStatus {
    return this.props.status;
  }

  getSeverity(): AlertSeverity {
    return this.props.severity;
  }

  getTitle(): string {
    return this.props.title;
  }

  getDescription(): string {
    return this.props.description;
  }

  getCurrentValue(): number {
    return this.props.currentValue;
  }

  getThreshold(): number {
    return this.props.threshold;
  }

  getLabels(): Record<string, string> {
    return { ...this.props.labels };
  }

  getAnnotations(): Record<string, string> {
    return { ...this.props.annotations };
  }

  getStartsAt(): Date {
    return this.props.startsAt;
  }

  getEndsAt(): Date | undefined {
    return this.props.endsAt;
  }

  getAcknowledgedAt(): Date | undefined {
    return this.props.acknowledgedAt;
  }

  getAcknowledgedBy(): string | undefined {
    return this.props.acknowledgedBy;
  }

  getAcknowledgeComment(): string | undefined {
    return this.props.acknowledgeComment;
  }

  getResolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  getResolvedBy(): string | undefined {
    return this.props.resolvedBy;
  }

  getResolution(): string | undefined {
    return this.props.resolution;
  }

  getNotificationsSent(): string[] {
    return [...this.props.notificationsSent];
  }

  getFingerprint(): string {
    return this.props.fingerprint;
  }

  getSilencedUntil(): Date | undefined {
    return this.props.silencedUntil;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  getDuration(): number {
    const endTime = this.props.endsAt || new Date();
    return endTime.getTime() - this.props.startsAt.getTime();
  }

  isFiring(): boolean {
    return this.props.status === AlertInstanceStatus.FIRING;
  }

  isResolved(): boolean {
    return this.props.status === AlertInstanceStatus.RESOLVED;
  }

  isSilenced(): boolean {
    if (this.props.status === AlertInstanceStatus.SILENCED) {
      return true;
    }
    if (this.props.silencedUntil && this.props.silencedUntil > new Date()) {
      return true;
    }
    return false;
  }

  getValue(): number {
    return this.props.currentValue;
  }

  getFiredAt(): Date {
    return this.props.startsAt;
  }

  // Commands
  escalate(escalationLevel: number): void {
    // Escalation logic - could be extended to update severity or other properties
    this.props.annotations = {
      ...this.props.annotations,
      escalation_level: escalationLevel.toString(),
      escalated_at: new Date().toISOString(),
    };
    this.props.updatedAt = new Date();
  }
  acknowledge(userId: string, comment?: string): void {
    if (this.props.status !== AlertInstanceStatus.FIRING) {
      return;
    }

    this.props.status = AlertInstanceStatus.ACKNOWLEDGED;
    this.props.acknowledgedAt = new Date();
    this.props.acknowledgedBy = userId;
    this.props.acknowledgeComment = comment;
    this.props.updatedAt = new Date();

    this._domainEvents.push(
      new AlertAcknowledgedEvent(
        this.props.alertRuleId,
        this.props.id,
        this.props.organizationId,
        userId,
        comment,
      ),
    );
  }

  resolve(
    resolvedBy: "auto" | "manual",
    userId?: string,
    resolution?: string,
  ): void {
    if (this.props.status === AlertInstanceStatus.RESOLVED) {
      return;
    }

    this.props.status = AlertInstanceStatus.RESOLVED;
    this.props.endsAt = new Date();
    this.props.resolvedAt = new Date();
    this.props.resolvedBy = resolvedBy === "manual" ? userId : "system";
    this.props.resolution = resolution;
    this.props.updatedAt = new Date();

    this._domainEvents.push(
      new AlertResolvedEvent(
        this.props.alertRuleId,
        this.props.id,
        this.props.organizationId,
        resolvedBy,
        userId,
        resolution,
      ),
    );
  }

  silence(until: Date): void {
    this.props.status = AlertInstanceStatus.SILENCED;
    this.props.silencedUntil = until;
    this.props.updatedAt = new Date();
  }

  unsilence(): void {
    if (this.props.status === AlertInstanceStatus.SILENCED) {
      this.props.status = AlertInstanceStatus.FIRING;
      this.props.silencedUntil = undefined;
      this.props.updatedAt = new Date();
    }
  }

  updateValue(value: number): void {
    this.props.currentValue = value;
    this.props.updatedAt = new Date();
  }

  recordNotificationSent(channelId: string): void {
    if (!this.props.notificationsSent.includes(channelId)) {
      this.props.notificationsSent.push(channelId);
      this.props.updatedAt = new Date();
    }
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
