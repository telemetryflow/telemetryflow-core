/**
 * Time Range Utilities
 * Global helpers for time range calculations matching the header time picker dropdown
 */

/**
 * Time range preset keys (matching header dropdown)
 */
export type TimeRangePreset =
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "3h"
  | "6h"
  | "12h"
  | "24h"
  | "2d"
  | "7d"
  | "14d"
  | "30d";

/**
 * Time range configuration interface
 */
export interface TimeRangeConfig {
  key: TimeRangePreset;
  label: string;
  shortLabel: string;
  durationMs: number;
  relativeTo: "now";
}

/**
 * Time range result with start and end timestamps
 */
export interface TimeRange {
  start: number;
  end: number;
  label: string;
  shortLabel: string;
  preset: TimeRangePreset;
}

/**
 * Duration constants in milliseconds
 */
export const DURATION_MS = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
} as const;

/**
 * Time range presets matching header dropdown
 * Order matches the dropdown UI
 */
export const TIME_RANGE_PRESETS: TimeRangeConfig[] = [
  {
    key: "5m",
    label: "Last 5 minutes",
    shortLabel: "5m",
    durationMs: 5 * DURATION_MS.minute,
    relativeTo: "now",
  },
  {
    key: "15m",
    label: "Last 15 minutes",
    shortLabel: "15m",
    durationMs: 15 * DURATION_MS.minute,
    relativeTo: "now",
  },
  {
    key: "30m",
    label: "Last 30 minutes",
    shortLabel: "30m",
    durationMs: 30 * DURATION_MS.minute,
    relativeTo: "now",
  },
  {
    key: "1h",
    label: "Last 1 hour",
    shortLabel: "1h",
    durationMs: 1 * DURATION_MS.hour,
    relativeTo: "now",
  },
  {
    key: "3h",
    label: "Last 3 hours",
    shortLabel: "3h",
    durationMs: 3 * DURATION_MS.hour,
    relativeTo: "now",
  },
  {
    key: "6h",
    label: "Last 6 hours",
    shortLabel: "6h",
    durationMs: 6 * DURATION_MS.hour,
    relativeTo: "now",
  },
  {
    key: "12h",
    label: "Last 12 hours",
    shortLabel: "12h",
    durationMs: 12 * DURATION_MS.hour,
    relativeTo: "now",
  },
  {
    key: "24h",
    label: "Last 24 hours",
    shortLabel: "24h",
    durationMs: 24 * DURATION_MS.hour,
    relativeTo: "now",
  },
  {
    key: "2d",
    label: "Last 2 days",
    shortLabel: "2d",
    durationMs: 2 * DURATION_MS.day,
    relativeTo: "now",
  },
  {
    key: "7d",
    label: "Last 7 days",
    shortLabel: "7d",
    durationMs: 7 * DURATION_MS.day,
    relativeTo: "now",
  },
  {
    key: "14d",
    label: "Last 14 days",
    shortLabel: "14d",
    durationMs: 14 * DURATION_MS.day,
    relativeTo: "now",
  },
  {
    key: "30d",
    label: "Last 30 days",
    shortLabel: "30d",
    durationMs: 30 * DURATION_MS.day,
    relativeTo: "now",
  },
];

/**
 * Map of preset keys to configurations for quick lookup
 */
export const TIME_RANGE_PRESET_MAP: Record<TimeRangePreset, TimeRangeConfig> =
  TIME_RANGE_PRESETS.reduce(
    (acc, preset) => {
      acc[preset.key] = preset;
      return acc;
    },
    {} as Record<TimeRangePreset, TimeRangeConfig>,
  );

/**
 * Default time range preset
 */
export const DEFAULT_TIME_RANGE_PRESET: TimeRangePreset = "1h";

/**
 * Get time range by preset key
 * Calculates start and end timestamps based on current time
 *
 * @param preset - Time range preset key
 * @returns TimeRange with start, end, and labels
 */
export function getTimeRangeByPreset(preset: TimeRangePreset): TimeRange {
  const config = TIME_RANGE_PRESET_MAP[preset];
  const now = Date.now();

  return {
    start: now - config.durationMs,
    end: now,
    label: config.label,
    shortLabel: config.shortLabel,
    preset: config.key,
  };
}

/**
 * Get time range from start and end timestamps
 * Attempts to match to a preset, otherwise calculates duration
 *
 * @param start - Start timestamp in milliseconds
 * @param end - End timestamp in milliseconds
 * @returns TimeRange with labels
 */
export function getTimeRangeFromTimestamps(
  start: number,
  end: number,
): TimeRange {
  const durationMs = end - start;

  // Try to match a preset
  const matchedPreset = TIME_RANGE_PRESETS.find(
    (preset) => Math.abs(preset.durationMs - durationMs) < DURATION_MS.minute, // 1 minute tolerance
  );

  if (matchedPreset) {
    return {
      start,
      end,
      label: matchedPreset.label,
      shortLabel: matchedPreset.shortLabel,
      preset: matchedPreset.key,
    };
  }

  // Calculate custom label
  const { label, shortLabel } = formatDurationLabel(durationMs);

  return {
    start,
    end,
    label,
    shortLabel,
    preset: "1h", // fallback preset
  };
}

/**
 * Format duration to human-readable labels
 *
 * @param durationMs - Duration in milliseconds
 * @returns Object with label and shortLabel
 */
export function formatDurationLabel(durationMs: number): {
  label: string;
  shortLabel: string;
} {
  const minutes = Math.floor(durationMs / DURATION_MS.minute);
  const hours = Math.floor(durationMs / DURATION_MS.hour);
  const days = Math.floor(durationMs / DURATION_MS.day);

  if (days >= 1) {
    return {
      label: `Last ${days} day${days > 1 ? "s" : ""}`,
      shortLabel: `${days}d`,
    };
  }
  if (hours >= 1) {
    return {
      label: `Last ${hours} hour${hours > 1 ? "s" : ""}`,
      shortLabel: `${hours}h`,
    };
  }
  return {
    label: `Last ${minutes} minute${minutes > 1 ? "s" : ""}`,
    shortLabel: `${minutes}m`,
  };
}

/**
 * Get title suffix for StatPanel from time range
 * Returns format like "(1h)" for display
 *
 * @param start - Start timestamp in milliseconds
 * @param end - End timestamp in milliseconds
 * @returns Formatted suffix string like "(1h)"
 */
export function getTimeRangeTitleSuffix(start: number, end: number): string {
  const timeRange = getTimeRangeFromTimestamps(start, end);
  return `(${timeRange.shortLabel})`;
}

/**
 * Get trend comparison suffix
 * Returns format like "vs 1h ago" for trend display
 *
 * @param start - Start timestamp in milliseconds
 * @param end - End timestamp in milliseconds
 * @returns Formatted suffix string like "vs 1h ago"
 */
export function getTrendComparisonSuffix(start: number, end: number): string {
  const timeRange = getTimeRangeFromTimestamps(start, end);
  return `vs ${timeRange.shortLabel} ago`;
}

/**
 * Get previous period for comparison
 * Calculates the time range before the current one with same duration
 *
 * @param start - Current period start timestamp
 * @param end - Current period end timestamp
 * @returns Object with previousStart and previousEnd
 */
export function getPreviousPeriodRange(
  start: number,
  end: number,
): { previousStart: number; previousEnd: number } {
  const duration = end - start;
  return {
    previousStart: start - duration,
    previousEnd: start,
  };
}

/**
 * Check if time range is a valid preset
 *
 * @param preset - String to check
 * @returns Boolean indicating if it's a valid preset
 */
export function isValidTimeRangePreset(
  preset: string,
): preset is TimeRangePreset {
  return preset in TIME_RANGE_PRESET_MAP;
}

/**
 * Get time range options for select/dropdown components
 * Returns array of options compatible with Naive UI select
 *
 * @returns Array of options with label and value
 */
export function getTimeRangeOptions(): Array<{
  label: string;
  value: TimeRangePreset;
}> {
  return TIME_RANGE_PRESETS.map((preset) => ({
    label: preset.label,
    value: preset.key,
  }));
}

/**
 * Parse relative time string (e.g., "now-1h")
 * Converts Grafana-style relative time to timestamp
 *
 * @param relativeTime - Relative time string (e.g., "now-1h", "now-30m")
 * @returns Timestamp in milliseconds
 */
export function parseRelativeTime(relativeTime: string): number {
  const now = Date.now();

  if (relativeTime === "now") {
    return now;
  }

  const match = relativeTime.match(/^now-(\d+)(m|h|d)$/);
  if (!match) {
    return now;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "m":
      return now - value * DURATION_MS.minute;
    case "h":
      return now - value * DURATION_MS.hour;
    case "d":
      return now - value * DURATION_MS.day;
    default:
      return now;
  }
}

/**
 * Format timestamp to relative time string
 * Converts timestamp to Grafana-style relative time (e.g., "now-1h")
 *
 * @param timestamp - Timestamp in milliseconds
 * @returns Relative time string
 */
export function formatToRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < DURATION_MS.minute) {
    return "now";
  }

  const minutes = Math.floor(diff / DURATION_MS.minute);
  const hours = Math.floor(diff / DURATION_MS.hour);
  const days = Math.floor(diff / DURATION_MS.day);

  if (days >= 1) {
    return `now-${days}d`;
  }
  if (hours >= 1) {
    return `now-${hours}h`;
  }
  return `now-${minutes}m`;
}
