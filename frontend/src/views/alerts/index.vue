<script setup lang="ts">
import { ref, computed, h, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import type { DataTableColumn } from 'naive-ui';
import { NTag, NButton, NDataTable, NInput, NButtonGroup, NTooltip } from 'naive-ui';
import { StatPanel } from '@/components/charts';
import { useAppStore, useAlertsStore } from '@/store';
import { formatTimestamp } from '@/utils/format';
import { getChannelIcon } from '@/utils';
import type { Alert, AlertSeverity } from '@/types';
import { useStatPanelsFromRegistry } from '@/composables/useStatPanelsFromRegistry';
import { exportToCSV, exportToJSON, getExportFilename } from '@/utils/export';
import { usePagination } from '@/composables/usePagination';

const router = useRouter();
const alertsStore = useAlertsStore();

/**
 * Render Prometheus-style alert templates:
 *   {{ $labels.xxx }}  → alert.labels.xxx
 *   {{ $value }}       → alert.value (2 decimal places)
 *   {{ $value | printf "%.2f" }} → alert.value (2 decimal places)
 */
function renderAlertTemplate(template: string, alert: Alert): string {
  if (!template) return template;
  return template
    .replace(/\{\{\s*\$labels\.(\w+)\s*\}\}/g, (_, key) => {
      if (alert.labels?.[key] !== undefined) return alert.labels[key];
      // Fallback: 'monitor' → try monitor_id label (for backcompat with older instances)
      if (key === 'monitor' && alert.labels?.monitor_id) return alert.labels.monitor_id;
      return '';
    })
    .replace(/\{\{\s*\$value\s*\|\s*printf\s+"[^"]*"\s*\}\}/g, () => alert.value?.toFixed(2) ?? String(alert.value ?? ""))
    .replace(/\{\{\s*\$value\s*\}\}/g, () => alert.value?.toFixed(2) ?? String(alert.value ?? ""));
}

// Pagination
const { paginationConfig } = usePagination(10);

// Search
const searchQuery = ref('');

const activeTab = ref<'all' | 'firing' | 'resolved'>('all');
const showDrawer = ref(false);

// Computed stats (current state, not time-dependent, so no trends)
const criticalCount = computed(() => alertsStore.alertsBySeverity.critical.length);
const warningCount = computed(() => alertsStore.alertsBySeverity.warning.length);
const infoCount = computed(() => alertsStore.alertsBySeverity.info.length);
const resolvedCount = computed(() => alertsStore.alertsByStatus.resolved.length);
// Note: Alert counts represent current state, not filtered by time range

// Stat panel cards driven by the stat-panel-registry
const statCards = useStatPanelsFromRegistry(
  ['ALR20001', 'ALR20002', 'ALR20003', 'ALR20004'],
  {
    ALR20001: criticalCount,
    ALR20002: warningCount,
    ALR20003: infoCount,
    ALR20004: resolvedCount,
  },
);

const severityColors: Record<AlertSeverity, 'error' | 'warning' | 'info'> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

const filteredAlerts = computed(() => {
  let alerts: Alert[];
  if (activeTab.value === 'all') alerts = alertsStore.alerts;
  else if (activeTab.value === 'firing') alerts = alertsStore.alertsByStatus.firing;
  else alerts = alertsStore.alertsByStatus.resolved;

  if (!searchQuery.value) return alerts;
  const query = searchQuery.value.toLowerCase();
  return alerts.filter(
    (alert) =>
      alert.ruleName.toLowerCase().includes(query) ||
      alert.severity.toLowerCase().includes(query) ||
      alert.status.toLowerCase().includes(query),
  );
});

// Export functionality
function handleExportCSV() {
  const filename = getExportFilename('alerts');
  exportToCSV(filteredAlerts.value as unknown as Record<string, unknown>[], filename);
}

function handleExportJSON() {
  const filename = getExportFilename('alerts');
  exportToJSON(filteredAlerts.value, filename);
}

const severityOrder: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// Status colors for badges
const statusColors: Record<string, { bg: string; color: string }> = {
  firing: { bg: '#ef4444', color: '#ffffff' },
  pending: { bg: '#f59e0b', color: '#ffffff' },
  resolved: { bg: '#22c55e', color: '#ffffff' },
};

// Severity colors for badges
const severityBadgeColors: Record<AlertSeverity, { bg: string; color: string }> = {
  critical: { bg: '#ef4444', color: '#ffffff' },
  warning: { bg: '#f59e0b', color: '#ffffff' },
  info: { bg: '#3b82f6', color: '#ffffff' },
};

// Helper to format duration
function formatDuration(startsAt: number, endsAt?: number): string {
  const end = endsAt || Date.now();
  const duration = end - startsAt;
  const minutes = Math.floor(duration / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d`;
}

// Get notification channels for an alert's rule
function getAlertChannels(alert: Alert) {
  const rule = alertsStore.rules.find(r => r.id === alert.ruleId);
  if (!rule || rule.useDefaultChannels !== false || !rule.channelIds) return [];
  return rule.channelIds
    .map(id => alertsStore.notificationChannels.find(c => c.id === id))
    .filter(Boolean);
}

const columns: DataTableColumn<Alert>[] = [
  {
    title: 'NAME',
    key: 'ruleName',
    minWidth: 280,
    sorter: (a, b) => a.ruleName.localeCompare(b.ruleName),
    defaultSortOrder: 'ascend',
    render: (row) =>
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, overflow: 'hidden' } }, [
        h('div', { style: { fontWeight: 600, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, row.ruleName),
        h('div', { style: { fontSize: '12px', opacity: 0.6, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
          row.annotations.summary ? renderAlertTemplate(row.annotations.summary, row) : `Alert ID: ${row.id.slice(0, 8)}`
        ),
      ]),
  },
  {
    title: 'STATUS',
    key: 'status',
    width: 110,
    sorter: (a, b) => a.status.localeCompare(b.status),
    render: (row) => {
      const config = statusColors[row.status] || { bg: '#666666', color: '#ffffff' };
      return h('span', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: config.bg,
          color: config.color,
          textTransform: 'uppercase',
        },
      }, row.status);
    },
  },
  {
    title: 'SEVERITY',
    key: 'severity',
    width: 120,
    sorter: (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    render: (row) => {
      const config = severityBadgeColors[row.severity];
      return h('span', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: config.bg,
          color: config.color,
          textTransform: 'uppercase',
        },
      }, row.severity);
    },
  },
  {
    title: 'VALUE',
    key: 'value',
    width: 100,
    sorter: (a, b) => a.value - b.value,
    render: (row) => h('span', { style: { fontFamily: 'monospace', fontSize: '13px' } }, row.value.toFixed(2)),
  },
  {
    title: 'DURATION',
    key: 'duration',
    width: 100,
    sorter: (a, b) => {
      const durationA = (a.endsAt || Date.now()) - a.startsAt;
      const durationB = (b.endsAt || Date.now()) - b.startsAt;
      return durationA - durationB;
    },
    render: (row) => h('span', { style: { fontSize: '13px' } }, formatDuration(row.startsAt, row.endsAt)),
  },
  {
    title: 'TAGS',
    key: 'tags',
    minWidth: 260,
    render: (row) => {
      const sConfig = statusColors[row.status] || { bg: '#666666', color: '#ffffff' };
      const sevConfig = severityBadgeColors[row.severity];
      const labels = Object.entries(row.labels || {});

      const badgeStyle = (bg: string, color: string, extra?: Record<string, string>) => ({
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: '600',
        backgroundColor: bg,
        color: color,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: '0',
        ...extra,
      });

      const fixedTags = [
        h('span', { style: badgeStyle(sConfig.bg, sConfig.color) }, row.status),
        h('span', { style: badgeStyle(sevConfig.bg, sevConfig.color) }, row.severity),
        h('span', { style: badgeStyle('rgba(139, 92, 246, 0.9)', '#ffffff', { fontWeight: '500' }) }, row.value.toFixed(2)),
      ];

      // First label tag
      if (labels.length > 0) {
        fixedTags.push(
          h('span', { style: badgeStyle('rgba(100, 116, 139, 0.7)', '#ffffff', { fontWeight: '500', textTransform: 'none' }) },
            `${labels[0][0]}: ${labels[0][1]}`)
        );
      }

      // Channel tags (limit to 1 visible, +N for rest)
      const channelTags: ReturnType<typeof h>[] = [];
      const channels = getAlertChannels(row);

      if (channels.length > 0) {
        const first = channels[0]!;
        channelTags.push(
          h('span', {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: '500',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              whiteSpace: 'nowrap',
              flexShrink: '0',
            },
          }, [
            h(Icon, { icon: getChannelIcon(first.type), width: 14, height: 14 }),
            first.name,
          ])
        );
        if (channels.length > 1) {
          channelTags.push(
            h(NTooltip, { trigger: 'hover' }, {
              trigger: () => h('span', {
                style: badgeStyle('rgba(59, 130, 246, 0.15)', '#60a5fa', {
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  cursor: 'pointer',
                  fontWeight: '500',
                }),
              }, `+${channels.length - 1}`),
              default: () => channels.slice(1).map(c => c!.name).join(', '),
            })
          );
        }
      }

      return h('div', {
        style: {
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          overflow: 'hidden',
        },
      }, [...fixedTags, ...channelTags]);
    },
  },
  {
    title: 'STARTED',
    key: 'startsAt',
    width: 180,
    sorter: (a, b) => a.startsAt - b.startsAt,
    render: (row) => h('div', { style: { fontSize: '13px' } }, formatTimestamp(row.startsAt)),
  },
  {
    title: 'ACTION',
    key: 'actions',
    width: 100,
    fixed: 'right' as const,
    align: 'center',
    render: (row) =>
      h(
        NButton,
        {
          text: true,
          size: 'small',
          onClick: (e: Event) => {
            e.stopPropagation();
            selectAlert(row);
          },
        },
        {
          icon: () =>
            h(Icon, { icon: 'carbon:magnify', style: { fontSize: '18px' } }),
        },
      ),
  },
];

function selectAlert(alert: Alert) {
  alertsStore.selectAlert(alert);
  showDrawer.value = true;
}

function goToRules() {
  router.push('/alerts/rules');
}

function formatAlertDuration(alert: Alert): string {
  const end = alert.endsAt || Date.now();
  const duration = end - alert.startsAt;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

const appStore = useAppStore();

// Fetch alerts from backend on mount
onMounted(async () => {
  await alertsStore.fetchBackendAlerts();
});

watch(() => appStore.globalTimeRange, () => { alertsStore.fetchBackendAlerts(); }, { deep: true });
</script>

<template>
  <div class="alerts-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Alerts</h2>
        <p class="page-subtitle">Monitor and manage alert notifications</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <StatPanel
        v-for="(card, index) in statCards"
        :key="index"
        v-bind="card"
      />
    </div>

    <!-- Tabs & Actions -->
    <n-card size="small">
      <n-tabs v-model:value="activeTab" type="line" justify-content="start">
        <n-tab name="all">All ({{ alertsStore.alerts.length }})</n-tab>
        <n-tab name="firing">Firing ({{ alertsStore.alertsByStatus.firing.length }})</n-tab>
        <n-tab name="resolved">Resolved ({{ alertsStore.alertsByStatus.resolved.length }})</n-tab>
        <template #suffix>
          <div class="tab-actions">
            <n-button type="primary" size="small" @click="goToRules">
              <template #icon>
                <Icon icon="carbon:rule" />
              </template>
              Manage Rules
            </n-button>
            <n-button size="small" @click="alertsStore.clearResolvedAlerts">
              <template #icon>
                <Icon icon="carbon:trash-can" />
              </template>
              Clear Resolved
            </n-button>
          </div>
        </template>
      </n-tabs>
    </n-card>

    <!-- Alerts Table Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:notification" class="section-icon" />
          <span>Alert Records</span>
          <n-tag :bordered="false" size="small" type="info">
            {{ filteredAlerts.length }} alerts
          </n-tag>
        </div>
        <div class="table-actions">
          <n-input
            v-model:value="searchQuery"
            placeholder="Search alerts..."
            size="small"
            clearable
            class="search-input"
          >
            <template #prefix><Icon icon="carbon:search" /></template>
          </n-input>
          <n-button-group size="small">
            <n-button @click="handleExportCSV">
              <template #icon><Icon icon="carbon:download" /></template>
              CSV
            </n-button>
            <n-button @click="handleExportJSON">
              <template #icon><Icon icon="carbon:json-reference" /></template>
              JSON
            </n-button>
          </n-button-group>
        </div>
      </div>
      <div class="section-content table-content">
        <!-- datatableId: ALR30001 -->
        <n-data-table
          :columns="columns"
          :data="filteredAlerts"
          :row-key="(row: Alert) => row.id"
          :bordered="false"
          bottom-bordered
          striped
          size="small"
          :scroll-x="1250"
          :pagination="{ ...paginationConfig, itemCount: filteredAlerts.length }"
          :row-props="
            (row) => ({
              style: 'cursor: pointer;',
              onClick: () => selectAlert(row),
            })
          "
        />
      </div>
    </div>

    <!-- Alert Detail Drawer -->
    <n-drawer v-model:show="showDrawer" width="480" placement="right">
      <n-drawer-content>
        <template #header>
          <div class="drawer-header">
            <Icon icon="carbon:notification" class="drawer-header-icon" />
            <span>Alert Details</span>
          </div>
        </template>
        <template #footer>
          <div class="drawer-footer">
            <n-button type="primary" ghost @click="showDrawer = false">
              <template #icon>
                <Icon icon="carbon:close" />
              </template>
              Close
            </n-button>
          </div>
        </template>

        <div v-if="alertsStore.selectedAlert" class="detail-content">
          <!-- Stats Row -->
          <div class="drawer-stats-row">
            <StatPanel
              size="small"
              icon="carbon:warning-alt"
              :color="alertsStore.selectedAlert.severity === 'critical' ? 'error' : alertsStore.selectedAlert.severity === 'warning' ? 'warning' : 'info'"
              :value-color="alertsStore.selectedAlert.severity === 'critical' ? '#ef4444' : alertsStore.selectedAlert.severity === 'warning' ? '#f59e0b' : '#3b82f6'"
              title="Severity"
              :value="alertsStore.selectedAlert.severity"
              :show-compact="false"
            />
            <StatPanel
              size="small"
              icon="carbon:status"
              :color="alertsStore.selectedAlert.status === 'firing' ? 'error' : 'success'"
              :value-color="alertsStore.selectedAlert.status === 'firing' ? '#ef4444' : '#22c55e'"
              title="Status"
              :value="alertsStore.selectedAlert.status"
              :show-compact="false"
            />
            <StatPanel
              size="small"
              icon="carbon:chart-line"
              color="info"
              value-color="#3b82f6"
              title="Current Value"
              :value="alertsStore.selectedAlert.value.toFixed(2)"
              :show-compact="false"
            />
            <StatPanel
              size="small"
              icon="carbon:timer"
              color="purple"
              value-color="#8b5cf6"
              title="Duration"
              :value="formatAlertDuration(alertsStore.selectedAlert)"
              :show-compact="false"
            />
          </div>

          <!-- Status Banner -->
          <div class="status-banner" :class="alertsStore.selectedAlert.status">
            <Icon :icon="alertsStore.selectedAlert.status === 'firing' ? 'carbon:warning-alt-filled' : 'carbon:checkmark-filled'" />
            <span>{{ alertsStore.selectedAlert.status === 'firing' ? 'Alert is currently firing' : alertsStore.selectedAlert.status }}</span>
          </div>

          <!-- Basic Information -->
          <div class="detail-section">
            <div class="section-label">Basic Information</div>
            <table class="info-table">
              <tbody>
                <tr>
                  <td class="info-label">Rule Name</td>
                  <td class="info-value">{{ alertsStore.selectedAlert.ruleName }}</td>
                </tr>
                <tr>
                  <td class="info-label">Severity</td>
                  <td class="info-value">
                    <n-tag
                      :type="severityColors[alertsStore.selectedAlert.severity]" size="small" :bordered="false"
                      :style="{
                        backgroundColor: alertsStore.selectedAlert.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' :
                          alertsStore.selectedAlert.severity === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: alertsStore.selectedAlert.severity === 'critical' ? '#ef4444' :
                          alertsStore.selectedAlert.severity === 'warning' ? '#f59e0b' : '#3b82f6'
                      }"
                    >
                      {{ alertsStore.selectedAlert.severity }}
                    </n-tag>
                  </td>
                </tr>
                <tr>
                  <td class="info-label">Status</td>
                  <td class="info-value">
                    <n-tag
                      :bordered="false" size="small"
                      :style="{
                        backgroundColor: alertsStore.selectedAlert.status === 'firing' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: alertsStore.selectedAlert.status === 'firing' ? '#ef4444' : '#22c55e'
                      }"
                    >
                      {{ alertsStore.selectedAlert.status }}
                    </n-tag>
                  </td>
                </tr>
                <tr>
                  <td class="info-label">Current Value</td>
                  <td class="info-value">{{ alertsStore.selectedAlert.value.toFixed(4) }}</td>
                </tr>
                <tr>
                  <td class="info-label">Started At</td>
                  <td class="info-value">{{ formatTimestamp(alertsStore.selectedAlert.startsAt) }}</td>
                </tr>
                <tr v-if="alertsStore.selectedAlert.endsAt">
                  <td class="info-label">Ended At</td>
                  <td class="info-value">{{ formatTimestamp(alertsStore.selectedAlert.endsAt) }}</td>
                </tr>
                <tr>
                  <td class="info-label">Duration</td>
                  <td class="info-value">{{ formatAlertDuration(alertsStore.selectedAlert) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Labels Section -->
          <div v-if="Object.keys(alertsStore.selectedAlert.labels).length > 0" class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:tag-group" />
              <span>Labels</span>
            </div>
            <table class="info-table">
              <tbody>
                <tr v-for="(value, key) in alertsStore.selectedAlert.labels" :key="key">
                  <td class="info-label">{{ key }}</td>
                  <td class="info-value"><code>{{ value }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Notification Channels -->
          <div class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:notification" />
              <span>Notification</span>
            </div>
            <div class="channels-card">
              <div class="channels-card-header">
                <Icon icon="carbon:notification" />
                <span>Notification Channels</span>
                <n-tag :bordered="false" size="tiny" round type="info">
                  {{ getAlertChannels(alertsStore.selectedAlert).length }}
                </n-tag>
              </div>
              <div v-if="getAlertChannels(alertsStore.selectedAlert).length > 0" class="channels-card-body">
                <span
                  v-for="ch in getAlertChannels(alertsStore.selectedAlert)"
                  :key="ch!.id"
                  class="channel-badge"
                >
                  <Icon :icon="getChannelIcon(ch!.type)" :width="14" :height="14" />
                  {{ ch!.name }}
                </span>
              </div>
              <div v-else class="channels-card-body channels-card-empty">
                Using global default channels
              </div>
            </div>
          </div>

          <!-- Summary Section -->
          <div v-if="alertsStore.selectedAlert.annotations.summary" class="detail-section">
            <div class="section-label">
              <Icon icon="carbon:document" />
              <span>Summary</span>
            </div>
            <div class="summary-box">
              {{ renderAlertTemplate(alertsStore.selectedAlert.annotations.summary, alertsStore.selectedAlert) }}
            </div>
          </div>

          <!-- Actions -->
          <div v-if="alertsStore.selectedAlert.status === 'firing'" class="drawer-actions">
            <n-button type="success" block @click="alertsStore.resolveAlert(alertsStore.selectedAlert.id)">
              <template #icon>
                <Icon icon="carbon:checkmark" />
              </template>
              Resolve Alert
            </n-button>
            <n-button block @click="alertsStore.acknowledgeAlert(alertsStore.selectedAlert.id)">
              <template #icon>
                <Icon icon="carbon:user-avatar" />
              </template>
              Acknowledge
            </n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";
@import "@/styles/tfo-channels-card.scss";

.alerts-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  margin-bottom: 8px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--n-text-color);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  padding: 0 5px;

  @media (max-width: 768px) {
    gap: 12px;
  }

  @media (max-width: 480px) {
    gap: 8px;
  }
}

.tab-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

// Section styles (matching agent monitoring)
// overflow: clip clips visual overflow for border-radius but does NOT
// create a new scroll container, so the datatable scrollbar stays visible
.section {
  border-radius: 8px;
  overflow: clip;
  background: var(--n-card-color);
  border: 1px solid var(--k8s-border-color);
}

:global(html.dark) .section {
  background: rgba(30, 41, 59, 0.3);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 0.875rem;
  background: var(--n-card-color);
  border-bottom: 1px solid var(--k8s-border-color);
  flex-wrap: wrap;
  gap: 12px;
}

:global(html.dark) .section-header {
  background: rgba(30, 41, 59, 0.4);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.section-icon {
  font-size: 18px;
  color: var(--n-text-color-3);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 220px;
}

.section-content {
  padding: 16px;
  border-top: 1px solid var(--k8s-border-color);
}

// Note: Pagination styling is now global in tfo-table-styles.scss

:deep(.n-tabs) {
  .n-tabs-nav {
    padding-bottom: 0;
    border-bottom: 1px solid var(--n-border-color);
  }

  .n-tabs-tab {
    padding: 12px 16px;
    font-size: 0.875rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    margin-right: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(99, 102, 241, 0.05);
    }

    &.n-tabs-tab--active {
      border-color: var(--n-border-color);
      background: var(--n-card-color);
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--n-card-color);
      }
    }
  }

  .n-tabs-bar {
    height: 2px;
  }

  .n-tabs-nav__suffix {
    padding-left: 16px;
    border-bottom: 1px solid var(--n-tab-border-color);
  }
}

// Detail Content
.detail-content {
  margin-top: 4px;
}

.drawer-stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }

  :deep(.stat-panel) {
    width: 100%;
    min-height: auto;
    height: auto;
  }
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 20px;
  border: 1px solid;

  :deep(svg) {
    font-size: 18px;
  }

  &.firing {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
  }

  &.resolved {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.2);
  }

  &.pending {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.2);
  }
}

.info-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  overflow: hidden;

  :root.dark & {
    border-color: var(--k8s-border-color);
  }

  tr:not(:last-child) td {
    border-bottom: 1px solid var(--k8s-border-color);

    :root.dark & {
      border-color: var(--k8s-border-color);
    }
  }

  td {
    padding: 10px 12px;
  }

  .info-label {
    font-weight: 500;
    color: var(--n-text-color-3);
    font-size: 0.8125rem;
    width: 180px;
    min-width: 160px;
    background: rgba(100, 116, 139, 0.1);

    :root.dark & {
      background: rgba(51, 65, 85, 0.4);
    }
  }

  .info-value {
    color: var(--n-text-color);
    font-size: 0.8125rem;

    &.mono {
      font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
        "Courier New", monospace;
    }
  }
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

.summary-box {
  padding: 14px 16px;
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--n-text-color);
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
    "Courier New", monospace;
  word-wrap: break-word;
  white-space: pre-wrap;

  :root.dark & {
    background: rgba(51, 65, 85, 0.4);
    border-color: var(--k8s-border-color);
  }
}

.drawer-actions {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--k8s-border-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
}


// Drawer Header & Footer
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
</style>
