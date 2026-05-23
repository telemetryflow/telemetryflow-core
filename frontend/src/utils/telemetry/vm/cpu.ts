/**
 * CPU Specific Helpers
 * Utilities for CPU metrics processing
 */

import type { Metric, VMCPUMetrics, TimeRange } from '../types';
import { createSeededRandom, generateTimeSeries, getRecommendedInterval } from '../common/generator';
import { VM_METRICS, DEFAULT_THRESHOLDS } from '../constants';

// ============================================
// CPU Utilization Helpers
// ============================================

export function getCPUUtilization(
  hostname: string,
  timeRange: TimeRange
): Metric {
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom(hostname.length);

  return {
    name: VM_METRICS.CPU.UTILIZATION,
    type: 'gauge',
    unit: '1',
    description: 'CPU utilization percentage',
    labels: [{ key: 'host.name', value: hostname }],
    dataPoints: generateTimeSeries({
      start: timeRange.start,
      end: timeRange.end,
      interval,
      baseValue: random.nextFloat(20, 60),
      variance: 15,
      noise: 0.1,
    }),
  };
}

export function getCPULoadAverage(
  hostname: string,
  seed?: number
): { load1m: number; load5m: number; load15m: number } {
  const random = createSeededRandom(seed ?? hostname.length);
  const base = random.nextFloat(0.5, 4);

  return {
    load1m: base * random.nextFloat(0.9, 1.3),
    load5m: base * random.nextFloat(0.8, 1.1),
    load15m: base * random.nextFloat(0.7, 1.0),
  };
}

// ============================================
// CPU Status Helpers
// ============================================

export function getCPUStatus(
  utilization: number,
  thresholds = DEFAULT_THRESHOLDS.CPU
): 'healthy' | 'warning' | 'critical' {
  if (utilization >= thresholds.critical) return 'critical';
  if (utilization >= thresholds.warning) return 'warning';
  return 'healthy';
}

export function isCPUOverloaded(
  utilization: number,
  threshold = DEFAULT_THRESHOLDS.CPU.critical
): boolean {
  return utilization >= threshold;
}

export function getCPUStatusColor(utilization: number): string {
  const status = getCPUStatus(utilization);
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
// CPU Calculation Helpers
// ============================================

export function calculateCPUUsageFromTime(
  cpuTimeStart: number,
  cpuTimeEnd: number,
  elapsedTime: number,
  cores: number
): number {
  const cpuTimeDiff = cpuTimeEnd - cpuTimeStart;
  return (cpuTimeDiff / (elapsedTime * cores)) * 100;
}

export function calculateLoadAverageStatus(
  loadAverage: number,
  cores: number
): 'healthy' | 'warning' | 'critical' {
  const ratio = loadAverage / cores;
  if (ratio > 1.5) return 'critical';
  if (ratio > 1.0) return 'warning';
  return 'healthy';
}

export function formatLoadAverage(load: number): string {
  return load.toFixed(2);
}

// ============================================
// CPU Metrics Summary
// ============================================

export function summarizeCPUMetrics(cpu: VMCPUMetrics): {
  status: 'healthy' | 'warning' | 'critical';
  summary: string;
  details: string[];
} {
  const status = getCPUStatus(cpu.utilization);
  const details: string[] = [];

  details.push(`Utilization: ${cpu.utilization.toFixed(1)}%`);
  details.push(`User: ${cpu.user.toFixed(1)}%`);
  details.push(`System: ${cpu.system.toFixed(1)}%`);
  details.push(`I/O Wait: ${cpu.iowait.toFixed(1)}%`);
  details.push(`Load Avg: ${cpu.loadAverage.load1m.toFixed(2)} / ${cpu.loadAverage.load5m.toFixed(2)} / ${cpu.loadAverage.load15m.toFixed(2)}`);

  let summary = '';
  if (status === 'critical') {
    summary = `CPU critically high at ${cpu.utilization.toFixed(1)}%`;
  } else if (status === 'warning') {
    summary = `CPU elevated at ${cpu.utilization.toFixed(1)}%`;
  } else {
    summary = `CPU normal at ${cpu.utilization.toFixed(1)}%`;
  }

  return { status, summary, details };
}

// ============================================
// Per-Core Helpers
// ============================================

export function generatePerCoreUtilization(
  cores: number,
  avgUtilization: number,
  seed?: number
): number[] {
  const random = createSeededRandom(seed ?? cores);
  const utilizations: number[] = [];
  let remaining = avgUtilization * cores;

  for (let i = 0; i < cores - 1; i++) {
    const maxForThis = Math.min(100, remaining - (cores - i - 1) * 0);
    const minForThis = Math.max(0, remaining - (cores - i - 1) * 100);
    const value = random.nextFloat(minForThis, maxForThis);
    utilizations.push(value);
    remaining -= value;
  }

  utilizations.push(Math.max(0, Math.min(100, remaining)));

  return utilizations;
}
