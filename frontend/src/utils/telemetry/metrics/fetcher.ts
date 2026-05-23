/**
 * Metrics Fetcher
 * Fetch metrics from OTEL v1 or TFO v2 endpoints
 */

import type {
  DataSourceConfig,
  TelemetryResponse,
  MetricQuery,
  MetricQueryResult,
  MetricMetadata,
  MetricSeries,
  TimeRange,
} from '../types';
import {
  fetchTelemetryData,
  createSuccessResponse,
  getEndpoint,
} from '../common/fetcher';
import { TFO_V2_ENDPOINTS } from '../constants';
import {
  generateMetricNames,
  generateMetricMetadata,
  generateMetricSeries,
  generateMockMetrics,
} from './generator';

// ============================================
// Fetch Metrics
// ============================================

export async function fetchMetrics(
  source: DataSourceConfig,
  query?: MetricQuery
): Promise<TelemetryResponse<MetricQueryResult>> {
  if (source.type === 'mock') {
    const timeRange: TimeRange = {
      start: query?.start ?? Date.now() - 3600000,
      end: query?.end ?? Date.now(),
    };

    const metrics = generateMockMetrics(10, timeRange);
    const series: MetricSeries[] = metrics.map(m => ({
      metric: m.name,
      labels: Object.fromEntries(m.labels.map(l => [l.key, l.value])),
      values: m.dataPoints,
    }));

    return createSuccessResponse<MetricQueryResult>(
      {
        status: 'success',
        data: series,
      },
      'mock'
    );
  }

  const endpoint = source.type === 'otel-v1'
    ? getEndpoint('otel-v1', 'metrics')
    : TFO_V2_ENDPOINTS.METRICS_QUERY;

  return fetchTelemetryData<MetricQueryResult>({
    source,
    endpoint,
    method: 'POST',
    body: query,
  });
}

// ============================================
// Fetch Metric Names
// ============================================

export async function fetchMetricNames(
  source: DataSourceConfig
): Promise<TelemetryResponse<string[]>> {
  if (source.type === 'mock') {
    return createSuccessResponse<string[]>(generateMetricNames(), 'mock');
  }

  return fetchTelemetryData<string[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.METRICS_LABELS,
    method: 'GET',
    params: { match: '__name__' },
  });
}

// ============================================
// Fetch Metric Labels
// ============================================

export async function fetchMetricLabels(
  source: DataSourceConfig,
  metricName: string
): Promise<TelemetryResponse<Record<string, string[]>>> {
  if (source.type === 'mock') {
    // Generate mock labels for the metric
    const mockLabels: Record<string, string[]> = {
      service: ['api-gateway', 'auth-service', 'user-service', 'order-service'],
      instance: ['instance-1', 'instance-2', 'instance-3'],
      job: ['telemetryflow'],
      namespace: ['default', 'production', 'staging'],
    };

    return createSuccessResponse<Record<string, string[]>>(mockLabels, 'mock');
  }

  return fetchTelemetryData<Record<string, string[]>>({
    source,
    endpoint: TFO_V2_ENDPOINTS.METRICS_LABELS,
    method: 'GET',
    params: { metric: metricName },
  });
}

// ============================================
// Fetch Metric Metadata
// ============================================

export async function fetchMetricMetadata(
  source: DataSourceConfig
): Promise<TelemetryResponse<MetricMetadata[]>> {
  if (source.type === 'mock') {
    return createSuccessResponse<MetricMetadata[]>(
      generateMetricMetadata(),
      'mock'
    );
  }

  return fetchTelemetryData<MetricMetadata[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.METRICS_METADATA,
    method: 'GET',
  });
}

// ============================================
// Fetch Metric Series
// ============================================

export async function fetchMetricSeries(
  source: DataSourceConfig,
  metricName: string,
  timeRange: TimeRange,
  labels?: Record<string, string>
): Promise<TelemetryResponse<MetricSeries[]>> {
  if (source.type === 'mock') {
    const series = generateMetricSeries([
      {
        name: metricName,
        type: 'gauge',
        labels: labels ?? { service: 'mock-service' },
        timeRange,
      },
    ]);

    return createSuccessResponse<MetricSeries[]>(series, 'mock');
  }

  return fetchTelemetryData<MetricSeries[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.METRICS_SERIES,
    method: 'POST',
    body: {
      metric: metricName,
      labels,
      start: timeRange.start,
      end: timeRange.end,
    },
  });
}

// ============================================
// Query Builder Helpers
// ============================================

export function buildMetricQuery(
  metricName: string,
  options?: {
    labels?: Record<string, string>;
    start?: number;
    end?: number;
    step?: number;
  }
): MetricQuery {
  const now = Date.now();

  return {
    query: metricName,
    start: options?.start ?? now - 3600000,
    end: options?.end ?? now,
    step: options?.step,
    labels: options?.labels,
  };
}

export function buildRangeQuery(
  metricName: string,
  labels: Record<string, string>,
  duration: string
): MetricQuery {
  const now = Date.now();
  const durationMs = parseDuration(duration);

  return {
    query: metricName,
    start: now - durationMs,
    end: now,
    labels,
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 3600000; // Default 1 hour

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 3600000;
  }
}
