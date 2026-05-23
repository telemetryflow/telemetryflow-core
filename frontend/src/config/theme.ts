/**
 * Theme configuration
 */
import { SERIES_COLORS } from "@/utils/chartColors";

export interface ThemeColors {
  primary: string;
  info: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeConfig {
  defaultMode: "light" | "dark";
  colors: ThemeColors;
}

export const themeConfig: ThemeConfig = {
  defaultMode: "light",
  colors: {
    primary: "#3b82f6",
    info: "#06b6d4",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  },
};

/**
 * Chart color palette — all 50 SERIES_COLORS used as default for every
 * line-chart and area-chart in the application (light and dark mode).
 * Round 0 (vivid) colors appear first → best contrast for the first series.
 * Round 2 (lighter) colors are in the same list for dark-mode readability.
 */
export const chartColors = {
  light: [...SERIES_COLORS],
  dark:  [...SERIES_COLORS],
};

export const logLevelColors: Record<string, string> = {
  trace: "#94a3b8",
  debug: "#60a5fa",
  info: "#22c55e",
  warn: "#f59e0b",
  error: "#ef4444",
  fatal: "#7c3aed",
};

export const spanKindColors: Record<string, string> = {
  internal: "#6b7280",
  server: "#3b82f6",
  client: "#22c55e",
  producer: "#f59e0b",
  consumer: "#8b5cf6",
  unspecified: "#9ca3af",
};

export const alertSeverityColors: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

/**
 * Global chart layout configuration
 * Shared across BarChart, TimeSeriesChart, ScatterChart, etc.
 */
export const chartLayout = {
  // Legend configuration
  legend: {
    bottom: 0,
    padding: [5, 0, 0, 0] as [number, number, number, number], // [top, right, bottom, left]
    height: 25, // Approximate legend height for calculations
    // Legend positioning:
    // - ≤8 series: Centered with left: 'center'
    // - >8 series: Constrained to grid width (left/right = grid margins) with scroll pagination
  },
  // Grid configuration per chart type
  grid: {
    timeSeries: { left: 20, right: 20 },
    bar: { left: 20, right: 20 },
    scatter: { left: 20, right: 20 },
    heatmap: { left: 20, right: 70 },
  },
  // Zoom slider configuration
  zoom: {
    height: {
      bar: 18,
      timeSeries: 20,
    },
    gapFromAxis: 5, // Gap between x-axis labels and zoom slider
    gapFromCanvas: 5, // Gap between canvas (when no x-axis) and zoom slider
    // Note: left/right not set - zoom slider auto-aligns with x-axis width
    autoAlignWithAxis: true,
  },
  // X-axis configuration
  xAxis: {
    labelHeight: 25, // Space for x-axis labels (only when containLabel is false)
    padding: 10, // Minimum padding between x-axis and zoom slider (always applied)
  },
  // Grid bottom calculations helper
  // containLabel: true = ECharts handles axis label space (ScatterChart) - only needs padding
  // containLabel: false = need to add space for x-axis labels manually (TimeSeriesChart)
  getGridBottom: (options: {
    hasLegend: boolean;
    hasZoom: boolean;
    chartType?: "bar" | "timeSeries";
    containLabel?: boolean;
  }) => {
    const {
      hasLegend,
      hasZoom,
      chartType = "timeSeries",
      containLabel = false,
    } = options;
    const legendHeight =
      chartLayout.legend.height + chartLayout.legend.padding[0];
    const zoomHeight =
      chartType === "bar"
        ? chartLayout.zoom.height.bar
        : chartLayout.zoom.height.timeSeries;
    const gap = chartLayout.zoom.gapFromAxis;
    // containLabel: true → just padding, containLabel: false → full label height
    const xAxisSpace = containLabel
      ? chartLayout.xAxis.padding
      : chartLayout.xAxis.labelHeight;

    if (hasLegend && hasZoom) {
      // X-axis space + zoom + legend + gap
      return xAxisSpace + zoomHeight + gap + legendHeight;
    } else if (hasLegend) {
      // X-axis space + legend
      return xAxisSpace + legendHeight;
    } else if (hasZoom) {
      // X-axis space + zoom + gap
      return xAxisSpace + zoomHeight + gap;
    }
    // Neither
    return chartType === "bar" ? 10 : xAxisSpace || 20;
  },
  // Get zoom slider bottom position (above legend)
  getZoomBottom: (hasLegend: boolean) => {
    const legendSpace = hasLegend
      ? chartLayout.legend.height + chartLayout.legend.padding[0]
      : 0;
    return legendSpace + chartLayout.zoom.gapFromAxis;
  },
  // No data overlay configuration
  noData: {
    // Vertical offset to center "No data" within chart canvas (accounts for bottom elements)
    topOffset: 25, // CSS: top: calc(50% - 25px)
  },
};

/**
 * Tooltip size configurations
 */
export type TooltipSize = "small" | "medium" | "standard";

export const tooltipSizes = {
  small: {
    padding: [8, 12] as [number, number],
    fontSize: 12,
    minWidth: 160,
    cellPadding: 6,
    labelFontSize: 11,
    valueFontSize: 11,
    valueFontWeight: 700, // Bold for small tooltips
  },
  medium: {
    padding: [10, 14] as [number, number],
    fontSize: 13,
    minWidth: 180,
    cellPadding: 7,
    labelFontSize: 12,
    valueFontSize: 12,
    valueFontWeight: 700, // Bold for medium tooltips
  },
  standard: {
    padding: [12, 16] as [number, number],
    fontSize: 14,
    minWidth: 200,
    cellPadding: 8,
    labelFontSize: 13,
    valueFontSize: 13,
    valueFontWeight: 700, // Bold for standard tooltips
  },
};

/**
 * Reusable tooltip configuration for all charts
 * Provides consistent styling across TimeSeriesChart, BarChart, ScatterChart, HeatmapChart, NodeGraph
 * @param isDarkMode - Whether dark mode is enabled
 * @param size - Tooltip size: 'small', 'medium', or 'standard' (default)
 */
export const createTooltipConfig = (
  isDarkMode: boolean,
  size: TooltipSize = "standard",
) => {
  const sizeConfig = tooltipSizes[size];
  return {
    backgroundColor: isDarkMode ? "#ffffff" : "#1e293b",
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    textStyle: {
      color: isDarkMode ? "#1f2937" : "#e5e7eb",
      fontSize: sizeConfig.fontSize,
    },
    padding: sizeConfig.padding,
    confine: true,
    appendToBody: true,
    extraCssText:
      "z-index: 9999; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); pointer-events: none;",
  };
};

/**
 * Tooltip color scheme for table-based tooltips
 */
export const getTooltipColors = (isDarkMode: boolean) => ({
  labelColor: isDarkMode ? "#6b7280" : "#9ca3af",
  valueColor: isDarkMode ? "#111827" : "#fff",
  borderColor: isDarkMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
});

/**
 * Get tooltip size configuration
 */
export const getTooltipSize = (size: TooltipSize = "standard") =>
  tooltipSizes[size];

/**
 * Check if a unit string represents a byte-based metric.
 * When true, values should use binary (1024) prefixes: KiB, MiB, GiB, TiB.
 */
const BYTE_UNITS = new Set([
  "bytes", "byte", "b", "B",
  "Bi", "bi",
  "bytespersec", "bytes/s", "B/s",
]);

export function isByteUnit(unit?: string): boolean {
  if (!unit) return false;
  return BYTE_UNITS.has(unit) || BYTE_UNITS.has(unit.toLowerCase());
}

/**
 * Format a chart value with unit awareness.
 * - Byte units: binary (1024) prefixes → KiB, MiB, GiB, TiB
 * - Other units: decimal (1000) prefixes → K, M, G
 *
 * @param val      Numeric value
 * @param unit     Unit string from graph registry (e.g., "bytes", "%", "cores")
 * @param decimals Decimal places (default 2 for tooltip, 1 for axis)
 */
export function formatChartValue(
  val: number,
  unit?: string,
  decimals = 2,
): string {
  if (isByteUnit(unit)) {
    const abs = Math.abs(val);
    if (abs >= 1024 ** 4) return `${(val / 1024 ** 4).toFixed(decimals)} TiB`;
    if (abs >= 1024 ** 3) return `${(val / 1024 ** 3).toFixed(decimals)} GiB`;
    if (abs >= 1024 ** 2) return `${(val / 1024 ** 2).toFixed(decimals)} MiB`;
    if (abs >= 1024)      return `${(val / 1024).toFixed(decimals)} KiB`;
    return `${Math.round(val)} B`;
  }
  // Decimal: general numeric values
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(decimals)}G`;
  if (abs >= 1_000_000)     return `${(val / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 10_000)        return `${(val / 1_000).toFixed(decimals)}K`;
  if (abs >= 1_000)         return `${(val / 1_000).toFixed(decimals)}K`;
  if (val % 1 === 0) return Math.round(val).toString();
  return formatSmallDecimal(val);
}

/**
 * Format value for tooltip display (unit-aware).
 * Legacy wrapper — prefer formatChartValue() directly when unit is available.
 */
export const formatTooltipValue = (val: unknown, unit?: string): string => {
  if (typeof val !== "number") return String(val);
  return formatChartValue(val, unit, 2);
};

/** Units that carry no meaning as a suffix on axis labels (redundant or placeholder). */
const UNIT_NO_SUFFIX = new Set(["count", "", "varies", "dynamic"]);

/**
 * Format a value for a y-axis tick label, including unit suffix.
 * - Byte units (bytes, bytes/s, …): suffix already embedded by formatChartValue (KiB/MiB/GiB)
 * - Percent (%/percent): appended without space → "42%"
 * - count / empty / varies / dynamic: no suffix (redundant or meaningless)
 * - All other units: appended with space → "1.2 ms", "0.5 cores", "42 req/s"
 */
export function formatAxisLabel(value: number, unit?: string, decimals = 1): string {
  const formatted = formatChartValue(value, unit, decimals);
  if (!unit || isByteUnit(unit) || UNIT_NO_SUFFIX.has(unit)) return formatted;
  if (unit === "%" || unit === "percent") return `${formatted}%`;
  return `${formatted} ${unit}`;
}

/**
 * Format small decimal values adaptively — show enough digits so the value is not "0.00"
 */
export const formatSmallDecimal = (val: number): string => {
  const abs = Math.abs(val);
  if (abs >= 1) return val.toFixed(2);
  if (abs >= 0.01) return val.toFixed(2);
  if (abs >= 0.001) return val.toFixed(3);
  if (abs >= 0.0001) return val.toFixed(4);
  if (abs === 0) return '0';
  return val.toExponential(2);
};
