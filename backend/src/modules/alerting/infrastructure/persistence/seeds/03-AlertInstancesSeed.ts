import { DataSource } from "typeorm";
import { BaseSeed } from "@/database/shared/BaseSeed";
import { v4 as uuidv4 } from "uuid";

/**
 * Alerting Seed 3 — Alert Instances
 *
 * Sample firing instances for mock/demo mode only.
 * Skipped when TELEMETRYFLOW_USE_MOCK=false.
 */
export class AlertInstancesSeed extends BaseSeed {
  name = "AlertInstancesSeed";
  moduleName = "alerting";
  order = 3;
  dependencies = ["AlertRulesSeed"];

  async run(dataSource: DataSource): Promise<void> {
    const useMock = process.env.TELEMETRYFLOW_USE_MOCK;
    if (useMock === "false") {
      this.log("TELEMETRYFLOW_USE_MOCK=false — skipping alert instances seed.");
      return;
    }

    this.log("Seeding alert instances...");

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
        WHERE "table_schema" = 'public' AND "table_name" = 'alert_instances'
      )
    `);

    if (!tableCheck[0].exists) {
      this.logError("alert_instances table does not exist. Run migrations first.");
      return;
    }

    const highCpuRule = await this.findRecord<{ id: string; severity: string }>(
      dataSource,
      "alert_rules",
      { organization_id: organizationId, name: "High CPU Usage" },
    );
    const highMemRule = await this.findRecord<{ id: string; severity: string }>(
      dataSource,
      "alert_rules",
      { organization_id: organizationId, name: "High Memory Usage" },
    );
    const serviceDownRule = await this.findRecord<{ id: string; severity: string }>(
      dataSource,
      "alert_rules",
      { organization_id: organizationId, name: "Service Down" },
    );
    const sslExpiry30Rule = await this.findRecord<{ id: string; severity: string }>(
      dataSource,
      "alert_rules",
      { organization_id: organizationId, name: "SSL Certificate Expiring in 30 Days" },
    );

    if (!highCpuRule && !highMemRule && !serviceDownRule && !sslExpiry30Rule) {
      this.logError("No alert rules found. Run AlertRulesSeed first.");
      return;
    }

    const now = new Date();
    const instances = [
      {
        alert_rule_id: highCpuRule?.id,
        severity: "warning",
        status: "firing",
        title: "High CPU Usage on api-gateway",
        description: "CPU usage exceeded 80% on api-gateway pod-1",
        current_value: 85.2,
        threshold: 80,
        labels: JSON.stringify({ service: "api-gateway", instance: "pod-1" }),
        annotations: JSON.stringify({
          summary: "CPU usage exceeded 80% on api-gateway",
        }),
        fingerprint: `${highCpuRule?.id}:instance=pod-1,service=api-gateway`,
        starts_at: new Date(now.getTime() - 30 * 60 * 1000), // 30m ago
      },
      {
        alert_rule_id: highMemRule?.id,
        severity: "critical",
        status: "firing",
        title: "High Memory Usage on database-primary",
        description: "Memory usage at 92% on database-primary node",
        current_value: 92.1,
        threshold: 85,
        labels: JSON.stringify({ service: "database-primary", instance: "node-2" }),
        annotations: JSON.stringify({
          summary: "Memory usage critical on database-primary",
        }),
        fingerprint: `${highMemRule?.id}:instance=node-2,service=database-primary`,
        starts_at: new Date(now.getTime() - 15 * 60 * 1000), // 15m ago
      },
      {
        alert_rule_id: serviceDownRule?.id,
        severity: "info",
        status: "firing",
        title: "Health check probe failing",
        description: "Health check endpoint returning 503 on metrics-collector",
        current_value: 0,
        threshold: 1,
        labels: JSON.stringify({ service: "metrics-collector", instance: "pod-3" }),
        annotations: JSON.stringify({
          summary: "Health check failing on metrics-collector",
        }),
        fingerprint: `${serviceDownRule?.id}:instance=pod-3,service=metrics-collector`,
        starts_at: new Date(now.getTime() - 5 * 60 * 1000), // 5m ago
      },
      // SSL Certificate Expiry instance — matches mock monitor 3 (22 days remaining, below 30d threshold)
      {
        alert_rule_id: sslExpiry30Rule?.id,
        severity: "warning",
        status: "firing",
        title: "SSL Certificate Expiring in 22 Days",
        description:
          "SSL certificate for github.com (TelemetryFlow GitHub Repository) will expire in 22 days. " +
          "Issuer: Sectigo RSA Domain Validation Secure Server CA. " +
          "Renew before the 7-day critical threshold is reached.",
        current_value: 22,
        threshold: 30,
        labels: JSON.stringify({
          monitor: "TelemetryFlow GitHub Repository",
          monitor_type: "https",
          domain: "github.com",
          issuer: "Sectigo RSA Domain Validation Secure Server CA",
          type: "ssl-expiry",
        }),
        annotations: JSON.stringify({
          summary: "SSL certificate for github.com expires in 22 days",
          runbook: "https://docs.telemetryflow.id/runbooks/ssl-renewal",
        }),
        fingerprint: `${sslExpiry30Rule?.id}:monitor=github.com,type=ssl-expiry`,
        starts_at: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
      },
      // NOTE: Log-specific alert instances are NOT seeded.
      // They should be generated by real alert rule evaluation against actual log data.
    ];

    let inserted = 0;
    for (const inst of instances) {
      if (!inst.alert_rule_id) {
        this.logSkip(`Skipping instance "${inst.title}" — alert rule not found`);
        continue;
      }

      const existing = await this.findRecord(
        dataSource,
        "alert_instances",
        { fingerprint: inst.fingerprint },
      );

      if (existing) {
        this.logSkip(`Alert instance exists: ${inst.title}`);
        continue;
      }

      const record: Record<string, unknown> = {
        id: uuidv4(),
        alert_rule_id: inst.alert_rule_id,
        organization_id: organizationId,
        status: inst.status,
        severity: inst.severity,
        title: inst.title,
        description: inst.description,
        current_value: inst.current_value,
        threshold: inst.threshold,
        labels: inst.labels,
        annotations: inst.annotations,
        fingerprint: inst.fingerprint,
        starts_at: inst.starts_at,
        notifications_sent: "[]",
      };

      if ((inst as any).ends_at) record.ends_at = (inst as any).ends_at;
      if ((inst as any).resolved_at) record.resolved_at = (inst as any).resolved_at;
      if ((inst as any).resolved_by) record.resolved_by = (inst as any).resolved_by;

      const wasInserted = await this.insertIfNotExists(
        dataSource,
        "alert_instances",
        record,
        "fingerprint",
      );

      if (wasInserted) {
        this.logSuccess(`Created alert instance: ${inst.title} [${inst.severity}/${inst.status}]`);
        inserted++;
      } else {
        this.logSkip(`Alert instance exists: ${inst.title}`);
      }
    }

    this.log(`Alert instances seeded: ${inserted} created, ${instances.length - inserted} skipped`);
  }
}
