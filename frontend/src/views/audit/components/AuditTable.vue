<script setup lang="ts">
import { h, ref, computed, watch } from "vue";
import { formatCompactNumber } from "@/utils/format";
import { Icon } from "@iconify/vue";
import {
  NButton,
  NTag,
  NSelect,
  NInput,
  NButtonGroup,
  NDataTable,
  NDatePicker,
  NSpin,
  NTooltip,
  NText,
  NTime,
} from "naive-ui";
import type { SelectOption } from "naive-ui";
import { StatPanel } from "@/components/charts";
import { useStatPanelsFromRegistry } from "@/composables/useStatPanelsFromRegistry";
import { useAuditStats, useAuditLogs } from "@/composables";
import type { AuditStatsActiveFilters } from "@/composables/useAuditStats";
import config from "@/config";
import { auditApi } from "@/api/audit";
import AuditCharts from "./AuditCharts.vue";
import type { AuditLog, AuditEventType, AuditResult } from "@/types/audit";
import {
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
  getActionLabel,
  formatAuditUserName,
} from "@/types/audit";
import { getExportFilename } from "@/utils/export";

const emit = defineEmits<{
  "show-detail": [log: AuditLog];
}>();

// ==================== FILTERS ====================

const searchQuery = ref("");
const selectedEventType = ref<AuditEventType | null>(null);
const selectedResult = ref<AuditResult | null>(null);
const dateRange = ref<[number, number] | null>(null);

const statsFilters = computed<AuditStatsActiveFilters>(() => ({
  eventType: selectedEventType.value || undefined,
  result: selectedResult.value || undefined,
  userEmail: searchQuery.value || undefined,
  from: dateRange.value ? new Date(dateRange.value[0]).toISOString() : undefined,
  to: dateRange.value ? new Date(dateRange.value[1]).toISOString() : undefined,
}));

// ==================== STATS ====================

const { stats: auditStatsData, loading: statsLoading, refresh: refreshStats } = useAuditStats(
  { syncGlobalTimeRange: false },
  statsFilters,
);

// ==================== DATATABLE ====================

const {
  data: auditLogsRaw,
  loading: tableLoading,
  total,
  paginationConfig,
  filters,
  setFilters,
  resetFilters,
  refresh: refreshTable,
  setSort,
} = useAuditLogs({ defaultPageSize: 10, fetchOnMount: true });

const totalEvents = computed(() => total.value || 0);
const successEvents = computed(() => auditStatsData.value?.byResult.SUCCESS || 0);
const failureEvents = computed(() => auditStatsData.value?.byResult.FAILURE || 0);
const highRiskEvents = computed(() => auditStatsData.value?.byResult.DENIED || 0);

const statCards = useStatPanelsFromRegistry(
  ["AUD20001", "AUD20002", "AUD20003", "AUD20004"],
  {
    AUD20001: totalEvents,
    AUD20002: successEvents,
    AUD20003: failureEvents,
    AUD20004: highRiskEvents,
  },
);

const auditLogs = computed(() => auditLogsRaw.value as AuditLog[]);

// ==================== FILTER OPTIONS ====================

const eventTypeOptions = computed(() => [
  { label: "All Event Types", value: null },
  ...Object.entries(AUDIT_EVENT_TYPES).map(([key, val]) => ({
    label: val.label,
    value: key,
  })),
] as SelectOption[]);

const resultOptions = computed(() => [
  { label: "All Results", value: null },
  ...Object.entries(AUDIT_RESULTS).map(([key, val]) => ({
    label: val.label,
    value: key,
  })),
] as SelectOption[]);

watch([selectedEventType, selectedResult, dateRange], () => {
  setFilters({
    eventType: selectedEventType.value || undefined,
    result: selectedResult.value || undefined,
    from: dateRange.value ? new Date(dateRange.value[0]).toISOString() : undefined,
    to: dateRange.value ? new Date(dateRange.value[1]).toISOString() : undefined,
  } as typeof filters.value);
  refreshStats();
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (query) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    setFilters({ userEmail: query || undefined } as typeof filters.value);
    refreshStats();
  }, 300);
});

function handleResetFilters() {
  searchQuery.value = "";
  selectedEventType.value = null;
  selectedResult.value = null;
  dateRange.value = null;
  resetFilters();
}

const eventsTagType = computed((): "info" | "success" | "error" | "warning" | "default" => {
  if (selectedResult.value === "FAILURE") return "error";
  if (selectedResult.value === "SUCCESS") return "success";
  if (selectedResult.value === "DENIED") return "warning";
  if (selectedEventType.value) return getEventTypeTagType(selectedEventType.value);
  return "info";
});

const isFiltered = computed(() =>
  !!(selectedEventType.value || selectedResult.value || dateRange.value || searchQuery.value)
);

// ==================== COLUMNS ====================

function getEventTypeTagType(eventType: AuditEventType): "info" | "warning" | "success" | "default" {
  const colorMap: Record<string, "info" | "warning" | "success" | "default"> = {
    info: "info",
    warning: "warning",
    success: "success",
    default: "default",
  };
  return colorMap[AUDIT_EVENT_TYPES[eventType]?.color] || "default";
}

function getResultTagType(result: AuditResult): "success" | "error" | "warning" {
  const colorMap: Record<string, "success" | "error" | "warning"> = {
    success: "success",
    error: "error",
    warning: "warning",
  };
  return colorMap[AUDIT_RESULTS[result]?.color] || "warning";
}

const columns = computed(() => [
  {
    title: "Timestamp",
    key: "timestamp",
    width: 150,
    sorter: true,
    render(row: AuditLog) {
      return h(NTime, { time: row.timestamp, format: "yyyy-MM-dd HH:mm:ss" });
    },
  },
  {
    title: "User",
    key: "userEmail",
    width: 200,
    sorter: true,
    ellipsis: { tooltip: true },
    render(row: AuditLog) {
      return h(NTooltip, { trigger: "hover" }, {
        trigger: () => h(NText, null, { default: () => formatAuditUserName(row) }),
        default: () => row.userEmail,
      });
    },
  },
  {
    title: "Event Type",
    key: "eventType",
    width: 140,
    align: "center" as const,
    sorter: true,
    render(row: AuditLog) {
      return h(NTag, { type: getEventTypeTagType(row.eventType), size: "small", round: true }, {
        default: () => AUDIT_EVENT_TYPES[row.eventType]?.label || row.eventType,
      });
    },
  },
  {
    title: "Action",
    key: "action",
    width: 200,
    sorter: true,
    render(row: AuditLog) {
      const label = getActionLabel(row.action);
      return h(NTooltip, { trigger: "hover" }, {
        trigger: () => h("div", { style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" },
          [h(NText, { code: true }, { default: () => label })]),
        default: () => label,
      });
    },
  },
  {
    title: "Resource",
    key: "resource",
    width: 130,
    sorter: true,
    render(row: AuditLog) {
      const val = row.resource || "-";
      return h(NTooltip, { trigger: "hover" }, {
        trigger: () => h("div", { style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, val),
        default: () => val,
      });
    },
  },
  {
    title: "Result",
    key: "result",
    width: 100,
    sorter: true,
    render(row: AuditLog) {
      return h(NTag, { type: getResultTagType(row.result), size: "small" }, {
        default: () => AUDIT_RESULTS[row.result]?.label || row.result,
      });
    },
  },
  {
    title: "IP Address",
    key: "ipAddress",
    width: 150,
    render(row: AuditLog) {
      const ip = row.ipAddress || "-";
      return h(NTooltip, { trigger: "hover" }, {
        trigger: () => h("div", { style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" },
          [h(NText, { code: true }, { default: () => ip })]),
        default: () => ip,
      });
    },
  },
  {
    title: "Duration",
    key: "durationMs",
    width: 90,
    sorter: true,
    align: "right" as const,
    render(row: AuditLog) {
      if (row.durationMs === undefined) return "-";
      return h(NText, null, { default: () => `${row.durationMs}ms` });
    },
  },
  {
    title: "Actions",
    key: "actions",
    width: 80,
    align: "center" as const,
    fixed: "right" as const,
    render(row: AuditLog) {
      return h(NButton, {
        size: "small",
        quaternary: true,
        onClick: () => emit("show-detail", row),
      }, { icon: () => h(Icon, { icon: "carbon:magnify" }) });
    },
  },
]);

// ==================== EXPORT ====================

const exportLoading = ref(false);

async function handleExportCSV() {
  exportLoading.value = true;
  try {
    const blob = await auditApi.exportAuditLogs({
      format: "csv",
      from: dateRange.value ? new Date(dateRange.value[0]).toISOString() : undefined,
      to: dateRange.value ? new Date(dateRange.value[1]).toISOString() : undefined,
      eventType: selectedEventType.value || undefined,
      result: selectedResult.value || undefined,
      limit: config.limitDataMax,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getExportFilename("audit-logs") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    exportLoading.value = false;
  }
}

async function handleExportJSON() {
  exportLoading.value = true;
  try {
    const blob = await auditApi.exportAuditLogs({
      format: "json",
      from: dateRange.value ? new Date(dateRange.value[0]).toISOString() : undefined,
      to: dateRange.value ? new Date(dateRange.value[1]).toISOString() : undefined,
      eventType: selectedEventType.value || undefined,
      result: selectedResult.value || undefined,
      limit: config.limitDataMax,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getExportFilename("audit-logs") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    exportLoading.value = false;
  }
}

// ==================== SORT ====================

function handleSorterChange(sorter: { columnKey: string; order: "ascend" | "descend" | false }) {
  if (!sorter.order) {
    setSort("timestamp", "desc");
  } else {
    setSort(sorter.columnKey, sorter.order === "ascend" ? "asc" : "desc");
  }
}

// ==================== EXPOSE REFRESH ====================

defineExpose({ refreshStats, refreshTable });
</script>

<template>
  <div class="audit-table-feature">
    <!-- Statistics Cards -->
    <NSpin :show="statsLoading">
      <div class="stats-grid">
        <StatPanel
          v-for="(config, index) in statCards" :key="`stat-${index}`" size="small" v-bind="config"
          :show-compact="true"
        />
      </div>
    </NSpin>

    <!-- Analytics Charts (after stat cards, before datatable) -->
    <AuditCharts />

    <!-- Data Table -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:document-security" class="section-icon" />
          <span>Audit Events</span>
          <NTag :bordered="false" size="small" :type="eventsTagType" class="events-count-tag">
            <template #icon>
              <span class="tag-dot" :class="`tag-dot--${eventsTagType}`" />
            </template>
            {{ formatCompactNumber(total) }} events
          </NTag>
          <NTag v-if="isFiltered" :bordered="false" size="small" type="warning" class="filtered-tag">
            <template #icon>
              <Icon icon="carbon:filter" style="font-size:11px" />
            </template>
            Filtered
          </NTag>
          <NTag
            v-if="!isFiltered && successEvents > 0" :bordered="false" size="small" type="success"
            class="mini-stat-tag"
          >
            <template #icon>
              <Icon icon="carbon:checkmark-filled" style="font-size:11px" />
            </template>
            {{ formatCompactNumber(successEvents) }}
          </NTag>
          <NTag
            v-if="!isFiltered && failureEvents > 0" :bordered="false" size="small" type="error"
            class="mini-stat-tag"
          >
            <template #icon>
              <Icon icon="carbon:error-filled" style="font-size:11px" />
            </template>
            {{ formatCompactNumber(failureEvents) }}
          </NTag>
        </div>
        <div class="table-actions">
          <NInput
            v-model:value="searchQuery" placeholder="Search by email..." clearable size="small"
            class="filter-search"
          >
            <template #prefix>
              <Icon icon="carbon:search" />
            </template>
          </NInput>
          <NSelect
            v-model:value="selectedEventType" :options="eventTypeOptions" placeholder="Event Type" clearable
            size="small" class="filter-event-type"
          />
          <NSelect
            v-model:value="selectedResult" :options="resultOptions" placeholder="Result" clearable size="small"
            class="filter-result"
          />
          <NDatePicker
            v-model:value="dateRange" type="daterange" clearable size="small" class="filter-date"
            :shortcuts="{
              'Last 24h': () => [Date.now() - 24 * 60 * 60 * 1000, Date.now()],
              'Last 7 days': () => [Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now()],
              'Last 30 days': () => [Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now()],
            }"
          />
          <NButton size="small" ghost class="filter-reset" @click="handleResetFilters">
            <template #icon>
              <Icon icon="carbon:reset" />
            </template>
            Reset
          </NButton>
          <NButtonGroup size="small" class="filter-export">
            <NButton :loading="exportLoading" @click="handleExportCSV">
              <template #icon>
                <Icon icon="carbon:document-download" />
              </template>
              CSV
            </NButton>
            <NButton :loading="exportLoading" @click="handleExportJSON">
              <template #icon>
                <Icon icon="carbon:json" />
              </template>
              JSON
            </NButton>
          </NButtonGroup>
        </div>
      </div>
      <div class="table-content">
        <NDataTable
          :columns="columns" :data="auditLogs" :loading="tableLoading" :pagination="paginationConfig"
          :scroll-x="1200" :row-key="(row: AuditLog) => row.id" :bordered="false" striped size="small" remote
          @update:sorter="handleSorterChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tfo-table-styles.scss';

.audit-table-feature {
  display: contents;
}

// ==================== STATS GRID ====================

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

// ==================== SECTION OVERRIDES ====================

.section {
  border-radius: 12px;
}

.section-header {
  padding: 16px 20px;
}

// ==================== EVENT COUNT TAGS ====================

.events-count-tag {
  font-weight: 600;
  font-size: 0.75rem;
}

.tag-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
  flex-shrink: 0;

  &--info    { background: #3b82f6; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  &--success { background: #22c55e; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  &--error   { background: #ef4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  &--warning { background: #f59e0b; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  &--default { background: #64748b; box-shadow: 0 0 0 0 rgba(100, 116, 139, 0.4); }
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.3); opacity: 0.7; }
}

.filtered-tag,
.mini-stat-tag {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.9;
}

// ==================== FILTER BAR ====================

.filter-search     { width: 200px; }
.filter-event-type { width: 160px; }
.filter-result     { width: 140px; }

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-actions {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    width: 100%;
    gap: 8px;
  }

  .filter-search { flex: 1 1 100%; width: 100%; }
  .filter-date   { flex: 1 1 100%; width: 100%; }
  .filter-reset  { flex: 1 1 100%; width: 100%; }

  .filter-event-type,
  .filter-result {
    flex: 1 1 calc(50% - 4px);
    width: calc(50% - 4px);
  }

  .filter-export {
    flex: 1 1 100%;
    display: flex;

    :deep(.n-button) { flex: 1; }
  }
}

// ==================== DATATABLE ====================

.table-content {
  padding: 0;

  :deep(.n-data-table) {
    border: 1px solid var(--k8s-border-color);
    border-radius: 6px;
    overflow: hidden;
    --n-th-color: transparent;
    --n-td-color: transparent;
    --n-th-text-color: var(--k8s-table-header-text);
    --n-border-color: var(--k8s-border-color);
  }

  :deep(.n-data-table-thead) { background: var(--k8s-table-header-bg) !important; }

  :deep(.n-data-table-th) {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 14px;
    background: var(--k8s-table-header-bg) !important;
    color: var(--k8s-table-header-text) !important;
    border-bottom: 1px solid var(--k8s-border-color) !important;
    white-space: nowrap;
  }

  :deep(.n-data-table-td) {
    padding: 10px 14px;
    font-size: 0.8125rem;
    vertical-align: middle !important;
    border-bottom: 1px solid var(--k8s-border-color) !important;
    overflow: hidden;

    code {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
  }

  :deep(.n-data-table-tr:last-child .n-data-table-td) { border-bottom: none !important; }

  :deep(.n-data-table-th--fixed-right),
  :deep(.n-data-table-td--fixed-right) {
    background: inherit;
    &::before { box-shadow: inset -10px 0 8px -8px rgba(0, 0, 0, 0.12); }
  }

  :deep(.n-data-table-pagination) {
    padding: 14px 16px;
    border-top: 1px solid var(--k8s-border-color);
    background: var(--k8s-table-header-bg);
  }

  :deep(.n-pagination) { justify-content: flex-end; }

  :deep(.n-data-table-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar { height: 6px; }
    &::-webkit-scrollbar-track { background: var(--k8s-scrollbar-track); border-radius: 3px; }
    &::-webkit-scrollbar-thumb {
      background: var(--k8s-scrollbar-thumb);
      border-radius: 3px;
      &:hover { background: var(--k8s-scrollbar-thumb-hover); }
    }
  }
}
</style>
