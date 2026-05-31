<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { useAlertsStore } from "@/store";
import { brandDefaults } from "@/config";
import { getChannelIcon } from "@/utils";
import type { NotificationChannelType } from "@/types";
import { generatePreviewData, formatNotificationByType } from "@/utils/telemetry/alerts";

const message = useMessage();

const alertsStore = useAlertsStore();

const showChannelModal = ref(false);
const channelType = ref<NotificationChannelType>("email");
const channelName = ref("");
const channelDescription = ref("");
const sendResolved = ref(true);
const sendReminder = ref(false);
const reminderInterval = ref("1h");
const testingChannelId = ref<string | null>(null);

// Email config
const emailRecipients = ref("");
const emailSmtpHost = ref("smtp.gmail.com");
const emailSmtpPort = ref(587);
const emailSmtpUser = ref("");
const emailSmtpPassword = ref("");
const emailSmtpSecure = ref(false);
const emailFromName = ref(brandDefaults.companyName);
const emailFromEmail = ref("");

// Slack config
const slackWebhookUrl = ref("");
const slackChannel = ref("");
const slackUsername = ref(brandDefaults.botName);
const slackIconEmoji = ref(":bell:");

// Discord config
const discordWebhookUrl = ref("");
const discordUsername = ref(brandDefaults.companyName);
const discordAvatarUrl = ref("");

// MS Teams config
const msteamsWebhookUrl = ref("");
const msteamsTitle = ref(brandDefaults.alertTitle);

// Zoom config
const zoomWebhookUrl = ref("");
const zoomBotJid = ref("");

// Telegram config
const telegramBotToken = ref("");
const telegramChatId = ref("");
const telegramParseMode = ref<"HTML" | "Markdown" | "MarkdownV2">("HTML");
const telegramDisableNotification = ref(false);

// Webhook config
const webhookUrl = ref("");
const webhookMethod = ref<"POST" | "PUT">("POST");
const webhookAuthType = ref<"none" | "basic" | "bearer">("none");
const webhookAuthToken = ref("");
const webhookBasicUsername = ref("");
const webhookBasicPassword = ref("");
const webhookHeaders = ref("");
const webhookBody = ref("");

// PagerDuty config
const pagerdutyIntegrationKey = ref("");
const pagerdutySeverity = ref<"critical" | "error" | "warning" | "info">("error");
const pagerdutyDedupKey = ref("");

// OpsGenie config
const opsgenieApiKey = ref("");
const opsgenieApiUrl = ref("https://api.opsgenie.com/v2/alerts");
const opsgeniePriority = ref<"P1" | "P2" | "P3" | "P4" | "P5">("P3");
const opsgenieTags = ref("");

const channelTypeOptions: {
  label: string;
  value: NotificationChannelType;
  icon: string;
}[] = [
    { label: "Email", value: "email", icon: "carbon:email" },
    { label: "Slack", value: "slack", icon: "carbon:logo-slack" },
    { label: "Discord", value: "discord", icon: "carbon:logo-discord" },
    { label: "MS Teams", value: "msteams", icon: "mdi:microsoft-teams" },
    { label: "Zoom", value: "zoom", icon: "mdi:video" },
    { label: "Telegram", value: "telegram", icon: "mdi:telegram" },
    { label: "OpsGenie", value: "opsgenie", icon: "simple-icons:opsgenie" },
    { label: "PagerDuty", value: "pagerduty", icon: "simple-icons:pagerduty" },
    { label: "Webhook", value: "webhook", icon: "carbon:webhook" },
  ];

function openAddChannel() {
  channelType.value = "email";
  channelName.value = "";
  channelDescription.value = "";
  sendResolved.value = true;
  sendReminder.value = false;
  reminderInterval.value = "1h";
  // Email
  emailRecipients.value = "";
  emailSmtpHost.value = "smtp.gmail.com";
  emailSmtpPort.value = 587;
  emailSmtpUser.value = "";
  emailSmtpPassword.value = "";
  emailSmtpSecure.value = false;
  emailFromName.value = brandDefaults.companyName;
  emailFromEmail.value = "";
  // Slack
  slackWebhookUrl.value = "";
  slackChannel.value = "";
  slackUsername.value = brandDefaults.botName;
  slackIconEmoji.value = ":bell:";
  // Discord
  discordWebhookUrl.value = "";
  discordUsername.value = brandDefaults.companyName;
  discordAvatarUrl.value = "";
  // MS Teams
  msteamsWebhookUrl.value = "";
  msteamsTitle.value = brandDefaults.alertTitle;
  // Zoom
  zoomWebhookUrl.value = "";
  zoomBotJid.value = "";
  // Telegram
  telegramBotToken.value = "";
  telegramChatId.value = "";
  telegramParseMode.value = "HTML";
  telegramDisableNotification.value = false;
  // Webhook
  webhookUrl.value = "";
  webhookMethod.value = "POST";
  webhookAuthType.value = "none";
  webhookAuthToken.value = "";
  webhookBasicUsername.value = "";
  webhookBasicPassword.value = "";
  webhookHeaders.value = "";
  webhookBody.value = "";
  // PagerDuty
  pagerdutyIntegrationKey.value = "";
  pagerdutySeverity.value = "error";
  pagerdutyDedupKey.value = "";
  // OpsGenie
  opsgenieApiKey.value = "";
  opsgenieApiUrl.value = "https://api.opsgenie.com/v2/alerts";
  opsgeniePriority.value = "P3";
  opsgenieTags.value = "";
  showChannelModal.value = true;
}

function saveChannel() {
  if (!channelName.value) return;

  switch (channelType.value) {
    case "email": {
      const recipients = emailRecipients.value
        .split(",")
        .map((e: string) => e.trim())
        .filter(Boolean);
      if (recipients.length === 0) return;
      alertsStore.createEmailChannel(channelName.value, recipients, {
        smtpHost: emailSmtpHost.value,
        smtpPort: emailSmtpPort.value,
        smtpUser: emailSmtpUser.value || undefined,
        smtpPassword: emailSmtpPassword.value || undefined,
        smtpSecure: emailSmtpSecure.value,
        fromName: emailFromName.value || undefined,
        fromEmail: emailFromEmail.value || undefined,
      });
      break;
    }
    case "slack":
      if (!slackWebhookUrl.value.trim()) return;
      alertsStore.createSlackChannel(channelName.value, slackWebhookUrl.value.trim(), {
        channel: slackChannel.value || undefined,
        username: slackUsername.value || undefined,
        iconEmoji: slackIconEmoji.value || undefined,
      });
      break;
    case "discord":
      if (!discordWebhookUrl.value.trim()) return;
      alertsStore.createDiscordChannel(channelName.value, discordWebhookUrl.value.trim(), {
        username: discordUsername.value || undefined,
        avatarUrl: discordAvatarUrl.value || undefined,
      });
      break;
    case "msteams":
      if (!msteamsWebhookUrl.value.trim()) return;
      alertsStore.createMSTeamsChannel(channelName.value, msteamsWebhookUrl.value.trim(), {
        title: msteamsTitle.value || undefined,
      });
      break;
    case "zoom":
      if (!zoomWebhookUrl.value.trim()) return;
      alertsStore.createZoomChannel(channelName.value, zoomWebhookUrl.value.trim(), {
        botJid: zoomBotJid.value || undefined,
      });
      break;
    case "telegram":
      if (!telegramBotToken.value || !telegramChatId.value.trim()) return;
      alertsStore.createTelegramChannel(
        channelName.value,
        telegramBotToken.value,
        telegramChatId.value.trim(),
        {
          parseMode: telegramParseMode.value,
          disableNotification: telegramDisableNotification.value,
        },
      );
      break;
    case "webhook": {
      if (!webhookUrl.value.trim()) return;
      // Parse headers JSON if provided
      let parsedHeaders: Record<string, string> | undefined;
      if (webhookHeaders.value.trim()) {
        try {
          parsedHeaders = JSON.parse(webhookHeaders.value);
        } catch {
          // Invalid JSON, ignore headers
        }
      }
      alertsStore.createWebhookChannel(channelName.value, webhookUrl.value.trim(), {
        method: webhookMethod.value,
        authType: webhookAuthType.value,
        authToken:
          webhookAuthType.value === "bearer"
            ? webhookAuthToken.value
            : undefined,
        basicAuth:
          webhookAuthType.value === "basic"
            ? { username: webhookBasicUsername.value, password: webhookBasicPassword.value }
            : undefined,
        headers: parsedHeaders,
        bodyTemplate: webhookBody.value.trim() || undefined,
      });
      break;
    }
    case "pagerduty":
      if (!pagerdutyIntegrationKey.value.trim()) return;
      alertsStore.createPagerDutyChannel(
        channelName.value,
        pagerdutyIntegrationKey.value.trim(),
        {
          severity: pagerdutySeverity.value,
          dedupKey: pagerdutyDedupKey.value.trim() || undefined,
        },
      );
      break;
    case "opsgenie":
      if (!opsgenieApiKey.value.trim()) return;
      alertsStore.createOpsGenieChannel(
        channelName.value,
        opsgenieApiKey.value.trim(),
        {
          apiUrl: opsgenieApiUrl.value || undefined,
          priority: opsgeniePriority.value,
          tags: opsgenieTags.value.trim()
            ? opsgenieTags.value.split(",").map((t: string) => t.trim())
            : undefined,
        },
      );
      break;
  }

  showChannelModal.value = false;
}

async function testChannel(id: string) {
  testingChannelId.value = id;
  await alertsStore.testChannel(id);
  testingChannelId.value = null;
}

// Template Preview
const previewData = generatePreviewData();

const templatePreview = computed(() => {
  const config: Record<string, unknown> = {};

  // Add channel-specific config for preview
  if (channelType.value === 'pagerduty') {
    config.routingKey = pagerdutyIntegrationKey.value || 'YOUR_ROUTING_KEY';
    config.severity = pagerdutySeverity.value;
    config.dedupKey = pagerdutyDedupKey.value || undefined;
  } else if (channelType.value === 'opsgenie') {
    config.priority = opsgeniePriority.value;
    config.tags = opsgenieTags.value.trim()
      ? opsgenieTags.value.split(",").map((t: string) => t.trim())
      : [];
  } else if (channelType.value === 'telegram') {
    config.parseMode = 'HTML';
  }

  const payload = formatNotificationByType(channelType.value, previewData, config);
  return JSON.stringify(payload, null, 2);
});

function getChannelDescription(type: NotificationChannelType): string {
  switch (type) {
    case "email":
      return "Send alerts via email with HTML formatting and rich content";
    case "slack":
      return "Post alerts to Slack channels with attachments and action buttons";
    case "discord":
      return "Send alerts to Discord channels using webhook embeds with rich formatting";
    case "msteams":
      return "Send alerts to Microsoft Teams using Adaptive Cards";
    case "zoom":
      return "Notify Zoom Team Chat with field-formatted messages";
    case "telegram":
      return "Send alerts to Telegram chats with HTML or Markdown formatting";
    case "opsgenie":
      return "Create OpsGenie alerts with priority routing and responders";
    case "pagerduty":
      return "Trigger PagerDuty incidents via Events API v2";
    case "webhook":
      return "Send generic JSON payloads to any HTTP endpoint";
    default:
      return "Configure notification channel";
  }
}

// Copy template to clipboard
async function copyTemplate() {
  try {
    await navigator.clipboard.writeText(templatePreview.value);
    message.success("Template copied to clipboard");
  } catch {
    message.error("Failed to copy template");
  }
}

// Paste from clipboard to webhook body template
async function pasteTemplate() {
  if (channelType.value !== "webhook") {
    message.warning("Paste is only available for Webhook channel");
    return;
  }
  try {
    const text = await navigator.clipboard.readText();
    webhookBody.value = text;
    message.success("Template pasted to custom body");
  } catch {
    message.error("Failed to paste from clipboard");
  }
}
</script>

<template>
  <n-card title="Notification Channels" size="small" class="card-centered">
    <template #header-extra>
      <n-button size="small" type="primary" @click="openAddChannel">
        <template #icon>
          <Icon icon="carbon:add" />
        </template>
        Add Channel
      </n-button>
    </template>

    <div v-if="alertsStore.notificationChannels.length === 0" class="empty-channels">
      <div class="empty-icon-box">
        <Icon icon="carbon:notification" class="empty-icon" />
      </div>
      <div class="empty-text">
        <p class="empty-title">No notification channels configured</p>
        <p class="empty-hint">
          Add email, Slack, or webhook notifications for alerts
        </p>
      </div>
    </div>

    <div v-else class="channels-list">
      <div v-for="channel in alertsStore.notificationChannels" :key="channel.id" class="channel-item">
        <div class="channel-info">
          <Icon :icon="getChannelIcon(channel.type)" class="channel-icon" />
          <div class="channel-details">
            <span class="channel-name">{{ channel.name }}</span>
            <span class="channel-type">{{ channel.type.toUpperCase() }}</span>
          </div>
        </div>
        <div class="channel-actions">
          <n-switch :value="channel.enabled" size="small" @update:value="() => alertsStore.toggleChannel(channel.id)" />
          <n-button size="tiny" quaternary :loading="testingChannelId === channel.id" @click="testChannel(channel.id)">
            <template #icon>
              <Icon icon="carbon:send-alt" />
            </template>
          </n-button>
          <n-popconfirm @positive-click="alertsStore.deleteChannel(channel.id)">
            <template #trigger>
              <n-button size="tiny" quaternary type="error">
                <template #icon>
                  <Icon icon="carbon:trash-can" />
                </template>
              </n-button>
            </template>
            Delete this notification channel?
          </n-popconfirm>
        </div>
      </div>
    </div>
  </n-card>

  <!-- Add Channel Modal -->
  <n-modal v-model:show="showChannelModal" preset="card" title="Add Notification Channel" style="max-width: 780px">
    <div class="channel-modal-content">
      <!-- Left Side: Vertical Tabs -->
      <div class="channel-tabs">
        <div
          v-for="opt in channelTypeOptions" :key="opt.value" class="channel-tab-item"
          :class="{ active: channelType === opt.value }" @click="channelType = opt.value"
        >
          <Icon :icon="opt.icon" class="tab-icon" />
          <span class="tab-label">{{ opt.label }}</span>
        </div>
        <div class="channel-type-hint">
          <p>{{ getChannelDescription(channelType) }}</p>
        </div>
      </div>

      <!-- Right Side: Configuration Form -->
      <div class="channel-form">
        <div class="form-box">
          <n-form label-placement="top">
            <n-form-item label="Channel Name">
              <n-input v-model:value="channelName" placeholder="My Channel" />
            </n-form-item>

            <n-form-item label="Description (optional)">
              <n-input
                v-model:value="channelDescription" type="textarea"
                placeholder="Brief description of this channel" :autosize="{ minRows: 2, maxRows: 3 }"
              />
            </n-form-item>

            <!-- Email Config -->
            <template v-if="channelType === 'email'">
              <n-form-item label="Recipients">
                <n-input v-model:value="emailRecipients" :placeholder="brandDefaults.exampleEmail('email1') + ', ' + brandDefaults.exampleEmail('email2')" />
              </n-form-item>
              <div class="form-row">
                <n-form-item label="From Name">
                  <n-input v-model:value="emailFromName" :placeholder="brandDefaults.companyName" />
                </n-form-item>
                <n-form-item label="From Email">
                  <n-input v-model:value="emailFromEmail" :placeholder="brandDefaults.exampleEmail('alerts')" />
                </n-form-item>
              </div>
              <n-divider style="margin: 8px 0">SMTP Configuration</n-divider>
              <div class="form-row">
                <n-form-item label="SMTP Host">
                  <n-input v-model:value="emailSmtpHost" placeholder="smtp.gmail.com" />
                </n-form-item>
                <n-form-item label="SMTP Port" style="max-width: 120px">
                  <n-input-number v-model:value="emailSmtpPort" :min="1" :max="65535" style="width: 100%" />
                </n-form-item>
              </div>
              <div class="form-row">
                <n-form-item label="SMTP Username">
                  <n-input v-model:value="emailSmtpUser" placeholder="username@gmail.com" />
                </n-form-item>
                <n-form-item label="SMTP Password">
                  <n-input v-model:value="emailSmtpPassword" type="password" placeholder="App password">
                    <template #suffix>
                      <Icon icon="carbon:locked" />
                    </template>
                  </n-input>
                </n-form-item>
              </div>
              <n-form-item label="Use SSL/TLS">
                <n-switch v-model:value="emailSmtpSecure" />
              </n-form-item>
            </template>

            <!-- Slack Config -->
            <template v-if="channelType === 'slack'">
              <n-form-item label="Webhook URL">
                <n-input v-model:value="slackWebhookUrl" placeholder="https://hooks.slack.com/services/..." />
              </n-form-item>
              <n-form-item label="Channel (optional)">
                <n-input v-model:value="slackChannel" placeholder="#alerts" />
              </n-form-item>
              <div class="form-row">
                <n-form-item label="Bot Username">
                  <n-input v-model:value="slackUsername" :placeholder="brandDefaults.botName" />
                </n-form-item>
                <n-form-item label="Icon Emoji">
                  <n-input v-model:value="slackIconEmoji" placeholder=":bell:" />
                </n-form-item>
              </div>
            </template>

            <!-- Discord Config -->
            <template v-if="channelType === 'discord'">
              <n-form-item label="Webhook URL">
                <n-input v-model:value="discordWebhookUrl" placeholder="https://discord.com/api/webhooks/..." />
              </n-form-item>
              <n-form-item label="Bot Username (optional)">
                <n-input v-model:value="discordUsername" :placeholder="brandDefaults.companyName" />
              </n-form-item>
              <n-form-item label="Avatar URL (optional)">
                <n-input v-model:value="discordAvatarUrl" :placeholder="'https://' + brandDefaults.domain + '/avatar.png'" />
              </n-form-item>
            </template>

            <!-- MS Teams Config -->
            <template v-if="channelType === 'msteams'">
              <n-form-item label="Webhook URL">
                <n-input v-model:value="msteamsWebhookUrl" placeholder="https://outlook.office.com/webhook/..." />
              </n-form-item>
              <n-form-item label="Card Title (optional)">
                <n-input v-model:value="msteamsTitle" :placeholder="brandDefaults.alertTitle" />
              </n-form-item>
            </template>

            <!-- Zoom Config -->
            <template v-if="channelType === 'zoom'">
              <n-form-item label="Webhook URL">
                <n-input v-model:value="zoomWebhookUrl" placeholder="https://zoom.us/webhook/..." />
              </n-form-item>
              <n-form-item label="Bot JID (optional)">
                <n-input v-model:value="zoomBotJid" placeholder="bot@xmpp.zoom.us" />
              </n-form-item>
            </template>

            <!-- Telegram Config -->
            <template v-if="channelType === 'telegram'">
              <n-form-item label="Bot Token">
                <n-input
                  v-model:value="telegramBotToken" placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  type="password"
                >
                  <template #suffix>
                    <Icon icon="carbon:locked" />
                  </template>
                </n-input>
              </n-form-item>
              <n-form-item label="Chat ID">
                <n-input v-model:value="telegramChatId" placeholder="-1001234567890" />
              </n-form-item>
              <div class="form-row">
                <n-form-item label="Parse Mode">
                  <n-select
                    v-model:value="telegramParseMode" :options="[
                      { label: 'HTML', value: 'HTML' },
                      { label: 'Markdown', value: 'Markdown' },
                      { label: 'MarkdownV2', value: 'MarkdownV2' },
                    ]"
                  />
                </n-form-item>
                <n-form-item label="Silent Notification">
                  <n-switch v-model:value="telegramDisableNotification" />
                </n-form-item>
              </div>
            </template>

            <!-- Webhook Config -->
            <template v-if="channelType === 'webhook'">
              <n-form-item label="Webhook URL">
                <n-input v-model:value="webhookUrl" :placeholder="brandDefaults.exampleUrl('api', '/webhook')" />
              </n-form-item>
              <n-form-item label="HTTP Method">
                <n-radio-group v-model:value="webhookMethod">
                  <n-radio-button value="POST">POST</n-radio-button>
                  <n-radio-button value="PUT">PUT</n-radio-button>
                </n-radio-group>
              </n-form-item>
              <n-form-item label="Authentication">
                <n-select
                  v-model:value="webhookAuthType" :options="[
                    { label: 'None', value: 'none' },
                    { label: 'Basic Auth', value: 'basic' },
                    { label: 'Bearer Token', value: 'bearer' },
                  ]"
                />
              </n-form-item>
              <n-form-item v-if="webhookAuthType === 'bearer'" label="Bearer Token">
                <n-input v-model:value="webhookAuthToken" type="password" placeholder="Enter token">
                  <template #suffix>
                    <Icon icon="carbon:locked" />
                  </template>
                </n-input>
              </n-form-item>
              <template v-if="webhookAuthType === 'basic'">
                <div class="form-row">
                  <n-form-item label="Username">
                    <n-input v-model:value="webhookBasicUsername" placeholder="Username" />
                  </n-form-item>
                  <n-form-item label="Password">
                    <n-input v-model:value="webhookBasicPassword" type="password" placeholder="Password">
                      <template #suffix>
                        <Icon icon="carbon:locked" />
                      </template>
                    </n-input>
                  </n-form-item>
                </div>
              </template>
              <n-form-item label="Custom Headers (JSON)">
                <n-input
                  v-model:value="webhookHeaders" type="textarea"
                  placeholder="{&quot;Content-Type&quot;: &quot;application/json&quot;, &quot;X-Custom-Header&quot;: &quot;value&quot;}"
                  :autosize="{ minRows: 3, maxRows: 6 }"
                />
              </n-form-item>
              <n-form-item label="Custom Body Template">
                <n-input
                  v-model:value="webhookBody" type="textarea"
                  placeholder="{&quot;alert&quot;: &quot;{{alertName}}&quot;, &quot;severity&quot;: &quot;{{severity}}&quot;, &quot;message&quot;: &quot;{{message}}&quot;}"
                  :autosize="{ minRows: 4, maxRows: 8 }"
                />
              </n-form-item>
            </template>

            <!-- PagerDuty Config -->
            <template v-if="channelType === 'pagerduty'">
              <n-form-item label="Integration Key">
                <n-input
                  v-model:value="pagerdutyIntegrationKey" placeholder="Events API v2 Integration Key"
                  type="password"
                >
                  <template #suffix>
                    <Icon icon="carbon:locked" />
                  </template>
                </n-input>
              </n-form-item>
              <n-form-item label="Default Severity">
                <n-select
                  v-model:value="pagerdutySeverity" :options="[
                    { label: 'Critical', value: 'critical' },
                    { label: 'Error', value: 'error' },
                    { label: 'Warning', value: 'warning' },
                    { label: 'Info', value: 'info' },
                  ]"
                />
              </n-form-item>
              <n-form-item label="Dedup Key (optional)">
                <n-input v-model:value="pagerdutyDedupKey" placeholder="Custom deduplication key" />
              </n-form-item>
            </template>

            <!-- OpsGenie Config -->
            <template v-if="channelType === 'opsgenie'">
              <n-form-item label="API Key">
                <n-input v-model:value="opsgenieApiKey" placeholder="OpsGenie API Integration Key" type="password">
                  <template #suffix>
                    <Icon icon="carbon:locked" />
                  </template>
                </n-input>
              </n-form-item>
              <n-form-item label="API URL">
                <n-input v-model:value="opsgenieApiUrl" placeholder="https://api.opsgenie.com/v2/alerts" />
                <template #feedback>
                  <span class="form-hint">Use https://api.eu.opsgenie.com/v2/alerts for EU region</span>
                </template>
              </n-form-item>
              <n-form-item label="Priority">
                <n-select
                  v-model:value="opsgeniePriority" :options="[
                    { label: 'P1 - Critical', value: 'P1' },
                    { label: 'P2 - High', value: 'P2' },
                    { label: 'P3 - Moderate', value: 'P3' },
                    { label: 'P4 - Low', value: 'P4' },
                    { label: 'P5 - Informational', value: 'P5' },
                  ]"
                />
              </n-form-item>
              <n-form-item label="Tags (optional)">
                <n-input v-model:value="opsgenieTags" placeholder="tag1, tag2, tag3" />
              </n-form-item>
            </template>

            <!-- Notification Options -->
            <n-divider style="margin: 16px 0 12px" />
            <n-form-item label="Notification Options">
              <div class="notification-options">
                <n-checkbox v-model:checked="sendResolved">
                  Send notification when alert is resolved
                </n-checkbox>
                <n-checkbox v-model:checked="sendReminder">
                  Send reminder for unresolved alerts
                </n-checkbox>
                <n-form-item v-if="sendReminder" label="Reminder Interval" style="margin-top: 8px; margin-bottom: 0">
                  <n-select
                    v-model:value="reminderInterval" :options="[
                      { label: '15 minutes', value: '15m' },
                      { label: '30 minutes', value: '30m' },
                      { label: '1 hour', value: '1h' },
                      { label: '2 hours', value: '2h' },
                      { label: '4 hours', value: '4h' },
                      { label: '8 hours', value: '8h' },
                      { label: '24 hours', value: '24h' },
                    ]" style="width: 180px"
                  />
                </n-form-item>
              </div>
            </n-form-item>

            <!-- Message Preview -->
            <n-divider style="margin: 16px 0 12px" />
            <n-collapse>
              <n-collapse-item title="Message Template Preview" name="preview">
                <template #header-extra>
                  <div class="preview-header-actions" @click.stop>
                    <n-tag size="small" :bordered="false" type="info">
                      {{ channelType.toUpperCase() }}
                    </n-tag>
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-button size="tiny" quaternary @click="copyTemplate">
                          <template #icon>
                            <Icon icon="carbon:copy" />
                          </template>
                        </n-button>
                      </template>
                      Copy template
                    </n-tooltip>
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-button size="tiny" quaternary :disabled="channelType !== 'webhook'" @click="pasteTemplate">
                          <template #icon>
                            <Icon icon="carbon:paste" />
                          </template>
                        </n-button>
                      </template>
                      {{ channelType === 'webhook' ? 'Paste to custom body' : 'Paste only available for Webhook' }}
                    </n-tooltip>
                  </div>
                </template>
                <div class="template-preview">
                  <p class="preview-hint">
                    This is how your alert notification will be formatted when sent to {{ channelType.toUpperCase() }}:
                  </p>
                  <n-code :code="templatePreview" language="json" :word-wrap="true" show-line-numbers />
                </div>
              </n-collapse-item>
            </n-collapse>
          </n-form>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer tfo-modal-footer">
        <n-button type="primary" ghost @click="showChannelModal = false">Cancel</n-button>
        <n-button type="primary" @click="saveChannel">Save Channel</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
// Notification Channels - Empty state with icon left, text right
.empty-channels {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px 16px;

  .empty-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.08);
    border: 1px solid rgba(128, 128, 128, 0.15);
    flex-shrink: 0;

    :root.dark & {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }
  }

  .empty-icon {
    font-size: 36px;
    color: var(--n-text-color-3);
    opacity: 0.6;
  }

  .empty-text {
    flex: 1;
  }

  .empty-title {
    margin: 0 0 4px 0;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--n-text-color-2);
  }

  .empty-hint {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--n-text-color-3);
    line-height: 1.5;
  }
}

.channels-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--n-action-color);
  border-radius: 8px;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-icon {
  font-size: 20px;
  color: var(--n-text-color-2);
}

.channel-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.channel-name {
  font-weight: 500;
  color: var(--n-text-color);
}

.channel-type {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

.channel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

// Channel Modal Vertical Tabs
.channel-modal-content {
  display: flex;
  gap: 16px;
  max-height: calc(80vh - 100px);
  overflow: hidden;
}

.channel-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 200px;
  border-right: 1px solid var(--n-border-color);
  padding-right: 16px;
}

.channel-tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--n-text-color-3);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--n-text-color);
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--n-primary-color);

    .tab-icon {
      color: var(--n-primary-color);
    }
  }

  .tab-icon {
    font-size: 20px;
    transition: color 0.2s ease;
  }

  .tab-label {
    white-space: nowrap;
  }
}

.channel-type-hint {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);

  p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--n-text-color-3);
    line-height: 1.5;
  }
}

.form-row {
  display: flex;
  gap: 12px;

  > :deep(.n-form-item) {
    flex: 1;
    min-width: 0;
  }
}

.form-hint {
  font-size: 11px;
  color: var(--n-text-color-3);
  margin-top: 4px;
}

.channel-form {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  .form-box {
    min-width: 300px;
    background: var(--n-action-color);
    border: 1px solid var(--n-border-color);
    border-radius: 8px;
    padding: 12px 16px;
  }

  // Input styles - minimal padding for placeholder and input text
  :deep(.n-input) {

    .n-input__input-el,
    .n-input__placeholder {
      padding-left: 0 !important;
      font-size: 14px;
    }

    .n-input__textarea-el,
    .n-input__textarea-mirror {
      padding: 8px 0 !important;
      line-height: 1.5;
      font-size: 14px;
    }

    // Fix dark mode - remove white background
    .n-input-wrapper {
      background: transparent !important;
    }
  }

  :deep(.n-input-number) {

    .n-input__input-el,
    .n-input__placeholder {
      text-align: left;
      padding-left: 0 !important;
      font-size: 14px;
    }
  }

  :deep(.n-select) {
    .n-base-selection-label {
      font-size: 14px;
    }
  }


  :deep(.n-form-item) {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.n-form-item-label) {
    font-weight: 500;
    font-size: 13px;
    margin-bottom: 2px;
  }
}

.notification-options {
  display: flex;
  flex-direction: column;
  gap: 8px;

  :deep(.n-checkbox) {
    font-size: 13px;
  }
}

.preview-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;

  :deep(.n-button) {
    padding: 0 6px;
  }
}

.template-preview {
  .preview-hint {
    margin: 0 0 12px 0;
    font-size: 0.8125rem;
    color: var(--n-text-color-3);
  }

  :deep(.n-code) {
    max-height: 300px;
    overflow-y: auto;
    font-size: 12px;
    border-radius: 6px;

    pre {
      margin: 0;
      padding: 12px;
    }
  }
}

:deep(.n-collapse) {
  .n-collapse-item__header {
    font-size: 13px;
    font-weight: 500;
  }

  .n-collapse-item__content-inner {
    padding-top: 8px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 15px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    width: 130px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 !important;
    box-sizing: border-box;
  }
}
</style>

<style lang="scss">
// Modal footer padding fix (unscoped)
.n-modal.n-card {
  .n-card__footer {
    padding-top: 0 !important;
  }
}

// Dark mode fix for inputs in notification channel modal (unscoped)
:root.dark {
  .n-modal {
    .channel-form {

      .n-input,
      .n-input-number {
        --n-color: rgba(255, 255, 255, 0.08) !important;
        --n-color-focus: rgba(255, 255, 255, 0.12) !important;
        background-color: rgba(255, 255, 255, 0.08) !important;
      }

      .n-input:focus-within,
      .n-input-number:focus-within {
        background-color: rgba(255, 255, 255, 0.12) !important;
      }

      // Fix browser autofill background for dark mode
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px #3b3b3b inset !important;
        -webkit-text-fill-color: #fff !important;
        caret-color: #fff !important;
      }
    }
  }
}
</style>