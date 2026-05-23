/**
 * Traces Fetcher
 * Fetch traces from OTEL v1 or TFO v2 endpoints
 */

import type {
  DataSourceConfig,
  TelemetryResponse,
  TraceQuery,
  TraceQueryResult,
  Trace,
  ServiceDependency,
  TraceLatencyStats,
  TimeRange,
} from '../types';
import {
  fetchTelemetryData,
  createSuccessResponse,
  getEndpoint,
} from '../common/fetcher';
import { TFO_V2_ENDPOINTS, MOCK_SERVICES, MOCK_OPERATIONS } from '../constants';
import {
  generateMockTraces,
  generateServiceMap,
  generateLatencyStatsForServices,
  buildTraceQuery,
} from './generator';

// ============================================
// Fetch Traces
// ============================================

export async function fetchTraces(
  source: DataSourceConfig,
  query?: TraceQuery
): Promise<TelemetryResponse<TraceQueryResult>> {
  if (source.type === 'mock') {
    const timeRange: TimeRange = {
      start: query?.start ?? Date.now() - 3600000,
      end: query?.end ?? Date.now(),
    };

    let traces = generateMockTraces(query?.limit ?? 20, timeRange);

    // Apply filters
    if (query?.service) {
      traces = traces.filter(t => t.rootSpan.serviceName === query.service);
    }

    if (query?.operation) {
      traces = traces.filter(t => t.rootSpan.name === query.operation);
    }

    if (query?.minDuration) {
      traces = traces.filter(t => t.duration >= query.minDuration!);
    }

    if (query?.maxDuration) {
      traces = traces.filter(t => t.duration <= query.maxDuration!);
    }

    return createSuccessResponse<TraceQueryResult>(
      {
        status: 'success',
        data: traces,
        total: traces.length,
      },
      'mock'
    );
  }

  const endpoint = source.type === 'otel-v1'
    ? getEndpoint('otel-v1', 'traces')
    : TFO_V2_ENDPOINTS.TRACES_QUERY;

  return fetchTelemetryData<TraceQueryResult>({
    source,
    endpoint,
    method: 'POST',
    body: query,
  });
}

// ============================================
// Fetch Single Trace
// ============================================

export async function fetchTraceById(
  source: DataSourceConfig,
  traceId: string
): Promise<TelemetryResponse<Trace>> {
  if (source.type === 'mock') {
    const traces = generateMockTraces(1);
    // Override the traceId to match the requested one
    const trace = traces[0];
    trace.traceId = traceId;
    trace.rootSpan.traceId = traceId;
    trace.spans.forEach(s => (s.traceId = traceId));

    return createSuccessResponse<Trace>(trace, 'mock');
  }

  return fetchTelemetryData<Trace>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.TRACES}/${traceId}`,
    method: 'GET',
  });
}

// ============================================
// Fetch Services
// ============================================

export async function fetchServices(
  source: DataSourceConfig
): Promise<TelemetryResponse<string[]>> {
  if (source.type === 'mock') {
    return createSuccessResponse<string[]>([...MOCK_SERVICES], 'mock');
  }

  return fetchTelemetryData<string[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.TRACES_SERVICES,
    method: 'GET',
  });
}

// ============================================
// Fetch Operations
// ============================================

export async function fetchOperations(
  source: DataSourceConfig,
  service: string
): Promise<TelemetryResponse<string[]>> {
  if (source.type === 'mock') {
    // Return a subset of operations relevant to the service
    const random = [...service].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const opCount = (random % 5) + 3;
    const operations = MOCK_OPERATIONS.slice(0, opCount);
    return createSuccessResponse<string[]>([...operations], 'mock');
  }

  return fetchTelemetryData<string[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.TRACES_OPERATIONS,
    method: 'GET',
    params: { service },
  });
}

// ============================================
// Fetch Dependencies
// ============================================

export async function fetchDependencies(
  source: DataSourceConfig,
  timeRange?: TimeRange
): Promise<TelemetryResponse<ServiceDependency[]>> {
  if (source.type === 'mock') {
    const dependencies = generateServiceMap([...MOCK_SERVICES]);
    return createSuccessResponse<ServiceDependency[]>(dependencies, 'mock');
  }

  return fetchTelemetryData<ServiceDependency[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.TRACES_DEPENDENCIES,
    method: 'GET',
    timeRange,
  });
}

// ============================================
// Fetch Latency Stats
// ============================================

export async function fetchLatencyStats(
  source: DataSourceConfig,
  service?: string,
  operation?: string,
  timeRange?: TimeRange
): Promise<TelemetryResponse<TraceLatencyStats[]>> {
  if (source.type === 'mock') {
    const services = service ? [service] : [...MOCK_SERVICES].slice(0, 5);
    let stats = generateLatencyStatsForServices(services);

    if (operation) {
      stats = stats.filter(s => s.operation === operation);
    }

    return createSuccessResponse<TraceLatencyStats[]>(stats, 'mock');
  }

  return fetchTelemetryData<TraceLatencyStats[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.TRACES_LATENCY,
    method: 'GET',
    params: { service, operation },
    timeRange,
  });
}

// ============================================
// Fetch Service Metrics
// ============================================

export async function fetchServiceMetrics(
  source: DataSourceConfig,
  service: string,
  timeRange: TimeRange
): Promise<TelemetryResponse<{
  requestRate: number;
  errorRate: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}>> {
  if (source.type === 'mock') {
    const stats = generateLatencyStatsForServices([service]);
    const combined = stats.reduce(
      (acc, s) => ({
        requests: acc.requests + s.requests,
        errors: acc.errors + s.errors,
        avgLatency: acc.avgLatency + s.p50,
        p95Latency: Math.max(acc.p95Latency, s.p95),
        p99Latency: Math.max(acc.p99Latency, s.p99),
      }),
      { requests: 0, errors: 0, avgLatency: 0, p95Latency: 0, p99Latency: 0 }
    );

    const durationHours = (timeRange.end - timeRange.start) / 3600000;

    return createSuccessResponse(
      {
        requestRate: combined.requests / durationHours,
        errorRate: combined.requests > 0 ? (combined.errors / combined.requests) * 100 : 0,
        avgLatency: combined.avgLatency / stats.length,
        p95Latency: combined.p95Latency,
        p99Latency: combined.p99Latency,
      },
      'mock'
    );
  }

  return fetchTelemetryData({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.TRACES_SERVICES}/${service}/metrics`,
    method: 'GET',
    timeRange,
  });
}

// ============================================
// Query Helper
// ============================================

export { buildTraceQuery };
