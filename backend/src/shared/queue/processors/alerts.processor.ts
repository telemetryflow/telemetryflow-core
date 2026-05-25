import { Injectable, Logger, Inject } from "@nestjs/common";
import { Job } from "bullmq";
import { BaseProcessor } from "./base.processor";
import {
  JobData,
  QUEUE_SERVICE,
  QUEUE_NAMES,
} from "../interfaces/queue.interface";
import { QueueService } from "../queue.service";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";
import {
  IAlertRuleRepository,
  ALERT_RULE_REPOSITORY,
} from "@/modules/alerting/domain/repositories/IAlertRuleRepository";
import {
  IAlertInstanceRepository,
  ALERT_INSTANCE_REPOSITORY,
} from "@/modules/alerting/domain/repositories/IAlertInstanceRepository";
import { AlertInstance, AlertInstanceStatus } from "@/modules/alerting/domain/aggregates/AlertInstance";
import { AlertSeverity } from "@/modules/alerting/domain/value-objects/AlertCondition";
import { NotificationChannelService } from "@/modules/alerting/application/services/NotificationChannel.service";

/**
 * Alert Processing Job Types
 */
export enum AlertJobType {
  // Rule evaluation
  EVALUATE_RULE = "alert.evaluate.rule",
  EVALUATE_ALL_RULES = "alert.evaluate.all",

  // Alert lifecycle
  FIRE_ALERT = "alert.fire",
  RESOLVE_ALERT = "alert.resolve",
  ESCALATE_ALERT = "alert.escalate",

  // Notification
  SEND_ALERT_NOTIFICATION = "alert.notify",
  SEND_DIGEST = "alert.notify.digest",

  // Maintenance
  CLEANUP_OLD_ALERTS = "alert.maintenance.cleanup",
  CHECK_ALERT_HEALTH = "alert.maintenance.health",
}

/**
 * Alert Condition Types
 */
export interface AlertCondition {
  type: "threshold" | "anomaly" | "absence" | "change";
  metric: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=";
  value: number;
  duration: number;
  filters?: Record<string, string>;
}

/**
 * Alerts Processor
 * Handles alert rule evaluation, firing, and notification
 */
@Injectable()
export class AlertsProcessor extends BaseProcessor {
  protected readonly logger = new Logger(AlertsProcessor.name);
  protected readonly processorName = "AlertsProcessor";

  constructor(
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
    private readonly clickhouseService: ClickHouseService,
    @Inject(QUEUE_SERVICE)
    private readonly queueService: QueueService,
    private readonly notificationChannelService: NotificationChannelService,
  ) {
    super();
  }

  async process(job: Job<JobData>): Promise<void> {
    this.validateJobData(job);
    const correlationId = this.getCorrelationId(job);

    this.logger.debug(`Processing alert job ${job.id}`, {
      type: job.data.type,
      correlationId,
    });

    switch (job.data.type) {
      // Rule evaluation
      case AlertJobType.EVALUATE_RULE:
        await this.evaluateRule(job);
        break;
      case AlertJobType.EVALUATE_ALL_RULES:
        await this.evaluateAllRules(job);
        break;

      // Alert lifecycle
      case AlertJobType.FIRE_ALERT:
        await this.fireAlert(job);
        break;
      case AlertJobType.RESOLVE_ALERT:
        await this.resolveAlert(job);
        break;
      case AlertJobType.ESCALATE_ALERT:
        await this.escalateAlert(job);
        break;

      // Notification
      case AlertJobType.SEND_ALERT_NOTIFICATION:
        await this.sendNotification(job);
        break;
      case AlertJobType.SEND_DIGEST:
        await this.sendDigest(job);
        break;

      // Maintenance
      case AlertJobType.CLEANUP_OLD_ALERTS:
        await this.cleanupOldAlerts(job);
        break;
      case AlertJobType.CHECK_ALERT_HEALTH:
        await this.checkAlertHealth(job);
        break;

      default:
        this.logger.warn(`Unknown alert job type: ${job.data.type}`);
    }

    this.onComplete(job);
  }

  private async evaluateRule(job: Job<JobData>): Promise<void> {
    const { ruleId, condition, organizationId } = job.data.payload as {
      ruleId: string;
      condition: AlertCondition;
      organizationId: string;
    };

    this.logger.debug(`Evaluating alert rule`, { ruleId, condition });

    try {
      // Fetch the alert rule
      const rule = await this.alertRuleRepository.findById(ruleId);
      if (!rule || !rule.isEnabled()) {
        this.logger.debug(`Rule ${ruleId} not found or disabled, skipping`);
        return;
      }

      // Query metrics/logs based on condition
      const currentValue = await this.queryConditionValue(
        condition,
        organizationId,
      );

      // Apply threshold evaluation
      const shouldFire = this.evaluateCondition(currentValue, condition);

      // Check for existing active alert
      const activeAlerts =
        await this.alertInstanceRepository.findActiveByAlertRule(ruleId);

      if (shouldFire && activeAlerts.length === 0) {
        // Fire new alert
        this.logger.log(`Alert condition met for rule ${ruleId}, firing alert`);
        await this.queueService.addJob(QUEUE_NAMES.ALERTS, {
          type: AlertJobType.FIRE_ALERT,
          payload: {
            ruleId,
            ruleName: rule.getName(),
            severity: rule.getSeverity(),
            value: currentValue,
            condition,
            labels: rule.getLabels(),
          },
          metadata: {
            organizationId: rule.getOrganizationId(),
            workspaceId: rule.getWorkspaceId(),
            tenantId: rule.getTenantId(),
          },
        });
      } else if (!shouldFire && activeAlerts.length > 0) {
        // Resolve existing alerts
        this.logger.log(
          `Alert condition cleared for rule ${ruleId}, resolving alerts`,
        );
        for (const alert of activeAlerts) {
          await this.queueService.addJob(QUEUE_NAMES.ALERTS, {
            type: AlertJobType.RESOLVE_ALERT,
            payload: {
              alertId: alert.id,
              ruleId,
              resolvedBy: "auto",
            },
            metadata: {
              organizationId: rule.getOrganizationId(),
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to evaluate rule ${ruleId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async queryConditionValue(
    condition: AlertCondition,
    organizationId: string,
  ): Promise<number> {
    const now = new Date();
    const startTime = new Date(now.getTime() - condition.duration * 60 * 1000);

    try {
      // Query metrics from ClickHouse
      const metrics = await this.clickhouseService.queryMetrics({
        startTime,
        endTime: now,
        metric_name: condition.metric,
        organization_id: organizationId,
        limit: 1000,
      });

      if (metrics.length === 0) return 0;

      // Return the most recent value
      return metrics[metrics.length - 1].value;
    } catch (error) {
      this.logger.error(`Failed to query condition value: ${error.message}`);
      return 0;
    }
  }

  private evaluateCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case ">":
        return value > condition.value;
      case "<":
        return value < condition.value;
      case ">=":
        return value >= condition.value;
      case "<=":
        return value <= condition.value;
      case "==":
        return value === condition.value;
      case "!=":
        return value !== condition.value;
      default:
        return false;
    }
  }

  private async evaluateAllRules(job: Job<JobData>): Promise<void> {
    const { organizationId } = job.data.payload as {
      organizationId?: string;
    };

    this.logger.debug(`Evaluating all alert rules`, { organizationId });

    // Fetch all enabled alert rules
    let enabledRules;
    if (organizationId) {
      enabledRules =
        await this.alertRuleRepository.findEnabledByOrganization(
          organizationId,
        );
    } else {
      // Get all organizations with enabled rules
      const orgIds =
        await this.alertRuleRepository.findOrganizationsWithEnabledRules();

      enabledRules = [];
      for (const orgId of orgIds) {
        const rules =
          await this.alertRuleRepository.findEnabledByOrganization(orgId);
        enabledRules.push(...rules);
      }
    }

    this.logger.debug(`Found ${enabledRules.length} enabled rules to evaluate`);

    // Queue individual evaluation jobs for each rule
    for (const rule of enabledRules) {
      await this.queueService.addJob(QUEUE_NAMES.ALERTS, {
        type: AlertJobType.EVALUATE_RULE,
        payload: {
          ruleId: rule.id,
          condition: {
            type: "threshold",
            metric: rule.getQuery(),
            operator: rule.getOperator() as any,
            value: rule.getThreshold(),
            duration: rule.getTimeWindow() || 5,
          },
          organizationId: rule.getOrganizationId(),
        },
        metadata: {
          organizationId: rule.getOrganizationId(),
          workspaceId: rule.getWorkspaceId(),
          tenantId: rule.getTenantId(),
        },
      });
    }
  }

  private async fireAlert(job: Job<JobData>): Promise<void> {
    const { ruleId, ruleName, severity, value, condition, labels } = job.data
      .payload as {
      ruleId: string;
      ruleName: string;
      severity: "critical" | "warning" | "info";
      value: number;
      condition: AlertCondition;
      labels?: Record<string, string>;
    };

    this.logger.debug(`Firing alert`, { ruleId, ruleName, severity, value });

    try {
      // Fetch the alert rule
      const rule = await this.alertRuleRepository.findById(ruleId);
      if (!rule) {
        this.logger.warn(`Alert rule ${ruleId} not found`);
        return;
      }

      // Generate fingerprint for deduplication
      const fingerprint = this.generateFingerprint(ruleId, labels || {});

      // Check for duplicate active alerts
      const existingAlert =
        await this.alertInstanceRepository.findByFingerprint(fingerprint);
      if (existingAlert && existingAlert.getStatus() === "firing") {
        this.logger.debug(
          `Duplicate alert ${fingerprint} already firing, skipping`,
        );
        return;
      }

      // Convert severity string to enum
      const severityEnum = severity === "critical" ? AlertSeverity.CRITICAL
        : severity === "warning" ? AlertSeverity.WARNING
        : AlertSeverity.INFO;

      // Create alert instance
      const alertInstance = AlertInstance.create({
        alertRuleId: ruleId,
        organizationId: rule.getOrganizationId(),
        workspaceId: rule.getWorkspaceId(),
        severity: severityEnum,
        title: ruleName,
        description: `Alert rule ${ruleName} threshold ${condition.operator} ${condition.value} (current: ${value})`,
        currentValue: value,
        threshold: condition.value,
        labels: labels || {},
        annotations: {
          summary: `${ruleName} is ${severity}`,
          description: `Alert rule ${ruleName} threshold ${condition.operator} ${condition.value} (current: ${value})`,
          value: value.toString(),
        },
      });

      await this.alertInstanceRepository.save(alertInstance);

      this.logger.log(`Alert fired: ${alertInstance.id} (${ruleName})`);

      // Queue notification job
      const notificationGroupId = rule.getNotificationGroupId();
      if (notificationGroupId) {
        await this.queueService.addJob(QUEUE_NAMES.ALERTS, {
          type: AlertJobType.SEND_ALERT_NOTIFICATION,
          payload: {
            alertId: alertInstance.id,
            notificationGroupId,
            channels: [], // Will be fetched by notification handler
          },
          metadata: {
            organizationId: rule.getOrganizationId(),
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to fire alert: ${error.message}`, error.stack);
    }
  }

  private generateFingerprint(
    ruleId: string,
    labels: Record<string, string>,
  ): string {
    const crypto = require("crypto");
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return crypto
      .createHash("sha256")
      .update(`${ruleId}:${labelString}`)
      .digest("hex")
      .substring(0, 16);
  }

  private generateId(): string {
    const crypto = require("crypto");
    return crypto.randomUUID();
  }

  private async resolveAlert(job: Job<JobData>): Promise<void> {
    const { alertId, ruleId, resolvedBy } = job.data.payload as {
      alertId: string;
      ruleId: string;
      resolvedBy?: "auto" | "manual";
    };

    this.logger.debug(`Resolving alert`, { alertId, ruleId, resolvedBy });

    try {
      const alertInstance =
        await this.alertInstanceRepository.findById(alertId);
      if (!alertInstance) {
        this.logger.warn(`Alert instance ${alertId} not found`);
        return;
      }

      if (alertInstance.getStatus() === "resolved") {
        this.logger.debug(`Alert ${alertId} already resolved`);
        return;
      }

      // Update alert status to resolved
      alertInstance.resolve(resolvedBy || "auto");
      await this.alertInstanceRepository.save(alertInstance);

      this.logger.log(`Alert resolved: ${alertId} (${resolvedBy || "auto"})`);

      // Optionally send resolution notification
      // This could be configurable per organization
    } catch (error) {
      this.logger.error(
        `Failed to resolve alert: ${error.message}`,
        error.stack,
      );
    }
  }

  private async escalateAlert(job: Job<JobData>): Promise<void> {
    const { alertId, escalationLevel, notificationGroupId } = job.data
      .payload as {
      alertId: string;
      escalationLevel: number;
      notificationGroupId: string;
    };

    this.logger.debug(`Escalating alert`, { alertId, escalationLevel });

    try {
      const alertInstance =
        await this.alertInstanceRepository.findById(alertId);
      if (!alertInstance) {
        this.logger.warn(`Alert instance ${alertId} not found`);
        return;
      }

      if (alertInstance.getStatus() === "resolved") {
        this.logger.debug(
          `Alert ${alertId} already resolved, skipping escalation`,
        );
        return;
      }

      // Update escalation level
      alertInstance.escalate(escalationLevel);
      await this.alertInstanceRepository.save(alertInstance);

      this.logger.log(
        `Alert escalated: ${alertId} to level ${escalationLevel}`,
      );

      // Send notification to escalation contacts
      await this.queueService.addJob(QUEUE_NAMES.ALERTS, {
        type: AlertJobType.SEND_ALERT_NOTIFICATION,
        payload: {
          alertId,
          notificationGroupId,
          channels: [], // Will be fetched based on escalation level
        },
        metadata: {
          organizationId: alertInstance.getOrganizationId(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to escalate alert: ${error.message}`,
        error.stack,
      );
    }
  }

  private async sendNotification(job: Job<JobData>): Promise<void> {
    const { alertId, notificationGroupId, channels } = job.data.payload as {
      alertId: string;
      notificationGroupId: string;
      channels: Array<{
        type: "email" | "slack" | "pagerduty" | "webhook" | "teams";
        config: Record<string, unknown>;
      }>;
    };

    this.logger.debug(`Sending alert notification`, {
      alertId,
      channels: channels.length,
    });

    try {
      const alertInstance =
        await this.alertInstanceRepository.findById(alertId);
      if (!alertInstance) {
        this.logger.warn(`Alert instance ${alertId} not found`);
        return;
      }

      // Fetch notification channels from the notification group
      const notificationChannels =
        await this.notificationChannelService.getChannelsByGroup(
          notificationGroupId,
        );

      this.logger.debug(
        `Found ${notificationChannels.length} notification channels`,
      );

      // Queue individual notification jobs for each channel
      for (const channel of notificationChannels) {
        const notificationPayload = {
          subject: `[${alertInstance.getSeverity().toUpperCase()}] ${alertInstance.getLabels()["ruleName"] || "Alert"}`,
          message:
            alertInstance.getAnnotations()["description"] || "Alert triggered",
          alertId,
          severity: alertInstance.getSeverity(),
          metadata: {
            value: alertInstance.getValue(),
            labels: alertInstance.getLabels(),
            annotations: alertInstance.getAnnotations(),
          },
        };

        // Delegate to notifications queue based on channel type
        const notificationJobType = `notification.send.${channel.type}`;

        await this.queueService.addJob(QUEUE_NAMES.NOTIFICATIONS, {
          type: notificationJobType,
          payload: {
            ...notificationPayload,
            channelConfig: channel.config,
          },
          metadata: {
            organizationId: alertInstance.getOrganizationId(),
          },
        });
      }

      this.logger.log(
        `Queued ${notificationChannels.length} notification jobs for alert ${alertId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send alert notification: ${error.message}`,
        error.stack,
      );
    }
  }

  private async sendDigest(job: Job<JobData>): Promise<void> {
    const { organizationId, period, recipients } = job.data.payload as {
      organizationId: string;
      period: "hourly" | "daily" | "weekly";
      recipients: string[];
    };

    this.logger.debug(`Sending alert digest`, { organizationId, period });

    try {
      // Calculate time range based on period
      const now = new Date();
      const startDate = new Date(now);

      switch (period) {
        case "hourly":
          startDate.setHours(startDate.getHours() - 1);
          break;
        case "daily":
          startDate.setDate(startDate.getDate() - 1);
          break;
        case "weekly":
          startDate.setDate(startDate.getDate() - 7);
          break;
      }

      // Fetch alerts from the period
      const { items: alerts } =
        await this.alertInstanceRepository.findByOrganization(organizationId, {
          startDate,
          endDate: now,
        });

      if (alerts.length === 0) {
        this.logger.debug(
          `No alerts to digest for ${organizationId} (${period})`,
        );
        return;
      }

      // Compile alert summary
      const summary = {
        period,
        startDate,
        endDate: now,
        totalAlerts: alerts.length,
        criticalCount: alerts.filter((a) => a.getSeverity() === "critical")
          .length,
        warningCount: alerts.filter((a) => a.getSeverity() === "warning")
          .length,
        infoCount: alerts.filter((a) => a.getSeverity() === "info").length,
        resolvedCount: alerts.filter((a) => a.getStatus() === "resolved")
          .length,
        activeCount: alerts.filter((a) => a.getStatus() === "firing").length,
      };

      // Send digest email
      await this.queueService.addJob(QUEUE_NAMES.NOTIFICATIONS, {
        type: "notification.send.email",
        payload: {
          recipients,
          subject: `[TelemetryFlow] ${period.charAt(0).toUpperCase() + period.slice(1)} Alert Digest`,
          message:
            `Alert Summary for the past ${period}:\n\n` +
            `Total Alerts: ${summary.totalAlerts}\n` +
            `- Critical: ${summary.criticalCount}\n` +
            `- Warning: ${summary.warningCount}\n` +
            `- Info: ${summary.infoCount}\n\n` +
            `Status:\n` +
            `- Active: ${summary.activeCount}\n` +
            `- Resolved: ${summary.resolvedCount}`,
          metadata: summary,
        },
        metadata: {
          organizationId,
        },
      });

      this.logger.log(
        `Sent ${period} alert digest for ${organizationId} (${alerts.length} alerts)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send alert digest: ${error.message}`,
        error.stack,
      );
    }
  }

  private async cleanupOldAlerts(job: Job<JobData>): Promise<void> {
    const { retentionDays } = job.data.payload as {
      retentionDays: number;
    };

    this.logger.debug(`Cleaning up old alerts`, { retentionDays });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Get all organizations
      const orgIds =
        await this.alertRuleRepository.findOrganizationsWithEnabledRules();

      let totalDeleted = 0;

      for (const orgId of orgIds) {
        // Find resolved alerts older than retention period
        const { items: oldAlerts } =
          await this.alertInstanceRepository.findByOrganization(orgId, {
            status: AlertInstanceStatus.RESOLVED,
            endDate: cutoffDate,
          });

        // Delete old resolved alerts
        for (const alert of oldAlerts) {
          await this.alertInstanceRepository.delete(alert.id);
          totalDeleted++;
        }
      }

      this.logger.log(
        `Cleaned up ${totalDeleted} old alert instances (older than ${retentionDays} days)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old alerts: ${error.message}`,
        error.stack,
      );
    }
  }

  private async checkAlertHealth(_job: Job<JobData>): Promise<void> {
    this.logger.debug(`Checking alert system health`);

    try {
      // Get all organizations with enabled rules
      const orgIds =
        await this.alertRuleRepository.findOrganizationsWithEnabledRules();

      const healthReport = {
        timestamp: new Date(),
        organizations: orgIds.length,
        issues: [] as string[],
      };

      for (const orgId of orgIds) {
        // Check enabled rules
        const enabledRules =
          await this.alertRuleRepository.findEnabledByOrganization(orgId);

        if (enabledRules.length === 0) continue;

        // Check if rules have been evaluated recently (within last 5 minutes)
        const recentAlerts =
          await this.alertInstanceRepository.findByOrganization(orgId, {
            startDate: new Date(Date.now() - 5 * 60 * 1000),
          });

        // If there are enabled rules but no recent alert instances, might indicate evaluation issues
        if (enabledRules.length > 0 && recentAlerts.items.length === 0) {
          healthReport.issues.push(
            `Organization ${orgId} has ${enabledRules.length} enabled rules but no recent evaluations`,
          );
        }

        // Check for stuck firing alerts (firing for more than 24 hours)
        const activeAlerts =
          await this.alertInstanceRepository.findActiveByOrganization(orgId);
        const stuckAlerts = activeAlerts.filter((alert) => {
          const firedAt = alert.getFiredAt();
          const hoursSinceFired =
            (Date.now() - firedAt.getTime()) / (1000 * 60 * 60);
          return hoursSinceFired > 24;
        });

        if (stuckAlerts.length > 0) {
          healthReport.issues.push(
            `Organization ${orgId} has ${stuckAlerts.length} alerts firing for over 24 hours`,
          );
        }
      }

      if (healthReport.issues.length > 0) {
        this.logger.warn(
          `Alert system health check found ${healthReport.issues.length} issues:\n` +
            healthReport.issues.join("\n"),
        );
      } else {
        this.logger.log(
          `Alert system health check passed for ${orgIds.length} organizations`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to check alert health: ${error.message}`,
        error.stack,
      );
    }
  }
}
