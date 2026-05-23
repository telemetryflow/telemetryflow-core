import { DataSource } from "typeorm";
import { BaseSeed } from "@/database/shared/BaseSeed";
import { v4 as uuidv4 } from "uuid";

export class AlertRulesSeed extends BaseSeed {
  name = "AlertRulesSeed";
  moduleName = "alerting";
  order = 1;
  dependencies = ["DefaultUsersSeed", "OrganizationsSeed"];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding alert rules...");

    const organization = await this.findRecord<{ organization_id: string }>(
      dataSource,
      "organizations",
      { code: "DEVOPSCORNER" },
    );

    if (!organization) {
      this.logError("Default organization (DEVOPSCORNER) not found. Run OrganizationsSeed first.");
      return;
    }

    const organizationId = organization.organization_id;

    const tableCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM "information_schema"."tables"
        WHERE "table_schema" = 'public' AND "table_name" = 'alert_rules'
      )
    `);

    if (!tableCheck[0].exists) {
      this.logError("alert_rules table does not exist. Run migrations first.");
      return;
    }

    const superAdmin = await this.findRecord<{ id: string }>(
      dataSource,
      "users",
      { email: "superadmin.telemetryflow@telemetryflow.id" },
    );

    if (!superAdmin) {
      this.logError("Super admin user not found. Run DefaultUsersSeed first.");
      return;
    }

    const alertRules = [
      {
        name: "High CPU Usage",
        description: "Alert when CPU usage exceeds 80% for 5 minutes",
        query_string:
          'avg by (instance) (rate(node_cpu_seconds_total{mode!="idle"}[5m])) > 0.8',
        for_duration: "5m",
        severity: "critical",
        labels: JSON.stringify({ team: "infrastructure", component: "cpu" }),
        annotations: JSON.stringify({
          summary: "High CPU usage detected on {{ $labels.instance }}",
          description: 'CPU usage is {{ $value | printf "%.2f" }}%',
        }),
        enabled: true,
        evaluation_interval: "1m",
        query_language: "promql",
        source_type: "tfo-agent",
      },
      {
        name: "High Memory Usage",
        description: "Alert when memory usage exceeds 85%",
        query_string:
          "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.85",
        for_duration: "5m",
        severity: "warning",
        labels: JSON.stringify({ team: "infrastructure", component: "memory" }),
        annotations: JSON.stringify({
          summary: "High memory usage on {{ $labels.instance }}",
          description: 'Memory usage is {{ $value | printf "%.2f" }}%',
        }),
        enabled: true,
        evaluation_interval: "1m",
        query_language: "promql",
        source_type: "tfo-agent",
      },
      {
        name: "Service Down",
        description: "Alert when a service is not responding",
        query_string: "up == 0",
        for_duration: "1m",
        severity: "critical",
        labels: JSON.stringify({ team: "platform", type: "availability" }),
        annotations: JSON.stringify({
          summary: "Service {{ $labels.job }} is down",
          description: "Target {{ $labels.instance }} is unreachable",
        }),
        enabled: true,
        evaluation_interval: "30s",
        query_language: "promql",
        source_type: "tfo-agent",
      },
      {
        name: "High Error Rate",
        description: "Alert when HTTP error rate exceeds 5%",
        query_string:
          'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05',
        for_duration: "5m",
        severity: "warning",
        labels: JSON.stringify({ team: "application", type: "error-rate" }),
        annotations: JSON.stringify({
          summary: "High error rate detected",
          description: 'Error rate is {{ $value | printf "%.2f" }}%',
        }),
        enabled: true,
        evaluation_interval: "1m",
        query_language: "promql",
        source_type: "tfo-agent",
        query_target: "metrics",
      },
      // ─── SSL Certificate Expiry Rules ─────────────────────────────────────
      // Source: ClickHouse uptime_checks_1d.min_ssl_days_remaining
      // Evaluated by uptime scheduler — only fires for HTTPS/SSL_CERTIFICATE monitors
      {
        name: "SSL Certificate Expiring in 30 Days",
        description:
          "Alert when an HTTPS monitor's SSL certificate will expire within 30 days. " +
          "Triggers from ClickHouse uptime_checks_1d.min_ssl_days_remaining < 30.",
        query_string: "min(ssl_days_remaining) < 30",
        for_duration: "1h",
        severity: "warning",
        labels: JSON.stringify({
          team: "platform",
          type: "ssl-expiry",
          component: "certificate",
        }),
        annotations: JSON.stringify({
          summary: "SSL certificate for {{ $labels.monitor }} expires in {{ $value }} days",
          description:
            "The SSL certificate will expire in {{ $value }} days. " +
            "Renew before the 7-day critical threshold is reached.",
          runbook: "https://docs.telemetryflow.id/runbooks/ssl-renewal",
        }),
        enabled: true,
        evaluation_interval: "1h",
        query_language: "condition",
        source_type: "tfo-collector",
        query_target: "uptime",
        conditions: JSON.stringify([
          {
            metric: "ssl_days_remaining",
            aggregation: "min",
            operator: "lt",
            threshold: 30,
            duration: "1h",
            labels: { type: "uptime" },
          },
        ]),
      },
      {
        name: "SSL Certificate Expiring in 7 Days",
        description:
          "Critical alert when an HTTPS monitor's SSL certificate will expire within 7 days. " +
          "Triggers from ClickHouse uptime_checks_1d.min_ssl_days_remaining < 7.",
        query_string: "min(ssl_days_remaining) < 7",
        for_duration: "30m",
        severity: "critical",
        labels: JSON.stringify({
          team: "platform",
          type: "ssl-expiry",
          component: "certificate",
          urgency: "high",
        }),
        annotations: JSON.stringify({
          summary: "CRITICAL: SSL certificate for {{ $labels.monitor }} expires in {{ $value }} days",
          description:
            "The SSL certificate will expire in {{ $value }} days. " +
            "Immediate renewal required to prevent service disruption.",
          runbook: "https://docs.telemetryflow.id/runbooks/ssl-renewal",
        }),
        enabled: true,
        evaluation_interval: "30m",
        query_language: "condition",
        source_type: "tfo-collector",
        query_target: "uptime",
        conditions: JSON.stringify([
          {
            metric: "ssl_days_remaining",
            aggregation: "min",
            operator: "lt",
            threshold: 7,
            duration: "30m",
            labels: { type: "uptime" },
          },
        ]),
      },
      {
        name: "SSL Certificate Expired",
        description:
          "Critical alert when an HTTPS monitor's SSL certificate has expired. " +
          "Triggers from ClickHouse uptime_checks_1d.min_ssl_days_remaining <= 0.",
        query_string: "min(ssl_days_remaining) <= 0",
        for_duration: "5m",
        severity: "critical",
        labels: JSON.stringify({
          team: "platform",
          type: "ssl-expired",
          component: "certificate",
          urgency: "critical",
        }),
        annotations: JSON.stringify({
          summary: "SSL certificate for {{ $labels.monitor }} has EXPIRED",
          description:
            "The SSL certificate has expired. HTTPS traffic will fail with certificate errors. " +
            "Renew the certificate immediately.",
          runbook: "https://docs.telemetryflow.id/runbooks/ssl-renewal",
        }),
        enabled: true,
        evaluation_interval: "5m",
        query_language: "condition",
        source_type: "tfo-collector",
        query_target: "uptime",
        conditions: JSON.stringify([
          {
            metric: "ssl_days_remaining",
            aggregation: "min",
            operator: "lte",
            threshold: 0,
            duration: "5m",
            labels: { type: "uptime" },
          },
        ]),
      },
      // NOTE: Log-specific alert rules (TFQL) are NOT seeded.
      // Users should create their own log alert rules through the UI
      // with real pattern queries and thresholds matching their environment.
    ];

    let inserted = 0;
    let updated = 0;
    for (const rule of alertRules) {
      const existing = await this.findRecord<{ id: string }>(
        dataSource,
        "alert_rules",
        { organization_id: organizationId, name: rule.name },
      );

      if (existing) {
        await dataSource.query(
          `DELETE FROM "alert_rules" WHERE "organization_id" = $1 AND "name" = $2`,
          [organizationId, rule.name],
        );
        this.log(`Deleted existing alert rule for re-seed: ${rule.name}`);
        updated++;
      }

      await dataSource.query(
        `INSERT INTO "alert_rules" (
          "id", "name", "description", "query_string", "for_duration", "severity",
          "labels", "annotations", "enabled", "evaluation_interval", "query_language",
          "source_type", "query_target", "conditions", "organization_id", "created_by"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          uuidv4(),
          rule.name,
          rule.description,
          rule.query_string,
          rule.for_duration,
          rule.severity,
          rule.labels,
          rule.annotations,
          rule.enabled,
          rule.evaluation_interval,
          rule.query_language,
          rule.source_type,
          (rule as any).query_target || null,
          (rule as any).conditions ?? "[]",
          organizationId,
          superAdmin.id,
        ],
      );

      if (existing) {
        this.logSuccess(`Re-seeded alert rule: ${rule.name}`);
      } else {
        this.logSuccess(`Created alert rule: ${rule.name}`);
        inserted++;
      }
    }

    this.log(`Alert rules seeded: ${inserted} created, ${updated} updated (delete+insert)`);
  }
}
