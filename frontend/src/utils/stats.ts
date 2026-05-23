/**
 * Statistics and trend calculation utilities
 */

/**
 * Calculate trend percentage comparing current count to previous period
 * For mock data, generates deterministic but varied trends based on current value
 *
 * @param currentCount - Current period count
 * @param previousCount - Previous period count (optional, will simulate if not provided)
 * @param seed - Optional seed for deterministic mock trend generation
 * @returns Trend percentage (positive = increase, negative = decrease)
 */
export function calculateTrend(
  currentCount: number,
  previousCount?: number,
  seed?: number,
): number {
  // If previous count is provided, calculate actual trend
  if (previousCount !== undefined) {
    if (previousCount <= 0) {
      // Can't divide by zero — show +100% if current has data, 0% otherwise
      return currentCount > 0 ? 100 : 0;
    }
    const change = ((currentCount - previousCount) / previousCount) * 100;
    // Avoid -0 (negative zero) — normalize to 0
    const rounded = Math.round(change);
    return rounded === 0 ? 0 : rounded;
  }

  // For mock data, generate deterministic trend based on current count and seed
  if (currentCount === 0) return 0;

  // Use seed or current count to generate a deterministic but varied trend
  const hashBase = seed ?? currentCount;
  const hash = Math.abs(Math.sin(hashBase * 12.9898) * 43758.5453) % 1;

  // Generate trend between -20% and +30%
  const trend = Math.round(hash * 50 - 20);
  return trend;
}

/**
 * Calculate time range for previous period (for trend comparison)
 *
 * @param start - Current period start timestamp
 * @param end - Current period end timestamp
 * @returns Object with previousStart and previousEnd timestamps
 */
export function getPreviousPeriod(
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
 * Generate stats with trends for a data array
 * Useful for computing multiple stats at once
 *
 * @param items - Array of items to compute stats from
 * @param getters - Object with getter functions for each stat
 * @returns Object with computed values and trends
 */
export function computeStatsWithTrends<T>(
  items: T[],
  getters: Record<string, (items: T[]) => number>,
): Record<string, { value: number; trend: number }> {
  const result: Record<string, { value: number; trend: number }> = {};
  let seedOffset = 0;

  for (const [key, getter] of Object.entries(getters)) {
    const value = getter(items);
    // Use key hash + offset for varied but deterministic trends
    const keyHash = key
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    result[key] = {
      value,
      trend: calculateTrend(
        value,
        undefined,
        keyHash + seedOffset + items.length,
      ),
    };
    seedOffset += 17; // Prime number offset for variety
  }

  return result;
}

/**
 * Format a trend value for display
 *
 * @param trend - Trend percentage
 * @returns Formatted string like "+12%" or "-5%"
 */
export function formatTrend(trend: number): string {
  if (trend > 0) return `+${trend}%`;
  if (trend < 0) return `${trend}%`;
  return "0%";
}

/**
 * Get trend type for styling
 *
 * @param trend - Trend percentage
 * @param invertPositive - If true, positive trend is bad (e.g., error rate)
 * @returns 'up' | 'down' | 'neutral'
 */
export function getTrendType(
  trend: number,
  invertPositive = false,
): "up" | "down" | "neutral" {
  if (trend === 0) return "neutral";
  if (invertPositive) {
    return trend > 0 ? "down" : "up"; // Inverted: positive is bad
  }
  return trend > 0 ? "up" : "down";
}

/**
 * Get trend direction string
 * Commonly used for StatPanel component's trend prop
 *
 * @param trend - Trend percentage
 * @returns 'up' | 'down' | 'stable'
 */
export function getTrendDirection(trend: number): "up" | "down" | "stable" {
  if (trend > 0) return "up";
  if (trend < 0) return "down";
  return "stable";
}

/**
 * Format trend value with +/- prefix
 * Alias for formatTrend, commonly used in views
 *
 * @param trend - Trend percentage
 * @returns Formatted string like "+12%", "-5%", or "0%"
 */
export function formatTrendValue(trend: number): string {
  return formatTrend(trend);
}

/**
 * Format time range duration as a short suffix for StatCard titles
 * e.g., "(1h)", "(5m)", "(7d)"
 *
 * @param start - Start timestamp in milliseconds
 * @param end - End timestamp in milliseconds
 * @returns Formatted string like "(1h)", "(30m)", "(7d)"
 */
export function formatTimeRangeSuffix(start: number, end: number): string {
  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(durationMs / 3600000);
  const days = Math.floor(durationMs / 86400000);

  // Check in order: days -> hours -> minutes
  if (days >= 1) {
    return `(${days}d)`;
  }
  if (hours >= 1) {
    return `(${hours}h)`;
  }
  return `(${minutes}m)`;
}

/**
 * Get time range label for display
 * e.g., "Last 1 Hour", "Last 30 Minutes", "Last 7 Days"
 *
 * @param start - Start timestamp in milliseconds
 * @param end - End timestamp in milliseconds
 * @returns Human readable time range label
 */
export function getTimeRangeLabel(start: number, end: number): string {
  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(durationMs / 3600000);
  const days = Math.floor(durationMs / 86400000);

  // Check in order: days -> hours -> minutes
  if (days >= 1) {
    return `Last ${days} Day${days > 1 ? "s" : ""}`;
  }
  if (hours >= 1) {
    return `Last ${hours} Hour${hours > 1 ? "s" : ""}`;
  }
  return `Last ${minutes} Minute${minutes > 1 ? "s" : ""}`;
}
