/**
 * Memory Specific Helpers
 * Utilities for memory metrics processing
 */

import type { Metric, VMMemoryMetrics, TimeRange } from '../types';
import { createSeededRandom, generateTimeSeries, getRecommendedInterval } from '../common/generator';
import { gibToBytes, formatBytesBinary } from '../common/transformer';
import { VM_METRICS, DEFAULT_THRESHOLDS } from '../constants';

// ============================================
// Memory Utilization Helpers
// ============================================

export function getMemoryUtilization(
  hostname: string,
  timeRange: TimeRange
): Metric {
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom(hostname.length);

  return {
    name: VM_METRICS.MEMORY.UTILIZATION,
    type: 'gauge',
    unit: '1',
    description: 'Memory utilization percentage',
    labels: [{ key: 'host.name', value: hostname }],
    dataPoints: generateTimeSeries({
      start: timeRange.start,
      end: timeRange.end,
      interval,
      baseValue: random.nextFloat(50, 75),
      variance: 10,
      noise: 0.05,
    }),
  };
}

export function getMemoryUsage(
  hostname: string,
  totalGB: number,
  seed?: number
): { used: number; available: number; total: number; utilization: number } {
  const random = createSeededRandom(seed ?? hostname.length);
  const total = gibToBytes(totalGB);
  const utilization = random.nextFloat(50, 85);
  const used = total * (utilization / 100);
  const available = total - used;

  return { used, available, total, utilization };
}

// ============================================
// Memory Status Helpers
// ============================================

export function getMemoryStatus(
  utilization: number,
  thresholds = DEFAULT_THRESHOLDS.MEMORY
): 'healthy' | 'warning' | 'critical' {
  if (utilization >= thresholds.critical) return 'critical';
  if (utilization >= thresholds.warning) return 'warning';
  return 'healthy';
}

export function isMemoryPressure(
  utilization: number,
  threshold = DEFAULT_THRESHOLDS.MEMORY.warning
): boolean {
  return utilization >= threshold;
}

export function getMemoryStatusColor(utilization: number): string {
  const status = getMemoryStatus(utilization);
  switch (status) {
    case 'critical':
      return '#ff4d4f';
    case 'warning':
      return '#faad14';
    default:
      return '#52c41a';
  }
}

// ============================================
// Memory Calculation Helpers
// ============================================

export function calculateMemoryUtilization(used: number, total: number): number {
  if (total === 0) return 0;
  return (used / total) * 100;
}

export function calculateAvailableMemory(
  total: number,
  used: number,
  cached: number = 0,
  buffered: number = 0
): number {
  // Available = Free + Cached + Buffered (can be reclaimed)
  const free = total - used;
  return free + cached + buffered;
}

export function calculateEffectiveMemoryUsage(
  used: number,
  cached: number,
  buffered: number
): number {
  // Effective usage excludes cache/buffers as they can be reclaimed
  return used - cached - buffered;
}

// ============================================
// Memory Formatting Helpers
// ============================================

export function formatMemoryBytes(bytes: number): string {
  return formatBytesBinary(bytes, 2);
}

export function formatMemoryUsage(used: number, total: number): string {
  return `${formatMemoryBytes(used)} / ${formatMemoryBytes(total)}`;
}

export function formatMemoryPercent(utilization: number): string {
  return `${utilization.toFixed(1)}%`;
}

// ============================================
// Memory Metrics Summary
// ============================================

export function summarizeMemoryMetrics(memory: VMMemoryMetrics): {
  status: 'healthy' | 'warning' | 'critical';
  summary: string;
  details: string[];
} {
  const status = getMemoryStatus(memory.utilization);
  const details: string[] = [];

  details.push(`Used: ${formatMemoryBytes(memory.used)} (${memory.utilization.toFixed(1)}%)`);
  details.push(`Available: ${formatMemoryBytes(memory.available)}`);
  details.push(`Total: ${formatMemoryBytes(memory.total)}`);
  details.push(`Cached: ${formatMemoryBytes(memory.cached)}`);
  details.push(`Buffered: ${formatMemoryBytes(memory.buffered)}`);

  let summary = '';
  if (status === 'critical') {
    summary = `Memory critically high at ${memory.utilization.toFixed(1)}%`;
  } else if (status === 'warning') {
    summary = `Memory elevated at ${memory.utilization.toFixed(1)}%`;
  } else {
    summary = `Memory normal at ${memory.utilization.toFixed(1)}%`;
  }

  return { status, summary, details };
}

// ============================================
// Memory Pressure Detection
// ============================================

export function detectOOMRisk(
  used: number,
  total: number,
  growthRate: number, // bytes per second
  timeHorizon: number = 3600 // seconds to predict
): { risk: boolean; timeToOOM: number | null } {
  if (growthRate <= 0) {
    return { risk: false, timeToOOM: null };
  }

  const remaining = total - used;
  const timeToOOM = remaining / growthRate;

  return {
    risk: timeToOOM < timeHorizon,
    timeToOOM: timeToOOM > 0 ? timeToOOM : null,
  };
}

export function getSwapUsageWarning(
  swapUsed: number,
  swapTotal: number
): string | null {
  if (swapTotal === 0) return null;

  const utilization = (swapUsed / swapTotal) * 100;

  if (utilization > 80) {
    return `High swap usage: ${utilization.toFixed(1)}%`;
  }
  if (utilization > 50) {
    return `Moderate swap usage: ${utilization.toFixed(1)}%`;
  }
  return null;
}
