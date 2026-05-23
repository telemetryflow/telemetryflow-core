<script setup lang="ts">
/**
 * RegistryGraphPanel - Unified graph component driven by registry graphId
 *
 * Superset of GraphPanel and MiniChartCard. Supports three rendering variants:
 *   - "default"  — ChartCard wrapper (original behavior)
 *   - "mini"     — Compact header with icon, value badge, inline chart-type buttons
 *   - "panel"    — Full Grafana-style panel with collapsible query editor
 *
 * Covers all 13 registry chart types:
 *   timeseries, bar, gauge, heatmap, scatter, stat, sparkline, mini-bars,
 *   progress, text, topology, waterfall, flamegraph (+ dynamic slot fallback)
 *
 * Usage:
 *   <RegistryGraphPanel graph-id="HOM10005" />
 *   <RegistryGraphPanel graph-id="INF10009" variant="mini" icon="carbon:cpu" display-value="72%" />
 *   <RegistryGraphPanel graph-id="MET10005" variant="panel" :editable="true" />
 */
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import {
  NButton,
  NProgress,
  NModal,
  NSwitch,
  NCheckbox,
  NCheckboxGroup,
  NSpace,
  NSpin,
  NTag,
  NTooltip,
  NInput,
  NInputGroup,
} from "naive-ui";
import { useGraphAlert } from "@/composables/useGraphAlert";
import { useGraphShare } from "@/composables/useGraphShare";
import TimeSeriesChart from "./TimeSeriesChart.vue";
import BarChart from "./BarChart.vue";
import GaugeChart from "./GaugeChart.vue";
import HeatmapChart from "./HeatmapChart.vue";
import ScatterChart from "./ScatterChart.vue";
import ChartCard from "./ChartCard.vue";
import ChartZoomModal from "./ChartZoomModal.vue";
import ChartTypeToggle from "./ChartTypeToggle.vue";
import type { ChartDisplayType } from "./ChartTypeToggle.vue";
import { QueryEditorPanel } from "./query-editor";
import { useGraphFromRegistry } from "@/composables/useGraphFromRegistry";
import { useAppStore } from "@/store";
import type { SignalSource } from "@/utils/query-templates";
import type { ChartSeries } from "@/utils/telemetry";
import type { TraceScatterPoint } from "@/types";
import type { HeatmapDataPoint } from "./HeatmapChart.vue";
import { SERIES_COLORS } from "@/utils/chartColors";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Registry graph ID (e.g., 'HOM10005') */
  graphId: string;
  /** Chart area height */
  height?: string;
  /** Show chart type toggle for timeseries charts */
  showToggle?: boolean;
  /** Show zoom button */
  showZoom?: boolean;
  /** Override chart display type (line/area/bar) */
  defaultChartType?: ChartDisplayType;
  /** Rendering variant */
  variant?: "default" | "mini" | "panel";
  /** Show collapsible query editor (variant="panel") */
  editable?: boolean;
  /** Initial query editor collapsed state */
  queryCollapsed?: boolean;
  /** Icon for mini mode header */
  icon?: string;
  /** Icon CSS class for mini mode (e.g., 'cpu', 'memory') */
  iconClass?: string;
  /** Badge value for mini mode header */
  displayValue?: string;
  /** Override value for progress chart type (0-100) */
  progressValue?: number;
  /** External series data that bypasses the query panel pipeline.
   *  When provided, useGraphFromRegistry runs with autoRun=false. */
  overrideSeries?: ChartSeries[];
  /** External loading state (used when overrideSeries is provided) */
  overrideLoading?: boolean;
  /** External scatter data (for scatter chart type) */
  overrideScatterData?: TraceScatterPoint[];
  /** External heatmap data (for heatmap chart type) */
  overrideHeatmapData?: {
    xCategories: string[];
    yCategories: string[];
    data: HeatmapDataPoint[];
    maxValue?: number;
  };
  /** Fixed time range label shown in the panel header (e.g. "30d").
   *  Use when the chart's data window is independent of the global time range. */
  overrideTimeBadge?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: "300px",
  showToggle: true,
  showZoom: true,
  defaultChartType: "area",
  variant: "default",
  editable: false,
  queryCollapsed: true,
  overrideLoading: false,
});

// ─── Emits ────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: "update:queryCollapsed", value: boolean): void;
  (e: "update:queries", queries: unknown[]): void;
}>();

// ─── State ────────────────────────────────────────────────────────────────────

const appStore = useAppStore();
const chartDisplayType = ref<ChartDisplayType>(props.defaultChartType);
const showZoomModal = ref(false);
const collapsed = ref(props.queryCollapsed);
const seriesCollapsed = ref(true);
const showProperties = ref(false);
const seriesColorOverrides = ref<Record<string, string>>({});

// Sync collapsed state
watch(collapsed, (val) => emit("update:queryCollapsed", val));

// ─── Registry Composable ──────────────────────────────────────────────────────

// True only when override has actual data — empty array falls through to registry query pipeline
const hasOverride = computed(() => !!props.overrideSeries?.length);

const {
  definition,
  series: registrySeries,
  value,
  loading: registryLoading,
  error,
  refresh,
  panel,
} = useGraphFromRegistry(props.graphId, {
  autoRun: !props.overrideSeries?.length,
});

/** Unified series: override takes precedence when it has data; otherwise use registry query pipeline */
const series = computed(() =>
  hasOverride.value ? props.overrideSeries! : registrySeries.value,
);

/** Unified loading: override takes precedence over query pipeline */
const loading = computed(() =>
  hasOverride.value ? (props.overrideLoading ?? false) : registryLoading.value,
);

// ─── Series Color Customization ──────────────────────────────────────────────

const SERIES_PALETTE = SERIES_COLORS;

/** Hidden series tracking (by name) */
const hiddenSeries = ref<Set<string>>(new Set());

function toggleSeriesVisibility(name: string) {
  const next = new Set(hiddenSeries.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  hiddenSeries.value = next;
}

/** All series with color overrides (includes hidden for legend display) */
const allColoredSeries = computed(() => {
  return series.value.map((s, i) => ({
    ...s,
    color:
      seriesColorOverrides.value[s.name] ||
      s.color ||
      SERIES_PALETTE[i % SERIES_PALETTE.length],
  }));
});

/** Visible series only (fed to chart) */
const coloredSeries = computed(() => {
  return allColoredSeries.value.filter((s) => !hiddenSeries.value.has(s.name));
});

/**
 * Series passed to ChartZoomModal.
 * - Scatter: real [timestamp, duration] data per Success/Error so legend shows actual stats.
 * - Heatmap: undefined — heatmap has no meaningful timeseries stats, hide the legend panel.
 * - All others: coloredSeries (the normal path).
 */
const zoomModalSeries = computed<ChartSeries[] | undefined>(() => {
  if (isScatter && props.overrideScatterData?.length) {
    const success = props.overrideScatterData
      .filter((p) => !p.hasError)
      .map((p) => [p.timestamp, p.duration] as [number, number]);
    const error = props.overrideScatterData
      .filter((p) => p.hasError)
      .map((p) => [p.timestamp, p.duration] as [number, number]);
    return [
      { name: "Success", data: success, color: "#22c55e" },
      { name: "Error", data: error, color: "#ef4444" },
    ];
  }
  if (isHeatmap) return undefined;
  return coloredSeries.value;
});

function updateSeriesColor(name: string, color: string) {
  seriesColorOverrides.value[name] = color;
}

/** Transform ChartSeries[] → BarChart sparse format (one non-zero value per category) */
function toBarChartData(
  src: { name: string; data: [number, number][]; color?: string }[],
) {
  return {
    categories: src.map((s) => s.name),
    series: src.map((s, idx) => ({
      name: s.name,
      data: src.map((_, j) =>
        j === idx
          ? Math.round(
              s.data.reduce((sum, pt) => sum + (pt[1] || 0), 0) * 10000,
            ) / 10000
          : 0,
      ),
      color: s.color,
    })),
  };
}

const barData = computed(() => toBarChartData(series.value));
const barColoredData = computed(() => toBarChartData(coloredSeries.value));

function toggleProperties() {
  showProperties.value = !showProperties.value;
}

/**
 * Build an isolated series query from the template query + series name.
 * Template: `FETCH traces latency AGGREGATE percentiles(duration)` + series "P50"
 * → Result: `FETCH traces latency AGGREGATE p50(duration)`
 *
 * For PromQL: `sum(rate(cpu[5m])) by (namespace)` + series "production"
 * → Result: `sum(rate(cpu{namespace="production"}[5m]))`
 */
function buildSeriesQuery(seriesName: string, _idx: number): string {
  const q = definition.defaultQueries[0];
  if (!q) return seriesName;

  const key = q.seriesKey || "__name__";
  const expr = q.expression;

  if (key === "__name__") {
    // Single-series: the template IS the query
    return expr;
  }

  if (q.dialect === "promql") {
    // PromQL: inject label matcher into the selector
    // `sum(rate(metric[5m])) by (ns)` + "prod" → `sum(rate(metric{ns="prod"}[5m]))`
    const byPattern = /\)\s*by\s*\([^)]+\)/i;
    const withFilter = expr.replace(byPattern, `{${key}="${seriesName}"})`);
    if (withFilter !== expr) return withFilter;
    // Fallback: append filter
    return `${expr}{${key}="${seriesName}"}`;
  }

  // TFQL: inject WHERE clause or GROUP BY filter
  // `FETCH metrics ... GROUP BY ns` + "prod" → `FETCH metrics ... WHERE ns = 'prod'`
  const groupByPattern = /\bGROUP\s+BY\s+\w+/i;
  const withWhere = expr.replace(
    groupByPattern,
    `WHERE ${key} = '${seriesName}'`,
  );
  if (withWhere !== expr) return withWhere;

  return `${expr} WHERE ${key} = '${seriesName}'`;
}

// ─── Chart Type Booleans ──────────────────────────────────────────────────────

const chartType = definition.chartType;
const isTimeseries = chartType === "timeseries";
const isBar = chartType === "bar";
const isGauge = chartType === "gauge";
const isHeatmap = chartType === "heatmap";
const isScatter = chartType === "scatter";
const isStat = chartType === "stat";
const isSparkline = chartType === "sparkline";
const isMiniBars = chartType === "mini-bars";
const isProgress = chartType === "progress";
const isText = chartType === "text";
const isSpecialized =
  chartType === "topology" ||
  chartType === "waterfall" ||
  chartType === "flamegraph";

// Timeseries-family: types that support chart type toggle
const isTimeseriesFamily = isTimeseries || isSparkline;

// Stat-expandable: types that expand to timeseries in zoom
const isZoomableAsSeries =
  isTimeseries || isStat || isGauge || isSparkline || isMiniBars;

// ─── Computed ─────────────────────────────────────────────────────────────────

const statValue = computed(() => value.value ?? 0);

const progressPercentage = computed(() => {
  if (props.progressValue !== undefined) return props.progressValue;
  const v = value.value ?? 0;
  return Math.min(100, Math.max(0, typeof v === "number" ? v : 0));
});

// Mini mode chart type (maps ChartDisplayType to mini chart type)
type MiniChartType = "line" | "area" | "bar";
const miniChartType = ref<MiniChartType>(
  props.defaultChartType as MiniChartType,
);

// Split displayValue by "/" into colorful badge parts
const BADGE_PALETTE = [
  { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },   // blue
  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },   // green
  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },   // amber
  { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },   // purple
  { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },    // cyan
  { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },    // red
] as const;

const valueBadges = computed(() => {
  if (!props.displayValue) return [];
  return props.displayValue
    .split("/")
    .map((part, i) => ({
      text: part.trim(),
      ...BADGE_PALETTE[i % BADGE_PALETTE.length],
    }))
    .filter(b => b.text.length > 0);
});

// ─── Query Editor Handlers (variant="panel") ─────────────────────────────────

function toggleQueryEditor() {
  collapsed.value = !collapsed.value;
}

function handleWidgetUpdate() {
  emit("update:queries", panel.exportQueries());
}

// ─── Alert Integration ────────────────────────────────────────────────────────

const {
  alertEnabled,
  hasRule,
  primaryQuery,
  toggleAlert,
  savingAlert,
  alertError,
  channels,
  loadingChannels,
  selectedChannelIds,
  applyChannels,
} = useGraphAlert(props.graphId, definition.title, definition.defaultQueries);

const showAlertModal = ref(false);
const pendingChannelIds = ref<string[]>([]);

function openAlertModal() {
  pendingChannelIds.value = [...selectedChannelIds.value];
  showAlertModal.value = true;
}

async function confirmAlertChannels() {
  const ok = await applyChannels(pendingChannelIds.value);
  if (ok) showAlertModal.value = false;
  // On failure: modal stays open, alertError is set and shown in the footer
}

async function handleAlertToggle() {
  if (!alertEnabled.value && selectedChannelIds.value.length === 0) {
    openAlertModal();
  } else {
    await toggleAlert();
  }
}

// ─── Share Integration ────────────────────────────────────────────────────────

const {
  isShared,
  shareUrl,
  shortUrl,
  share: shareGraph,
  unshare: unshareGraph,
  regenerate: regenerateShareToken,
  copyLink,
  loading: shareLoading,
  error: shareError,
} = useGraphShare(
  props.graphId,
  definition.title,
  definition.defaultQueries as object[],
);

const showShareModal = ref(false);
const linkCopied = ref(false);

function openShareModal() {
  showShareModal.value = true;
}

async function handleCopyLink() {
  const ok = await copyLink(false);
  if (ok) {
    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  }
}

async function handleCopyShortLink() {
  const ok = await copyLink(true);
  if (ok) {
    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  }
}
</script>

<template>
  <!-- ═══════════════════════════════════════════════════════════════════════
       VARIANT: mini — Compact card with icon, value badge, inline controls
       ═══════════════════════════════════════════════════════════════════════ -->
  <div v-if="variant === 'mini'" class="mini-chart-card">
    <div class="mini-chart-header">
      <!-- Row 1: icon + title + controls -->
      <div class="mini-hdr-top">
        <Icon
          v-if="icon"
          :icon="icon"
          class="mini-chart-icon"
          :class="iconClass"
        />
        <span class="mini-chart-title">{{ definition.title }}</span>

        <!-- Controls — right-aligned on the same row as title -->
        <div class="mini-hdr-actions">
        <!-- Chart type toggles (timeseries only) -->
        <div v-if="isTimeseriesFamily" class="action-group">
          <button
            v-for="opt in [
              { type: 'line' as MiniChartType, icon: 'carbon:chart-line' },
              { type: 'area' as MiniChartType, icon: 'carbon:chart-area' },
              { type: 'bar' as MiniChartType, icon: 'carbon:chart-bar' },
            ]"
            :key="opt.type"
            class="panel-icon-btn"
            :class="{ 'is-active-tool': miniChartType === opt.type }"
            @click="miniChartType = opt.type"
          >
            <Icon :icon="opt.icon" :width="13" :height="13" />
          </button>
        </div>

        <!-- Feature group: Alert + Share -->
        <div class="action-group">
          <n-tooltip>
            <template #trigger>
              <button
                class="panel-icon-btn"
                :class="{ 'is-active-alert': alertEnabled }"
                :disabled="savingAlert"
                @click="handleAlertToggle"
              >
                <Icon icon="carbon:alarm" :width="14" :height="14" />
                <span v-if="alertEnabled" class="btn-dot btn-dot--alert" />
              </button>
            </template>
            {{
              alertEnabled
                ? "Alert ON — click to disable"
                : "Alert OFF — click to enable"
            }}
          </n-tooltip>

          <n-tooltip>
            <template #trigger>
              <button class="panel-icon-btn" @click="openAlertModal">
                <Icon icon="carbon:notification" :width="14" :height="14" />
              </button>
            </template>
            Configure alert channels
          </n-tooltip>

          <div class="action-sep" />

          <n-tooltip>
            <template #trigger>
              <button
                class="panel-icon-btn"
                :class="{ 'is-active-share': isShared }"
                :disabled="shareLoading"
                @click="openShareModal"
              >
                <Icon
                  :icon="isShared ? 'carbon:link' : 'carbon:share'"
                  :width="14"
                  :height="14"
                />
                <span v-if="isShared" class="btn-dot btn-dot--share" />
              </button>
            </template>
            {{
              isShared
                ? "Shared — click to manage link"
                : "Share publicly (no login)"
            }}
          </n-tooltip>
        </div>

        <!-- Tool group: Settings + Zoom -->
        <div class="action-group">
          <n-tooltip>
            <template #trigger>
              <button
                class="panel-icon-btn"
                :class="{ 'is-active-tool': showProperties }"
                @click="toggleProperties"
              >
                <Icon icon="carbon:settings" :width="14" :height="14" />
              </button>
            </template>
            {{ showProperties ? "Hide properties" : "Widget properties" }}
          </n-tooltip>

          <n-tooltip v-if="showZoom">
            <template #trigger>
              <button class="panel-icon-btn" @click="showZoomModal = true">
                <Icon icon="carbon:zoom-in" :width="14" :height="14" />
              </button>
            </template>
            Zoom in
          </n-tooltip>
        </div>
        </div><!-- /mini-hdr-actions -->
      </div><!-- /mini-hdr-top -->

      <!-- Row 2: value badges — colorful tags with "of" separator -->
      <div v-if="valueBadges.length" class="mini-hdr-value-row">
        <template v-for="(badge, i) in valueBadges" :key="badge.text">
          <span
            class="mini-chart-value-badge"
            :style="{ color: badge.color, background: badge.bg }"
          >{{ badge.text }}</span>
          <span v-if="i < valueBadges.length - 1" class="mini-badge-sep">of</span>
        </template>
      </div>
    </div><!-- /mini-chart-header -->

    <div class="mini-chart-body">
      <!-- Loading -->
      <div
        v-if="loading"
        class="registry-chart-loading"
        :style="{ minHeight: height }"
      >
        <n-spin size="small" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error && coloredSeries.length === 0"
        class="chart-error"
        :style="{ minHeight: height }"
      >
        <Icon icon="carbon:warning-alt" class="chart-error-icon" />
        <span class="chart-error-text">{{ error }}</span>
        <n-button size="tiny" quaternary @click="refresh">
          <template #icon
            ><Icon icon="carbon:renew" :width="14" :height="14"
          /></template>
          Retry
        </n-button>
      </div>

      <!-- Mini Timeseries -->
      <TimeSeriesChart
        v-else-if="isTimeseriesFamily"
        :series="coloredSeries"
        :height="height"
        :show-legend="true"
        :show-zoom="false"
        tooltip-mode="compact"
        :unit="definition.unit"
        :chart-type="miniChartType"
        :area-style="miniChartType === 'area'"
        tooltip-size="small"
        no-sync
        hide-time-badge
      />

      <!-- Mini uses same chart routing as default for non-timeseries -->
      <BarChart
        v-else-if="isBar || isMiniBars"
        :categories="barColoredData.categories"
        :series="barColoredData.series"
        :unit="definition.unit"
        stacked
        :height="height"
        tooltip-size="small"
        no-sync
      />

      <GaugeChart
        v-else-if="isGauge"
        :value="statValue"
        :unit="definition.unit || '%'"
        :height="height"
        :show-border="true"
      />

      <!-- Mini fallback -->
      <div v-else class="registry-fallback" :style="{ minHeight: height }">
        <Icon icon="carbon:chart-line" style="font-size: 24px; opacity: 0.3" />
        <span class="registry-fallback-label">{{ definition.chartType }}</span>
      </div>
    </div>

    <!-- Mini Widget Properties Panel -->
    <div v-if="showProperties" class="widget-properties">
      <div class="wp-header" @click="showProperties = false">
        <div class="wp-header-left">
          <Icon
            icon="carbon:settings"
            :width="14"
            :height="14"
            class="wp-header-icon"
          />
          <span class="wp-title">Widget Properties</span>
        </div>
        <Icon
          icon="carbon:chevron-up"
          :width="14"
          :height="14"
          class="wp-chevron"
        />
      </div>
      <div class="wp-badges">
        <span class="wp-badge badge-id">
          <span class="wp-badge-label">ID</span>
          <span class="wp-badge-value">{{ definition.graphId }}</span>
        </span>
        <span class="wp-badge badge-signal">
          <span class="wp-badge-label">Signal</span>
          <span class="wp-badge-value">{{ definition.signalType }}</span>
        </span>
        <span class="wp-badge badge-type">
          <span class="wp-badge-label">Type</span>
          <span class="wp-badge-value">{{ definition.chartType }}</span>
        </span>
        <span class="wp-badge badge-unit">
          <span class="wp-badge-label">Unit</span>
          <span class="wp-badge-value">{{ definition.unit || "\u2014" }}</span>
        </span>
      </div>
      <div v-if="coloredSeries.length > 0" class="wp-colors">
        <div
          v-for="(s, idx) in coloredSeries"
          :key="s.name"
          class="wp-color-chip"
        >
          <n-color-picker
            :value="s.color || SERIES_PALETTE[idx % SERIES_PALETTE.length]"
            size="small"
            :modes="['hex']"
            :show-alpha="false"
            :swatches="[...SERIES_PALETTE]"
            @update:value="updateSeriesColor(s.name, $event)"
          />
          <span class="wp-chip-name">{{ s.name }}</span>
        </div>
      </div>
    </div>

    <!-- Mini Zoom Modal -->
    <ChartZoomModal
      v-model:show="showZoomModal"
      v-model:chart-type="miniChartType"
      :title="definition.title"
      :series="zoomModalSeries"
      :unit="isScatter ? 'ms' : definition.unit"
      :override-scatter-data="isScatter ? overrideScatterData : undefined"
      :override-heatmap-data="isHeatmap ? overrideHeatmapData : undefined"
      :override-time-badge="overrideTimeBadge"
      tooltip-size="small"
      embed-chart
      height="80vh"
    />
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════
       VARIANT: panel — Full panel with header, chart, collapsible query editor
       ═══════════════════════════════════════════════════════════════════════ -->
  <div
    v-else-if="variant === 'panel'"
    class="graph-panel"
    :class="{ editable }"
  >
    <!-- Panel Header -->
    <div class="panel-header">
      <div class="panel-title-row">
        <span class="panel-title">{{ definition.title }}</span>
        <span v-if="overrideTimeBadge" class="panel-time-badge">
          <Icon icon="carbon:time" :width="11" :height="11" />
          {{ overrideTimeBadge }}
        </span>
      </div>

      <div class="panel-actions">
        <!-- Chart type toggle (timeseries only) -->
        <ChartTypeToggle
          v-if="isTimeseriesFamily"
          v-model="chartDisplayType"
          :show-bar="true"
          :show-expand="false"
        />

        <!-- ── Feature group: Alert + Share ── -->
        <div class="action-group">
          <!-- Alert toggle with dot indicator -->
          <n-tooltip>
            <template #trigger>
              <button
                class="panel-icon-btn"
                :class="{
                  'is-active-alert': alertEnabled,
                  'is-loading': savingAlert,
                }"
                :disabled="savingAlert"
                @click="handleAlertToggle"
              >
                <Icon icon="carbon:alarm" :width="15" :height="15" />
                <span v-if="alertEnabled" class="btn-dot btn-dot--alert" />
              </button>
            </template>
            {{
              alertEnabled
                ? "Alert ON — click to disable"
                : "Alert OFF — click to enable"
            }}
          </n-tooltip>

          <!-- Notification channels -->
          <n-tooltip>
            <template #trigger>
              <button class="panel-icon-btn" @click="openAlertModal">
                <Icon icon="carbon:notification" :width="15" :height="15" />
              </button>
            </template>
            Configure alert channels
          </n-tooltip>

          <div class="action-sep" />

          <!-- Share toggle with dot indicator -->
          <n-tooltip>
            <template #trigger>
              <button
                class="panel-icon-btn"
                :class="{ 'is-active-share': isShared }"
                :disabled="shareLoading"
                @click="openShareModal"
              >
                <Icon
                  :icon="isShared ? 'carbon:link' : 'carbon:share'"
                  :width="15"
                  :height="15"
                />
                <span v-if="isShared" class="btn-dot btn-dot--share" />
              </button>
            </template>
            {{
              isShared
                ? "Shared — click to manage link"
                : "Share publicly (no login)"
            }}
          </n-tooltip>
        </div>

        <!-- ── Tool group: Settings + Query + Zoom ── -->
        <div class="action-group">
          <n-tooltip>
            <template #trigger>
              <button
                class="panel-icon-btn"
                :class="{ 'is-active-tool': showProperties }"
                @click="toggleProperties"
              >
                <Icon icon="carbon:settings" :width="15" :height="15" />
              </button>
            </template>
            {{ showProperties ? "Hide properties" : "Widget properties" }}
          </n-tooltip>

          <n-tooltip v-if="editable">
            <template #trigger>
              <button
                class="panel-icon-btn"
                :class="{ 'is-active-tool': !collapsed }"
                @click="toggleQueryEditor"
              >
                <Icon icon="carbon:query-queue" :width="15" :height="15" />
              </button>
            </template>
            {{ collapsed ? "Show query editor" : "Hide query editor" }}
          </n-tooltip>

          <n-tooltip v-if="showZoom">
            <template #trigger>
              <button class="panel-icon-btn" @click="showZoomModal = true">
                <Icon icon="carbon:zoom-in" :width="15" :height="15" />
              </button>
            </template>
            Zoom in
          </n-tooltip>
        </div>
      </div>
    </div>

    <!-- Chart Area -->
    <div class="chart-area" :style="{ height }">
      <!-- Loading -->
      <div v-if="loading" class="chart-loading">
        <n-spin size="small" />
      </div>

      <!-- Error State -->
      <div v-else-if="error && coloredSeries.length === 0" class="chart-error">
        <Icon icon="carbon:warning-alt" class="chart-error-icon" />
        <span class="chart-error-text">{{ error }}</span>
        <n-button size="tiny" quaternary @click="refresh">
          <template #icon
            ><Icon icon="carbon:renew" :width="14" :height="14"
          /></template>
          Retry
        </n-button>
      </div>

      <!-- Time Series -->
      <TimeSeriesChart
        v-else-if="isTimeseries"
        :series="coloredSeries"
        :unit="definition.unit"
        :height="height"
        :show-legend="true"
        :chart-type="chartDisplayType"
        :area-style="chartDisplayType === 'area'"
        tooltip-size="small"
        no-sync
      />

      <!-- Bar Chart -->
      <BarChart
        v-else-if="isBar"
        :categories="barColoredData.categories"
        :series="barColoredData.series"
        :unit="definition.unit"
        stacked
        :height="height"
        tooltip-size="small"
        no-sync
      />

      <!-- Gauge -->
      <GaugeChart
        v-else-if="isGauge"
        :value="statValue"
        :unit="definition.unit || '%'"
        :height="height"
        :show-border="true"
      />

      <!-- Stat (rich — with icon, left border accent) -->
      <div v-else-if="isStat" class="stat-card-widget">
        <div class="stat-header">
          <Icon icon="carbon:analytics" class="stat-icon-small" />
          <span class="stat-title">{{ definition.title }}</span>
        </div>
        <div class="stat-value-large">
          {{ statValue }}
        </div>
        <div v-if="definition.unit" class="stat-trend">
          {{ definition.unit }}
        </div>
      </div>

      <!-- Heatmap -->
      <HeatmapChart
        v-else-if="
          isHeatmap &&
          overrideHeatmapData &&
          overrideHeatmapData.data.length > 0
        "
        :x-categories="overrideHeatmapData.xCategories"
        :y-categories="overrideHeatmapData.yCategories"
        :data="overrideHeatmapData.data"
        :max-value="overrideHeatmapData.maxValue"
        :height="height"
        :show-zoom="showZoom"
        tooltip-size="small"
        no-sync
      />
      <div
        v-else-if="isHeatmap"
        class="registry-chart-empty"
        :style="{ height }"
      >
        <Icon icon="carbon:chart-area" style="font-size: 32px; opacity: 0.25" />
        <span>No latency data available</span>
      </div>

      <!-- Scatter -->
      <ScatterChart
        v-else-if="
          isScatter && overrideScatterData && overrideScatterData.length > 0
        "
        :data="overrideScatterData"
        :height="height"
        tooltip-size="small"
        no-sync
      />
      <div
        v-else-if="isScatter"
        class="registry-chart-empty"
        :style="{ height }"
      >
        <Icon
          icon="carbon:scatter-matrix"
          style="font-size: 32px; opacity: 0.25"
        />
        <span>No scatter data available</span>
      </div>

      <!-- Sparkline (compact timeseries — no legend, no axis) -->
      <TimeSeriesChart
        v-else-if="isSparkline"
        :series="coloredSeries"
        :height="height"
        :show-legend="false"
        :show-axis="false"
        :show-grid="false"
        chart-type="area"
        :area-style="true"
        tooltip-size="small"
        no-sync
      />

      <!-- Mini Bars (compact bar) -->
      <BarChart
        v-else-if="isMiniBars"
        :categories="barColoredData.categories"
        :series="barColoredData.series"
        stacked
        :height="height"
        tooltip-size="small"
        no-sync
      />

      <!-- Progress Bar -->
      <div v-else-if="isProgress" class="registry-progress-display">
        <n-progress
          :percentage="progressPercentage"
          indicator-placement="inside"
        />
        <span class="progress-label">{{ definition.title }}</span>
      </div>

      <!-- Text Widget -->
      <div v-else-if="isText" class="text-content">
        <p>{{ definition.description || definition.title }}</p>
      </div>

      <!-- Topology / Waterfall / Flamegraph (specialized — slot-based) -->
      <div v-else-if="isSpecialized" class="registry-specialized-slot">
        <slot
          :definition="definition"
          :series="coloredSeries"
          :loading="loading"
          :value="value"
        />
      </div>

      <!-- Fallback -->
      <div v-else class="fallback-content">
        <Icon icon="carbon:chart-line" style="font-size: 32px; opacity: 0.3" />
        <span class="fallback-label">{{ definition.chartType }}</span>
      </div>
    </div>

    <!-- Series Queries (collapsible, per-line isolated queries with hide/show) -->
    <div
      v-if="
        (isTimeseriesFamily || isBar) && allColoredSeries.length > 0 && editable
      "
      class="series-queries"
    >
      <div class="sq-bar" @click="seriesCollapsed = !seriesCollapsed">
        <Icon
          :icon="
            seriesCollapsed ? 'carbon:chevron-right' : 'carbon:chevron-down'
          "
          :width="14"
          :height="14"
          class="sq-chevron"
        />
        <span class="sq-label"
          >Series Queries ({{ coloredSeries.length }}/{{
            allColoredSeries.length
          }})</span
        >
        <code
          v-if="
            definition.defaultQueries[0]?.seriesKey &&
            definition.defaultQueries[0]?.seriesKey !== '__name__'
          "
          class="sq-key-tag"
          >by {{ definition.defaultQueries[0].seriesKey }}</code
        >
      </div>
      <div v-show="!seriesCollapsed" class="sq-list">
        <div
          v-for="(s, idx) in allColoredSeries"
          :key="s.name + idx"
          class="sq-row"
          :class="{ 'sq-hidden': hiddenSeries.has(s.name) }"
        >
          <button
            class="sq-color-chip"
            :title="hiddenSeries.has(s.name) ? 'Show series' : 'Hide series'"
            :style="{
              backgroundColor: hiddenSeries.has(s.name)
                ? 'var(--n-text-color-disabled)'
                : s.color || SERIES_PALETTE[idx % SERIES_PALETTE.length],
            }"
            @click="toggleSeriesVisibility(s.name)"
          />
          <span class="sq-series-name">{{ s.name }}</span>
          <code class="sq-expr">{{ buildSeriesQuery(s.name, idx) }}</code>
        </div>
      </div>
    </div>

    <!-- Widget Properties Panel (TFO section standard) -->
    <div v-if="showProperties" class="widget-properties">
      <div class="wp-header" @click="showProperties = false">
        <div class="wp-header-left">
          <Icon
            icon="carbon:settings"
            :width="14"
            :height="14"
            class="wp-header-icon"
          />
          <span class="wp-title">Widget Properties</span>
        </div>
        <Icon
          icon="carbon:chevron-up"
          :width="14"
          :height="14"
          class="wp-chevron"
        />
      </div>

      <!-- Metadata badges -->
      <div class="wp-badges">
        <span class="wp-badge badge-id">
          <span class="wp-badge-label">ID</span>
          <span class="wp-badge-value">{{ definition.graphId }}</span>
        </span>
        <span class="wp-badge badge-signal">
          <span class="wp-badge-label">Signal</span>
          <span class="wp-badge-value">{{ definition.signalType }}</span>
        </span>
        <span class="wp-badge badge-type">
          <span class="wp-badge-label">Type</span>
          <span class="wp-badge-value">{{ definition.chartType }}</span>
        </span>
        <span class="wp-badge badge-unit">
          <span class="wp-badge-label">Unit</span>
          <span class="wp-badge-value">{{ definition.unit || "\u2014" }}</span>
        </span>
      </div>

      <!-- Description -->
      <div v-if="definition.description" class="wp-desc">
        {{ definition.description }}
      </div>

      <!-- Series Color Chips (inline horizontal) -->
      <div v-if="coloredSeries.length > 0" class="wp-colors">
        <div
          v-for="(s, idx) in coloredSeries"
          :key="s.name"
          class="wp-color-chip"
        >
          <n-color-picker
            :value="s.color || SERIES_PALETTE[idx % SERIES_PALETTE.length]"
            size="small"
            :modes="['hex']"
            :show-alpha="false"
            :swatches="[...SERIES_PALETTE]"
            @update:value="updateSeriesColor(s.name, $event)"
          />
          <span class="wp-chip-name">{{ s.name }}</span>
        </div>
      </div>
    </div>

    <!-- Query Editor Panel (collapsible) -->
    <QueryEditorPanel
      v-if="editable"
      :rows="panel.rows.value"
      :loading="loading"
      :collapsed="collapsed"
      :template-suggestions="panel.templateSuggestions.value"
      @update:collapsed="collapsed = $event"
      @update-query="
        (i: number, v: string) => {
          panel.updateQueryText(i, v);
          handleWidgetUpdate();
        }
      "
      @update-type="
        (i: number, v: string) => {
          panel.updateQueryType(i, v as SignalSource);
          handleWidgetUpdate();
        }
      "
      @update-dialect="
        (i: number, v: string) => {
          panel.updateDialect(i, v as 'tfql' | 'promql');
          handleWidgetUpdate();
        }
      "
      @update-legend="
        (i: number, v: string) => {
          panel.updateLegend(i, v);
          handleWidgetUpdate();
        }
      "
      @toggle-query="
        (i: number) => {
          panel.toggleQuery(i);
          handleWidgetUpdate();
        }
      "
      @run-query="(i: number) => panel.runQuery(i)"
      @run-all="panel.runAllQueries()"
      @add-query="
        () => {
          panel.addQuery();
          handleWidgetUpdate();
        }
      "
      @remove-query="
        (i: number) => {
          panel.removeQuery(i);
          handleWidgetUpdate();
        }
      "
      @duplicate-query="
        (i: number) => {
          panel.duplicateQuery(i);
          handleWidgetUpdate();
        }
      "
      @select-template="
        (i: number, tid: string) => {
          panel.applyTemplate(i, tid);
          handleWidgetUpdate();
        }
      "
    />

    <!-- Panel Zoom Modal -->
    <ChartZoomModal
      v-model:show="showZoomModal"
      :title="definition.title"
      :series="zoomModalSeries"
      :unit="isScatter ? 'ms' : definition.unit"
      :chart-type="chartDisplayType"
      :override-scatter-data="isScatter ? overrideScatterData : undefined"
      :override-heatmap-data="isHeatmap ? overrideHeatmapData : undefined"
      :override-time-badge="overrideTimeBadge"
      tooltip-size="small"
      :show-chart-type-toggle="isZoomableAsSeries"
      @update:chart-type="chartDisplayType = $event"
    >
      <TimeSeriesChart
        v-if="isZoomableAsSeries"
        :series="coloredSeries"
        :unit="definition.unit"
        height="70vh"
        :show-legend="true"
        :area-style="chartDisplayType === 'area'"
        :chart-type="chartDisplayType"
        tooltip-size="small"
      />
      <BarChart
        v-else-if="isBar"
        :categories="barColoredData.categories"
        :series="barColoredData.series"
        :unit="definition.unit"
        stacked
        height="70vh"
        tooltip-size="small"
        no-sync
      />
    </ChartZoomModal>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════
       VARIANT: default — ChartCard wrapper (original behavior, enhanced)
       ═══════════════════════════════════════════════════════════════════════ -->
  <ChartCard
    v-else
    :title="definition.title"
    :chart-id="definition.graphId"
    :chart-type="chartDisplayType"
    :show-chart-type-toggle="false"
    :series="series"
    :unit="definition.unit"
  >
    <template #header-actions>
      <ChartTypeToggle
        v-if="isTimeseriesFamily && showToggle"
        v-model="chartDisplayType"
        :show-bar="true"
        :show-expand="false"
      />

      <!-- ── Feature group: Alert + Share ── -->
      <div class="action-group">
        <!-- Alert toggle with dot indicator -->
        <n-tooltip>
          <template #trigger>
            <button
              class="panel-icon-btn"
              :class="{ 'is-active-alert': alertEnabled }"
              :disabled="savingAlert"
              @click="handleAlertToggle"
            >
              <Icon icon="carbon:alarm" :width="15" :height="15" />
              <span v-if="alertEnabled" class="btn-dot btn-dot--alert" />
            </button>
          </template>
          {{
            alertEnabled
              ? "Alert ON — click to disable"
              : "Alert OFF — click to enable"
          }}
        </n-tooltip>

        <!-- Notification channels -->
        <n-tooltip>
          <template #trigger>
            <button class="panel-icon-btn" @click="openAlertModal">
              <Icon icon="carbon:notification" :width="15" :height="15" />
            </button>
          </template>
          Configure alert channels
        </n-tooltip>

        <div class="action-sep" />

        <!-- Share toggle with dot indicator -->
        <n-tooltip>
          <template #trigger>
            <button
              class="panel-icon-btn"
              :class="{ 'is-active-share': isShared }"
              :disabled="shareLoading"
              @click="openShareModal"
            >
              <Icon
                :icon="isShared ? 'carbon:link' : 'carbon:share'"
                :width="15"
                :height="15"
              />
              <span v-if="isShared" class="btn-dot btn-dot--share" />
            </button>
          </template>
          {{
            isShared
              ? "Shared — click to manage link"
              : "Share publicly (no login)"
          }}
        </n-tooltip>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="registry-chart-loading">
      <n-spin size="small" />
    </div>

    <!-- Error State -->
    <div v-else-if="error && coloredSeries.length === 0" class="chart-error">
      <Icon icon="carbon:warning-alt" class="chart-error-icon" />
      <span class="chart-error-text">{{ error }}</span>
      <n-button size="tiny" quaternary @click="refresh">
        <template #icon
          ><Icon icon="carbon:renew" :width="14" :height="14"
        /></template>
        Retry
      </n-button>
    </div>

    <!-- Time Series -->
    <TimeSeriesChart
      v-else-if="isTimeseries"
      :series="coloredSeries"
      :unit="definition.unit"
      :height="height"
      :show-legend="true"
      :chart-type="chartDisplayType"
      :area-style="chartDisplayType === 'area'"
      tooltip-size="small"
      no-sync
    />

    <!-- Bar Chart -->
    <BarChart
      v-else-if="isBar"
      :categories="barColoredData.categories"
      :series="barColoredData.series"
      :unit="definition.unit"
      stacked
      :height="height"
      tooltip-size="small"
      no-sync
    />

    <!-- Gauge -->
    <GaugeChart
      v-else-if="isGauge"
      :value="statValue"
      :unit="definition.unit || '%'"
      :height="height"
      :show-border="true"
    />

    <!-- Heatmap -->
    <HeatmapChart
      v-else-if="
        isHeatmap && overrideHeatmapData && overrideHeatmapData.data.length > 0
      "
      :x-categories="overrideHeatmapData.xCategories"
      :y-categories="overrideHeatmapData.yCategories"
      :data="overrideHeatmapData.data"
      :max-value="overrideHeatmapData.maxValue"
      :height="height"
      :show-zoom="showZoom"
      tooltip-size="small"
      no-sync
    />
    <div v-else-if="isHeatmap" class="registry-chart-empty" :style="{ height }">
      <Icon icon="carbon:chart-area" style="font-size: 32px; opacity: 0.25" />
      <span>No latency data available</span>
    </div>

    <!-- Scatter -->
    <ScatterChart
      v-else-if="
        isScatter && overrideScatterData && overrideScatterData.length > 0
      "
      :data="overrideScatterData"
      :height="height"
      tooltip-size="small"
      no-sync
    />
    <div v-else-if="isScatter" class="registry-chart-empty" :style="{ height }">
      <Icon
        icon="carbon:scatter-matrix"
        style="font-size: 32px; opacity: 0.25"
      />
      <span>No scatter data available</span>
    </div>

    <!-- Stat (rich — icon, color, left border accent) -->
    <div v-else-if="isStat" class="stat-card-widget">
      <div class="stat-header">
        <Icon icon="carbon:analytics" class="stat-icon-small" />
        <span class="stat-title">{{ definition.title }}</span>
      </div>
      <div class="stat-value-large">
        {{ statValue }}
      </div>
      <div v-if="definition.unit" class="stat-trend">
        {{ definition.unit }}
      </div>
    </div>

    <!-- Sparkline (compact timeseries — no legend, no axis) -->
    <TimeSeriesChart
      v-else-if="isSparkline"
      :series="coloredSeries"
      :height="height"
      :show-legend="false"
      :show-axis="false"
      :show-grid="false"
      chart-type="area"
      :area-style="true"
      tooltip-size="small"
      no-sync
    />

    <!-- Mini Bars -->
    <BarChart
      v-else-if="isMiniBars"
      :categories="barColoredData.categories"
      :series="barColoredData.series"
      stacked
      :height="height"
      tooltip-size="small"
      no-sync
    />

    <!-- Progress Bar -->
    <div v-else-if="isProgress" class="registry-progress-display">
      <n-progress
        :percentage="progressPercentage"
        indicator-placement="inside"
      />
      <span class="progress-label">{{ definition.title }}</span>
    </div>

    <!-- Text Widget -->
    <div v-else-if="isText" class="text-content">
      <p>{{ definition.description || definition.title }}</p>
    </div>

    <!-- Topology / Waterfall / Flamegraph (slot-based) -->
    <div v-else-if="isSpecialized" class="registry-specialized-slot">
      <slot
        :definition="definition"
        :series="series"
        :loading="loading"
        :value="value"
      />
    </div>

    <!-- Fallback -->
    <div v-else class="registry-fallback">
      <Icon icon="carbon:chart-line" style="font-size: 32px; opacity: 0.3" />
      <span class="registry-fallback-label">{{ definition.chartType }}</span>
    </div>
  </ChartCard>

  <!-- ═══════════════════════════════════════════════════════════════════════
       Alert Notification Channel Modal (shared across all variants)
       ═══════════════════════════════════════════════════════════════════════ -->
  <n-modal
    v-model:show="showAlertModal"
    preset="card"
    :title="`Alert Channels — ${definition.title}`"
    style="width: 420px; max-width: 95vw"
    :mask-closable="true"
    :closable="true"
  >
    <div class="alert-modal-body">
      <!-- Alert ON/OFF switch — only shows toggle when a rule already exists -->
      <div class="alert-modal-toggle-row">
        <span class="alert-modal-label">Alert</span>
        <n-switch
          :value="alertEnabled"
          :loading="savingAlert"
          :disabled="!hasRule"
          :checked-value="true"
          :unchecked-value="false"
          checked-style="background: var(--n-color-error)"
          @update:value="toggleAlert"
        >
          <template #checked>ON</template>
          <template #unchecked>OFF</template>
        </n-switch>
        <n-tag v-if="alertEnabled" type="error" size="small" round>Active</n-tag>
        <n-tag v-else-if="hasRule" size="small" round>Inactive</n-tag>
        <n-tag v-else size="small" round type="warning">Not configured</n-tag>
      </div>

      <div class="alert-modal-divider" />

      <!-- Captured query preview -->
      <div v-if="primaryQuery" class="alert-query-preview">
        <div class="alert-query-preview-header">
          <Icon icon="carbon:code" :width="13" />
          <span>Query captured from graph</span>
          <span class="alert-query-dialect">{{ primaryQuery.dialect.toUpperCase() }}</span>
        </div>
        <code class="alert-query-expr">{{ primaryQuery.expression }}</code>
      </div>

      <div class="alert-modal-divider" />

      <!-- Channel selector -->
      <p class="alert-modal-section-title">Notification Channels</p>
      <div v-if="loadingChannels" class="alert-modal-loading">
        <n-spin size="small" />
        <span>Loading channels…</span>
      </div>
      <div v-else-if="channels.length === 0" class="alert-modal-empty">
        No notification channels configured. Add one in Settings →
        Notifications.
      </div>
      <n-checkbox-group v-else v-model:value="pendingChannelIds">
        <n-space vertical :size="6">
          <n-checkbox
            v-for="ch in channels"
            :key="ch.id"
            :value="ch.id"
            :disabled="!ch.enabled"
          >
            <span class="channel-option-label">
              <Icon
                :icon="`carbon:${ch.type === 'email' ? 'email' : ch.type === 'slack' ? 'logo-slack' : 'notification'}`"
                :width="14"
              />
              {{ ch.name }}
              <n-tag
                v-if="!ch.enabled"
                size="tiny"
                type="warning"
                style="margin-left: 4px"
                >disabled</n-tag
              >
            </span>
          </n-checkbox>
        </n-space>
      </n-checkbox-group>
    </div>

    <template #footer>
      <div class="alert-modal-footer">
        <span v-if="alertError" class="alert-modal-error">
          <Icon icon="carbon:warning-filled" :width="13" />
          {{ alertError }}
        </span>
        <div class="alert-modal-footer-btns">
          <n-button size="small" @click="showAlertModal = false"
            >Cancel</n-button
          >
          <n-button
            type="primary"
            size="small"
            :loading="savingAlert"
            :disabled="pendingChannelIds.length === 0"
            @click="confirmAlertChannels"
          >
            Apply &amp; Enable Alert
          </n-button>
        </div>
      </div>
    </template>
  </n-modal>

  <!-- ═══════════════════════════════════════════════════════════════════════
       Share Graph Modal (shared across all variants)
       ═══════════════════════════════════════════════════════════════════════ -->
  <n-modal
    v-model:show="showShareModal"
    preset="card"
    :title="`Share — ${definition.title}`"
    style="width: 460px; max-width: 95vw"
    :mask-closable="true"
    :closable="true"
  >
    <div class="share-modal-body">
      <!-- Share ON/OFF -->
      <div class="share-toggle-row">
        <span class="share-label">Public access</span>
        <n-switch
          :value="isShared"
          :loading="shareLoading"
          @update:value="(v: boolean) => (v ? shareGraph() : unshareGraph())"
        >
          <template #checked>ON</template>
          <template #unchecked>OFF</template>
        </n-switch>
        <n-tag v-if="isShared" type="info" size="small" round>Active</n-tag>
        <n-tag v-else size="small" round>Inactive</n-tag>
      </div>

      <!-- Error feedback -->
      <div v-if="shareError" class="share-error-banner">
        <Icon icon="carbon:warning-filled" :width="13" />
        {{ shareError }}
      </div>

      <div v-if="isShared" class="share-url-section">
        <!-- Short URL (primary — easy to share) -->
        <p class="share-url-label">Short link:</p>
        <n-input-group>
          <n-input
            :value="shortUrl ?? ''"
            readonly
            size="small"
            style="font-size: 12px; font-weight: 600"
          />
          <n-button
            size="small"
            :type="linkCopied ? 'success' : 'primary'"
            @click="handleCopyShortLink"
          >
            <template #icon>
              <Icon
                :icon="linkCopied ? 'carbon:checkmark' : 'carbon:copy'"
                :width="14"
                :height="14"
              />
            </template>
            {{ linkCopied ? "Copied!" : "Copy" }}
          </n-button>
        </n-input-group>

        <!-- Full URL (collapsible) -->
        <p class="share-url-label" style="margin-top: 8px">Full link:</p>
        <n-input-group>
          <n-input
            :value="shareUrl ?? ''"
            readonly
            size="small"
            style="font-size: 11px; color: var(--n-text-color-3)"
          />
          <n-button size="small" quaternary @click="handleCopyLink">
            <template #icon>
              <Icon icon="carbon:copy" :width="14" :height="14" />
            </template>
          </n-button>
        </n-input-group>

        <div class="share-actions-row">
          <n-button
            size="tiny"
            quaternary
            :loading="shareLoading"
            @click="regenerateShareToken"
          >
            <template #icon>
              <Icon icon="carbon:renew" :width="13" :height="13" />
            </template>
            Regenerate links
          </n-button>
        </div>
      </div>

      <div v-else class="share-off-hint">
        Enable public access to get a shareable link that works without login.
      </div>
    </div>
  </n-modal>
</template>

<style scoped lang="scss">
// ─── Alert Modal ─────────────────────────────────────────────────────────────

.alert-modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-modal-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-modal-label {
  font-size: 13px;
  font-weight: 600;
  min-width: 38px;
}

.alert-modal-divider {
  border-top: 1px solid var(--n-border-color);
}

// Query preview block
.alert-query-preview {
  background: var(--n-color-modal, rgba(0,0,0,0.03));
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-query-preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.alert-query-dialect {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  color: #6366f1;
  background: rgba(99,102,241,0.1);
  border-radius: 3px;
  padding: 1px 5px;
}

.alert-query-expr {
  display: block;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 11px;
  color: var(--n-text-color);
  background: transparent;
  word-break: break-all;
  white-space: pre-wrap;
  padding: 0;
}

.alert-modal-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--n-text-color-2);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.alert-modal-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.alert-modal-empty {
  font-size: 13px;
  color: var(--n-text-color-3);
  padding: 8px 0;
}

.channel-option-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.alert-modal-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-modal-footer-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.alert-modal-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--n-error-color, #ef4444);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  padding: 6px 10px;
}

// ─── Share Modal ─────────────────────────────────────────────────────────────

.share-modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.share-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.share-label {
  font-size: 13px;
  font-weight: 600;
  min-width: 90px;
}

.share-url-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-url-label {
  font-size: 12px;
  color: var(--n-text-color-2);
  margin: 0;
}

.share-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.share-error {
  font-size: 12px;
  color: var(--n-color-error);
  margin: 0;
}

// Top-level error banner (replaces inline share-error for visibility)
.share-error-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--n-error-color, #ef4444);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  padding: 6px 10px;
}

.share-off-hint {
  font-size: 13px;
  color: var(--n-text-color-3);
  padding: 4px 0;
}

// ─── Shared Styles ──────────────────────────────────────────────────────────

.registry-chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.registry-chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.registry-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 200px;
  color: var(--n-text-color-3);

  .registry-fallback-label {
    font-size: 12px;
    text-transform: capitalize;
  }
}

.registry-progress-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 120px;
  padding: 20px;

  .progress-label {
    font-size: 0.85rem;
    color: var(--n-text-color-3);
  }
}

.text-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--n-text-color-2);

  @media (max-width: 768px) {
    padding: 12px;
    font-size: 13px;
  }
}

.registry-specialized-slot {
  min-height: 200px;
}

// ─── Stat Card Widget (shared between default + panel variants) ─────────────

.stat-card-widget {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 16px 20px;
  border: 1px solid var(--k8s-border-color, var(--n-border-color));
  border-left-width: 4px;
  border-left-color: var(--n-primary-color);
  border-radius: 8px;
  background: var(--n-card-color);

  :global(html.dark) & {
    background: #1e293b;
  }
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;

  .stat-icon-small {
    font-size: 14px;
    color: var(--n-text-color-3);
  }

  .stat-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--n-text-color-3);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
}

.stat-value-large {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--n-text-color-2);
}

// ─── Mini Variant ───────────────────────────────────────────────────────────

.mini-chart-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: var(--n-card-color);

  :global(html.dark) & {
    border-color: #475569;
    background: #1e293b;
  }
}

.mini-chart-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px 8px;
  background: transparent;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

// Row 1 — icon + title + controls (buttons right-aligned on same row)
.mini-hdr-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

// Controls inside row 1 — pushed to the right
.mini-hdr-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

// Row 2 — colorful value badges, left-aligned below title
.mini-hdr-value-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding-left: calc(18px + 8px); // icon width + gap → aligns with title text
}

.mini-chart-icon {
  font-size: 18px;
  flex-shrink: 0;

  &.cpu {
    color: #3b82f6;
  }
  &.memory {
    color: #8b5cf6;
  }
  &.disk {
    color: #f59e0b;
  }
  &.network {
    color: #10b981;
  }
  &.ephemeral {
    color: #14b8a6;
  }
  &.capacity {
    color: #3b82f6;
  }
  &.iops {
    color: #f59e0b;
  }
  &.throughput {
    color: #8b5cf6;
  }
}

.mini-chart-title {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--n-text-color);
  letter-spacing: 0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-chart-value-badge {
  display: inline-block;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
  padding: 1px 7px;
  border-radius: 4px;
  line-height: 1.6;
  letter-spacing: 0.01em;
}

.mini-badge-sep {
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  user-select: none;
}

.mini-chart-body {
  padding: 8px 8px 12px 8px;
}

// ─── Panel Variant (from GraphPanel) ────────────────────────────────────────

.graph-panel {
  display: flex;
  flex-direction: column;
  background: var(--n-card-color);
  border: 1px solid var(--k8s-border-color, var(--n-border-color));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;

  :global(html.dark) & {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--k8s-border-color, var(--n-border-color));
  min-height: 56px;
  background: var(--n-card-color);

  @media (max-width: 768px) {
    padding: 12px 16px;
    min-height: 48px;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--n-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 14px;
    min-width: 0;
  }
}

.panel-time-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

// ── Button group pill ─────────────────────────────────────────────────────────
.action-group {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  background: var(--n-color-modal, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 2px;
}

// Thin separator inside a group
.action-sep {
  width: 1px;
  height: 14px;
  background: var(--n-border-color);
  margin: 0 2px;
  flex-shrink: 0;
}

// Base icon button inside a group
.panel-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--n-text-color-3);
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
  padding: 0;
  outline: none;

  &:hover:not(:disabled) {
    background: var(--n-close-color-hover, rgba(99, 102, 241, 0.08));
    color: var(--n-text-color);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  // Alert active state
  &.is-active-alert {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
  }

  // Share active state
  &.is-active-share {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.08);
  }

  // Generic tool active state (settings, query editor)
  &.is-active-tool {
    color: var(--n-color-primary, #6366f1);
    background: rgba(99, 102, 241, 0.08);
  }
}

// Dot badge — top-right of an icon button
.btn-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--n-card-color, #fff);

  &--alert {
    background: #ef4444;
  }
  &--share {
    background: #3b82f6;
  }
}

// Legacy flat action-btn (still used in older template spots if any)
.action-btn {
  width: 28px;
  height: 28px;
  padding: 0;
}

.chart-area {
  position: relative;
  flex: 1;
  min-height: 200px;
  padding: 20px;
  overflow: hidden;
  background: var(--n-card-color);

  & > * {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 768px) {
    padding: 16px;
    min-height: 180px;
  }

  // Adjust GaugeChart wrapper inside panel
  :deep(.gauge-chart-wrapper.with-border) {
    border: 2px solid var(--k8s-border-color, var(--n-border-color));
    border-radius: 8px;
    padding: 16px;
    background: var(--n-color);

    @media (max-width: 768px) {
      border-width: 1.5px;
      border-radius: 6px;
      padding: 12px;
    }
  }
}

.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--n-modal-color);
  z-index: 10;
  pointer-events: none;
}

.chart-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 200px;
  color: var(--n-text-color-3);

  .chart-error-icon {
    font-size: 28px;
    color: #f59e0b;
  }

  .chart-error-text {
    font-size: 12px;
    max-width: 280px;
    text-align: center;
    line-height: 1.4;
  }
}

.fallback-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--n-text-color-3);

  @media (max-width: 768px) {
    gap: 6px;

    :deep(svg) {
      font-size: 24px !important;
    }
  }
}

.fallback-label {
  font-size: 12px;
  text-transform: capitalize;

  @media (max-width: 768px) {
    font-size: 11px;
  }
}

// ─── Widget Properties Panel (TFO section standard) ─────────────────────────
// Single border-top separates from chart; everything inside uses spacing only.

.widget-properties {
  border-top: 1px solid var(--k8s-border-color, var(--n-border-color));
  background: var(--n-action-color);
}

.wp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: pointer;
  user-select: none;
  height: 34px;
  transition: background-color 0.15s ease;

  &:hover {
    background: rgba(128, 128, 128, 0.06);
  }
}

.wp-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wp-header-icon {
  color: var(--n-text-color-3);
}

.wp-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--n-text-color-2);
  letter-spacing: 0.02em;
}

.wp-chevron {
  color: var(--n-text-color-3);
}

// ── Series Queries ──
.series-queries {
  border-top: 1px solid var(--n-divider-color);
}

.sq-bar {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: rgba(128, 128, 128, 0.04);
  border-bottom: 1px solid rgba(128, 128, 128, 0.06);
  color: var(--n-text-color-3);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: rgba(128, 128, 128, 0.07);
  }
}

.sq-chevron {
  color: var(--n-text-color-3);
  flex-shrink: 0;
}

.sq-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--n-text-color-2);
  letter-spacing: 0.3px;
}

.sq-key-tag {
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  font-family: "SF Mono", Monaco, monospace;
  margin-left: auto;
}

.sq-list {
  max-height: 180px;
  overflow-y: auto;
}

.sq-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.04);
  transition:
    background 0.15s,
    opacity 0.15s;

  &:hover {
    background: rgba(128, 128, 128, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }

  &.sq-hidden {
    opacity: 0.35;
  }
}

.sq-color-chip {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    opacity 0.15s,
    transform 0.1s;

  &:hover {
    transform: scale(1.15);
    opacity: 0.85;
  }
}

.sq-series-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--n-text-color);
  white-space: nowrap;
  min-width: 50px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.sq-expr {
  font-size: 10px;
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
  color: var(--n-text-color-3);
  background: rgba(128, 128, 128, 0.06);
  padding: 2px 6px;
  border-radius: 3px;
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

// ── Metadata Badges ──
.wp-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
}

.wp-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--k8s-border-color-subtle, rgba(128, 128, 128, 0.2));
  line-height: 1;
}

.wp-badge-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 4px 7px;
  background: rgba(128, 128, 128, 0.08);
  white-space: nowrap;
}

.wp-badge-value {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  white-space: nowrap;
}

// Badge color variants
.badge-id .wp-badge-value {
  color: #3b82f6;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  letter-spacing: -0.02em;
}

.badge-signal .wp-badge-value {
  color: #22c55e;
}

.badge-type .wp-badge-value {
  color: #a855f7;
}

.badge-unit .wp-badge-value {
  color: #f59e0b;
}

// ── Description ──
.wp-desc {
  padding: 6px 12px;
  font-size: 11px;
  color: var(--n-text-color-3);
  line-height: 1.4;
}

// ── Series Color Chips (inline horizontal) ──
.wp-colors {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 8px;
}

.wp-color-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 2px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.06);
  transition: background-color 0.15s ease;
  cursor: default;

  &:hover {
    background: rgba(128, 128, 128, 0.12);
  }

  :deep(.n-color-picker) {
    width: 28px !important;
    flex-shrink: 0;
  }

  :deep(.n-color-picker-trigger) {
    width: 25px !important;
    height: 25px !important;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }

  :deep(.n-color-picker-trigger__value) {
    display: none;
  }
}

.wp-chip-name {
  font-size: 11px;
  color: var(--n-text-color);
  white-space: nowrap;
  line-height: 1;
}
</style>
