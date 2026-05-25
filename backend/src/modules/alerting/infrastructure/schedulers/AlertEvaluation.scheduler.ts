import { Injectable, Inject, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import {
  IAlertRuleRepository,
  ALERT_RULE_REPOSITORY,
} from "../../domain/repositories/IAlertRuleRepository";
import {
  IAlertInstanceRepository,
  ALERT_INSTANCE_REPOSITORY,
} from "../../domain/repositories/IAlertInstanceRepository";
import { AlertRule, AlertRuleState } from "../../domain/aggregates/AlertRule";
import {
  AlertInstance,
} from "../../domain/aggregates/AlertInstance";
import { NotificationChannelService } from "../../application/services/NotificationChannel.service";
import type { AlertNotification } from "../services/INotificationSender";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";

@Injectable()
export class AlertEvaluationScheduler {
  private readonly logger = new Logger(AlertEvaluationScheduler.name);
  private readonly tableExistsCache = new Map<string, boolean>();

  constructor(
    private readonly configService: ConfigService,
    @Inject(ALERT_RULE_REPOSITORY)
    private readonly alertRuleRepository: IAlertRuleRepository,
    @Inject(ALERT_INSTANCE_REPOSITORY)
    private readonly alertInstanceRepository: IAlertInstanceRepository,
    private readonly notificationChannelService: NotificationChannelService,
    private readonly clickhouseService: ClickHouseService,
  ) {}

  /**
   * Evaluate all enabled alert rules every minute.
   * For each rule:
   * 1. Execute the rule's query to get current metric values
   * 2. Evaluate conditions against current values
   * 3. Create/update AlertInstances accordingly
   * 4. Send notifications for newly triggered alerts
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAlertEvaluation(): Promise<void> {
    if (!this.isSchedulerEnabled()) {
      this.logger.debug("Alert evaluation scheduler is disabled");
      return;
    }

    this.logger.log("Starting alert evaluation cycle...");
    const startTime = Date.now();

    try {
      // Fetch all organizations that have enabled rules
      // For now, we evaluate all enabled rules across organizations
      const organizations = await this.getOrganizationsWithEnabledRules();

      let totalEvaluated = 0;
      let totalTriggered = 0;
      let totalResolved = 0;

      for (const orgId of organizations) {
        const result = await this.evaluateOrganizationRules(orgId);
        totalEvaluated += result.evaluated;
        totalTriggered += result.triggered;
        totalResolved += result.resolved;
      }

      const elapsed = Date.now() - startTime;
      this.logger.log(
        `Alert evaluation cycle completed in ${elapsed}ms: ` +
          `${totalEvaluated} rules evaluated, ${totalTriggered} triggered, ${totalResolved} resolved`,
      );
    } catch (error) {
      this.logger.error(
        `Alert evaluation cycle failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Clean up stale alert instances every hour.
   * Resolves instances whose rules have been disabled or deleted.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleStaleInstanceCleanup(): Promise<void> {
    if (!this.isSchedulerEnabled()) return;

    this.logger.log("Starting stale alert instance cleanup...");

    try {
      const organizations = await this.getOrganizationsWithEnabledRules();

      for (const orgId of organizations) {
        const activeInstances =
          await this.alertInstanceRepository.findActiveByOrganization(orgId);

        for (const instance of activeInstances) {
          const rule = await this.alertRuleRepository.findById(
            instance.getAlertRuleId(),
          );

          // Auto-resolve if rule was deleted or disabled
          if (!rule || !rule.isEnabled()) {
            instance.resolve("auto", undefined, "Rule disabled or deleted");
            await this.alertInstanceRepository.save(instance);
            this.logger.log(
              `Auto-resolved stale instance ${instance.getId()} (rule: ${instance.getAlertRuleId()})`,
            );
          }
        }
      }

      this.logger.log("Stale alert instance cleanup completed");
    } catch (error) {
      this.logger.error(
        `Stale instance cleanup failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Evaluate all enabled rules for a given organization.
   */
  private async evaluateOrganizationRules(
    organizationId: string,
  ): Promise<{ evaluated: number; triggered: number; resolved: number }> {
    const rules =
      await this.alertRuleRepository.findEnabledByOrganization(organizationId);

    let evaluated = 0;
    let triggered = 0;
    let resolved = 0;

    for (const rule of rules) {
      try {
        const result = await this.evaluateSingleRule(rule);
        evaluated++;
        if (result === "triggered") triggered++;
        if (result === "resolved") resolved++;
      } catch (error) {
        this.logger.error(
          `Failed to evaluate rule ${rule.getId()} (${rule.getName()}): ${error.message}`,
        );
        rule.markError();
        await this.alertRuleRepository.save(rule);
      }
    }

    return { evaluated, triggered, resolved };
  }

  /**
   * Evaluate a single alert rule.
   * Returns the result state: 'triggered', 'resolved', 'pending', or 'ok'
   */
  private async evaluateSingleRule(
    rule: AlertRule,
  ): Promise<"triggered" | "resolved" | "pending" | "ok"> {
    // Step 1: Execute the rule's query to get current metric values
    // dynamicLabels carries runtime context (e.g. monitor name) for template rendering
    const dynamicLabels: Record<string, string> = {};
    const values = await this.executeRuleQuery(rule, dynamicLabels);

    // Step 2: Evaluate conditions
    const { shouldTrigger } = rule.evaluate(values);

    // Step 3: Find existing active instances for this rule
    const activeInstances =
      await this.alertInstanceRepository.findActiveByAlertRule(rule.getId());

    if (shouldTrigger) {
      return this.handleTrigger(rule, activeInstances, values, dynamicLabels);
    } else {
      return this.handleResolve(rule, activeInstances);
    }
  }

  /**
   * Handle a rule that should trigger.
   * Creates new AlertInstance if none exists, or updates existing one.
   */
  private async handleTrigger(
    rule: AlertRule,
    activeInstances: AlertInstance[],
    values: Record<string, number>,
    dynamicLabels: Record<string, string> = {},
  ): Promise<"triggered" | "pending"> {
    const conditions = rule.getConditions();
    const firstCondition = conditions[0];
    const currentValue = firstCondition
      ? values[firstCondition.metric] || 0
      : 0;
    const threshold = firstCondition ? firstCondition.threshold : 0;

    if (activeInstances.length > 0) {
      // Update existing instance with new value
      for (const instance of activeInstances) {
        instance.updateValue(currentValue);
        await this.alertInstanceRepository.save(instance);
      }

      // If rule was pending, check if forDuration has elapsed
      if (rule.getState() === AlertRuleState.PENDING) {
        const forDurationMs = this.parseDuration(rule.getForDuration());
        const lastEvaluated = rule.getLastEvaluatedAt();
        if (
          lastEvaluated &&
          Date.now() - lastEvaluated.getTime() >= forDurationMs
        ) {
          rule.trigger(activeInstances[0].getId(), currentValue, threshold);
          await this.alertRuleRepository.save(rule);
          await this.sendNotifications(rule, activeInstances[0]);
          return "triggered";
        }
      }

      return "pending";
    }

    // Merge static rule labels with runtime context (e.g. monitor name from query)
    const mergedLabels = { ...rule.getLabels(), ...dynamicLabels };

    // Create new AlertInstance with rendered annotation templates
    const renderedAnnotations = this.renderAnnotations(
      rule.getAnnotations(),
      mergedLabels,
      currentValue,
    );
    const instance = AlertInstance.create({
      alertRuleId: rule.getId(),
      organizationId: rule.getOrganizationId(),
      severity: rule.getSeverity(),
      title: rule.getName(),
      description: rule.getDescription() || `Alert: ${rule.getName()}`,
      currentValue,
      threshold,
      labels: mergedLabels,
      annotations: renderedAnnotations,
      workspaceId: rule.getWorkspaceId(),
    });

    await this.alertInstanceRepository.save(instance);

    // Check forDuration — if 0 or very short, trigger immediately
    const forDurationMs = this.parseDuration(rule.getForDuration());
    if (forDurationMs <= 60000) {
      // Trigger immediately for rules with ≤1m forDuration
      rule.trigger(instance.getId(), currentValue, threshold);
      await this.alertRuleRepository.save(rule);
      await this.sendNotifications(rule, instance);
      return "triggered";
    } else {
      // Mark as pending, will trigger after forDuration elapses
      rule.markPending();
      await this.alertRuleRepository.save(rule);
      return "pending";
    }
  }

  /**
   * Handle a rule whose conditions are no longer met.
   * Resolves any active instances.
   */
  private async handleResolve(
    rule: AlertRule,
    activeInstances: AlertInstance[],
  ): Promise<"resolved" | "ok"> {
    if (activeInstances.length === 0 && rule.getState() === AlertRuleState.OK) {
      return "ok";
    }

    // Resolve all active instances
    for (const instance of activeInstances) {
      instance.resolve("auto", undefined, "Condition no longer met");
      await this.alertInstanceRepository.save(instance);

      // Send resolve notification if channels support it
      await this.sendResolveNotification(rule, instance);
    }

    // Reset rule state
    rule.resolve();
    await this.alertRuleRepository.save(rule);

    return activeInstances.length > 0 ? "resolved" : "ok";
  }

  /**
   * Execute the rule's query against the telemetry data source.
   * Returns a map of metric names to their current values.
   *
   * Query execution pipeline:
   * - TFQL queries → ClickHouse log counts
   * - PromQL-style queries → ClickHouse metrics (via TFO-Agents)
   * - Metric queries → ClickHouse metrics table
   */
  private async executeRuleQuery(
    rule: AlertRule,
    dynamicLabels: Record<string, string> = {},
  ): Promise<Record<string, number>> {
    const queryLanguage = rule.getQueryLanguage();
    const queryString = rule.getQueryString();
    const conditions = rule.getConditions();

    // Build values map from rule conditions
    const values: Record<string, number> = {};

    if (queryLanguage === "tfql" && queryString) {
      // TFQL: Execute log count query against ClickHouse
      const logCount = await this.executeTfqlQuery(queryString, rule);
      for (const condition of conditions) {
        values[condition.metric] = logCount;
      }
    } else if (queryLanguage === "promql" && queryString) {
      // PromQL-style queries now executed against ClickHouse metrics (TFO-Agents)
      const metricValue = await this.executePromqlQuery(queryString, rule);
      for (const condition of conditions) {
        values[condition.metric] = metricValue;
      }
    } else if (
      queryLanguage === "condition" &&
      rule.getQueryTarget() === "uptime"
    ) {
      // Uptime condition rules (e.g., ssl_days_remaining < 30):
      // Query real ClickHouse data per monitor and evaluate each one separately.
      // Returns one value per monitor that violates the condition.
      await this.executeUptimeConditionQuery(rule, values, dynamicLabels);
    } else {
      // Default: Use condition field names as metric keys
      // This handles simple threshold-based rules
      // TEMPORARY: Generate semi-realistic values based on metric name
      for (const condition of conditions) {
        values[condition.metric] = this.generateSampleMetricValue(
          condition.metric,
        );
      }
      this.logger.debug(
        `[PLACEHOLDER] Generated sample values for rule "${rule.getName()}": ${JSON.stringify(values)}`,
      );
    }

    return values;
  }

  /**
   * Execute a TFQL query to count matching log entries.
   * Queries ClickHouse for logs within the rule's time window.
   */
  private async executeTfqlQuery(
    queryString: string,
    rule: AlertRule,
  ): Promise<number> {
    try {
      // Execute TFQL query as log count against ClickHouse
      // Parse time window from rule (default: last 5 minutes)
      const timeWindow = rule.getTimeWindow() || 5;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeWindow * 60 * 1000);

      // Query logs within time window
      const logs = await this.clickhouseService.queryLogs({
        startTime,
        endTime,
        organization_id: rule.getOrganizationId(),
        limit: 10000, // Get up to 10k logs for counting
      });

      const count = logs.length;

      this.logger.debug(
        `TFQL query for rule "${rule.getName()}" returned ${count} logs`,
      );

      return count;
    } catch (error) {
      this.logger.error(
        `Failed to execute TFQL query for rule "${rule.getName()}": ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Execute a PromQL-style query against ClickHouse metrics (via TFO-Agents).
   * Note: TFO-Agents replaces Prometheus for metric storage and querying.
   */
  private async executePromqlQuery(
    queryString: string,
    rule: AlertRule,
  ): Promise<number> {
    try {
      // Execute metric query against ClickHouse
      // Parse time window from rule (default: last 5 minutes)
      const timeWindow = rule.getTimeWindow() || 5;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeWindow * 60 * 1000);

      // Extract metric name from query string (simplified parsing)
      // For production, implement proper PromQL parser
      const metricNameMatch = queryString.match(/^([a-zA-Z_][a-zA-Z0-9_:]*)/);
      const metricName = metricNameMatch ? metricNameMatch[1] : undefined;

      // Query metrics within time window
      const metrics = await this.clickhouseService.queryMetrics({
        startTime,
        endTime,
        metric_name: metricName,
        organization_id: rule.getOrganizationId(),
        limit: 1000,
      });

      // Return latest value or average
      if (metrics.length === 0) {
        return 0;
      }

      // Use the latest metric value
      const latestMetric = metrics[metrics.length - 1];
      const value = latestMetric.value;

      this.logger.debug(
        `PromQL-style query for rule "${rule.getName()}" returned value: ${value}`,
      );

      return value;
    } catch (error) {
      this.logger.error(
        `Failed to execute PromQL query for rule "${rule.getName()}": ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Send firing notifications for a triggered alert.
   */
  private async sendNotifications(
    rule: AlertRule,
    instance: AlertInstance,
  ): Promise<void> {
    const channels = rule.getNotificationChannels();
    if (channels.length === 0) {
      this.logger.debug(
        `No notification channels configured for rule ${rule.getId()}`,
      );
      return;
    }

    const channelIds = channels.map((c) => c.channelId);
    const notification: AlertNotification = {
      alertInstanceId: instance.getId(),
      alertRuleId: rule.getId(),
      alertRuleName: rule.getName(),
      severity: rule.getSeverity(),
      status: "firing",
      title: `[${rule.getSeverity().toUpperCase()}] ${rule.getName()}`,
      description:
        rule.getDescription() || `Alert triggered: ${rule.getName()}`,
      currentValue: instance.getCurrentValue(),
      threshold: instance.getThreshold(),
      labels: instance.getLabels(),
      annotations: instance.getAnnotations(),
      startsAt: instance.getStartsAt(),
      organizationId: rule.getOrganizationId(),
      fingerprint: instance.getFingerprint(),
    };

    try {
      const results =
        await this.notificationChannelService.sendAlertNotification(
          notification,
          channelIds,
        );

      for (const result of results) {
        if (result.success) {
          instance.recordNotificationSent(result.channelId);
          this.logger.log(
            `Notification sent to channel ${result.channelId} for alert ${instance.getId()}`,
          );
        } else {
          this.logger.error(
            `Failed to send notification to channel ${result.channelId}: ${result.error}`,
          );
        }
      }

      await this.alertInstanceRepository.save(instance);
    } catch (error) {
      this.logger.error(
        `Failed to send notifications for alert ${instance.getId()}: ${error.message}`,
      );
    }
  }

  /**
   * Send resolve notifications when an alert is resolved.
   */
  private async sendResolveNotification(
    rule: AlertRule,
    instance: AlertInstance,
  ): Promise<void> {
    const channels = rule.getNotificationChannels();
    const resolveChannels = channels.filter((c) => c.sendOnResolve);

    if (resolveChannels.length === 0) return;

    const channelIds = resolveChannels.map((c) => c.channelId);
    const notification: AlertNotification = {
      alertInstanceId: instance.getId(),
      alertRuleId: rule.getId(),
      alertRuleName: rule.getName(),
      severity: rule.getSeverity(),
      status: "resolved",
      title: `[RESOLVED] ${rule.getName()}`,
      description: `Alert resolved: ${rule.getName()}`,
      currentValue: instance.getCurrentValue(),
      threshold: instance.getThreshold(),
      labels: instance.getLabels(),
      annotations: instance.getAnnotations(),
      startsAt: instance.getStartsAt(),
      endsAt: instance.getEndsAt(),
      organizationId: rule.getOrganizationId(),
      fingerprint: instance.getFingerprint(),
    };

    try {
      await this.notificationChannelService.sendAlertNotification(
        notification,
        channelIds,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send resolve notification for alert ${instance.getId()}: ${error.message}`,
      );
    }
  }

  /**
   * Get all organization IDs that have at least one enabled alert rule.
   * Queries the database for distinct organization IDs with enabled rules.
   * Falls back to DEFAULT_ORGANIZATION_ID if no rules are found.
   */
  private async getOrganizationsWithEnabledRules(): Promise<string[]> {
    try {
      // Query distinct organization IDs from alert_rules where enabled = true
      const organizations =
        await this.alertRuleRepository.findOrganizationsWithEnabledRules();

      if (organizations.length > 0) {
        this.logger.debug(
          `Found ${organizations.length} organization(s) with enabled rules: ${organizations.join(", ")}`,
        );
        return organizations;
      }

      // Fallback to default organization if no enabled rules found
      const defaultOrgId = this.configService.get<string>(
        "DEFAULT_ORGANIZATION_ID",
        "default",
      );
      this.logger.debug(
        `No enabled rules found, using default organization: ${defaultOrgId}`,
      );
      return [defaultOrgId];
    } catch (error) {
      this.logger.error(
        `Failed to fetch organizations with enabled rules: ${error.message}`,
        error.stack,
      );
      // Fallback to default organization on error
      const defaultOrgId = this.configService.get<string>(
        "DEFAULT_ORGANIZATION_ID",
        "default",
      );
      return [defaultOrgId];
    }
  }

  /**
   * Parse duration string (e.g., "5m", "1h", "30s") to milliseconds.
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 300000; // Default 5 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 3600 * 1000;
      case "d":
        return value * 86400 * 1000;
      default:
        return 300000;
    }
  }

  /**
   * Generate semi-realistic sample metric values based on metric name.
   * TEMPORARY: Used for testing before actual data source integration.
   *
   * @param metricName - The name of the metric (e.g., "cpu_usage", "error_count")
   * @returns A random value appropriate for the metric type
   */
  private generateSampleMetricValue(metricName: string): number {
    const lowerMetric = metricName.toLowerCase();

    // Count-based metrics (errors, requests, logs)
    if (
      lowerMetric.includes("count") ||
      lowerMetric.includes("total") ||
      lowerMetric.includes("errors") ||
      lowerMetric.includes("requests")
    ) {
      // Range: 0-50 with occasional spikes
      const baseValue = Math.floor(Math.random() * 20);
      const spike = Math.random() < 0.15 ? Math.floor(Math.random() * 30) : 0;
      return baseValue + spike;
    }

    // Percentage metrics (CPU, memory, disk usage)
    if (
      lowerMetric.includes("percent") ||
      lowerMetric.includes("usage") ||
      lowerMetric.includes("cpu") ||
      lowerMetric.includes("memory") ||
      lowerMetric.includes("disk")
    ) {
      // Range: 20-80 with normal distribution
      const mean = 50;
      const stddev = 15;
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const value = mean + z0 * stddev;
      return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
    }

    // Rate metrics (requests per second, errors per minute)
    if (
      lowerMetric.includes("rate") ||
      lowerMetric.includes("per_second") ||
      lowerMetric.includes("per_minute")
    ) {
      // Range: 0-100 with exponential distribution
      return Math.round(Math.random() * Math.random() * 100 * 100) / 100;
    }

    // Duration/latency metrics (response time, duration)
    if (
      lowerMetric.includes("latency") ||
      lowerMetric.includes("duration") ||
      lowerMetric.includes("time") ||
      lowerMetric.includes("ms")
    ) {
      // Range: 10-500ms with occasional spikes to 2000ms
      const baseLatency = 10 + Math.random() * 200;
      const spike = Math.random() < 0.1 ? Math.random() * 1500 : 0;
      return Math.round((baseLatency + spike) * 100) / 100;
    }

    // Default: generic numeric value (0-100)
    return Math.round(Math.random() * 100 * 100) / 100;
  }

  /**
   * Execute uptime condition rules by querying ClickHouse uptime_checks.
   * For each monitor with SSL data below threshold, injects the monitor
   * as a label and the actual SSL days as the metric value.
   *
   * Populates `values` with the WORST (minimum) ssl_days_remaining across
   * all monitors for the first failing condition — the caller evaluates
   * shouldTrigger from this. Per-monitor instances are handled separately
   * by the multi-series trigger path.
   */
  private async tableExists(tableName: string): Promise<boolean> {
    const db = process.env.CLICKHOUSE_DB || "telemetryflow_db";
    const key = `${db}.${tableName}`;
    if (this.tableExistsCache.has(key)) {
      return this.tableExistsCache.get(key)!;
    }
    try {
      const client = this.clickhouseService.getClient();
      const result = await client.query({
        query: `EXISTS TABLE ${key}`,
        format: "JSONEachRow",
      });
      const rows = (await result.json()) as Array<{ result: string }>;
      const exists = rows.length > 0 && rows[0].result === "1";
      this.tableExistsCache.set(key, exists);
      return exists;
    } catch {
      this.tableExistsCache.set(key, false);
      return false;
    }
  }

  private async executeUptimeConditionQuery(
    rule: AlertRule,
    values: Record<string, number>,
    dynamicLabels: Record<string, string> = {},
  ): Promise<void> {
    const db = process.env.CLICKHOUSE_DB || "telemetryflow_db";
    const orgId = rule.getOrganizationId();
    const conditions = rule.getConditions();

    for (const condition of conditions) {
      if (condition.metric === "ssl_days_remaining") {
        const uptimeAvailable = await this.tableExists("uptime_checks");
        if (!uptimeAvailable) {
          values[condition.metric] = 999;
          continue;
        }
        try {
          const client = this.clickhouseService.getClient();
          // Get latest min ssl_days_remaining per monitor (last 25h, ssl checks only)
          // Also fetch monitor_name so it can be used in annotation templates.
          const result = await client.query({
            query: `
              SELECT
                monitor_id,
                any(monitor_name) AS monitor_name,
                min(ssl_days_remaining) AS min_ssl_days
              FROM ${db}.uptime_checks
              WHERE organization_id = {orgId:String}
                AND checked_at >= now() - INTERVAL 25 HOUR
                AND ssl_days_remaining >= 0
              GROUP BY monitor_id
              ORDER BY min_ssl_days ASC
            `,
            query_params: { orgId },
            format: "JSONEachRow",
          });
          const rows = (await result.json()) as Array<{
            monitor_id: string;
            monitor_name: string;
            min_ssl_days: string | number;
          }>;

          if (rows.length > 0) {
            // Use the worst (minimum) value across all monitors for condition evaluation
            const worstRow = rows[0];
            const minVal = Number(worstRow.min_ssl_days);
            values[condition.metric] = minVal;
            // Populate dynamic labels so {{ $labels.monitor }} resolves correctly
            dynamicLabels["monitor"] = worstRow.monitor_name || worstRow.monitor_id;
            dynamicLabels["monitor_id"] = worstRow.monitor_id;
            this.logger.debug(
              `Uptime SSL condition for rule "${rule.getName()}": ` +
                `min_ssl_days=${minVal} on monitor "${dynamicLabels["monitor"]}"`,
            );
          } else {
            // No uptime SSL data — default to a safe high value so rule doesn't trigger
            values[condition.metric] = 999;
          }
        } catch (err: any) {
          if (err.message?.includes("Unknown table")) {
            this.logger.debug(
              `Uptime table not available for rule "${rule.getName()}": ${err.message}`,
            );
          } else {
            this.logger.error(
              `Failed to query uptime SSL data for rule "${rule.getName()}": ${err.message}`,
            );
          }
          values[condition.metric] = 999;
        }
      } else {
        // Other uptime metrics — placeholder until implemented
        values[condition.metric] = this.generateSampleMetricValue(
          condition.metric,
        );
      }
    }
  }

  /**
   * Render Prometheus-style annotation templates with real labels and value.
   * Replaces {{ $labels.xxx }} and {{ $value }} in annotation strings.
   */
  private renderAnnotations(
    annotations: Record<string, string>,
    labels: Record<string, string>,
    value: number,
  ): Record<string, string> {
    const rendered: Record<string, string> = {};
    for (const [key, template] of Object.entries(annotations)) {
      rendered[key] = template
        .replace(
          /\{\{\s*\$labels\.(\w+)\s*\}\}/g,
          (_, k) => labels[k] ?? `$labels.${k}`,
        )
        .replace(
          /\{\{\s*\$value\s*\|\s*printf\s+"[^"]*"\s*\}\}/g,
          () => value.toFixed(2),
        )
        .replace(/\{\{\s*\$value\s*\}\}/g, () => value.toFixed(2));
    }
    return rendered;
  }

  private isSchedulerEnabled(): boolean {
    return this.configService.get<boolean>("ALERT_SCHEDULER_ENABLED", true);
  }
}
