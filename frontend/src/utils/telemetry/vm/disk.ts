/**
 * Disk Specific Helpers
 * Utilities for disk metrics processing
 */

import type { Metric, VMDiskMetrics, TimeRange } from '../types';
import { createSeededRandom, generateTimeSeries, getRecommendedInterval } from '../common/generator';
import { gibToBytes, formatBytesBinary, formatTransferRate } from '../common/transformer';
import { VM_METRICS, DEFAULT_THRESHOLDS } from '../constants';

// ============================================
// Disk Utilization Helpers
// ============================================

export function getDiskIOPS(
  hostname: string,
  device: string,
  timeRange: TimeRange
): { read: Metric; write: Metric } {
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom((hostname + device).length);

  return {
    read: {
      name: VM_METRICS.DISK.OPERATIONS_READ,
      type: 'counter',
      unit: '1',
      description: 'Disk read operations',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'device', value: device },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(100, 5000),
        variance: 1000,
        trend: 'up',
      }),
    },
    write: {
      name: VM_METRICS.DISK.OPERATIONS_WRITE,
      type: 'counter',
      unit: '1',
      description: 'Disk write operations',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'device', value: device },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(50, 3000),
        variance: 500,
        trend: 'up',
      }),
    },
  };
}

export function getDiskUsage(
  hostname: string,
  mountpoint: string,
  totalGB: number = 100,
  seed?: number
): { used: number; available: number; total: number; utilization: number } {
  const random = createSeededRandom(seed ?? (hostname + mountpoint).length);
  const total = gibToBytes(totalGB);
  const utilization = random.nextFloat(40, 80);
  const used = total * (utilization / 100);
  const available = total - used;

  return { used, available, total, utilization };
}

// ============================================
// Disk Status Helpers
// ============================================

export function getDiskStatus(
  utilization: number,
  thresholds = DEFAULT_THRESHOLDS.DISK
): 'healthy' | 'warning' | 'critical' {
  if (utilization >= thresholds.critical) return 'critical';
  if (utilization >= thresholds.warning) return 'warning';
  return 'healthy';
}

export function isDiskFull(
  utilization: number,
  threshold = DEFAULT_THRESHOLDS.DISK.critical
): boolean {
  return utilization >= threshold;
}

export function getDiskStatusColor(utilization: number): string {
  const status = getDiskStatus(utilization);
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
// Disk Calculation Helpers
// ============================================

export function calculateDiskUtilization(used: number, total: number): number {
  if (total === 0) return 0;
  return (used / total) * 100;
}

export function calculateIOPS(
  operations: number,
  timeSeconds: number
): number {
  if (timeSeconds === 0) return 0;
  return operations / timeSeconds;
}

export function calculateThroughput(
  bytes: number,
  timeSeconds: number
): number {
  if (timeSeconds === 0) return 0;
  return bytes / timeSeconds;
}

export function calculateIOWait(
  ioTime: number,
  totalTime: number
): number {
  if (totalTime === 0) return 0;
  return (ioTime / totalTime) * 100;
}

// ============================================
// Disk Formatting Helpers
// ============================================

export function formatDiskBytes(bytes: number): string {
  return formatBytesBinary(bytes, 2);
}

export function formatDiskUsage(used: number, total: number): string {
  return `${formatDiskBytes(used)} / ${formatDiskBytes(total)}`;
}

export function formatIOPS(iops: number): string {
  if (iops >= 1000000) {
    return `${(iops / 1000000).toFixed(2)}M IOPS`;
  }
  if (iops >= 1000) {
    return `${(iops / 1000).toFixed(2)}K IOPS`;
  }
  return `${iops.toFixed(0)} IOPS`;
}

export function formatThroughput(bytesPerSec: number): string {
  return formatTransferRate(bytesPerSec, true);
}

// ============================================
// Disk Metrics Summary
// ============================================

export function summarizeDiskMetrics(disk: VMDiskMetrics): {
  status: 'healthy' | 'warning' | 'critical';
  summary: string;
  details: string[];
} {
  const status = getDiskStatus(disk.utilization);
  const details: string[] = [];

  details.push(`Device: ${disk.device}`);
  details.push(`Mount: ${disk.mountpoint}`);
  details.push(`Used: ${formatDiskBytes(disk.used)} (${disk.utilization.toFixed(1)}%)`);
  details.push(`Available: ${formatDiskBytes(disk.available)}`);
  details.push(`Total: ${formatDiskBytes(disk.total)}`);
  details.push(`IOPS: ${formatIOPS(disk.iops.read)} R / ${formatIOPS(disk.iops.write)} W`);

  let summary = '';
  if (status === 'critical') {
    summary = `${disk.mountpoint} critically full at ${disk.utilization.toFixed(1)}%`;
  } else if (status === 'warning') {
    summary = `${disk.mountpoint} getting full at ${disk.utilization.toFixed(1)}%`;
  } else {
    summary = `${disk.mountpoint} healthy at ${disk.utilization.toFixed(1)}%`;
  }

  return { status, summary, details };
}

// ============================================
// Disk Prediction Helpers
// ============================================

export function predictDiskFull(
  used: number,
  total: number,
  growthRate: number, // bytes per day
  days: number = 30
): { daysUntilFull: number | null; projectedUsage: number } {
  if (growthRate <= 0) {
    return { daysUntilFull: null, projectedUsage: used };
  }

  const available = total - used;
  const daysUntilFull = available / growthRate;
  const projectedUsage = Math.min(total, used + growthRate * days);

  return { daysUntilFull, projectedUsage };
}

export function getFilesystemHealthCheck(disk: VMDiskMetrics): string[] {
  const issues: string[] = [];

  if (disk.utilization >= 90) {
    issues.push('Critical: Disk space nearly exhausted');
  } else if (disk.utilization >= 75) {
    issues.push('Warning: Disk space running low');
  }

  if (disk.iops.read > 10000 || disk.iops.write > 10000) {
    issues.push('Warning: High IOPS detected');
  }

  return issues;
}
