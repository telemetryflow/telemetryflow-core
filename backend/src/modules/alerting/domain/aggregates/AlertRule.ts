import {
  AlertRuleId,
  AlertCondition,
  AlertConditionProps,
  AlertSeverity,
} from "../value-objects";
import { AlertTriggeredEvent } from "../events";

export enum AlertRuleState {
  OK = "ok",
  PENDING = "pending",
  ALERTING = "alerting",
  NO_DATA = "no_data",
  ERROR = "error",
}

export interface NotificationChannelRef {
  channelId: string;
  sendOnResolve: boolean;
}

export interface AlertRuleProps {
  id: AlertRuleId;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
  conditions: AlertCondition[];
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
}

export class AlertRule {
  private _domainEvents: unknown[] = [];

  private constructor(private props: AlertRuleProps) {}

  static create(params: {
    organizationId: string;
    name: string;
    createdBy: string;
    description?: string;
    severity?: AlertSeverity;
    conditions?: AlertConditionProps[];
    notificationChannels?: NotificationChannelRef[];
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    evaluationInterval?: string;
    forDuration?: string;
    workspaceId?: string;
    muteTimings?: string[];
    queryLanguage?: string;
    queryString?: string;
    queryTarget?: string;
    sourceType?: string;
  }): AlertRule {
    const now = new Date();
    const conditions = (params.conditions || []).map((c) =>
      AlertCondition.create(c),
    );

    return new AlertRule({
      id: AlertRuleId.generate(),
      organizationId: params.organizationId,
      workspaceId: params.workspaceId,
      name: params.name,
      description: params.description,
      severity: params.severity || AlertSeverity.WARNING,
      conditions,
      notificationChannels: params.notificationChannels || [],
      labels: params.labels || {},
      annotations: params.annotations || {},
      enabled: true,
      state: AlertRuleState.OK,
      evaluationInterval: params.evaluationInterval || "1m",
      forDuration: params.forDuration || "5m",
      muteTimings: params.muteTimings,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
      queryLanguage: params.queryLanguage,
      queryString: params.queryString,
      queryTarget: params.queryTarget,
      sourceType: params.sourceType,
    });
  }

  static reconstitute(props: {
    id: AlertRuleId;
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
    queryLanguage?: string;
    queryString?: string;
    queryTarget?: string;
    sourceType?: string;
  }): AlertRule {
    return new AlertRule({
      ...props,
      conditions: props.conditions.map((c) => AlertCondition.create(c)),
    });
  }

  // Getters
  get domainEvents(): unknown[] {
    return [...this._domainEvents];
  }

  getId(): string {
    return this.props.id.toString();
  }

  getOrganizationId(): string {
    return this.props.organizationId;
  }

  getWorkspaceId(): string | undefined {
    return this.props.workspaceId;
  }

  getName(): string {
    return this.props.name;
  }

  getDescription(): string | undefined {
    return this.props.description;
  }

  getSeverity(): AlertSeverity {
    return this.props.severity;
  }

  getConditions(): AlertConditionProps[] {
    return this.props.conditions.map((c) => c.toJSON());
  }

  getNotificationChannels(): NotificationChannelRef[] {
    return [...this.props.notificationChannels];
  }

  getLabels(): Record<string, string> {
    return { ...this.props.labels };
  }

  getAnnotations(): Record<string, string> {
    return { ...this.props.annotations };
  }

  isEnabled(): boolean {
    return this.props.enabled;
  }

  getState(): AlertRuleState {
    return this.props.state;
  }

  getEvaluationInterval(): string {
    return this.props.evaluationInterval;
  }

  getForDuration(): string {
    return this.props.forDuration;
  }

  getMuteTimings(): string[] | undefined {
    return this.props.muteTimings;
  }

  getLastEvaluatedAt(): Date | undefined {
    return this.props.lastEvaluatedAt;
  }

  getLastTriggeredAt(): Date | undefined {
    return this.props.lastTriggeredAt;
  }

  getCreatedBy(): string {
    return this.props.createdBy;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  getQueryLanguage(): string | undefined {
    return this.props.queryLanguage;
  }

  getQueryString(): string | undefined {
    return this.props.queryString;
  }

  getQueryTarget(): string | undefined {
    return this.props.queryTarget;
  }

  getSourceType(): string | undefined {
    return this.props.sourceType;
  }

  getTenantId(): string {
    return this.props.organizationId;
  }

  getNotificationGroupId(): string | undefined {
    // Legacy support: return first channel ID if exists
    return this.props.notificationChannels.length > 0
      ? this.props.notificationChannels[0].channelId
      : undefined;
  }

  getTimeWindow(): number {
    // Parse forDuration to minutes (default: 5 minutes)
    const duration = this.props.forDuration || "5m";
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 5;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return Math.max(1, Math.ceil(value / 60));
      case "m":
        return value;
      case "h":
        return value * 60;
      case "d":
        return value * 60 * 24;
      default:
        return 5;
    }
  }

  // Commands
  update(params: {
    name?: string;
    description?: string;
    severity?: AlertSeverity;
    conditions?: AlertConditionProps[];
    notificationChannels?: NotificationChannelRef[];
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    evaluationInterval?: string;
    forDuration?: string;
    muteTimings?: string[];
  }): void {
    if (params.name !== undefined) {
      this.props.name = params.name;
    }
    if (params.description !== undefined) {
      this.props.description = params.description;
    }
    if (params.severity !== undefined) {
      this.props.severity = params.severity;
    }
    if (params.conditions !== undefined) {
      this.props.conditions = params.conditions.map((c) =>
        AlertCondition.create(c),
      );
    }
    if (params.notificationChannels !== undefined) {
      this.props.notificationChannels = params.notificationChannels;
    }
    if (params.labels !== undefined) {
      this.props.labels = params.labels;
    }
    if (params.annotations !== undefined) {
      this.props.annotations = params.annotations;
    }
    if (params.evaluationInterval !== undefined) {
      this.props.evaluationInterval = params.evaluationInterval;
    }
    if (params.forDuration !== undefined) {
      this.props.forDuration = params.forDuration;
    }
    if (params.muteTimings !== undefined) {
      this.props.muteTimings = params.muteTimings;
    }

    this.props.updatedAt = new Date();
  }

  enable(): void {
    this.props.enabled = true;
    this.props.updatedAt = new Date();
  }

  disable(): void {
    this.props.enabled = false;
    this.props.state = AlertRuleState.OK;
    this.props.updatedAt = new Date();
  }

  /**
   * Evaluate the rule with a given value
   * Returns true if the alert should trigger
   */
  evaluate(values: Record<string, number>): {
    shouldTrigger: boolean;
    matchedConditions: number[];
  } {
    if (!this.props.enabled) {
      return { shouldTrigger: false, matchedConditions: [] };
    }

    this.props.lastEvaluatedAt = new Date();
    const matchedConditions: number[] = [];

    for (let i = 0; i < this.props.conditions.length; i++) {
      const condition = this.props.conditions[i];
      const value = values[condition.getMetric()];
      if (condition.evaluate(value)) {
        matchedConditions.push(i);
      }
    }

    // All conditions must match for the alert to trigger
    const shouldTrigger =
      matchedConditions.length === this.props.conditions.length &&
      this.props.conditions.length > 0;

    return { shouldTrigger, matchedConditions };
  }

  /**
   * Trigger the alert
   */
  trigger(
    alertInstanceId: string,
    currentValue: number,
    threshold: number,
  ): void {
    this.props.state = AlertRuleState.ALERTING;
    this.props.lastTriggeredAt = new Date();
    this.props.updatedAt = new Date();

    this._domainEvents.push(
      new AlertTriggeredEvent(
        this.getId(),
        alertInstanceId,
        this.props.organizationId,
        this.props.severity,
        this.props.name,
        this.props.description || "",
        currentValue,
        threshold,
        this.props.labels,
      ),
    );
  }

  /**
   * Mark alert as pending (condition met but waiting for forDuration)
   */
  markPending(): void {
    if (this.props.state !== AlertRuleState.ALERTING) {
      this.props.state = AlertRuleState.PENDING;
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Resolve the alert (condition no longer met)
   */
  resolve(): void {
    if (
      this.props.state === AlertRuleState.ALERTING ||
      this.props.state === AlertRuleState.PENDING
    ) {
      this.props.state = AlertRuleState.OK;
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Mark as no data
   */
  markNoData(): void {
    this.props.state = AlertRuleState.NO_DATA;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as error
   */
  markError(): void {
    this.props.state = AlertRuleState.ERROR;
    this.props.updatedAt = new Date();
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
