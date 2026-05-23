/**
 * Network Specific Helpers
 * Utilities for network metrics processing
 */

import type { Metric, VMNetworkMetrics, TimeRange } from '../types';
import { createSeededRandom, generateTimeSeries, getRecommendedInterval } from '../common/generator';
import {
  formatBandwidth as formatBandwidthUtil,
  formatBytesBinary,
} from '../common/transformer';
import { VM_METRICS } from '../constants';

// ============================================
// Network Throughput Helpers
// ============================================

export function getNetworkThroughput(
  hostname: string,
  iface: string,
  timeRange: TimeRange
): { rx: Metric; tx: Metric } {
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom((hostname + iface).length);

  return {
    rx: {
      name: VM_METRICS.NETWORK.IO_RECEIVE,
      type: 'counter',
      unit: 'By',
      description: 'Network bytes received',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'interface', value: iface },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(10000000, 100000000),
        variance: 20000000,
        trend: 'up',
      }),
    },
    tx: {
      name: VM_METRICS.NETWORK.IO_TRANSMIT,
      type: 'counter',
      unit: 'By',
      description: 'Network bytes transmitted',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'interface', value: iface },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(5000000, 50000000),
        variance: 10000000,
        trend: 'up',
      }),
    },
  };
}

export function getNetworkErrors(
  hostname: string,
  iface: string,
  timeRange: TimeRange
): { rxErrors: Metric; txErrors: Metric } {
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom((hostname + iface).length);

  return {
    rxErrors: {
      name: VM_METRICS.NETWORK.ERRORS_RECEIVE,
      type: 'counter',
      unit: '1',
      description: 'Network receive errors',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'interface', value: iface },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(0, 10),
        variance: 5,
        trend: 'stable',
      }),
    },
    txErrors: {
      name: VM_METRICS.NETWORK.ERRORS_TRANSMIT,
      type: 'counter',
      unit: '1',
      description: 'Network transmit errors',
      labels: [
        { key: 'host.name', value: hostname },
        { key: 'interface', value: iface },
      ],
      dataPoints: generateTimeSeries({
        start: timeRange.start,
        end: timeRange.end,
        interval,
        baseValue: random.nextFloat(0, 5),
        variance: 3,
        trend: 'stable',
      }),
    },
  };
}

// ============================================
// Network Status Helpers
// ============================================

export function getNetworkStatus(
  errorRate: number,
  thresholds = { warning: 0.1, critical: 1 }
): 'healthy' | 'warning' | 'critical' {
  if (errorRate >= thresholds.critical) return 'critical';
  if (errorRate >= thresholds.warning) return 'warning';
  return 'healthy';
}

export function hasNetworkIssues(metrics: VMNetworkMetrics): boolean {
  const totalErrors = metrics.errorsReceive + metrics.errorsTransmit;
  const totalPackets = metrics.packetsReceived + metrics.packetsTransmitted;

  if (totalPackets === 0) return false;

  const errorRate = (totalErrors / totalPackets) * 100;
  return errorRate > 0.1;
}

export function getNetworkStatusColor(errorRate: number): string {
  const status = getNetworkStatus(errorRate);
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
// Network Calculation Helpers
// ============================================

export function calculateBandwidth(
  bytesStart: number,
  bytesEnd: number,
  timeSeconds: number
): number {
  if (timeSeconds === 0) return 0;
  return (bytesEnd - bytesStart) / timeSeconds;
}

export function calculateErrorRate(
  errors: number,
  packets: number
): number {
  if (packets === 0) return 0;
  return (errors / packets) * 100;
}

export function calculatePacketLoss(
  sent: number,
  received: number
): number {
  if (sent === 0) return 0;
  return ((sent - received) / sent) * 100;
}

export function calculateUtilization(
  currentBandwidth: number,
  maxBandwidth: number
): number {
  if (maxBandwidth === 0) return 0;
  return (currentBandwidth / maxBandwidth) * 100;
}

// ============================================
// Network Formatting Helpers
// ============================================

export function formatNetworkBandwidth(bytesPerSec: number): string {
  // Convert bytes/sec to bits/sec for bandwidth display
  return formatBandwidthUtil(bytesPerSec * 8);
}

export function formatBytes(bytes: number): string {
  return formatBytesBinary(bytes, 2);
}

export function formatPackets(packets: number): string {
  if (packets >= 1000000000) {
    return `${(packets / 1000000000).toFixed(2)}B`;
  }
  if (packets >= 1000000) {
    return `${(packets / 1000000).toFixed(2)}M`;
  }
  if (packets >= 1000) {
    return `${(packets / 1000).toFixed(2)}K`;
  }
  return `${packets}`;
}

// ============================================
// Network Metrics Summary
// ============================================

export function summarizeNetworkMetrics(network: VMNetworkMetrics): {
  status: 'healthy' | 'warning' | 'critical';
  summary: string;
  details: string[];
} {
  const totalPackets = network.packetsReceived + network.packetsTransmitted;
  const totalErrors = network.errorsReceive + network.errorsTransmit;
  const errorRate = totalPackets > 0 ? (totalErrors / totalPackets) * 100 : 0;

  const status = getNetworkStatus(errorRate);
  const details: string[] = [];

  details.push(`Interface: ${network.interface}`);
  details.push(`RX: ${formatBytes(network.bytesReceived)} (${formatPackets(network.packetsReceived)} pkts)`);
  details.push(`TX: ${formatBytes(network.bytesTransmitted)} (${formatPackets(network.packetsTransmitted)} pkts)`);
  details.push(`Errors: ${network.errorsReceive} RX / ${network.errorsTransmit} TX`);
  details.push(`Drops: ${network.dropsReceive} RX / ${network.dropsTransmit} TX`);

  let summary = '';
  if (status === 'critical') {
    summary = `${network.interface} has high error rate (${errorRate.toFixed(2)}%)`;
  } else if (status === 'warning') {
    summary = `${network.interface} has elevated errors (${errorRate.toFixed(2)}%)`;
  } else {
    summary = `${network.interface} healthy`;
  }

  return { status, summary, details };
}

// ============================================
// Network Anomaly Detection
// ============================================

export function detectNetworkAnomalies(
  current: VMNetworkMetrics,
  baseline: VMNetworkMetrics
): string[] {
  const anomalies: string[] = [];

  // Check for significant traffic increase
  const rxIncrease = ((current.bytesReceived - baseline.bytesReceived) / baseline.bytesReceived) * 100;
  const txIncrease = ((current.bytesTransmitted - baseline.bytesTransmitted) / baseline.bytesTransmitted) * 100;

  if (rxIncrease > 200) {
    anomalies.push(`Unusual spike in received traffic: +${rxIncrease.toFixed(0)}%`);
  }
  if (txIncrease > 200) {
    anomalies.push(`Unusual spike in transmitted traffic: +${txIncrease.toFixed(0)}%`);
  }

  // Check for error rate increase
  const currentErrorRate = calculateErrorRate(
    current.errorsReceive + current.errorsTransmit,
    current.packetsReceived + current.packetsTransmitted
  );
  const baselineErrorRate = calculateErrorRate(
    baseline.errorsReceive + baseline.errorsTransmit,
    baseline.packetsReceived + baseline.packetsTransmitted
  );

  if (currentErrorRate > baselineErrorRate * 10 && currentErrorRate > 0.1) {
    anomalies.push(`Error rate increased significantly: ${currentErrorRate.toFixed(2)}%`);
  }

  return anomalies;
}
