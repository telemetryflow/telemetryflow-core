import { DataSource } from "typeorm";
import { BaseSeed } from "@/database/shared/BaseSeed";
import { v4 as uuidv4 } from "uuid";

interface ChannelDef {
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  sendResolved: boolean;
  sendReminder: boolean;
  reminderInterval?: string;
  config: string;
}

/**
 * Alerting Seed 2 — Notification Channels
 *
 * Default channels covering all supported integrations.
 * Only Email is enabled by default — others require real credentials.
 *
 * All TS object properties are camelCase.
 * DB column names (snake_case) are mapped at upsert time.
 * Config JSONB keys are camelCase to match NotificationChannelConfig interface.
 */
export class NotificationChannelsSeed extends BaseSeed {
  name = "NotificationChannelsSeed";
  moduleName = "alerting";
  order = 2;
  dependencies = ["OrganizationsSeed"];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding notification channels...");

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
        WHERE "table_schema" = 'public' AND "table_name" = 'notification_channels'
      )
    `);

    if (!tableCheck[0].exists) {
      this.logError("notification_channels table does not exist. Run migrations first.");
      return;
    }

    const channels: ChannelDef[] = [
      // ── Email ────────────────────────────────────────────────────────────────
      {
        name: "Email - Infrastructure Team",
        type: "email",
        description: "Email alerts to infrastructure team via SMTP",
        enabled: true,
        sendResolved: true,
        sendReminder: false,
        config: JSON.stringify({
          recipients: ["infra-alerts@telemetryflow.id"],
          bcc: ["ops@telemetryflow.id"],
          fromName: "TelemetryFlow Alerts",
          fromEmail: "no-reply@telemetryflow.id",
          subject: "[{severity}] {alertName} is {status}",
          smtpHost: "email-smtp.us-west-2.amazonaws.com",
          smtpPort: 587,
          smtpUser: "REPLACE_WITH_SMTP_USER",
          smtpPassword: "REPLACE_WITH_SMTP_PASSWORD",
          smtpSecure: false,
        }),
      },
      // ── Slack ─────────────────────────────────────────────────────────────────
      {
        name: "Slack - Alerts Channel",
        type: "slack",
        description: "Slack webhook to #alerts channel",
        enabled: false,
        sendResolved: true,
        sendReminder: false,
        config: JSON.stringify({
          webhookUrl: "https://hooks.slack.com/services/XXXXXXXXX/YYYYYYYYY/ZZZZZZZZZZ",
          channel: "#alerts",
          username: "TelemetryFlow Bot",
          iconEmoji: ":bell:",
        }),
      },
      // ── Discord ───────────────────────────────────────────────────────────────
      {
        name: "Discord - Alerts Channel",
        type: "discord",
        description: "Discord webhook to alerts channel",
        enabled: false,
        sendResolved: true,
        sendReminder: false,
        config: JSON.stringify({
          webhookUrl: "https://discord.com/api/webhooks/XXXXXXXXX/ZZZZZZZZZZZZZZZZ",
          username: "TelemetryFlow Bot",
          avatarUrl: "",
        }),
      },
      // ── MS Teams ──────────────────────────────────────────────────────────────
      {
        name: "MS Teams - Alerts Channel",
        type: "msteams",
        description: "Microsoft Teams webhook for alert notifications",
        enabled: false,
        sendResolved: true,
        sendReminder: false,
        config: JSON.stringify({
          webhookUrl: "https://prod-XX.westus.logic.azure.com/workflows/XXXXXXXXX",
          title: "TelemetryFlow Alert",
        }),
      },
      // ── Zoom ──────────────────────────────────────────────────────────────────
      {
        name: "Zoom - Alerts Channel",
        type: "zoom",
        description: "Zoom Team Chat webhook for alert notifications",
        enabled: false,
        sendResolved: true,
        sendReminder: true,
        reminderInterval: "1h",
        config: JSON.stringify({
          webhookUrl: "https://integrations.zoom.us/chat/webhooks/incomingwebhook/XXXXXXXXX?format=fields",
          authToken: "REPLACE_WITH_AUTH_TOKEN",
        }),
      },
      // ── Telegram ──────────────────────────────────────────────────────────────
      {
        name: "Telegram - Alerts Bot",
        type: "telegram",
        description: "Telegram bot for alert notifications",
        enabled: false,
        sendResolved: true,
        sendReminder: false,
        config: JSON.stringify({
          botToken: "REPLACE_WITH_BOT_TOKEN",
          chatId: "REPLACE_WITH_CHAT_ID",
          parseMode: "HTML",
          disableNotification: false,
        }),
      },
      // ── OpsGenie ──────────────────────────────────────────────────────────────
      {
        name: "OpsGenie - On-Call Alerts",
        type: "opsgenie",
        description: "OpsGenie integration for on-call alert routing",
        enabled: false,
        sendResolved: true,
        sendReminder: false,
        config: JSON.stringify({
          apiKey: "REPLACE_WITH_OPSGENIE_API_KEY",
          apiUrl: "https://api.opsgenie.com/v2/alerts",
          priority: "P2",
        }),
      },
      // ── PagerDuty ─────────────────────────────────────────────────────────────
      {
        name: "PagerDuty - Critical Alerts",
        type: "pagerduty",
        description: "PagerDuty integration for critical incident escalation",
        enabled: false,
        sendResolved: true,
        sendReminder: false,
        config: JSON.stringify({
          integrationKey: "REPLACE_WITH_PAGERDUTY_INTEGRATION_KEY",
          severity: "critical",
        }),
      },
      // ── Custom Webhook ────────────────────────────────────────────────────────
      {
        name: "Webhook - Custom Integration",
        type: "webhook",
        description: "Custom webhook for alert forwarding to internal systems",
        enabled: false,
        sendResolved: true,
        sendReminder: false,
        config: JSON.stringify({
          url: "https://api.telemetryflow.id/alerts",
          method: "POST",
          contentType: "json",
          authType: "bearer",
          authToken: "REPLACE_WITH_API_TOKEN",
          headers: { "X-Source": "telemetryflow" },
          retryCount: 3,
        }),
      },
    ];

    let upserted = 0;
    for (const channel of channels) {
      // Map camelCase TS object → snake_case DB columns
      await this.upsert(
        dataSource,
        "notification_channels",
        {
          id: uuidv4(),
          organization_id: organizationId,
          name: channel.name,
          description: channel.description,
          type: channel.type,
          config: channel.config,
          enabled: channel.enabled,
          send_resolved: channel.sendResolved,
          send_reminder: channel.sendReminder,
          ...(channel.reminderInterval ? { reminder_interval: channel.reminderInterval } : {}),
        },
        ["organization_id", "name"],
      );
      this.logSuccess(`Upserted [${channel.type}] ${channel.name}`);
      upserted++;
    }

    this.log(`Notification channels seeded: ${upserted} upserted`);
  }
}
