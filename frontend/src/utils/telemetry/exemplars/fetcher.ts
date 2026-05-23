/**
 * Exemplars Fetcher
 * Fetch exemplars from TFO v2 endpoints
 */

import type {
  DataSourceConfig,
  TelemetryResponse,
  ExemplarQuery,
  ExemplarQueryResult,
  Exemplar,
  ExemplarCorrelation,
  TimeRange,
} from '../types';
import {
  fetchTelemetryData,
  createSuccessResponse,
} from '../common/fetcher';
import { TFO_V2_ENDPOINTS } from '../constants';
import {
  generateMockExemplars,
  generateExemplarCorrelations,
} from './generator';

// ============================================
// Fetch Exemplars
// ============================================

export async function fetchExemplars(
  source: DataSourceConfig,
  query?: ExemplarQuery
): Promise<TelemetryResponse<ExemplarQueryResult>> {
  if (source.type === 'mock') {
    const timeRange: TimeRange = {
      start: query?.start ?? Date.now() - 3600000,
      end: query?.end ?? Date.now(),
    };

    let exemplars = generateMockExemplars(query?.limit ?? 50, timeRange);

    // Apply filters
    if (query?.metricName) {
      exemplars = exemplars.filter(e => e.metricName === query.metricName);
    }

    if (query?.traceId) {
      exemplars = exemplars.filter(e => e.traceId === query.traceId);
    }

    return createSuccessResponse<ExemplarQueryResult>(
      {
        status: 'success',
        data: exemplars,
      },
      'mock'
    );
  }

  // OTEL v1 doesn't support exemplars directly, so we use TFO v2
  return fetchTelemetryData<ExemplarQueryResult>({
    source,
    endpoint: TFO_V2_ENDPOINTS.EXEMPLARS_QUERY,
    method: 'POST',
    body: query,
  });
}

// ============================================
// Fetch Exemplars by Metric
// ============================================

export async function fetchExemplarsByMetric(
  source: DataSourceConfig,
  metricName: string,
  timeRange: TimeRange,
  labels?: Record<string, string>
): Promise<TelemetryResponse<Exemplar[]>> {
  if (source.type === 'mock') {
    let exemplars = generateMockExemplars(20, timeRange)
      .filter(e => e.metricName === metricName);

    if (labels) {
      exemplars = exemplars.filter(e =>
        Object.entries(labels).every(([k, v]) => e.labels[k] === v)
      );
    }

    return createSuccessResponse<Exemplar[]>(exemplars, 'mock');
  }

  return fetchTelemetryData<Exemplar[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.EXEMPLARS_QUERY,
    method: 'POST',
    body: {
      metricName,
      labels,
      start: timeRange.start,
      end: timeRange.end,
    },
  });
}

// ============================================
// Fetch Exemplars by Trace
// ============================================

export async function fetchExemplarsByTrace(
  source: DataSourceConfig,
  traceId: string
): Promise<TelemetryResponse<Exemplar[]>> {
  if (source.type === 'mock') {
    const exemplars = generateMockExemplars(5)
      .map(e => ({ ...e, traceId }));

    return createSuccessResponse<Exemplar[]>(exemplars, 'mock');
  }

  return fetchTelemetryData<Exemplar[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.EXEMPLARS_QUERY,
    method: 'GET',
    params: { traceId },
  });
}

// ============================================
// Fetch Exemplar Correlations
// ============================================

export async function fetchExemplarCorrelations(
  source: DataSourceConfig,
  query: ExemplarQuery
): Promise<TelemetryResponse<ExemplarCorrelation[]>> {
  if (source.type === 'mock') {
    const timeRange: TimeRange = {
      start: query.start,
      end: query.end,
    };

    const exemplars = generateMockExemplars(query.limit ?? 20, timeRange);
    const correlations = generateExemplarCorrelations(exemplars);

    return createSuccessResponse<ExemplarCorrelation[]>(correlations, 'mock');
  }

  return fetchTelemetryData<ExemplarCorrelation[]>({
    source,
    endpoint: `${TFO_V2_ENDPOINTS.EXEMPLARS}/correlations`,
    method: 'POST',
    body: query,
  });
}

// ============================================
// Fetch High Value Exemplars
// ============================================

export async function fetchHighValueExemplars(
  source: DataSourceConfig,
  metricName: string,
  threshold: number,
  timeRange: TimeRange
): Promise<TelemetryResponse<Exemplar[]>> {
  if (source.type === 'mock') {
    const exemplars = generateMockExemplars(10, timeRange)
      .filter(e => e.value > threshold);

    return createSuccessResponse<Exemplar[]>(exemplars, 'mock');
  }

  return fetchTelemetryData<Exemplar[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.EXEMPLARS_QUERY,
    method: 'POST',
    body: {
      metricName,
      minValue: threshold,
      start: timeRange.start,
      end: timeRange.end,
    },
  });
}

// ============================================
// Query Builder
// ============================================

export function buildExemplarQuery(options: {
  metricName?: string;
  traceId?: string;
  timeRange?: TimeRange;
  limit?: number;
}): ExemplarQuery {
  const now = Date.now();

  return {
    metricName: options.metricName,
    start: options.timeRange?.start ?? now - 3600000,
    end: options.timeRange?.end ?? now,
    traceId: options.traceId,
    limit: options.limit ?? 50,
  };
}
