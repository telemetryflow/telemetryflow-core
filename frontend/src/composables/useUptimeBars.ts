/**
 * Shared Uptime Bar Chart Composable
 *
 * Single source of truth for building uptime bar charts from ClickHouse data.
 * Used by: public.vue, StatusPageDetailPanel.vue, MonitorDetailPanel.vue
 *
 * Data sources (priority):
 *   1. HourlyUptimeStat[] from CH uptime_checks_1h  (preferred, granular)
 *   2. UptimeCheck[] from PG raw checks              (short ranges < 1h)
 *   3. Percentage-based fallback                      (no data available)
 */

import { UPTIME_COLORS } from "@/types/uptime";
import type { HourlyUptimeStat, UptimeCheck } from "@/types/uptime";

// ==================== TYPES ====================

export interface BarEntry {
  success: boolean;
  color: string;
  statusLabel: string; // "Up" | "Down" | "Issues" | "No data"
  avgResponseTime: number; // ms
  checkCount: number;
  timestamp: string; // "YYYY-MM-DD HH:mm:ss"
}

// ==================== TIME RANGE OPTIONS ====================

export const TIME_RANGE_OPTIONS = [
  { label: "Last 5 min", value: 5 * 60 * 1000 },
  { label: "Last 15 min", value: 15 * 60 * 1000 },
  { label: "Last 30 min", value: 30 * 60 * 1000 },
  { label: "Last 1 hour", value: 60 * 60 * 1000 },
  { label: "Last 3 hours", value: 3 * 60 * 60 * 1000 },
  { label: "Last 6 hours", value: 6 * 60 * 60 * 1000 },
  { label: "Last 12 hours", value: 12 * 60 * 60 * 1000 },
  { label: "Last 24 hours", value: 24 * 60 * 60 * 1000 },
  { label: "Last 2 days", value: 2 * 24 * 60 * 60 * 1000 },
  { label: "Last 7 days", value: 7 * 24 * 60 * 60 * 1000 },
  { label: "Last 14 days", value: 14 * 24 * 60 * 60 * 1000 },
  { label: "Last 30 days", value: 30 * 24 * 60 * 60 * 1000 },
  { label: "Last 90 days", value: 90 * 24 * 60 * 60 * 1000 },
];

// ==================== HELPERS ====================

function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

function noDataBar(bucketStart: Date): BarEntry {
  return {
    success: false,
    color: UPTIME_COLORS.noData,
    statusLabel: "No data",
    avgResponseTime: 0,
    checkCount: 0,
    timestamp: formatTimestamp(bucketStart),
  };
}

/**
 * Determine bar color & label from success/failure counts
 */
function resolveBarStatus(
  successCount: number,
  failureCount: number,
): { color: string; statusLabel: string; success: boolean } {
  const total = successCount + failureCount;
  if (total === 0) {
    return { color: UPTIME_COLORS.noData, statusLabel: "No data", success: false };
  }
  if (failureCount === 0) {
    return { color: UPTIME_COLORS.up, statusLabel: "Up", success: true };
  }
  if (successCount === 0) {
    return { color: UPTIME_COLORS.down, statusLabel: "Down", success: false };
  }
  // Mixed: some failures among successes → issues/degraded
  return { color: UPTIME_COLORS.issues, statusLabel: "Issues", success: false };
}

// ==================== MAIN BUILDERS ====================

/**
 * Build bars from ClickHouse hourly stats (preferred for ranges >= 1h).
 * Divides the time range into equal buckets, maps hourly data into buckets,
 * then determines worst status per bucket.
 */
export function buildBarsFromHourlyStats(
  hourlyStats: HourlyUptimeStat[],
  rangeMs: number,
  totalBars: number = 50,
): BarEntry[] {
  const now = Date.now();
  const cutoff = now - rangeMs;
  const bucketSize = rangeMs / totalBars;

  // Pre-index hourly stats by bucket
  const buckets: Array<{
    successCount: number;
    failureCount: number;
    totalResponseTime: number;
    totalChecks: number;
  }> = Array.from({ length: totalBars }, () => ({
    successCount: 0,
    failureCount: 0,
    totalResponseTime: 0,
    totalChecks: 0,
  }));

  const HOUR_MS = 3_600_000;

  for (const stat of hourlyStats) {
    const hourTs = new Date(stat.hour).getTime();
    // Each hourly stat covers [hourTs, hourTs + 1 hour) — spread across all overlapping buckets
    const clampedStart = Math.max(hourTs, cutoff);
    const clampedEnd = Math.min(hourTs + HOUR_MS, now);
    if (clampedEnd <= clampedStart) continue;

    const startIdx = Math.floor((clampedStart - cutoff) / bucketSize);
    const endIdx = Math.min(
      totalBars - 1,
      Math.floor((clampedEnd - cutoff - 1) / bucketSize),
    );

    for (let idx = startIdx; idx <= endIdx; idx++) {
      buckets[idx].successCount += stat.successCount;
      buckets[idx].failureCount += stat.failureCount;
      buckets[idx].totalResponseTime += stat.avgResponseTimeMs * stat.totalChecks;
      buckets[idx].totalChecks += stat.totalChecks;
    }
  }

  return buckets.map((bucket, i) => {
    const bucketStart = new Date(cutoff + i * bucketSize);
    if (bucket.totalChecks === 0) {
      return noDataBar(bucketStart);
    }
    const { color, statusLabel, success } = resolveBarStatus(
      bucket.successCount,
      bucket.failureCount,
    );
    return {
      success,
      color,
      statusLabel,
      avgResponseTime: Math.round(bucket.totalResponseTime / bucket.totalChecks),
      checkCount: bucket.totalChecks,
      timestamp: formatTimestamp(bucketStart),
    };
  });
}

/**
 * Build bars from raw PostgreSQL checks (for short ranges < 1h where
 * raw checks are more granular than hourly aggregations).
 */
export function buildBarsFromChecks(
  checks: UptimeCheck[],
  rangeMs: number,
  totalBars: number = 50,
): BarEntry[] {
  const now = Date.now();
  const cutoff = now - rangeMs;
  const bucketSize = rangeMs / totalBars;

  // Pre-index checks by bucket
  const buckets: Array<{
    successCount: number;
    failureCount: number;
    totalResponseTime: number;
    count: number;
  }> = Array.from({ length: totalBars }, () => ({
    successCount: 0,
    failureCount: 0,
    totalResponseTime: 0,
    count: 0,
  }));

  for (const check of checks) {
    const ts = typeof check.checkedAt === "number"
      ? check.checkedAt
      : new Date(check.checkedAt).getTime();
    if (ts < cutoff || ts > now) continue;
    const idx = Math.min(
      Math.floor((ts - cutoff) / bucketSize),
      totalBars - 1,
    );
    if (check.status === "success") {
      buckets[idx].successCount++;
    } else {
      buckets[idx].failureCount++;
    }
    buckets[idx].totalResponseTime += check.responseTime || 0;
    buckets[idx].count++;
  }

  return buckets.map((bucket, i) => {
    const bucketStart = new Date(cutoff + i * bucketSize);
    if (bucket.count === 0) {
      return noDataBar(bucketStart);
    }
    const { color, statusLabel, success } = resolveBarStatus(
      bucket.successCount,
      bucket.failureCount,
    );
    return {
      success,
      color,
      statusLabel,
      avgResponseTime: Math.round(bucket.totalResponseTime / bucket.count),
      checkCount: bucket.count,
      timestamp: formatTimestamp(bucketStart),
    };
  });
}

/**
 * Build bars from uptime percentage alone (last resort fallback).
 * When no real check data exists, all bars are gray ("No data").
 */
export function buildBarsFromPercentage(
  _uptimePercent: number,
  totalBars: number = 50,
  rangeMs: number = 24 * 60 * 60 * 1000,
): BarEntry[] {
  const now = Date.now();
  const bucketSize = rangeMs / totalBars;

  return Array.from({ length: totalBars }, (_, i) => {
    return noDataBar(new Date(now - rangeMs + i * bucketSize));
  });
}

/**
 * Two-pass fill: forward-fill + backward-fill.
 *
 * Pass 1 (left → right):  Forward-fill empty bars from last known status.
 *   Handles gaps AFTER the first data point.
 * Pass 2 (right → left):  Backward-fill remaining empty bars from the
 *   nearest future status. Handles the gap BETWEEN createdAt and the
 *   first data point (common for large ranges like 7d/30d/90d where
 *   monitoring started recently).
 *
 * Rules:
 *   - Real check data (checkCount > 0) → ALWAYS shown.
 *     CH/PG data only comes from real checks, so it's valid even when
 *     the bucket start falls before createdAt (wide-bucket alignment).
 *   - Empty bars BEFORE createdAt → gray.
 *   - Empty bars AFTER createdAt → filled from nearest known status.
 */
export function fillEmptyBars(
  bars: BarEntry[],
  _uptimePercent: number,
  createdAt?: number,
): BarEntry[] {
  if (bars.length === 0) return bars;

  // ── Pass 1: forward-fill (left → right) ──
  let lastKnown: { color: string; statusLabel: string; success: boolean } | null = null;

  const result = bars.map((bar) => {
    if (bar.checkCount > 0) {
      lastKnown = { color: bar.color, statusLabel: bar.statusLabel, success: bar.success };
    }

    // Real check data → always show
    if (bar.checkCount > 0) {
      return bar;
    }

    // Empty bar before monitor creation → gray
    if (createdAt) {
      const barTs = typeof bar.timestamp === "number" ? bar.timestamp : new Date(String(bar.timestamp).endsWith("Z") || String(bar.timestamp).includes("+") ? bar.timestamp : bar.timestamp + "Z").getTime();
      if (barTs < createdAt) {
        return {
          ...bar,
          success: false,
          color: UPTIME_COLORS.noData,
          statusLabel: "No data",
          avgResponseTime: 0,
          checkCount: 0,
        };
      }
    }

    // Empty bar after creation → forward-fill
    if (lastKnown) {
      return { ...bar, color: lastKnown.color, statusLabel: lastKnown.statusLabel, success: lastKnown.success };
    }

    // No previous status yet → stays gray (pass 2 will fix)
    return bar;
  });

  // ── Pass 2: backward-fill (right → left) ──
  // Fills the gap between createdAt and the first data bar.
  let nextKnown: { color: string; statusLabel: string; success: boolean } | null = null;

  for (let i = result.length - 1; i >= 0; i--) {
    const bar = result[i];

    // Track next known status (real data or already forward-filled)
    if (bar.color !== UPTIME_COLORS.noData) {
      nextKnown = { color: bar.color, statusLabel: bar.statusLabel, success: bar.success };
      continue;
    }

    // Before creation → keep gray
    if (createdAt) {
      const barTs = typeof bar.timestamp === "number" ? bar.timestamp : new Date(String(bar.timestamp).endsWith("Z") || String(bar.timestamp).includes("+") ? bar.timestamp : bar.timestamp + "Z").getTime();
      if (barTs < createdAt) continue;
    }

    // Empty bar after creation → backward-fill
    if (nextKnown) {
      result[i] = { ...bar, color: nextKnown.color, statusLabel: nextKnown.statusLabel, success: nextKnown.success };
    }
  }

  return result;
}

/**
 * Convert a time range in milliseconds to hours (for API calls).
 * Always adds +1 hour to cover the partial hour at the window boundary.
 * Example: "Last 1 hour" at 14:45 spans 13:45–14:45, crossing both
 * the 13:00 and 14:00 hours, so we need at least 2 hours of data.
 */
export function rangeToHours(rangeMs: number): number {
  return Math.max(2, Math.ceil(rangeMs / (60 * 60 * 1000)) + 1);
}
