<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { useAlertsStore } from "@/store";
import { brandDefaults } from "@/config";
import type { NotificationChannel, NotificationChannelType } from "@/types";
import {
  generatePreviewData,
  formatNotificationByType,
} from "@/utils/telemetry/alerts";
import { highlightJsonLine } from "@/utils/json";

import {
  EmailConfig,
  type EmailConfigModel,
  SlackConfig,
  type SlackConfigModel,
  DiscordConfig,
  type DiscordConfigModel,
  MSTeamsConfig,
  type MSTeamsConfigModel,
  ZoomConfig,
  type ZoomConfigModel,
  TelegramConfig,
  type TelegramConfigModel,
  WebhookConfig,
  type WebhookConfigModel,
  PagerDutyConfig,
  type PagerDutyConfigModel,
  OpsGenieConfig,
  type OpsGenieConfigModel,
} from "./components";

const props = defineProps<{
  show: boolean;
  editingChannel: NotificationChannel | null;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "save"): void;
}>();

const message = useMessage();
const alertsStore = useAlertsStore();
const saving = ref(false);
const testing = ref(false);

const isEditing = computed(() => !!props.editingChannel);
const modalTitle = computed(() =>
  isEditing.value ? "Edit Notification Channel" : "Add Notification Channel",
);

// ─── Shared form state ────────────────────────────────────────────────────────
const channelType = ref<NotificationChannelType>("email");
const channelName = ref("");
const channelDescription = ref("");
const sendResolved = ref(true);
const sendReminder = ref(false);
const reminderInterval = ref("1h");

// ─── Per-channel config models ─────────────────────────────────────────────────
const emailConfig = ref<EmailConfigModel>({
  recipients: [],
  cc: [],
  bcc: [],
  subject: "",
  fromName: brandDefaults.companyName,
  fromEmail: "",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  smtpSecure: false,
});

const slackConfig = ref<SlackConfigModel>({
  webhookUrl: "",
  channel: "",
  username: brandDefaults.botName,
  iconEmoji: ":bell:",
});

const discordConfig = ref<DiscordConfigModel>({
  webhookUrl: "",
  username: brandDefaults.companyName,
  avatarUrl: "",
});

const msteamsConfig = ref<MSTeamsConfigModel>({
  webhookUrl: "",
  title: brandDefaults.alertTitle,
});

const zoomConfig = ref<ZoomConfigModel>({
  webhookUrl: "",
  authToken: "",
  botJid: "",
  headers: "",
});

const telegramConfig = ref<TelegramConfigModel>({
  botToken: "",
  chatId: "",
  parseMode: "HTML",
  disableNotification: false,
});

const webhookConfig = ref<WebhookConfigModel>({
  url: "",
  method: "POST",
  contentType: "json",
  authType: "none",
  authToken: "",
  basicUsername: "",
  basicPassword: "",
  apiKeyHeader: "X-Api-Key",
  apiKeyValue: "",
  signingSecret: "",
  signingHeader: "X-Webhook-Signature",
  headers: "",
  bodyTemplate: "",
  retryCount: 0,
});

const pagerdutyConfig = ref<PagerDutyConfigModel>({
  integrationKey: "",
  severity: "error",
  dedupKey: "",
});

const opsgenieConfig = ref<OpsGenieConfigModel>({
  apiKey: "",
  apiUrl: "https://api.opsgenie.com/v2/alerts",
  priority: "P3",
  tags: "",
});

// ─── Channel type sidebar ─────────────────────────────────────────────────────
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

function getChannelDescription(type: NotificationChannelType): string {
  const map: Record<NotificationChannelType, string> = {
    email: "Send alerts via email with HTML formatting and rich content",
    slack: "Post alerts to Slack channels with attachments and action buttons",
    discord:
      "Send alerts to Discord channels using webhook embeds with rich formatting",
    msteams: "Send alerts to Microsoft Teams using Adaptive Cards",
    zoom: "Notify Zoom Team Chat with field-formatted messages",
    telegram: "Send alerts to Telegram chats with HTML or Markdown formatting",
    opsgenie: "Create OpsGenie alerts with priority routing and responders",
    pagerduty: "Trigger PagerDuty incidents via Events API v2",
    webhook: "Send generic JSON payloads to any HTTP endpoint",
  };
  return map[type] ?? "Configure notification channel";
}

// ─── Populate / reset ─────────────────────────────────────────────────────────
watch(
  () => props.show,
  (visible) => {
    if (visible && props.editingChannel) {
      populateFromChannel(props.editingChannel);
    } else if (visible) {
      resetForm();
    }
  },
);

function populateFromChannel(ch: NotificationChannel) {
  channelType.value = ch.type;
  channelName.value = ch.name;
  channelDescription.value = ch.description || "";
  sendResolved.value = ch.sendResolved ?? true;
  sendReminder.value = ch.sendReminder ?? false;
  reminderInterval.value = ch.reminderInterval || "1h";

  switch (ch.type) {
    case "email":
      emailConfig.value = {
        recipients: ch.config.recipients ?? [],
        cc: ch.config.cc ?? [],
        bcc: ch.config.bcc ?? [],
        subject: ch.config.subject ?? "",
        fromName: ch.config.fromName ?? brandDefaults.companyName,
        fromEmail: ch.config.fromEmail ?? "",
        smtpHost: ch.config.smtpHost ?? "smtp.gmail.com",
        smtpPort: ch.config.smtpPort ?? 587,
        smtpUser: ch.config.smtpUser ?? "",
        smtpPassword: ch.config.smtpPassword ?? "",
        smtpSecure: ch.config.smtpSecure ?? false,
      };
      break;
    case "slack":
      slackConfig.value = {
        webhookUrl: ch.config.webhookUrl ?? "",
        channel: ch.config.channel ?? "",
        username: ch.config.username ?? brandDefaults.botName,
        iconEmoji: ch.config.iconEmoji ?? ":bell:",
      };
      break;
    case "discord":
      discordConfig.value = {
        webhookUrl: ch.config.webhookUrl ?? "",
        username: ch.config.username ?? brandDefaults.companyName,
        avatarUrl: ch.config.avatarUrl ?? "",
      };
      break;
    case "msteams":
      msteamsConfig.value = {
        webhookUrl: ch.config.webhookUrl ?? "",
        title: ch.config.title ?? brandDefaults.alertTitle,
      };
      break;
    case "zoom":
      zoomConfig.value = {
        webhookUrl: ch.config.webhookUrl ?? "",
        authToken: ch.config.authToken ?? "",
        botJid: ch.config.botJid ?? "",
        headers: ch.config.headers
          ? JSON.stringify(ch.config.headers, null, 2)
          : "",
      };
      break;
    case "telegram":
      telegramConfig.value = {
        botToken: ch.config.botToken ?? "",
        chatId: ch.config.chatId ?? "",
        parseMode: ch.config.parseMode ?? "HTML",
        disableNotification: ch.config.disableNotification ?? false,
      };
      break;
    case "webhook":
      webhookConfig.value = {
        url: ch.config.url ?? "",
        method: ch.config.method ?? "POST",
        contentType: ch.config.contentType ?? "json",
        authType: ch.config.authType ?? "none",
        authToken: ch.config.authToken ?? "",
        basicUsername: ch.config.basicAuth?.username ?? "",
        basicPassword: ch.config.basicAuth?.password ?? "",
        apiKeyHeader: ch.config.apiKey?.header ?? "X-Api-Key",
        apiKeyValue: ch.config.apiKey?.value ?? "",
        signingSecret: ch.config.signingSecret ?? "",
        signingHeader: ch.config.signingHeader ?? "X-Webhook-Signature",
        headers: ch.config.headers
          ? JSON.stringify(ch.config.headers, null, 2)
          : "",
        bodyTemplate: ch.config.bodyTemplate ?? "",
        retryCount: ch.config.retryCount ?? 0,
      };
      break;
    case "pagerduty":
      pagerdutyConfig.value = {
        integrationKey: ch.config.integrationKey ?? "",
        severity: ch.config.severity ?? "error",
        dedupKey: ch.config.dedupKey ?? "",
      };
      break;
    case "opsgenie":
      opsgenieConfig.value = {
        apiKey: ch.config.apiKey ?? "",
        apiUrl: ch.config.apiUrl ?? "https://api.opsgenie.com/v2/alerts",
        priority: ch.config.priority ?? "P3",
        tags: ch.config.tags?.join(", ") ?? "",
      };
      break;
  }
}

function resetForm() {
  channelType.value = "email";
  channelName.value = "";
  channelDescription.value = "";
  sendResolved.value = true;
  sendReminder.value = false;
  reminderInterval.value = "1h";

  emailConfig.value = {
    recipients: [],
    cc: [],
    bcc: [],
    subject: "",
    fromName: brandDefaults.companyName,
    fromEmail: "",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: false,
  };
  slackConfig.value = {
    webhookUrl: "",
    channel: "",
    username: brandDefaults.botName,
    iconEmoji: ":bell:",
  };
  discordConfig.value = {
    webhookUrl: "",
    username: brandDefaults.companyName,
    avatarUrl: "",
  };
  msteamsConfig.value = { webhookUrl: "", title: brandDefaults.alertTitle };
  zoomConfig.value = { webhookUrl: "", authToken: "", botJid: "", headers: "" };
  telegramConfig.value = {
    botToken: "",
    chatId: "",
    parseMode: "HTML",
    disableNotification: false,
  };
  webhookConfig.value = {
    url: "",
    method: "POST",
    contentType: "json",
    authType: "none",
    authToken: "",
    basicUsername: "",
    basicPassword: "",
    apiKeyHeader: "X-Api-Key",
    apiKeyValue: "",
    signingSecret: "",
    signingHeader: "X-Webhook-Signature",
    headers: "",
    bodyTemplate: "",
    retryCount: 0,
  };
  pagerdutyConfig.value = {
    integrationKey: "",
    severity: "error",
    dedupKey: "",
  };
  opsgenieConfig.value = {
    apiKey: "",
    apiUrl: "https://api.opsgenie.com/v2/alerts",
    priority: "P3",
    tags: "",
  };
}

// ─── Build config payload ─────────────────────────────────────────────────────
function buildChannelConfig(): Record<string, unknown> | null {
  switch (channelType.value) {
    case "email": {
      const recipients = emailConfig.value.recipients.filter(Boolean);
      if (recipients.length === 0) return null;
      return {
        recipients,
        cc: emailConfig.value.cc.filter(Boolean).length > 0
          ? emailConfig.value.cc.filter(Boolean)
          : undefined,
        bcc: emailConfig.value.bcc.filter(Boolean).length > 0
          ? emailConfig.value.bcc.filter(Boolean)
          : undefined,
        subject: emailConfig.value.subject || undefined,
        fromName: emailConfig.value.fromName || undefined,
        fromEmail: emailConfig.value.fromEmail || undefined,
        smtpHost: emailConfig.value.smtpHost,
        smtpPort: emailConfig.value.smtpPort,
        smtpUser: emailConfig.value.smtpUser || undefined,
        smtpPassword: emailConfig.value.smtpPassword || undefined,
        smtpSecure: emailConfig.value.smtpSecure,
      };
    }
    case "slack":
      if (!slackConfig.value.webhookUrl.trim()) return null;
      return {
        webhookUrl: slackConfig.value.webhookUrl.trim(),
        channel: slackConfig.value.channel || undefined,
        username: slackConfig.value.username || undefined,
        iconEmoji: slackConfig.value.iconEmoji || undefined,
      };
    case "discord":
      if (!discordConfig.value.webhookUrl.trim()) return null;
      return {
        webhookUrl: discordConfig.value.webhookUrl.trim(),
        username: discordConfig.value.username || undefined,
        avatarUrl: discordConfig.value.avatarUrl || undefined,
      };
    case "msteams":
      if (!msteamsConfig.value.webhookUrl.trim()) return null;
      return {
        webhookUrl: msteamsConfig.value.webhookUrl.trim(),
        title: msteamsConfig.value.title || undefined,
      };
    case "zoom": {
      if (!zoomConfig.value.webhookUrl.trim()) return null;
      let parsedHeaders: Record<string, string> | undefined;
      if (zoomConfig.value.headers.trim()) {
        try {
          parsedHeaders = JSON.parse(zoomConfig.value.headers);
        } catch {
          /* ignore */
        }
      }
      return {
        webhookUrl: zoomConfig.value.webhookUrl.trim(),
        authToken: zoomConfig.value.authToken.trim() || undefined,
        botJid: zoomConfig.value.botJid || undefined,
        headers: parsedHeaders,
      };
    }
    case "telegram":
      if (!telegramConfig.value.botToken || !telegramConfig.value.chatId.trim())
        return null;
      return {
        botToken: telegramConfig.value.botToken,
        chatId: telegramConfig.value.chatId.trim(),
        parseMode: telegramConfig.value.parseMode,
        disableNotification: telegramConfig.value.disableNotification,
      };
    case "webhook": {
      if (!webhookConfig.value.url.trim()) return null;
      let parsedHeaders: Record<string, string> | undefined;
      if (webhookConfig.value.headers.trim()) {
        try {
          parsedHeaders = JSON.parse(webhookConfig.value.headers);
        } catch {
          /* ignore */
        }
      }
      return {
        url: webhookConfig.value.url.trim(),
        method: webhookConfig.value.method,
        contentType: webhookConfig.value.contentType,
        authType: webhookConfig.value.authType,
        authToken:
          webhookConfig.value.authType === "bearer"
            ? webhookConfig.value.authToken
            : undefined,
        basicAuth:
          webhookConfig.value.authType === "basic"
            ? {
                username: webhookConfig.value.basicUsername,
                password: webhookConfig.value.basicPassword,
              }
            : undefined,
        apiKey:
          webhookConfig.value.authType === "apikey"
            ? {
                header: webhookConfig.value.apiKeyHeader || "X-Api-Key",
                value: webhookConfig.value.apiKeyValue,
              }
            : undefined,
        signingSecret: webhookConfig.value.signingSecret.trim() || undefined,
        signingHeader:
          webhookConfig.value.signingSecret.trim()
            ? webhookConfig.value.signingHeader || "X-Webhook-Signature"
            : undefined,
        headers: parsedHeaders,
        bodyTemplate: webhookConfig.value.bodyTemplate.trim() || undefined,
        retryCount: webhookConfig.value.retryCount || undefined,
      };
    }
    case "pagerduty":
      if (!pagerdutyConfig.value.integrationKey.trim()) return null;
      return {
        integrationKey: pagerdutyConfig.value.integrationKey.trim(),
        severity: pagerdutyConfig.value.severity,
        dedupKey: pagerdutyConfig.value.dedupKey.trim() || undefined,
      };
    case "opsgenie":
      if (!opsgenieConfig.value.apiKey.trim()) return null;
      return {
        apiKey: opsgenieConfig.value.apiKey.trim(),
        apiUrl: opsgenieConfig.value.apiUrl || undefined,
        priority: opsgenieConfig.value.priority,
        tags: opsgenieConfig.value.tags.trim()
          ? opsgenieConfig.value.tags.split(",").map((t) => t.trim())
          : undefined,
      };
    default:
      return null;
  }
}

// ─── Test ─────────────────────────────────────────────────────────────────────
async function testCurrentChannel() {
  if (!props.editingChannel || testing.value) return;
  testing.value = true;
  try {
    await alertsStore.testChannel(props.editingChannel.id);
    message.success("Test notification sent successfully");
  } catch (e: any) {
    message.error(e?.message || "Test notification failed");
  } finally {
    testing.value = false;
  }
}

const canTest = computed(() => !!props.editingChannel && !saving.value);

// ─── Save ─────────────────────────────────────────────────────────────────────
async function saveChannel() {
  if (!channelName.value.trim() || saving.value) return;
  const channelConfig = buildChannelConfig();
  if (!channelConfig) return;

  saving.value = true;
  try {
    if (isEditing.value && props.editingChannel) {
      await alertsStore.updateChannel(props.editingChannel.id, {
        name: channelName.value,
        description: channelDescription.value || undefined,
        sendResolved: sendResolved.value,
        sendReminder: sendReminder.value,
        reminderInterval: sendReminder.value
          ? reminderInterval.value
          : undefined,
        config: channelConfig,
      } as Partial<NotificationChannel>);
      message.success("Channel updated successfully");
    } else {
      await alertsStore.addChannel({
        name: channelName.value,
        type: channelType.value,
        description: channelDescription.value || undefined,
        config: channelConfig,
        sendResolved: sendResolved.value,
        sendReminder: sendReminder.value,
        reminderInterval: sendReminder.value
          ? reminderInterval.value
          : undefined,
      });
      message.success("Channel created successfully");
    }
    emit("save");
  } catch (e: any) {
    message.error(e?.response?.data?.message || "Failed to save channel");
  } finally {
    saving.value = false;
  }
}

// ─── Template preview ─────────────────────────────────────────────────────────
const previewData = generatePreviewData();

const templatePreview = computed(() => {
  const config: Record<string, unknown> = {};
  if (channelType.value === "pagerduty") {
    config.routingKey =
      pagerdutyConfig.value.integrationKey || "YOUR_ROUTING_KEY";
    config.severity = pagerdutyConfig.value.severity;
    config.dedupKey = pagerdutyConfig.value.dedupKey || undefined;
  } else if (channelType.value === "opsgenie") {
    config.priority = opsgenieConfig.value.priority;
    config.tags = opsgenieConfig.value.tags.trim()
      ? opsgenieConfig.value.tags.split(",").map((t) => t.trim())
      : [];
  } else if (channelType.value === "telegram") {
    config.parseMode = telegramConfig.value.parseMode;
  }
  const payload = formatNotificationByType(
    channelType.value,
    previewData,
    config,
  );
  return JSON.stringify(payload, null, 2);
});

const highlightedLines = computed(() =>
  templatePreview.value.split("\n").map((line, i) => ({
    number: i + 1,
    html: highlightJsonLine(line),
  })),
);

async function copyTemplate() {
  try {
    await navigator.clipboard.writeText(templatePreview.value);
    message.success("Template copied to clipboard");
  } catch {
    message.error("Failed to copy template");
  }
}

async function pasteTemplate() {
  if (channelType.value !== "webhook") {
    message.warning("Paste is only available for Webhook channel");
    return;
  }
  try {
    const text = await navigator.clipboard.readText();
    webhookConfig.value.bodyTemplate = text;
    message.success("Template pasted to custom body");
  } catch {
    message.error("Failed to paste from clipboard");
  }
}

function handleClose() {
  emit("update:show", false);
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :title="modalTitle"
    style="max-width: 800px; width: 85%"
    @update:show="handleClose"
  >
    <div class="channel-modal-content">
      <!-- Left Side: Vertical Tabs -->
      <div class="channel-tabs">
        <div
          v-for="opt in channelTypeOptions"
          :key="opt.value"
          class="channel-tab-item"
          :class="{
            active: channelType === opt.value,
            disabled: isEditing && channelType !== opt.value,
          }"
          @click="!isEditing && (channelType = opt.value)"
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
            <!-- Shared Fields -->
            <n-form-item>
              <template #label>
                Channel Name <span class="required-asterisk">*</span>
              </template>
              <n-input v-model:value="channelName" placeholder="My Channel" />
            </n-form-item>
            <n-form-item label="Description (optional)">
              <n-input
                v-model:value="channelDescription"
                type="textarea"
                placeholder="Brief description of this channel"
                :autosize="{ minRows: 2, maxRows: 3 }"
              />
            </n-form-item>

            <!-- Per-channel Config Components -->
            <EmailConfig v-if="channelType === 'email'" v-model="emailConfig" />
            <SlackConfig v-if="channelType === 'slack'" v-model="slackConfig" />
            <DiscordConfig
              v-if="channelType === 'discord'"
              v-model="discordConfig"
            />
            <MSTeamsConfig
              v-if="channelType === 'msteams'"
              v-model="msteamsConfig"
            />
            <ZoomConfig v-if="channelType === 'zoom'" v-model="zoomConfig" />
            <TelegramConfig
              v-if="channelType === 'telegram'"
              v-model="telegramConfig"
            />
            <WebhookConfig
              v-if="channelType === 'webhook'"
              v-model="webhookConfig"
            />
            <PagerDutyConfig
              v-if="channelType === 'pagerduty'"
              v-model="pagerdutyConfig"
            />
            <OpsGenieConfig
              v-if="channelType === 'opsgenie'"
              v-model="opsgenieConfig"
            />

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
                <n-form-item
                  v-if="sendReminder"
                  label="Reminder Interval"
                  style="margin-top: 8px; margin-bottom: 0"
                >
                  <n-select
                    v-model:value="reminderInterval"
                    :options="[
                      { label: '15 minutes', value: '15m' },
                      { label: '30 minutes', value: '30m' },
                      { label: '1 hour', value: '1h' },
                      { label: '2 hours', value: '2h' },
                      { label: '4 hours', value: '4h' },
                      { label: '8 hours', value: '8h' },
                      { label: '24 hours', value: '24h' },
                    ]"
                    style="width: 180px"
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
                          <template #icon><Icon icon="carbon:copy" /></template>
                        </n-button>
                      </template>
                      Copy template
                    </n-tooltip>
                    <n-tooltip trigger="hover">
                      <template #trigger>
                        <n-button
                          size="tiny"
                          quaternary
                          :disabled="channelType !== 'webhook'"
                          @click="pasteTemplate"
                        >
                          <template #icon>
                            <Icon icon="carbon:paste" />
                          </template>
                        </n-button>
                      </template>
                      {{
                        channelType === "webhook"
                          ? "Paste to custom body"
                          : "Paste only available for Webhook"
                      }}
                    </n-tooltip>
                  </div>
                </template>
                <div class="template-preview">
                  <p class="preview-hint">
                    This is how your alert notification will be formatted when
                    sent to {{ channelType.toUpperCase() }}:
                  </p>
                  <div class="template-preview-scroll">
                    <div
                      class="line-numbered-editor-wrapper readonly size-medium"
                    >
                      <div class="line-numbered-editor-numbers">
                        <span
                          v-for="line in highlightedLines"
                          :key="`tpl-${line.number}`"
                          class="line-number"
                        >
                          {{ line.number }}
                        </span>
                      </div>
                      <pre class="line-numbered-editor-content"><span
                        v-for="line in highlightedLines"
                        :key="`hl-${line.number}`"
                        class="json-line"
                        v-html="line.html"
                      /></pre>
                    </div>
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>
          </n-form>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer tfo-modal-footer">
        <n-button type="primary" ghost @click="handleClose">
          <template #icon><Icon icon="carbon:close" /></template>
          Cancel
        </n-button>
        <n-tooltip :disabled="canTest" trigger="hover">
          <template #trigger>
            <n-button
              type="default"
              :disabled="!canTest || testing"
              :loading="testing"
              @click="testCurrentChannel"
            >
              <template #icon><Icon icon="carbon:send-alt" /></template>
              Test Channel
            </n-button>
          </template>
          Save the channel first to enable testing
        </n-tooltip>
        <n-button
          type="primary"
          :disabled="!channelName.trim() || saving"
          :loading="saving"
          @click="saveChannel"
        >
          <template #icon><Icon icon="carbon:save" /></template>
          {{ isEditing ? "Update Channel" : "Save Channel" }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
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

  &:hover:not(.disabled) {
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

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
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

  :deep(.n-input) {
    // Single-line inputs: left-flush text + vertically centered placeholder
    &:not(.n-input--textarea) {
      .n-input__input-el {
        padding-left: 0 !important;
        font-size: 14px;
        line-height: 1;
      }
      .n-input__placeholder {
        padding-left: 0 !important;
        font-size: 14px;
        display: flex !important;
        align-items: center !important;
        top: 0 !important;
        bottom: 0 !important;
        transform: none !important;
        height: 100% !important;
        line-height: 1;
      }
    }

    // Textarea inputs
    .n-input__textarea-el,
    .n-input__textarea-mirror {
      padding: 8px 0 !important;
      line-height: 1.5;
      font-size: 14px;
    }

    .n-input__textarea-placeholder {
      padding: 8px 0 !important;
      font-size: 14px;
    }

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

  .required-asterisk {
    color: #e03050;
    margin-left: 2px;
  }
}

// form-row is used inside child components — expose via :deep
:deep(.form-row) {
  display: flex;
  gap: 12px;

  > .n-form-item {
    flex: 1;
    min-width: 0;
  }
}

:deep(.form-hint) {
  font-size: 11px;
  color: var(--n-text-color-3);
  margin-top: 4px;
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

  .template-preview-scroll {
    max-height: 300px;
    overflow-y: auto;
    border-radius: 6px;

    .line-numbered-editor-wrapper {
      overflow: visible;
      border: none;
      border-radius: 0;

      .line-numbered-editor-content {
        min-height: unset;
        max-height: unset;
        overflow: visible;
      }
    }

    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.3);
      border-radius: 4px;
      &:hover {
        background: rgba(100, 116, 139, 0.5);
      }
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
    min-width: 120px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 16px !important;
    box-sizing: border-box;
  }
}
</style>

<style lang="scss">
.n-modal.n-card {
  .n-card__footer {
    padding-top: 0 !important;
  }
}

:root.dark {
  .n-modal {
    .channel-form {
      .n-input-wrapper {
        background: transparent !important;
      }
    }
  }
}
</style>
