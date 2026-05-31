<script setup lang="ts">
import { h, ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  NButton,
  NTag,
  NSelect,
  NInput,
  NDataTable,
  NCard,
  NText,
  NDropdown,
  NSwitch,
  NDrawer,
  NDrawerContent,
  useMessage,
  useDialog,
} from "naive-ui";
import type { DataTableColumns, SelectOption, DropdownOption } from "naive-ui";
import { useAlertsStore } from "@/store";
import { getChannelIcon } from "@/utils";
import { formatDateTime } from "@/utils/format";
import type { NotificationChannel, NotificationChannelType } from "@/types";
import { uptimeApi } from "@/api/uptime";
import type { Monitor } from "@/types/uptime";
import { MONITOR_TYPES } from "@/types/uptime";

// Import the existing modal component for Add/Edit
import ChannelModal from "./ChannelModal.vue";

const message = useMessage();
const dialog = useDialog();
const alertsStore = useAlertsStore();

// ==================== DATA ====================

const loading = ref(false);
const testingChannelId = ref<string | null>(null);

// Filters
const searchQuery = ref("");
const filterType = ref<string | null>(null);
const filterStatus = ref<string | null>(null);

// Modal
const showModal = ref(false);
const editingChannel = ref<NotificationChannel | null>(null);

// Default channels — sourced from DB via store
const defaultChannelIds = computed({
  get: () => alertsStore.defaultChannelIds,
  set: (ids: string[]) => alertsStore.saveDefaultChannels(ids),
});

function handleDefaultsChange(ids: string[]) {
  alertsStore.saveDefaultChannels(ids);
}

// ==================== FILTER OPTIONS ====================

const typeOptions: (SelectOption & { icon?: string })[] = [
  { label: "All Types", value: "all", icon: "carbon:filter" },
  { label: "Email", value: "email", icon: "carbon:email" },
  { label: "Slack", value: "slack", icon: "carbon:logo-slack" },
  { label: "Discord", value: "discord", icon: "carbon:logo-discord" },
  { label: "MS Teams", value: "msteams", icon: "mdi:microsoft-teams" },
  { label: "Zoom", value: "zoom", icon: "mdi:video" },
  { label: "Telegram", value: "telegram", icon: "mdi:telegram" },
  { label: "PagerDuty", value: "pagerduty", icon: "simple-icons:pagerduty" },
  { label: "OpsGenie", value: "opsgenie", icon: "simple-icons:opsgenie" },
  { label: "Webhook", value: "webhook", icon: "carbon:webhook" },
];

function renderTypeLabel(option: SelectOption & { icon?: string }) {
  return h("div", { style: "display: flex; align-items: center; gap: 8px" }, [
    option.icon ? h(Icon, { icon: option.icon, width: 16, height: 16 }) : null,
    h("span", null, option.label as string),
  ]);
}

const statusOptions: SelectOption[] = [
  { label: "All Status", value: "all" },
  { label: "Enabled", value: "enabled" },
  { label: "Disabled", value: "disabled" },
];

// ==================== COMPUTED ====================

const filteredChannels = computed(() => {
  let channels = alertsStore.notificationChannels;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    channels = channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }

  if (filterType.value && filterType.value !== "all") {
    channels = channels.filter((c) => c.type === filterType.value);
  }

  if (filterStatus.value && filterStatus.value !== "all") {
    const isEnabled = filterStatus.value === "enabled";
    channels = channels.filter((c) => c.enabled === isEnabled);
  }

  return channels;
});

// Stats
const totalChannels = computed(() => alertsStore.notificationChannels.length);
const enabledChannels = computed(() => alertsStore.notificationChannels.filter((c) => c.enabled).length);
const disabledChannels = computed(() => alertsStore.notificationChannels.filter((c) => !c.enabled).length);

const defaultChannelCount = computed(() => alertsStore.defaultChannelIds.length);

// Default channel options for multi-select (all channels, disabled ones cannot be newly selected)
const defaultChannelOptions = computed(() =>
  alertsStore.notificationChannels.map((c) => ({
    label: c.name,
    value: c.id,
    icon: getChannelIcon(c.type),
    channelType: c.type,
    disabled: !c.enabled,
  }))
);

function renderDefaultLabel(option: SelectOption & { icon?: string; channelType?: string }) {
  const { color } = option.channelType ? getChannelColor(option.channelType as NotificationChannelType) : { color: "#6b7280" };
  return h("div", { style: "display: flex; align-items: center; gap: 8px" }, [
    option.icon ? h(Icon, { icon: option.icon, width: 16, height: 16, style: `color: ${color}` }) : null,
    h("span", null, option.label as string),
  ]);
}

function renderDefaultTag({ option, handleClose }: { option: SelectOption & { icon?: string; channelType?: string }; handleClose: () => void }) {
  const { color, bg } = option.channelType ? getChannelColor(option.channelType as NotificationChannelType) : { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  return h("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "0.75rem",
      fontWeight: "600",
      backgroundColor: bg,
      color: color,
      marginRight: "4px",
      marginTop: "2px",
      marginBottom: "2px",
    },
  }, [
    option.icon ? h(Icon, { icon: option.icon, width: 12, height: 12, style: `color: ${color}` }) : null,
    h("span", null, option.label as string),
    h("span", {
      style: "cursor: pointer; margin-left: 4px; opacity: 0.6; font-size: 14px; line-height: 1",
      onClick: (e: Event) => { e.stopPropagation(); handleClose(); },
    }, "\u00d7"),
  ]);
}

// ==================== HELPERS ====================

const statusBadgeColors: Record<string, { bg: string; color: string }> = {
  enabled: { bg: "#22c55e", color: "#ffffff" },
  disabled: { bg: "#6b7280", color: "#ffffff" },
};

const severityBadgeColors: Record<string, { bg: string; color: string }> = {
  critical: { bg: "#ef4444", color: "#ffffff" },
  warning: { bg: "#f59e0b", color: "#ffffff" },
  info: { bg: "#3b82f6", color: "#ffffff" },
};

// Map channel ID -> list of rules using it
const channelRulesMap = computed(() => {
  const map = new Map<string, { name: string; severity: string }[]>();
  for (const rule of alertsStore.rules) {
    const channelIds = rule.channelIds || [];
    for (const cid of channelIds) {
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push({ name: rule.name, severity: rule.severity });
    }
  }
  return map;
});

// Uptime monitors
const monitors = ref<Monitor[]>([]);

async function fetchMonitors() {
  try {
    const result = await uptimeApi.listMonitors({ pageSize: 1000 });
    monitors.value = result.data;
  } catch (error) {
    console.error("Failed to fetch monitors:", error);
  }
}

// Map channel ID -> list of monitors using it
const channelMonitorsMap = computed(() => {
  const map = new Map<string, { name: string; type: string; status: string }[]>();
  for (const monitor of monitors.value) {
    const channelIds = monitor.notificationChannels || [];
    for (const cid of channelIds) {
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push({ name: monitor.name, type: monitor.type, status: monitor.status });
    }
  }
  return map;
});

// Unified usage items for a channel
interface UsageItem {
  name: string;
  source: "rule" | "monitor";
  severity?: string;
  monitorType?: string;
  monitorStatus?: string;
}

function getChannelUsageItems(channelId: string): UsageItem[] {
  const items: UsageItem[] = [];
  const rules = channelRulesMap.value.get(channelId) || [];
  for (const r of rules) {
    items.push({ name: r.name, source: "rule", severity: r.severity });
  }
  const mons = channelMonitorsMap.value.get(channelId) || [];
  for (const m of mons) {
    items.push({ name: m.name, source: "monitor", monitorType: m.type, monitorStatus: m.status });
  }
  return items;
}

const usageBadgeColors: Record<string, { bg: string; color: string }> = {
  // Rule severities
  critical: { bg: "#ef4444", color: "#ffffff" },
  warning: { bg: "#f59e0b", color: "#ffffff" },
  info: { bg: "#3b82f6", color: "#ffffff" },
  // Monitor source
  monitor: { bg: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9" },
};

function getChannelColor(type: NotificationChannelType): { color: string; bg: string } {
  const colors: Record<NotificationChannelType, { color: string; bg: string }> = {
    email: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
    slack: { color: "#e01e5a", bg: "rgba(224, 30, 90, 0.1)" },
    discord: { color: "#5865f2", bg: "rgba(88, 101, 242, 0.1)" },
    msteams: { color: "#6264a7", bg: "rgba(98, 100, 167, 0.1)" },
    zoom: { color: "#2d8cff", bg: "rgba(45, 140, 255, 0.1)" },
    telegram: { color: "#26a5e4", bg: "rgba(38, 165, 228, 0.1)" },
    webhook: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    pagerduty: { color: "#06ac38", bg: "rgba(6, 172, 56, 0.1)" },
    opsgenie: { color: "#2684ff", bg: "rgba(38, 132, 255, 0.1)" },
  };
  return colors[type] || { color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)" };
}

function getChannelConfigSummary(channel: NotificationChannel): string {
  switch (channel.type) {
    case "email": {
      const count = channel.config.recipients?.length ?? 0;
      const host = channel.config.smtpHost;
      return count > 0
        ? `${count} recipient(s)${host ? ` via ${host}` : ""}`
        : host ? `SMTP: ${host}` : "Email";
    }
    case "slack":
      return channel.config.channel || (channel.config.webhookUrl ? channel.config.webhookUrl.substring(0, 40) + "..." : "Slack Webhook");
    case "discord":
      return channel.config.username || "Discord Webhook";
    case "msteams":
      return channel.config.title || "MS Teams Webhook";
    case "zoom":
      return channel.config.botJid || "Zoom Webhook";
    case "telegram":
      return channel.config.chatId ? `Chat: ${channel.config.chatId}` : "Telegram";
    case "webhook":
      return channel.config.url ? channel.config.url.substring(0, 40) + "..." : "Webhook";
    case "pagerduty":
      return `Severity: ${channel.config.severity || "error"}`;
    case "opsgenie":
      return `Priority: ${channel.config.priority || "P3"}`;
    default:
      return "";
  }
}

// ==================== COLUMNS ====================

const columns = computed<DataTableColumns<NotificationChannel>>(() => [
  {
    title: "Channel",
    key: "name",
    width: 250,
    sorter: (a, b) => a.name.localeCompare(b.name),
    render(row) {
      return h("div", { class: "channel-name-cell" }, [
        h(Icon, { icon: getChannelIcon(row.type), width: 20, height: 20, class: "channel-cell-icon" }),
        h("div", { class: "channel-cell-info" }, [
          h(NText, { strong: true, style: "font-size: 14px; font-weight: 600; display: block" }, { default: () => row.name }),
          h(NText, { depth: 3, style: "font-size: 12px; display: block; margin-top: 2px" }, { default: () => row.description || getChannelConfigSummary(row) }),
        ]),
      ]);
    },
  },
  {
    title: "Type",
    key: "type",
    width: 120,
    sorter: (a, b) => a.type.localeCompare(b.type),
    render(row) {
      const { color, bg } = getChannelColor(row.type);
      return h(
        NTag,
        {
          size: "small",
          bordered: false,
          style: `color: ${color}; background: ${bg}; font-weight: 700;`,
        },
        {
          default: () => row.type.toUpperCase(),
          icon: () => h(Icon, { icon: getChannelIcon(row.type), width: 14, style: `color: ${color}` }),
        }
      );
    },
  },
  {
    title: "Status",
    key: "enabled",
    width: 160,
    sorter: (a, b) => Number(a.enabled) - Number(b.enabled),
    render(row) {
      const status = row.enabled ? "enabled" : "disabled";
      const config = statusBadgeColors[status];
      return h("div", { style: "display: flex; align-items: center; gap: 8px" }, [
        h(NSwitch, {
          value: row.enabled,
          size: "small",
          onUpdateValue: () => handleToggle(row.id),
        }),
        h("span", {
          style: {
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 12px",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontWeight: "600",
            backgroundColor: config.bg,
            color: config.color,
            textTransform: "uppercase",
          },
        }, status),
      ]);
    },
  },
  {
    title: "Default",
    key: "default",
    width: 80,
    sorter: (a, b) => Number(defaultChannelIds.value.includes(a.id)) - Number(defaultChannelIds.value.includes(b.id)),
    render(row) {
      const isDefault = defaultChannelIds.value.includes(row.id);
      return h(
        NTag,
        { size: "small", type: isDefault ? "success" : "default", bordered: false },
        { default: () => (isDefault ? "Yes" : "-") }
      );
    },
  },
  {
    title: "Used By",
    key: "usedBy",
    width: 220,
    render(row) {
      const items = getChannelUsageItems(row.id);
      if (items.length === 0) {
        return h(NText, { depth: 3, style: "font-size: 12px" }, { default: () => "Not used" });
      }
      const maxVisible = 2;
      const visible = items.slice(0, maxVisible);
      const remaining = items.length - maxVisible;
      return h("div", { style: "display: flex; gap: 4px; flex-wrap: nowrap; align-items: center; overflow: hidden;" }, [
        ...visible.map((item) => {
          if (item.source === "rule") {
            const config = severityBadgeColors[item.severity || "info"] || severityBadgeColors.info;
            return h("span", {
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "0.7rem",
                fontWeight: "600",
                backgroundColor: config.bg,
                color: config.color,
                whiteSpace: "nowrap",
              },
            }, [
              h(Icon, { icon: "carbon:rule", width: 12, height: 12 }),
              item.name,
            ]);
          }
          // Monitor
          const monitorTypeInfo = MONITOR_TYPES[item.monitorType as keyof typeof MONITOR_TYPES];
          return h("span", {
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.7rem",
              fontWeight: "600",
              backgroundColor: usageBadgeColors.monitor.bg,
              color: usageBadgeColors.monitor.color,
              whiteSpace: "nowrap",
            },
          }, [
            h(Icon, { icon: monitorTypeInfo?.icon || "carbon:activity", width: 12, height: 12 }),
            item.name,
          ]);
        }),
        ...(remaining > 0
          ? [h("span", {
            style: {
              fontSize: "0.7rem",
              fontWeight: "500",
              color: "var(--n-text-color-3)",
              cursor: "pointer",
            },
            onClick: () => showChannelDetail(row),
          }, `+${remaining} more`)]
          : []),
      ]);
    },
  },
  {
    title: "Last Used",
    key: "lastUsedAt",
    width: 170,
    sorter: (a, b) => (a.lastUsedAt || 0) - (b.lastUsedAt || 0),
    render(row) {
      if (!row.lastUsedAt) return h(NText, { depth: 3 }, { default: () => "Never" });
      const lastUsed = row.lastUsedAt;
      return h(NText, { depth: 2, style: "font-size: 13px" }, { default: () => formatDateTime(lastUsed) });
    },
  },
  {
    title: "Created",
    key: "createdAt",
    width: 170,
    sorter: (a, b) => a.createdAt - b.createdAt,
    render(row) {
      return h(NText, { depth: 2, style: "font-size: 13px" }, { default: () => formatDateTime(row.createdAt) });
    },
  },
  {
    title: "Actions",
    key: "actions",
    width: 80,
    align: "center" as const,
    fixed: "right" as const,
    render(row) {
      const options: DropdownOption[] = [
        {
          label: "Detail",
          key: "detail",
          icon: () => h(Icon, { icon: "carbon:magnify", width: 16, height: 16 }),
        },
        {
          label: "Edit",
          key: "edit",
          icon: () => h(Icon, { icon: "carbon:edit", width: 16, height: 16 }),
        },
        {
          label: "Test",
          key: "test",
          icon: () => h(Icon, { icon: "carbon:send-alt", width: 16, height: 16 }),
        },
        { type: "divider", key: "d1" },
        {
          label: "Delete",
          key: "delete",
          icon: () => h(Icon, { icon: "carbon:trash-can", width: 16, height: 16, style: "color: #ef4444" }),
          props: { style: "color: #ef4444" },
        },
      ];

      function handleActionSelect(key: string) {
        switch (key) {
          case "detail":
            showChannelDetail(row);
            break;
          case "edit":
            openEditModal(row);
            break;
          case "test":
            handleTest(row.id);
            break;
          case "delete":
            dialog.warning({
              title: "Delete Channel",
              content: "Delete this notification channel?",
              positiveText: "Delete",
              negativeText: "Cancel",
              onPositiveClick: () => handleDelete(row.id),
            });
            break;
        }
      }

      return h(
        NDropdown,
        {
          options,
          trigger: "click",
          onSelect: handleActionSelect,
        },
        {
          default: () =>
            h(
              NButton,
              { size: "small", quaternary: true },
              { icon: () => h(Icon, { icon: "carbon:overflow-menu-vertical", width: 16, height: 16 }) }
            ),
        }
      );
    },
  },
]);

// ==================== ACTIONS ====================

function openAddModal() {
  editingChannel.value = null;
  showModal.value = true;
}

function openEditModal(channel: NotificationChannel) {
  editingChannel.value = channel;
  showModal.value = true;
}

function handleModalSave() {
  showModal.value = false;
  editingChannel.value = null;
}

async function handleToggle(id: string) {
  try {
    await alertsStore.toggleChannel(id);
  } catch {
    message.error("Failed to update channel status");
  }
}

async function handleTest(id: string) {
  testingChannelId.value = id;
  try {
    await alertsStore.testChannel(id);
    message.success("Test notification sent successfully");
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : "Failed to send test notification";
    message.error(errMsg);
  } finally {
    testingChannelId.value = null;
  }
}

async function handleDelete(id: string) {
  try {
    // Remove from defaults first
    const currentDefaults = alertsStore.defaultChannelIds;
    if (currentDefaults.includes(id)) {
      await alertsStore.saveDefaultChannels(currentDefaults.filter((cid) => cid !== id));
    }
    await alertsStore.deleteChannel(id);
    message.success("Channel deleted");
  } catch {
    message.error("Failed to delete channel");
  }
}

function handleResetFilters() {
  searchQuery.value = "";
  filterType.value = null;
  filterStatus.value = null;
}

// ==================== DETAIL DRAWER ====================

const showDetailDrawer = ref(false);
const selectedChannel = ref<NotificationChannel | null>(null);

const selectedChannelRules = computed(() => {
  if (!selectedChannel.value) return [];
  return channelRulesMap.value.get(selectedChannel.value.id) || [];
});

const selectedChannelMonitors = computed(() => {
  if (!selectedChannel.value) return [];
  return channelMonitorsMap.value.get(selectedChannel.value.id) || [];
});

function showChannelDetail(channel: NotificationChannel) {
  selectedChannel.value = channel;
  showDetailDrawer.value = true;
}

// ==================== INIT ====================

onMounted(() => {
  fetchMonitors();
  alertsStore.fetchChannels();
});
</script>

<template>
  <div class="notification-channels-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="carbon:notification" class="title-icon" />
          Notification Channels
        </h1>
        <span class="page-subtitle">Manage notification channels for alerts and monitoring</span>
      </div>
      <div class="header-right">
        <NButton type="primary" @click="openAddModal">
          <template #icon>
            <Icon icon="carbon:add" />
          </template>
          Add Channel
        </NButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <NCard size="small" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <Icon icon="carbon:notification" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalChannels }}</span>
            <span class="stat-label">Total Channels</span>
          </div>
        </div>
      </NCard>
      <NCard size="small" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon enabled">
            <Icon icon="carbon:checkmark-filled" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ enabledChannels }}</span>
            <span class="stat-label">Enabled</span>
          </div>
        </div>
      </NCard>
      <NCard size="small" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon disabled">
            <Icon icon="carbon:subtract-filled" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ disabledChannels }}</span>
            <span class="stat-label">Disabled</span>
          </div>
        </div>
      </NCard>
      <NCard size="small" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon default">
            <Icon icon="carbon:star-filled" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ defaultChannelCount }}</span>
            <span class="stat-label">Default Channels</span>
          </div>
        </div>
      </NCard>
    </div>

    <!-- Global Defaults -->
    <NCard size="small" class="defaults-card">
      <div class="defaults-content">
        <div class="defaults-label">
          <Icon icon="carbon:star-filled" class="defaults-icon" />
          <div>
            <NText strong>Default Channels</NText>
            <br />
            <NText depth="3" style="font-size: 12px">
              Used when no specific channels are assigned to an alert rule
            </NText>
          </div>
        </div>
        <NSelect
          :value="defaultChannelIds" :options="defaultChannelOptions" :render-label="renderDefaultLabel"
          :render-tag="renderDefaultTag" multiple :max-tag-count="3" placeholder="Select default channels..."
          style="min-width: 300px; max-width: 500px" @update:value="handleDefaultsChange"
        />
      </div>
    </NCard>

    <!-- Data Table -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:notification" class="section-icon" />
          <span>Channel List</span>
          <NTag :bordered="false" size="small" type="info">
            {{ filteredChannels.length }} channels
          </NTag>
        </div>
        <div class="table-actions">
          <NInput
            v-model:value="searchQuery" placeholder="Search channels..." size="small" clearable
            class="search-input"
          >
            <template #prefix>
              <Icon icon="carbon:search" />
            </template>
          </NInput>
          <NSelect
            v-model:value="filterType" :options="typeOptions" :render-label="renderTypeLabel" placeholder="Type"
            size="small" style="width: 140px"
          />
          <NSelect
            v-model:value="filterStatus" :options="statusOptions" placeholder="Status" size="small"
            style="width: 130px"
          />
          <NButton size="small" ghost @click="handleResetFilters">
            <template #icon>
              <Icon icon="carbon:reset" />
            </template>
            Reset
          </NButton>
        </div>
      </div>
      <div class="table-content">
        <NDataTable
          :columns="columns" :data="filteredChannels" :loading="loading" :scroll-x="1350"
          :row-key="(row: NotificationChannel) => row.id"
          :pagination="{ pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50, 100, 200, 500] }" :bordered="false" striped
          size="small"
        />
      </div>
    </div>

    <!-- Channel Modal (Add/Edit) -->
    <ChannelModal v-model:show="showModal" :editing-channel="editingChannel" @save="handleModalSave" />

    <!-- Detail Drawer -->
    <NDrawer
      :show="showDetailDrawer" :width="500" placement="right"
      @update:show="(val: boolean) => showDetailDrawer = val"
    >
      <NDrawerContent v-if="selectedChannel">
        <template #header>
          <div class="drawer-header">
            <Icon :icon="getChannelIcon(selectedChannel.type)" class="drawer-header-icon" />
            <span>{{ selectedChannel.name }}</span>
          </div>
        </template>
        <template #footer>
          <div class="drawer-footer">
            <NButton @click="showDetailDrawer = false">
              <template #icon>
                <Icon icon="carbon:close" />
              </template>
              Close
            </NButton>
          </div>
        </template>

        <div class="detail-content">
          <!-- Channel Info -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:information" />
              <span>Channel Information</span>
            </div>
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="info-label">Name</td>
                  <td class="info-value">{{ selectedChannel.name }}</td>
                </tr>
                <tr>
                  <td class="info-label">Type</td>
                  <td class="info-value">
                    <NTag
                      size="small" :bordered="false"
                      :style="`color: ${getChannelColor(selectedChannel.type).color}; background: ${getChannelColor(selectedChannel.type).bg}; font-weight: 700;`"
                    >
                      <template #icon>
                        <Icon :icon="getChannelIcon(selectedChannel.type)" />
                      </template>
                      {{ selectedChannel.type.toUpperCase() }}
                    </NTag>
                  </td>
                </tr>
                <tr>
                  <td class="info-label">Status</td>
                  <td class="info-value">
                    <NTag :type="selectedChannel.enabled ? 'success' : 'default'" size="small">
                      {{ selectedChannel.enabled ? 'Enabled' : 'Disabled' }}
                    </NTag>
                  </td>
                </tr>
                <tr v-if="selectedChannel.description">
                  <td class="info-label">Description</td>
                  <td class="info-value">{{ selectedChannel.description }}</td>
                </tr>
                <tr>
                  <td class="info-label">Default</td>
                  <td class="info-value">
                    <NTag :type="defaultChannelIds.includes(selectedChannel.id) ? 'success' : 'default'" size="small">
                      {{ defaultChannelIds.includes(selectedChannel.id) ? 'Yes' : 'No' }}
                    </NTag>
                  </td>
                </tr>
                <tr>
                  <td class="info-label">Config</td>
                  <td class="info-value"><code>{{ getChannelConfigSummary(selectedChannel) }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Used By -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:connect" />
              <span>Used By</span>
            </div>
            <div
              v-if="selectedChannelRules.length === 0 && selectedChannelMonitors.length === 0"
              class="empty-rules-hint"
            >
              <NText depth="3">This channel is not used by any rules or monitors</NText>
            </div>
            <div v-else class="used-by-groups">
              <!-- Alert Rules -->
              <div v-if="selectedChannelRules.length > 0" class="usage-group">
                <div class="usage-group-label">
                  <Icon icon="carbon:rule" :style="{ fontSize: '14px' }" />
                  <span>Alert Rules</span>
                  <NTag size="tiny" :bordered="false" round :style="{ backgroundColor: '#fef3c7', color: '#d97706' }">
                    {{
                      selectedChannelRules.length }}
                  </NTag>
                </div>
                <div class="used-by-tags">
                  <span
                    v-for="(rule, idx) in selectedChannelRules" :key="`rule-${idx}`" class="rule-badge" :style="{
                      backgroundColor: (severityBadgeColors[rule.severity] || severityBadgeColors.info).bg,
                      color: (severityBadgeColors[rule.severity] || severityBadgeColors.info).color,
                    }"
                  >
                    <Icon icon="carbon:rule" :style="{ fontSize: '12px' }" />
                    {{ rule.name }}
                  </span>
                </div>
              </div>

              <!-- Uptime Monitors -->
              <div v-if="selectedChannelMonitors.length > 0" class="usage-group">
                <div class="usage-group-label">
                  <Icon icon="carbon:activity" :style="{ fontSize: '14px' }" />
                  <span>Uptime Monitors</span>
                  <NTag size="tiny" :bordered="false" round :style="{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }">
                    {{
                      selectedChannelMonitors.length }}
                  </NTag>
                </div>
                <div class="used-by-tags">
                  <span
                    v-for="(monitor, idx) in selectedChannelMonitors" :key="`monitor-${idx}`" class="rule-badge"
                    :style="{
                      backgroundColor: usageBadgeColors.monitor.bg,
                      color: usageBadgeColors.monitor.color,
                    }"
                  >
                    <Icon
                      :icon="MONITOR_TYPES[monitor.type as keyof typeof MONITOR_TYPES]?.icon || 'carbon:activity'"
                      :style="{ fontSize: '12px' }"
                    />
                    {{ monitor.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:time" />
              <span>Timestamps</span>
            </div>
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="info-label">Created</td>
                  <td class="info-value">{{ formatDateTime(selectedChannel.createdAt) }}</td>
                </tr>
                <tr>
                  <td class="info-label">Updated</td>
                  <td class="info-value">{{ formatDateTime(selectedChannel.updatedAt) }}</td>
                </tr>
                <tr>
                  <td class="info-label">Last Used</td>
                  <td class="info-value">
                    <template v-if="selectedChannel.lastUsedAt">
                      {{ formatDateTime(selectedChannel.lastUsedAt) }}
                    </template>
                    <NText v-else depth="3">Never</NText>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Notification Options -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:settings" />
              <span>Notification Options</span>
            </div>
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="info-label">Send Resolved</td>
                  <td class="info-value">
                    <NTag :type="selectedChannel.sendResolved !== false ? 'success' : 'default'" size="small">
                      {{ selectedChannel.sendResolved !== false ? 'Yes' : 'No' }}
                    </NTag>
                  </td>
                </tr>
                <tr>
                  <td class="info-label">Send Reminder</td>
                  <td class="info-value">
                    <NTag :type="selectedChannel.sendReminder ? 'success' : 'default'" size="small">
                      {{ selectedChannel.sendReminder ? 'Yes' : 'No' }}
                    </NTag>
                  </td>
                </tr>
                <tr v-if="selectedChannel.sendReminder && selectedChannel.reminderInterval">
                  <td class="info-label">Interval</td>
                  <td class="info-value"><code>{{ selectedChannel.reminderInterval }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tfo-table-styles.scss';

.notification-channels-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.title-icon {
  font-size: 28px;
  color: var(--primary-color);
}

.page-subtitle {
  color: var(--text-color-3);
  font-size: 14px;
}

// Stats
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
    font-size: 20px;

    &.enabled {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    &.disabled {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    &.default {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--n-text-color-3);
  }
}

// Defaults
.defaults-card {
  margin-bottom: 16px;
}

.defaults-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.defaults-label {
  display: flex;
  align-items: center;
  gap: 12px;
}

.defaults-icon {
  font-size: 24px;
  color: #f59e0b;
}

// Filters
.filters-card {
  margin-bottom: 16px;
}

// Table
.table-card {
  margin-bottom: 24px;
}

// Table cell styles
:deep(.channel-name-cell) {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}

:deep(.channel-cell-icon) {
  color: var(--n-text-color-2);
  flex-shrink: 0;
}

:deep(.channel-cell-info) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// Responsive
@media (max-width: 1024px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .header-right {
    width: 100%;
  }

  .header-right :deep(.n-button) {
    width: 100%;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .defaults-content {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-card :deep(.n-space) {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }

  .filters-card :deep(.n-input),
  .filters-card :deep(.n-select) {
    width: 100% !important;
  }
}

// ==================== DRAWER STYLES ====================

.drawer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.drawer-header-icon {
  font-size: 20px;
  color: var(--n-primary-color);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 5px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    width: 120px;
    min-width: 100px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 !important;
    box-sizing: border-box;
  }
}

.detail-content {
  margin-top: 4px;
}

.detail-section {
  margin-top: 24px;

  &:first-child {
    margin-top: 0;
  }
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--n-text-color-3);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  :deep(svg) {
    font-size: 16px;
  }
}

.info-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--k8s-border-color, rgba(128, 128, 128, 0.2));
  border-radius: 6px;
  overflow: hidden;

  tr:not(:last-child) td {
    border-bottom: 1px solid var(--k8s-border-color, rgba(128, 128, 128, 0.2));
  }

  td {
    padding: 10px 12px;
  }

  .info-label {
    font-weight: 500;
    color: var(--n-text-color-3);
    font-size: 0.8125rem;
    width: 130px;
    min-width: 110px;
    background: rgba(100, 116, 139, 0.1);

    :root.dark & {
      background: rgba(51, 65, 85, 0.4);
    }
  }

  .info-value {
    color: var(--n-text-color);
    font-size: 0.8125rem;

    code {
      font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
      font-size: 0.8125rem;
      background: transparent;
      padding: 0;
      border: none;
    }
  }
}

.empty-rules-hint {
  padding: 16px;
  text-align: center;
  border: 1px dashed var(--k8s-border-color, rgba(128, 128, 128, 0.2));
  border-radius: 6px;
}

.used-by-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.rule-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.used-by-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-group {
  border: 1px solid var(--k8s-border-color, rgba(128, 128, 128, 0.2));
  border-radius: 6px;
  padding: 12px;
  background: var(--n-card-color);

  :root.dark & {
    background: rgba(30, 41, 59, 0.5);
  }
}

.usage-group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--n-text-color-2);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--k8s-border-color, rgba(128, 128, 128, 0.2));
}

// Drawer responsive
:deep(.n-drawer) {
  max-width: 100vw !important;
}

@media (max-width: 768px) {
  :deep(.n-drawer[style*="width: 500px"]) {
    width: 100vw !important;
    max-width: 100vw !important;
  }
}
</style>