/**
 * Alerts store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { v4 as uuidv4 } from "uuid";
import { config } from "@/config";
import alertingApi from "@/api/alerting";
import { notificationChannelsApi } from "@/api/notification-channels";
import type {
  Alert,
  AlertRule,
  AlertSeverity,
  AlertStatus,
  AlertCondition,
  NotificationChannel,
  NotificationChannelType,
  EmailNotificationChannel,
  SlackNotificationChannel,
  DiscordNotificationChannel,
  MSTeamsNotificationChannel,
  ZoomNotificationChannel,
  TelegramNotificationChannel,
  PagerDutyNotificationChannel,
  OpsGenieNotificationChannel,
  WebhookNotificationChannel,
} from "@/types";

const RULES_STORAGE_KEY = "tfo-viz-alert-rules";
const CHANNELS_STORAGE_KEY = "tfo-viz-notification-channels";
const DEFAULTS_STORAGE_KEY = "tfo-viz-default-channel-ids";

export const useAlertsStore = defineStore("alerts", () => {
  // State
  const alerts = ref<Alert[]>([]);
  const rules = ref<AlertRule[]>([]);
  const notificationChannels = ref<NotificationChannel[]>([]);
  const defaultChannelIds = ref<string[]>([]);
  const selectedAlert = ref<Alert | null>(null);
  const selectedRule = ref<AlertRule | null>(null);
  const selectedChannel = ref<NotificationChannel | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const activeAlerts = computed(() =>
    alerts.value.filter((a) => a.status === "firing"),
  );

  const alertsByStatus = computed(() => {
    const grouped: Record<AlertStatus, Alert[]> = {
      firing: [],
      pending: [],
      resolved: [],
    };

    alerts.value.forEach((alert) => {
      grouped[alert.status].push(alert);
    });

    return grouped;
  });

  const alertsBySeverity = computed(() => {
    const grouped: Record<AlertSeverity, Alert[]> = {
      critical: [],
      warning: [],
      info: [],
    };

    alerts.value.forEach((alert) => {
      grouped[alert.severity].push(alert);
    });

    return grouped;
  });

  const criticalAlertCount = computed(
    () =>
      alerts.value.filter(
        (a) => a.severity === "critical" && a.status === "firing",
      ).length,
  );

  const enabledRules = computed(() => rules.value.filter((r) => r.enabled));

  const enabledChannels = computed(() =>
    notificationChannels.value.filter((c) => c.enabled),
  );

  const channelsByType = computed(() => {
    const grouped: Record<NotificationChannelType, NotificationChannel[]> = {
      email: [],
      slack: [],
      discord: [],
      msteams: [],
      zoom: [],
      telegram: [],
      pagerduty: [],
      opsgenie: [],
      webhook: [],
    };

    notificationChannels.value.forEach((channel) => {
      grouped[channel.type].push(channel);
    });

    return grouped;
  });

  // Actions
  function loadRules() {
    try {
      const saved = localStorage.getItem(RULES_STORAGE_KEY);
      if (saved) {
        rules.value = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load alert rules:", e);
    }
  }

  /** Map operator symbol (from backend) → AlertCondition enum form */
  const SYMBOL_TO_OP: Record<string, AlertCondition["operator"]> = {
    ">": "gt", ">=": "gte", "<": "lt", "<=": "lte", "=": "eq", "!=": "neq",
  };

  /** Fetch ALL alert rules from the real backend (no queryTarget filter) */
  async function fetchRules() {
    if (config.useMock) return; // localStorage rules are already loaded
    try {
      const { items } = await alertingApi.listRules();
      rules.value = items.map((r) => {
        const cond = r.conditions?.[0];
        const opRaw = cond?.operator || ">";
        return {
          id: r.id,
          name: r.name,
          description: r.description || "",
          enabled: r.enabled,
          query: r.query,
          condition: {
            operator: SYMBOL_TO_OP[opRaw] ?? (opRaw as AlertCondition["operator"]) ?? "gt",
            threshold: cond?.value ?? 0,
          },
          duration: cond?.timeWindow ? `${Math.floor(cond.timeWindow / 60)}m` : "5m",
          severity: r.severity,
          labels: {},
          annotations: {},
          channelIds: r.channelIds,
          useDefaultChannels: r.useDefaultChannels,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        } as AlertRule;
      });
    } catch (e) {
      console.error("Failed to fetch alert rules from backend:", e);
    }
  }

  /** Fetch real notification channels from backend. */
  async function fetchChannels() {
    if (config.useMock) return;
    try {
      const [channels] = await Promise.all([
        notificationChannelsApi.listChannels(),
        fetchDefaultChannels(),
      ]);
      notificationChannels.value = (channels as any[]).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        description: c.description || null,
        enabled: c.enabled,
        config: c.config || c.configuration || {},
        sendResolved: c.sendResolved ?? true,
        sendReminder: c.sendReminder ?? false,
        reminderInterval: c.reminderInterval || null,
        lastUsedAt: c.lastUsedAt ? new Date(c.lastUsedAt).getTime() : null,
        errorCount: c.errorCount ?? 0,
        createdAt: c.createdAt ? new Date(c.createdAt).getTime() : Date.now(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now(),
      })) as any;
    } catch (e) {
      console.error("Failed to fetch notification channels from backend:", e);
    }
  }

  /** Fetch default channel IDs from backend (or localStorage for mock) */
  async function fetchDefaultChannels() {
    try {
      defaultChannelIds.value = await notificationChannelsApi.getDefaultChannels();
    } catch (e) {
      console.error("Failed to fetch default channels:", e);
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem(DEFAULTS_STORAGE_KEY);
        if (saved) defaultChannelIds.value = JSON.parse(saved);
      } catch { /* ignore */ }
    }
  }

  /** Persist default channel IDs to backend (or localStorage for mock) */
  async function saveDefaultChannels(ids: string[]) {
    defaultChannelIds.value = ids;
    try {
      await notificationChannelsApi.setDefaultChannels(ids);
    } catch (e) {
      console.error("Failed to save default channels:", e);
    }
  }

  function saveRules() {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules.value));
    } catch (e) {
      console.error("Failed to save alert rules:", e);
    }
  }

  function createRule(
    name: string,
    query: string,
    condition: AlertCondition,
    severity: AlertSeverity,
    options?: Partial<AlertRule>,
  ): AlertRule {
    const rule: AlertRule = {
      id: uuidv4(),
      name,
      query,
      condition,
      severity,
      enabled: true,
      duration: "5m",
      labels: {},
      annotations: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...options,
    };

    rules.value.push(rule);
    saveRules();
    return rule;
  }

  function updateRule(id: string, updates: Partial<AlertRule>) {
    const index = rules.value.findIndex((r) => r.id === id);
    if (index !== -1) {
      rules.value[index] = {
        ...rules.value[index],
        ...updates,
        updatedAt: Date.now(),
      };
      saveRules();
    }
  }

  function deleteRule(id: string) {
    const index = rules.value.findIndex((r) => r.id === id);
    if (index !== -1) {
      rules.value.splice(index, 1);
      saveRules();

      if (selectedRule.value?.id === id) {
        selectedRule.value = null;
      }
    }
  }

  function toggleRule(id: string) {
    const rule = rules.value.find((r) => r.id === id);
    if (rule) {
      rule.enabled = !rule.enabled;
      rule.updatedAt = Date.now();
      saveRules();
    }
  }

  function duplicateRule(id: string): AlertRule | null {
    const original = rules.value.find((r) => r.id === id);
    if (!original) return null;

    const copy: AlertRule = {
      ...JSON.parse(JSON.stringify(original)),
      id: uuidv4(),
      name: `${original.name} Copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    rules.value.push(copy);
    saveRules();
    return copy;
  }

  function selectRule(rule: AlertRule | null) {
    selectedRule.value = rule;
  }

  // Notification Channel Management
  function loadChannels() {
    try {
      const saved = localStorage.getItem(CHANNELS_STORAGE_KEY);
      if (saved) {
        notificationChannels.value = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load notification channels:", e);
    }
  }

  function saveChannels() {
    try {
      localStorage.setItem(
        CHANNELS_STORAGE_KEY,
        JSON.stringify(notificationChannels.value),
      );
    } catch (e) {
      console.error("Failed to save notification channels:", e);
    }
  }

  function createEmailChannel(
    name: string,
    recipients: string[],
    config?: Partial<EmailNotificationChannel["config"]>,
  ): EmailNotificationChannel {
    const channel: EmailNotificationChannel = {
      id: uuidv4(),
      name,
      type: "email",
      enabled: true,
      config: {
        recipients,
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpSecure: true,
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  function createSlackChannel(
    name: string,
    webhookUrl: string,
    config?: Partial<Omit<SlackNotificationChannel["config"], "webhookUrl">>,
  ): SlackNotificationChannel {
    const channel: SlackNotificationChannel = {
      id: uuidv4(),
      name,
      type: "slack",
      enabled: true,
      config: {
        webhookUrl,
        username: "TelemetryFlow",
        iconEmoji: ":bell:",
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  function createDiscordChannel(
    name: string,
    webhookUrl: string,
    config?: Partial<Omit<DiscordNotificationChannel["config"], "webhookUrl">>,
  ): DiscordNotificationChannel {
    const channel: DiscordNotificationChannel = {
      id: uuidv4(),
      name,
      type: "discord",
      enabled: true,
      config: {
        webhookUrl,
        username: "TelemetryFlow",
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  function createMSTeamsChannel(
    name: string,
    webhookUrl: string,
    config?: Partial<Omit<MSTeamsNotificationChannel["config"], "webhookUrl">>,
  ): MSTeamsNotificationChannel {
    const channel: MSTeamsNotificationChannel = {
      id: uuidv4(),
      name,
      type: "msteams",
      enabled: true,
      config: {
        webhookUrl,
        title: "TelemetryFlow Alert",
        themeColor: "0076D7",
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  function createZoomChannel(
    name: string,
    webhookUrl: string,
    config?: Partial<Omit<ZoomNotificationChannel["config"], "webhookUrl">>,
  ): ZoomNotificationChannel {
    const channel: ZoomNotificationChannel = {
      id: uuidv4(),
      name,
      type: "zoom",
      enabled: true,
      config: {
        webhookUrl,
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  function createTelegramChannel(
    name: string,
    botToken: string,
    chatId: string,
    config?: Partial<
      Omit<TelegramNotificationChannel["config"], "botToken" | "chatId">
    >,
  ): TelegramNotificationChannel {
    const channel: TelegramNotificationChannel = {
      id: uuidv4(),
      name,
      type: "telegram",
      enabled: true,
      config: {
        botToken,
        chatId,
        parseMode: "HTML",
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  function createWebhookChannel(
    name: string,
    url: string,
    config?: Partial<Omit<WebhookNotificationChannel["config"], "url">>,
  ): WebhookNotificationChannel {
    const channel: WebhookNotificationChannel = {
      id: uuidv4(),
      name,
      type: "webhook",
      enabled: true,
      config: {
        url,
        method: "POST",
        authType: "none",
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  function createPagerDutyChannel(
    name: string,
    integrationKey: string,
    config?: Partial<
      Omit<PagerDutyNotificationChannel["config"], "integrationKey">
    >,
  ): PagerDutyNotificationChannel {
    const channel: PagerDutyNotificationChannel = {
      id: uuidv4(),
      name,
      type: "pagerduty",
      enabled: true,
      config: {
        integrationKey,
        severity: "error",
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  function createOpsGenieChannel(
    name: string,
    apiKey: string,
    config?: Partial<Omit<OpsGenieNotificationChannel["config"], "apiKey">>,
  ): OpsGenieNotificationChannel {
    const channel: OpsGenieNotificationChannel = {
      id: uuidv4(),
      name,
      type: "opsgenie",
      enabled: true,
      config: {
        apiKey,
        apiUrl: "https://api.opsgenie.com/v2/alerts",
        priority: "P3",
        ...config,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    notificationChannels.value.push(channel);
    saveChannels();
    return channel;
  }

  /** Unified create that persists to the real backend when not in mock mode */
  async function addChannel(payload: {
    name: string;
    type: NotificationChannelType;
    description?: string;
    config: Record<string, unknown>;
    sendResolved?: boolean;
    sendReminder?: boolean;
    reminderInterval?: string;
  }): Promise<NotificationChannel> {
    if (config.useMock) {
      const channel = {
        id: uuidv4(),
        name: payload.name,
        type: payload.type,
        description: payload.description,
        enabled: true,
        config: payload.config,
        sendResolved: payload.sendResolved ?? true,
        sendReminder: payload.sendReminder ?? false,
        reminderInterval: payload.reminderInterval,
        lastUsedAt: undefined,
        errorCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as unknown as NotificationChannel;
      notificationChannels.value.unshift(channel);
      saveChannels();
      return channel;
    }

    const result = await notificationChannelsApi.createChannel({
      name: payload.name,
      type: payload.type,
      description: payload.description,
      config: payload.config,
      sendResolved: payload.sendResolved,
      sendReminder: payload.sendReminder,
      reminderInterval: payload.reminderInterval,
    });

    const channel = {
      id: result.id,
      name: result.name,
      type: result.type as NotificationChannelType,
      description: (result as any).description || undefined,
      enabled: result.enabled,
      config: (result as any).config || payload.config,
      sendResolved: (result as any).sendResolved ?? true,
      sendReminder: (result as any).sendReminder ?? false,
      reminderInterval: (result as any).reminderInterval || undefined,
      lastUsedAt: (result as any).lastUsedAt ? new Date((result as any).lastUsedAt).getTime() : undefined,
      errorCount: (result as any).errorCount ?? 0,
      createdAt: (result as any).createdAt ? new Date((result as any).createdAt).getTime() : Date.now(),
      updatedAt: (result as any).updatedAt ? new Date((result as any).updatedAt).getTime() : Date.now(),
    } as unknown as NotificationChannel;

    notificationChannels.value.unshift(channel);
    return channel;
  }

  async function updateChannel(id: string, updates: Partial<NotificationChannel>): Promise<void> {
    const index = notificationChannels.value.findIndex((c) => c.id === id);
    if (index === -1) return;

    const previous = notificationChannels.value[index];

    // Optimistic update
    notificationChannels.value[index] = {
      ...previous,
      ...updates,
      updatedAt: Date.now(),
    } as NotificationChannel;

    if (config.useMock) {
      saveChannels();
      return;
    }

    try {
      const result = await notificationChannelsApi.updateChannel(id, {
        name: (updates as any).name,
        description: (updates as any).description,
        enabled: (updates as any).enabled,
        config: (updates as any).config,
        sendResolved: (updates as any).sendResolved,
        sendReminder: (updates as any).sendReminder,
        reminderInterval: (updates as any).reminderInterval,
      });
      // Apply server response fields
      notificationChannels.value[index] = {
        ...notificationChannels.value[index],
        config: (result as any).config || (updates as any).config,
        updatedAt: (result as any).updatedAt
          ? new Date((result as any).updatedAt).getTime()
          : Date.now(),
      } as NotificationChannel;
    } catch (e) {
      // Rollback on failure
      notificationChannels.value[index] = previous;
      throw e;
    }
  }

  async function deleteChannel(id: string): Promise<void> {
    const index = notificationChannels.value.findIndex((c) => c.id === id);
    if (index === -1) return;

    // Optimistic removal
    const [removed] = notificationChannels.value.splice(index, 1);
    if (selectedChannel.value?.id === id) {
      selectedChannel.value = null;
    }

    if (config.useMock) {
      saveChannels();
      return;
    }

    try {
      await notificationChannelsApi.deleteChannel(id);
    } catch (e) {
      // Rollback on API failure
      notificationChannels.value.splice(index, 0, removed);
      console.error("Failed to delete channel:", e);
      throw e;
    }
  }

  async function toggleChannel(id: string): Promise<void> {
    const index = notificationChannels.value.findIndex((c) => c.id === id);
    if (index === -1) return;

    const channel = notificationChannels.value[index];
    const newEnabled = !channel.enabled;

    // Optimistic update via index assignment (triggers Vue 3 reactivity reliably)
    notificationChannels.value[index] = { ...channel, enabled: newEnabled, updatedAt: Date.now() };

    if (config.useMock) {
      saveChannels();
      return;
    }

    try {
      await notificationChannelsApi.updateChannel(id, { enabled: newEnabled });
    } catch (e) {
      // Rollback on API failure
      notificationChannels.value[index] = { ...channel, updatedAt: Date.now() };
      console.error("Failed to toggle channel:", e);
      throw e;
    }
  }

  function selectChannel(channel: NotificationChannel | null) {
    selectedChannel.value = channel;
  }

  async function testChannel(id: string): Promise<boolean> {
    const result = await notificationChannelsApi.testChannel(id);
    if (!result.success) {
      // Backend returns { success, error }; mock returns { success, message }
      const reason = (result as any).error || result.message || "Test notification failed";
      throw new Error(reason);
    }
    return true;
  }

  // Fetch alerts from backend API
  async function fetchBackendAlerts() {
    loading.value = true;
    try {
      const { items } = await alertingApi.listInstancesAsAlerts({ pageSize: 100 });
      if (items.length > 0) {
        alerts.value = items;
      }
    } catch (e) {
      console.error("[alertsStore] fetchBackendAlerts:", e);
    } finally {
      loading.value = false;
    }
  }

  // Alert management (these would typically come from an API in production)
  function addAlert(alert: Omit<Alert, "id" | "updatedAt">): Alert {
    const newAlert: Alert = {
      ...alert,
      id: uuidv4(),
      updatedAt: Date.now(),
    };
    alerts.value.unshift(newAlert);
    return newAlert;
  }

  function updateAlert(id: string, updates: Partial<Alert>) {
    const index = alerts.value.findIndex((a) => a.id === id);
    if (index !== -1) {
      alerts.value[index] = {
        ...alerts.value[index],
        ...updates,
        updatedAt: Date.now(),
      };
    }
  }

  function resolveAlert(id: string) {
    updateAlert(id, {
      status: "resolved",
      endsAt: Date.now(),
    });
  }

  function acknowledgeAlert(id: string) {
    const alert = alerts.value.find((a) => a.id === id);
    if (alert) {
      alert.annotations = {
        ...alert.annotations,
        acknowledged: "true",
        acknowledgedAt: new Date().toISOString(),
      };
      alert.updatedAt = Date.now();
    }
  }

  function selectAlert(alert: Alert | null) {
    selectedAlert.value = alert;
  }

  function clearResolvedAlerts() {
    alerts.value = alerts.value.filter((a) => a.status !== "resolved");
  }

  function clearAllAlerts() {
    alerts.value = [];
    selectedAlert.value = null;
  }

  // Seed realistic dummy channels when none exist
  function seedDummyChannels() {
    if (notificationChannels.value.length > 0) return;

    const now = Date.now();
    const hour = 3600000;
    const day = 86400000;

    const dummyChannels: NotificationChannel[] = [
      // Email - Operations team
      {
        id: uuidv4(),
        name: "Ops Team Email",
        type: "email",
        enabled: true,
        description: "Primary operations team email alerts",
        sendResolved: true,
        sendReminder: true,
        reminderInterval: "1h",
        lastUsedAt: now - 2 * hour,
        errorCount: 0,
        config: {
          recipients: ["ops-team@telemetryflow.id", "sre@telemetryflow.id"],
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          smtpSecure: true,
          fromName: "TelemetryFlow Alerts",
          fromEmail: "alerts@telemetryflow.id",
        },
        createdAt: now - 30 * day,
        updatedAt: now - 2 * day,
      } as EmailNotificationChannel,
      // Email - Management escalation
      {
        id: uuidv4(),
        name: "Management Escalation",
        type: "email",
        enabled: true,
        description: "Critical alerts escalated to management",
        sendResolved: true,
        lastUsedAt: now - 5 * day,
        errorCount: 0,
        config: {
          recipients: ["cto@telemetryflow.id", "vp-eng@telemetryflow.id"],
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          smtpSecure: true,
          fromName: "TelemetryFlow Critical",
          fromEmail: "critical@telemetryflow.id",
        },
        createdAt: now - 60 * day,
        updatedAt: now - 10 * day,
      } as EmailNotificationChannel,
      // Slack - Engineering channel
      {
        id: uuidv4(),
        name: "Slack #engineering-alerts",
        type: "slack",
        enabled: true,
        description: "Engineering team alert channel",
        sendResolved: true,
        lastUsedAt: now - 45 * 60000,
        errorCount: 0,
        config: {
          webhookUrl:
            "https://hooks.slack.com/services/<workspace-id>/<channel-id>/<webhook-token>",
          channel: "#engineering-alerts",
          username: "TelemetryFlow Bot",
          iconEmoji: ":rotating_light:",
        },
        createdAt: now - 45 * day,
        updatedAt: now - 3 * day,
      } as SlackNotificationChannel,
      // Slack - Incidents channel
      {
        id: uuidv4(),
        name: "Slack #incidents",
        type: "slack",
        enabled: true,
        description: "High-severity incident notifications",
        sendResolved: true,
        sendReminder: true,
        reminderInterval: "30m",
        lastUsedAt: now - 3 * hour,
        errorCount: 0,
        config: {
          webhookUrl:
            "https://example.com/slack-webhook/REPLACE_WITH_ACTUAL_URL",
          channel: "#incidents",
          username: "Incident Bot",
          iconEmoji: ":fire:",
        },
        createdAt: now - 20 * day,
        updatedAt: now - 1 * day,
      } as SlackNotificationChannel,
      // Discord - DevOps server
      {
        id: uuidv4(),
        name: "Discord DevOps Server",
        type: "discord",
        enabled: true,
        description: "DevOps team Discord server alerts",
        sendResolved: true,
        lastUsedAt: now - 6 * hour,
        errorCount: 0,
        config: {
          webhookUrl:
            "https://discord.com/api/webhooks/1234567890/aBcDeFgHiJkLmNoPqRsTuVwXyZ-1234567890AbCdEfGhIj",
          username: "TelemetryFlow",
          avatarUrl: "https://cdn.telemetryflow.id/bot-avatar.png",
        },
        createdAt: now - 15 * day,
        updatedAt: now - 4 * day,
      } as DiscordNotificationChannel,
      // MS Teams - Platform Engineering
      {
        id: uuidv4(),
        name: "Teams - Platform Eng",
        type: "msteams",
        enabled: true,
        description: "Microsoft Teams platform engineering channel",
        sendResolved: true,
        lastUsedAt: now - 12 * hour,
        errorCount: 0,
        config: {
          webhookUrl:
            "https://outlook.office.com/webhook/a1b2c3d4-e5f6-7890-abcd-ef1234567890/IncomingWebhook/abc123def456/g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2",
          title: "TelemetryFlow Alert",
          themeColor: "0076D7",
        },
        createdAt: now - 25 * day,
        updatedAt: now - 7 * day,
      } as MSTeamsNotificationChannel,
      // Zoom - SRE Team Chat
      {
        id: uuidv4(),
        name: "Zoom SRE Chat",
        type: "zoom",
        enabled: false,
        description: "SRE team Zoom chat notifications (paused)",
        sendResolved: false,
        lastUsedAt: now - 14 * day,
        lastError: "Webhook URL expired, needs renewal",
        errorCount: 3,
        config: {
          webhookUrl:
            "https://zoom.us/webhook/v2/chatbot/send?accountId=abc123&botJid=sre-bot@xmpp.zoom.us",
          botJid: "sre-bot@xmpp.zoom.us",
          accountId: "abc123def456",
        },
        createdAt: now - 40 * day,
        updatedAt: now - 14 * day,
      } as ZoomNotificationChannel,
      // Telegram - On-call group
      {
        id: uuidv4(),
        name: "Telegram On-Call",
        type: "telegram",
        enabled: true,
        description: "On-call engineer notifications via Telegram",
        sendResolved: true,
        lastUsedAt: now - 1 * hour,
        errorCount: 0,
        config: {
          botToken: "7890123456:ABCdefGHIjklMNOpqrsTUVwxyz_1234567",
          chatId: "-1001987654321",
          parseMode: "HTML",
          disableNotification: false,
        },
        createdAt: now - 35 * day,
        updatedAt: now - 5 * day,
      } as TelegramNotificationChannel,
      // Webhook - Internal API
      {
        id: uuidv4(),
        name: "Internal Alert API",
        type: "webhook",
        enabled: true,
        description: "Forward alerts to internal incident management system",
        sendResolved: true,
        lastUsedAt: now - 30 * 60000,
        errorCount: 0,
        config: {
          url: "https://api.internal.telemetryflow.id/v1/alerts/ingest",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Source": "telemetryflow-viz",
          },
          authType: "bearer",
          authToken: "eyJhbGciOiJIUzI1NiIs...",
        },
        createdAt: now - 50 * day,
        updatedAt: now - 1 * day,
      } as WebhookNotificationChannel,
      // Webhook - Datadog integration
      {
        id: uuidv4(),
        name: "Datadog Events",
        type: "webhook",
        enabled: false,
        description: "Forward alerts as Datadog events (disabled - migrated)",
        sendResolved: false,
        lastUsedAt: now - 20 * day,
        lastError: "401 Unauthorized - API key rotated",
        errorCount: 12,
        config: {
          url: "https://api.datadoghq.com/api/v1/events",
          method: "POST",
          headers: {
            "DD-API-KEY": "a1b2c3d4e5f6...",
            "Content-Type": "application/json",
          },
          authType: "none",
          bodyTemplate:
            '{"title":"{{alertName}}","text":"{{message}}","alert_type":"{{severity}}","source_type_name":"telemetryflow"}',
        },
        createdAt: now - 90 * day,
        updatedAt: now - 20 * day,
      } as WebhookNotificationChannel,
      // PagerDuty - Production
      {
        id: uuidv4(),
        name: "PagerDuty Production",
        type: "pagerduty",
        enabled: true,
        description: "Production service PagerDuty escalation",
        sendResolved: true,
        lastUsedAt: now - 8 * hour,
        errorCount: 0,
        config: {
          integrationKey: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
          severity: "critical",
          dedupKey: "telemetryflow-prod",
        },
        createdAt: now - 55 * day,
        updatedAt: now - 2 * day,
      } as PagerDutyNotificationChannel,
      // OpsGenie - Infrastructure
      {
        id: uuidv4(),
        name: "OpsGenie Infra Team",
        type: "opsgenie",
        enabled: true,
        description: "Infrastructure team alerts with P2 priority routing",
        sendResolved: true,
        sendReminder: true,
        reminderInterval: "2h",
        lastUsedAt: now - 4 * hour,
        errorCount: 0,
        config: {
          apiKey: "abcdef12-3456-7890-abcd-ef1234567890",
          apiUrl: "https://api.opsgenie.com/v2/alerts",
          priority: "P2",
          tags: ["infrastructure", "telemetryflow", "production"],
        },
        createdAt: now - 28 * day,
        updatedAt: now - 3 * day,
      } as OpsGenieNotificationChannel,
    ];

    notificationChannels.value = dummyChannels;
    saveChannels();
  }

  // Initialize
  loadRules();
  loadChannels();
  if (config.useMock) {
    seedDummyChannels();
  }

  return {
    // State
    alerts,
    rules,
    notificationChannels,
    defaultChannelIds,
    selectedAlert,
    selectedRule,
    selectedChannel,
    loading,
    error,
    // Getters
    activeAlerts,
    alertsByStatus,
    alertsBySeverity,
    criticalAlertCount,
    enabledRules,
    enabledChannels,
    channelsByType,
    // Actions
    loadRules,
    fetchRules,
    fetchChannels,
    saveRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    selectRule,
    // Channel actions
    loadChannels,
    saveChannels,
    fetchDefaultChannels,
    saveDefaultChannels,
    addChannel,
    createEmailChannel,
    createSlackChannel,
    createDiscordChannel,
    createMSTeamsChannel,
    createZoomChannel,
    createTelegramChannel,
    createWebhookChannel,
    createPagerDutyChannel,
    createOpsGenieChannel,
    updateChannel,
    deleteChannel,
    toggleChannel,
    selectChannel,
    testChannel,
    // Alert actions
    fetchBackendAlerts,
    addAlert,
    updateAlert,
    resolveAlert,
    acknowledgeAlert,
    selectAlert,
    clearResolvedAlerts,
    clearAllAlerts,
  };
});
