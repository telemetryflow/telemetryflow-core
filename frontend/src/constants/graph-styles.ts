/**
 * TelemetryFlow Graph Style Constants
 *
 * Global design system for all graph/chart visualizations.
 * Ensures consistent styling across the entire platform (Grafana-like).
 *
 * Usage:
 *   import { GRAPH_COLORS, CHART_DEFAULTS, SEVERITY_COLORS } from '@/constants/graph-styles';
 */

// ─── Color Palette ──────────────────────────────────────────────────────────────

/** Primary chart series colors (10-color palette) */
export const SERIES_COLORS = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#22c55e", // green
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
] as const;

/** Severity / status colors */
export const SEVERITY_COLORS = {
  critical: "#ef4444",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  success: "#22c55e",
  healthy: "#22c55e",
  degraded: "#f59e0b",
  unhealthy: "#ef4444",
  down: "#ef4444",
  maintenance: "#8b5cf6",
  pending: "#6b7280",
  neutral: "#6b7280",
} as const;

/** Log level colors */
export const LOG_LEVEL_COLORS = {
  trace: "#6b7280",
  debug: "#3b82f6",
  info: "#22c55e",
  warn: "#f59e0b",
  error: "#ef4444",
  fatal: "#dc2626",
} as const;

/** Stat panel color presets */
export const STAT_PANEL_COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
} as const;

/** Gauge threshold colors */
export const GAUGE_THRESHOLDS = {
  low: { max: 30, color: "#22c55e" },
  medium: { max: 70, color: "#f59e0b" },
  high: { max: 100, color: "#ef4444" },
} as const;

/** Resource utilization thresholds */
export const RESOURCE_THRESHOLDS = {
  normal: { max: 60, color: "#22c55e" },
  elevated: { max: 80, color: "#f59e0b" },
  critical: { max: 100, color: "#ef4444" },
} as const;

// ─── Chart Defaults ─────────────────────────────────────────────────────────────

/** Default chart dimensions */
export const CHART_DIMENSIONS = {
  /** Standard chart height */
  standard: "300px",
  /** Compact chart height */
  compact: "200px",
  /** Mini chart card height */
  mini: "160px",
  /** Zoom modal chart height */
  zoomModal: "80vh",
  /** Dashboard widget height (builder) */
  widgetBuilder: "150px",
  /** Dashboard widget height (viewer) */
  widgetViewer: "200px",
  /** Scatter chart height */
  scatter: "320px",
  /** Heatmap chart height */
  heatmap: "280px",
  /** Detail page chart height */
  detail: "400px",
} as const;

/** Default ECharts grid configuration */
export const CHART_GRID = {
  top: 40,
  right: 20,
  bottom: 60,
  left: 60,
  containLabel: true,
} as const;

/** Default axis label styles */
export const AXIS_STYLES = {
  fontSize: 11,
  fontFamily: "'Inter', 'SF Pro', -apple-system, sans-serif",
  color: "#9ca3af",
} as const;

/** Default tooltip configuration */
export const TOOLTIP_DEFAULTS = {
  trigger: "axis" as const,
  backgroundColor: "rgba(17, 24, 39, 0.95)",
  borderColor: "rgba(55, 65, 81, 0.5)",
  borderWidth: 1,
  textStyle: {
    color: "#e5e7eb",
    fontSize: 12,
  },
  padding: [8, 12],
} as const;

/** Default legend configuration */
export const LEGEND_DEFAULTS = {
  type: "scroll" as const,
  bottom: 0,
  textStyle: {
    color: "#9ca3af",
    fontSize: 11,
  },
  pageTextStyle: {
    color: "#9ca3af",
  },
  icon: "roundRect",
  itemWidth: 14,
  itemHeight: 3,
} as const;

/** Data zoom (slider) defaults */
export const DATA_ZOOM_DEFAULTS = {
  type: "slider" as const,
  height: 20,
  bottom: 25,
  borderColor: "transparent",
  backgroundColor: "rgba(55, 65, 81, 0.3)",
  fillerColor: "rgba(59, 130, 246, 0.15)",
  handleStyle: {
    color: "#3b82f6",
    borderColor: "#3b82f6",
  },
  textStyle: {
    color: "#9ca3af",
    fontSize: 10,
  },
} as const;

// ─── Line / Area Styles ─────────────────────────────────────────────────────────

/** Line chart style defaults */
export const LINE_STYLE_DEFAULTS = {
  width: 1.5,
  type: "solid" as const,
} as const;

/** Area chart fill opacity */
export const AREA_OPACITY = 0.15;

/** Scatter chart symbol defaults */
export const SCATTER_DEFAULTS = {
  symbolSize: 8,
  symbolSizeRange: [6, 20],
  successColor: "rgba(34, 197, 94, 0.7)",
  errorColor: "rgba(239, 68, 68, 0.7)",
  hoverOpacity: 1,
} as const;

// ─── Stat Panel Styles ──────────────────────────────────────────────────────────

/** StatPanel component style tokens */
export const STAT_PANEL_STYLES = {
  /** Default card height */
  height: "110px",
  /** Small variant height */
  heightSmall: "75px",
  /** Value font size */
  valueFontSize: "2rem",
  /** Value font weight */
  valueFontWeight: 700,
  /** Label font size */
  labelFontSize: "0.75rem",
  /** Trend indicator colors */
  trendUp: "#22c55e",
  trendDown: "#ef4444",
  trendStable: "#6b7280",
  /** Icon background opacity */
  iconBgOpacity: 0.12,
  /** Icon size */
  iconSize: 20,
  /** Left border width for accent */
  borderLeftWidth: "3px",
} as const;

// ─── Topology Graph Styles ──────────────────────────────────────────────────────

/** Service Map node graph styles */
export const SERVICE_NODE_STYLES = {
  nodeRadius: 50,
  nodeSpacingX: 260,
  nodeSpacingY: 180,
  edgeMinWidth: 1,
  edgeMaxWidth: 3.5,
  fontFamily: "'Inter', sans-serif",
  nameFontSize: 12,
  metricFontSize: 10,
  labelFontSize: 9,
  statusColors: {
    healthy: "#22c55e",
    degraded: "#f59e0b",
    unhealthy: "#ef4444",
  },
  edgeColors: {
    normal: "#22c55e",
    critical: "#f97316",
    unhealthy: "#ef4444",
  },
} as const;

/** Network Map node graph styles */
export const NETWORK_NODE_STYLES = {
  nodeWidth: 130,
  nodeHeight: 100,
  topBarHeight: 4,
  statusLedSize: 4,
  iconSize: 32,
  fontFamily: "'Inter', sans-serif",
  nameFontSize: 11,
  ipFontSize: 9,
  typeColors: {
    router: "#3b82f6",
    switch: "#22c55e",
    firewall: "#ef4444",
    load_balancer: "#f59e0b",
    server: "#8b5cf6",
    database: "#ec4899",
    cache: "#06b6d4",
    cdn: "#f97316",
    dns: "#14b8a6",
    gateway: "#a855f7",
  },
} as const;

// ─── Mini Chart Card Styles ─────────────────────────────────────────────────────

export const MINI_CHART_STYLES = {
  height: "160px",
  chartHeight: "100px",
  headerHeight: "40px",
  iconSize: 16,
  valueSize: "0.85rem",
  titleSize: "0.75rem",
} as const;

// ─── Uptime Bar Styles ──────────────────────────────────────────────────────────

export const UPTIME_BAR_STYLES = {
  barCount: 40,
  barWidth: "4px",
  barHeight: "24px",
  barGap: "2px",
  barRadius: "2px",
  successColor: "#22c55e",   // Green  - Up
  failureColor: "#ef4444",   // Red    - Down
  issuesColor: "#f59e0b",    // Orange - Other Issues
  noDataColor: "#9ca3af",    // Gray   - No Data
} as const;

// ─── Heatmap Styles ─────────────────────────────────────────────────────────────

export const HEATMAP_STYLES = {
  normalMinColor: "#1e3a5f",
  normalMaxColor: "#3b82f6",
  errorMinColor: "#5f1e1e",
  errorMaxColor: "#ef4444",
  cellBorderWidth: 1,
  cellBorderColor: "rgba(0, 0, 0, 0.1)",
} as const;

// ─── Sparkline Styles ───────────────────────────────────────────────────────────

export const SPARKLINE_STYLES = {
  width: 80,
  height: 20,
  strokeWidth: 1.5,
  pointRadius: 1.5,
} as const;

// ─── Progress Bar Styles ────────────────────────────────────────────────────────

export const PROGRESS_BAR_STYLES = {
  height: "8px",
  borderRadius: "4px",
  backgroundColor: "rgba(55, 65, 81, 0.3)",
  normalColor: "#22c55e",
  elevatedColor: "#f59e0b",
  criticalColor: "#ef4444",
  getColor: (value: number): string => {
    if (value >= 80) return PROGRESS_BAR_STYLES.criticalColor;
    if (value >= 60) return PROGRESS_BAR_STYLES.elevatedColor;
    return PROGRESS_BAR_STYLES.normalColor;
  },
} as const;

// ─── Dark Mode Overrides ────────────────────────────────────────────────────────

export const DARK_MODE_OVERRIDES = {
  backgroundColor: "transparent",
  textColor: "#e5e7eb",
  axisLineColor: "rgba(75, 85, 99, 0.5)",
  splitLineColor: "rgba(55, 65, 81, 0.3)",
  tooltipBg: "rgba(17, 24, 39, 0.95)",
  tooltipBorder: "rgba(55, 65, 81, 0.5)",
  legendColor: "#9ca3af",
} as const;

// ─── Animation Defaults ─────────────────────────────────────────────────────────

export const ANIMATION_DEFAULTS = {
  duration: 300,
  easing: "cubicOut" as const,
  updateDuration: 200,
  hoverScale: 1.05,
} as const;

// ─── Number Formatting ──────────────────────────────────────────────────────────

/**
 * Format a number to compact representation (K, M, B)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

/**
 * Format bytes to human-readable (KB, MB, GB, TB)
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1_099_511_627_776)
    return `${(bytes / 1_099_511_627_776).toFixed(1)} TB`;
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/**
 * Format duration to human-readable (us, ms, s, min)
 */
export function formatDuration(ms: number): string {
  if (ms < 0.001) return `${(ms * 1_000_000).toFixed(0)}ns`;
  if (ms < 1) return `${(ms * 1_000).toFixed(0)}us`;
  if (ms < 1_000) return `${ms.toFixed(1)}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
}
