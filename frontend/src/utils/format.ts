import dayjs from "dayjs";
import { useAppStore } from "@/store/app";

/**
 * Convert epoch ms to a dayjs instance in the user-selected timezone.
 * All display formatting MUST go through this helper so timestamps
 * respect the global timezone selector (UTC / Browser / IANA).
 */
function tz(value: number | Date | string) {
  const appStore = useAppStore();
  const zone = appStore.chartTimezone;
  return zone === "UTC" ? dayjs.utc(value) : dayjs.utc(value).tz(zone);
}

/**
 * Format timestamp to standard datetime format
 */
export function formatTimestamp(ts: number): string {
  return tz(ts).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Format date/timestamp to standard datetime format (YYYY-MM-DD HH:mm:ss)
 * Accepts Date object, ISO string, or timestamp number
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "—";
  const d = tz(date);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : "—";
}

/**
 * Format timestamp to human readable format
 */
export function formatTime(ts: number): string {
  return tz(ts).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Format timestamp to short time format (HH:mm:ss)
 */
export function formatTimeShort(ts: number): string {
  return tz(ts).format("HH:mm:ss");
}

/**
 * Format timestamp to short date format (MMM D, HH:mm)
 * Used for displaying "Updated at" timestamps
 */
export function formatDateShort(ts: number): string {
  return tz(ts).format("MMM D, HH:mm");
}

/**
 * Format timestamps for bar chart categories
 * Shows date (YYYY-MM-DD) only once when day changes
 * @param timestamps - array of timestamps to format
 * @param rangeStart - start of the time range
 * @param rangeEnd - end of the time range
 */
export function formatBarChartCategories(
  timestamps: number[],
  rangeStart: number,
  rangeEnd: number,
): string[] {
  if (timestamps.length === 0) return [];

  // Check if actual data spans multiple days
  const firstDay = tz(timestamps[0]).format("YYYY-MM-DD");
  const lastDay = tz(timestamps[timestamps.length - 1]).format("YYYY-MM-DD");
  const rangeStartDay = tz(rangeStart).format("YYYY-MM-DD");
  const rangeEndDay = tz(rangeEnd).format("YYYY-MM-DD");

  const spansMultipleDays =
    firstDay !== lastDay || rangeStartDay !== rangeEndDay;

  if (!spansMultipleDays) {
    // Same day - just show time
    return timestamps.map((ts) => tz(ts).format("HH:mm"));
  }

  // Multiple days - show date when day changes
  let lastDate = firstDay;

  return timestamps.map((ts) => {
    const d = tz(ts);
    const currentDate = d.format("YYYY-MM-DD");
    const time = d.format("HH:mm");

    if (currentDate !== lastDate) {
      lastDate = currentDate;
      // Show date format (e.g., "Jan 14") when date changes
      return d.format("MMM D");
    }
    return time;
  });
}

/**
 * Format single timestamp for bar chart (legacy support)
 * @deprecated Use formatBarChartCategories for better date display
 */
export function formatBarChartTime(
  ts: number,
  _rangeStart?: number,
  _rangeEnd?: number,
): string {
  return tz(ts).format("HH:mm");
}

/**
 * Format duration to human readable format
 * Converts milliseconds to appropriate unit (μs, ms, s)
 */
export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format nanoseconds to human readable duration
 */
export function formatNanoseconds(ns: number): string {
  if (ns < 1000) return `${ns}ns`;
  if (ns < 1000000) return `${(ns / 1000).toFixed(2)}μs`;
  if (ns < 1000000000) return `${(ns / 1000000).toFixed(2)}ms`;
  return `${(ns / 1000000000).toFixed(2)}s`;
}

/**
 * Format bytes to human readable format (decimal units)
 * Supports: B, KB, MB, GB, TB, PB, EB
 * Uses consistent spacing: "1.5 GB"
 * Strips trailing zeros: "306.00 GB" -> "306 GB"
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 B";
  if (bytes < 0) return `-${formatBytes(-bytes, decimals)}`;

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  const value = bytes / Math.pow(k, i);

  // Use appropriate decimal places based on value size
  const formattedValue =
    value < 10
      ? value.toFixed(decimals)
      : value < 100
        ? value.toFixed(1)
        : value.toFixed(0);

  return `${stripTrailingZeros(formattedValue)} ${sizes[i]}`;
}

/**
 * Format bytes to Kubernetes-style binary units
 * Supports: B, Ki, Mi, Gi, Ti, Pi, Ei
 * Uses consistent spacing: "1.5 Gi"
 * Strips trailing zeros: "306.00 Gi" -> "306 Gi"
 */
export function formatBytesK8s(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 B";
  if (bytes < 0) return `-${formatBytesK8s(-bytes, decimals)}`;

  const k = 1024;
  const sizes = ["B", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  const value = bytes / Math.pow(k, i);

  // Use appropriate decimal places based on value size
  const formattedValue =
    value < 10
      ? value.toFixed(decimals)
      : value < 100
        ? value.toFixed(1)
        : value.toFixed(0);

  return `${stripTrailingZeros(formattedValue)} ${sizes[i]}`;
}

/**
 * Parse Kubernetes memory string to bytes
 * e.g., "4Gi" -> 4294967296, "512Mi" -> 536870912
 */
export function parseK8sMemory(memStr: string): number {
  const match = memStr.match(
    /^([\d.]+)\s*(Ki|Mi|Gi|Ti|Pi|Ei|K|M|G|T|P|E|B)?$/i,
  );
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "B").toLowerCase();

  const multipliers: Record<string, number> = {
    b: 1,
    ki: 1024,
    mi: 1024 ** 2,
    gi: 1024 ** 3,
    ti: 1024 ** 4,
    pi: 1024 ** 5,
    ei: 1024 ** 6,
    k: 1000,
    m: 1000 ** 2,
    g: 1000 ** 3,
    t: 1000 ** 4,
    p: 1000 ** 5,
    e: 1000 ** 6,
  };

  return value * (multipliers[unit] || 1);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Strip trailing zeros from decimal numbers
 * e.g., "306.00" -> "306", "3.50" -> "3.5", "3.05" -> "3.05"
 */
function stripTrailingZeros(value: string): string {
  if (!value.includes(".")) return value;
  return value.replace(/\.?0+$/, "");
}

/**
 * Format large numbers with K, M, B suffixes
 * Used for stat panels and dashboards
 *
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2 for values < 10, 1 for values < 100, 0 for larger)
 * @returns Formatted string like "1.5K", "2.3M", "1B"
 */
export function formatCompactNumber(num: number | string): string {
  // Handle null/undefined/NaN/Infinity
  if (num == null || (typeof num === "number" && !isFinite(num))) return "0";

  // Try to parse numeric strings
  if (typeof num === "string") {
    const parsed = parseFloat(num);
    if (!isNaN(parsed)) {
      num = parsed;
    } else {
      return num;
    }
  }

  // Handle zero
  if (num === 0) return "0";

  // Handle negative numbers
  if (num < 0) return `-${formatCompactNumber(-num)}`;

  const suffixes = ["", "K", "M", "B", "T"];
  // Clamp to 0 so fractional values (0 < num < 1) don't produce negative tier
  const tier = Math.max(0, Math.floor(Math.log10(Math.abs(num)) / 3));

  // If number is small (< 1000): integer → no decimals, decimal → up to 2 places
  if (tier === 0) {
    if (Number.isInteger(num)) return num.toString();
    return stripTrailingZeros(num.toFixed(2));
  }

  // Ensure tier doesn't exceed our suffixes
  const safeTier = Math.min(tier, suffixes.length - 1);
  const suffix = suffixes[safeTier];
  const scale = Math.pow(10, safeTier * 3);
  const scaled = num / scale;

  // Integer scaled → no decimals, otherwise up to 2
  if (Number.isInteger(scaled)) return `${scaled}${suffix}`;
  return `${stripTrailingZeros(scaled.toFixed(2))}${suffix}`;
}

/**
 * Format number with metric suffixes (K, M, G, T)
 * Used specifically for dashboard metrics and technical measurements
 *
 * @param num - Number to format
 * @returns Formatted string like "1.5K", "2.3M", "1.2G", "5T"
 */
export function formatMetricNumber(num: number | string): string {
  // Try to parse numeric strings
  if (typeof num === "string") {
    const parsed = parseFloat(num);
    if (!isNaN(parsed)) {
      num = parsed;
    } else {
      return num;
    }
  }

  // Handle zero
  if (num === 0) return "0";

  // Handle negative numbers
  if (num < 0) return `-${formatMetricNumber(-num)}`;

  const suffixes = ["", "K", "M", "G", "T"]; // Metric suffixes
  // Clamp to 0 so fractional values (0 < num < 1) don't produce negative tier
  const tier = Math.max(0, Math.floor(Math.log10(Math.abs(num)) / 3));

  // If number is small (< 1000): integer → no decimals, decimal → up to 2 places
  if (tier === 0) {
    if (Number.isInteger(num)) return num.toString();
    return stripTrailingZeros(num.toFixed(2));
  }

  // Ensure tier doesn't exceed our suffixes
  const safeTier = Math.min(tier, suffixes.length - 1);
  const suffix = suffixes[safeTier];
  const scale = Math.pow(10, safeTier * 3);
  const scaled = num / scale;

  // Integer scaled → no decimals, otherwise up to 2
  if (Number.isInteger(scaled)) return `${scaled}${suffix}`;
  return `${stripTrailingZeros(scaled.toFixed(2))}${suffix}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  if (Number.isInteger(value)) return `${value}%`;
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format timestamp to age string (e.g., "2d5h", "3h10m", "45m")
 * Used for Kubernetes resource age display
 */
export function formatAge(timestamp: number | string | Date): string {
  const ms =
    typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
  if (isNaN(ms)) return "-";
  const diff = Date.now() - ms;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d${hours}h`;
  if (hours > 0) return `${hours}h${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format timestamp to relative time string (e.g., "5m ago", "2h ago", "3d ago")
 * Used for "last seen", "updated at" displays
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Format seconds to time window string (e.g., "30s", "5m", "2h")
 * Used for alert time windows
 */
export function formatTimeWindow(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
