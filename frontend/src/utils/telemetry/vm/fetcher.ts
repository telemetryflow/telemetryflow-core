/**
 * VM Metrics Fetcher
 * Fetch VM/infrastructure metrics from TFO v2 endpoints
 */

import type {
  DataSourceConfig,
  TelemetryResponse,
  VMMetricsBundle,
  VMInfo,
  Metric,
  TimeRange,
} from '../types';
import {
  fetchTelemetryData,
  createSuccessResponse,
} from '../common/fetcher';
import { TFO_V2_ENDPOINTS } from '../constants';
import {
  generateVMMetrics,
  generateVMList,
  generateAllVMMetrics,
} from './generator';

// ============================================
// Fetch VM Metrics Bundle
// ============================================

export async function fetchVMMetrics(
  source: DataSourceConfig,
  hostname: string,
  timeRange: TimeRange
): Promise<TelemetryResponse<VMMetricsBundle>> {
  if (source.type === 'mock') {
    const metrics = generateVMMetrics({
      hostname,
      timeRange,
    });

    return createSuccessResponse<VMMetricsBundle>(metrics, 'mock');
  }

  return fetchTelemetryData<VMMetricsBundle>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.INFRASTRUCTURE_METRICS}/${hostname}`,
    method: 'GET',
    timeRange,
  });
}

// ============================================
// Fetch VM List
// ============================================

export async function fetchVMList(
  source: DataSourceConfig
): Promise<TelemetryResponse<VMInfo[]>> {
  if (source.type === 'mock') {
    const vms = generateVMList(10);
    return createSuccessResponse<VMInfo[]>(vms, 'mock');
  }

  return fetchTelemetryData<VMInfo[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.INFRASTRUCTURE_VMS,
    method: 'GET',
  });
}

// ============================================
// Fetch Single VM Info
// ============================================

export async function fetchVMInfo(
  source: DataSourceConfig,
  vmId: string
): Promise<TelemetryResponse<VMInfo>> {
  if (source.type === 'mock') {
    const vms = generateVMList(1);
    return createSuccessResponse<VMInfo>(vms[0], 'mock');
  }

  return fetchTelemetryData<VMInfo>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.INFRASTRUCTURE_VMS}/${vmId}`,
    method: 'GET',
  });
}

// ============================================
// Fetch All VM Metrics (Time Series)
// ============================================

export async function fetchVMMetricsSeries(
  source: DataSourceConfig,
  hostname: string,
  timeRange: TimeRange
): Promise<TelemetryResponse<Metric[]>> {
  if (source.type === 'mock') {
    const metrics = generateAllVMMetrics({
      hostname,
      timeRange,
    });

    return createSuccessResponse<Metric[]>(metrics, 'mock');
  }

  return fetchTelemetryData<Metric[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.INFRASTRUCTURE_METRICS,
    method: 'POST',
    body: {
      hostname,
      start: timeRange.start,
      end: timeRange.end,
    },
  });
}

// ============================================
// Fetch CPU Metrics
// ============================================

export async function fetchCPUMetrics(
  source: DataSourceConfig,
  hostname: string,
  timeRange: TimeRange
): Promise<TelemetryResponse<{
  utilization: number;
  loadAverage: { load1m: number; load5m: number; load15m: number };
}>> {
  if (source.type === 'mock') {
    const metrics = generateVMMetrics({ hostname, timeRange });

    return createSuccessResponse(
      {
        utilization: metrics.cpu.utilization,
        loadAverage: metrics.cpu.loadAverage,
      },
      'mock'
    );
  }

  return fetchTelemetryData({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.INFRASTRUCTURE_METRICS}/${hostname}/cpu`,
    method: 'GET',
    timeRange,
  });
}

// ============================================
// Fetch Memory Metrics
// ============================================

export async function fetchMemoryMetrics(
  source: DataSourceConfig,
  hostname: string,
  timeRange: TimeRange
): Promise<TelemetryResponse<{
  utilization: number;
  used: number;
  available: number;
  total: number;
}>> {
  if (source.type === 'mock') {
    const metrics = generateVMMetrics({ hostname, timeRange });

    return createSuccessResponse(
      {
        utilization: metrics.memory.utilization,
        used: metrics.memory.used,
        available: metrics.memory.available,
        total: metrics.memory.total,
      },
      'mock'
    );
  }

  return fetchTelemetryData({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.INFRASTRUCTURE_METRICS}/${hostname}/memory`,
    method: 'GET',
    timeRange,
  });
}

// ============================================
// Fetch Disk Metrics
// ============================================

export async function fetchDiskMetrics(
  source: DataSourceConfig,
  hostname: string,
  timeRange: TimeRange
): Promise<TelemetryResponse<{
  devices: Array<{
    device: string;
    mountpoint: string;
    utilization: number;
    used: number;
    total: number;
  }>;
}>> {
  if (source.type === 'mock') {
    const metrics = generateVMMetrics({ hostname, timeRange });

    return createSuccessResponse(
      {
        devices: metrics.disk.map(d => ({
          device: d.device,
          mountpoint: d.mountpoint,
          utilization: d.utilization,
          used: d.used,
          total: d.total,
        })),
      },
      'mock'
    );
  }

  return fetchTelemetryData({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.INFRASTRUCTURE_METRICS}/${hostname}/disk`,
    method: 'GET',
    timeRange,
  });
}

// ============================================
// Fetch Network Metrics
// ============================================

export async function fetchNetworkMetrics(
  source: DataSourceConfig,
  hostname: string,
  timeRange: TimeRange
): Promise<TelemetryResponse<{
  interfaces: Array<{
    name: string;
    bytesReceived: number;
    bytesTransmitted: number;
    errorsReceive: number;
    errorsTransmit: number;
  }>;
}>> {
  if (source.type === 'mock') {
    const metrics = generateVMMetrics({ hostname, timeRange });

    return createSuccessResponse(
      {
        interfaces: metrics.network.map(n => ({
          name: n.interface,
          bytesReceived: n.bytesReceived,
          bytesTransmitted: n.bytesTransmitted,
          errorsReceive: n.errorsReceive,
          errorsTransmit: n.errorsTransmit,
        })),
      },
      'mock'
    );
  }

  return fetchTelemetryData({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.INFRASTRUCTURE_METRICS}/${hostname}/network`,
    method: 'GET',
    timeRange,
  });
}

// ============================================
// Aggregate Infrastructure Metrics
// ============================================

export async function fetchInfrastructureOverview(
  source: DataSourceConfig
): Promise<TelemetryResponse<{
  totalVMs: number;
  runningVMs: number;
  stoppedVMs: number;
  avgCPU: number;
  avgMemory: number;
  totalAlerts: number;
}>> {
  if (source.type === 'mock') {
    const vms = generateVMList(10);
    const runningVMs = vms.filter(vm => vm.status === 'running').length;

    return createSuccessResponse(
      {
        totalVMs: vms.length,
        runningVMs,
        stoppedVMs: vms.length - runningVMs,
        avgCPU: Math.random() * 50 + 20,
        avgMemory: Math.random() * 40 + 40,
        totalAlerts: Math.floor(Math.random() * 5),
      },
      'mock'
    );
  }

  return fetchTelemetryData({
    source,
    endpoint: TFO_V2_ENDPOINTS.INFRASTRUCTURE,
    method: 'GET',
  });
}
