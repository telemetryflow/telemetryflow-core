/**
 * Logs Fetcher
 * Fetch logs from OTEL v1 or TFO v2 endpoints
 */

import type {
  DataSourceConfig,
  TelemetryResponse,
  LogQuery,
  LogQueryResult,
  LogPattern,
  FieldMetadata,
  TimeRange,
} from '../types';
import {
  fetchTelemetryData,
  createSuccessResponse,
  getEndpoint,
} from '../common/fetcher';
import { TFO_V2_ENDPOINTS } from '../constants';
import {
  generateMockLogs,
  generateLogPatterns,
} from './generator';

// ============================================
// Fetch Logs
// ============================================

export async function fetchLogs(
  source: DataSourceConfig,
  query?: LogQuery
): Promise<TelemetryResponse<LogQueryResult>> {
  if (source.type === 'mock') {
    const timeRange: TimeRange = {
      start: query?.start ?? Date.now() - 3600000,
      end: query?.end ?? Date.now(),
    };

    const allLogs = generateMockLogs(query?.limit ?? 100, timeRange);

    // Apply filters
    let filteredLogs = allLogs;

    if (query?.severityLevels?.length) {
      filteredLogs = filteredLogs.filter(log =>
        query.severityLevels!.includes(log.severityText)
      );
    }

    if (query?.services?.length) {
      filteredLogs = filteredLogs.filter(log =>
        query.services!.includes(log.resource['service.name'])
      );
    }

    if (query?.query) {
      const searchTerm = query.query.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.body.toLowerCase().includes(searchTerm) ||
        Object.values(log.attributes).some(v =>
          String(v).toLowerCase().includes(searchTerm)
        )
      );
    }

    return createSuccessResponse<LogQueryResult>(
      {
        status: 'success',
        data: filteredLogs,
        total: filteredLogs.length,
        hasMore: false,
      },
      'mock'
    );
  }

  const endpoint = source.type === 'otel-v1'
    ? getEndpoint('otel-v1', 'logs')
    : TFO_V2_ENDPOINTS.LOGS_QUERY;

  return fetchTelemetryData<LogQueryResult>({
    source,
    endpoint,
    method: 'POST',
    body: query,
  });
}

// ============================================
// Fetch Log Patterns
// ============================================

export async function fetchLogPatterns(
  source: DataSourceConfig,
  timeRange: TimeRange
): Promise<TelemetryResponse<LogPattern[]>> {
  if (source.type === 'mock') {
    const logs = generateMockLogs(500, timeRange);
    const patterns = generateLogPatterns(logs, 20);
    return createSuccessResponse<LogPattern[]>(patterns, 'mock');
  }

  return fetchTelemetryData<LogPattern[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.LOGS_PATTERNS,
    method: 'GET',
    timeRange,
  });
}

// ============================================
// Fetch Log Fields
// ============================================

export async function fetchLogFields(
  source: DataSourceConfig
): Promise<TelemetryResponse<FieldMetadata[]>> {
  if (source.type === 'mock') {
    const mockFields: FieldMetadata[] = [
      {
        name: 'severity',
        path: 'severityText',
        type: 'keyword',
        count: 1000,
        isNested: false,
        topValues: [
          { value: 'info', count: 500, percentage: 50 },
          { value: 'debug', count: 200, percentage: 20 },
          { value: 'warn', count: 150, percentage: 15 },
          { value: 'error', count: 100, percentage: 10 },
          { value: 'trace', count: 50, percentage: 5 },
        ],
      },
      {
        name: 'service.name',
        path: 'resource.service.name',
        type: 'keyword',
        count: 1000,
        isNested: true,
        parent: 'resource',
        topValues: [
          { value: 'api-gateway', count: 300, percentage: 30 },
          { value: 'auth-service', count: 250, percentage: 25 },
          { value: 'user-service', count: 200, percentage: 20 },
          { value: 'order-service', count: 150, percentage: 15 },
          { value: 'payment-service', count: 100, percentage: 10 },
        ],
      },
      {
        name: 'http.method',
        path: 'attributes.http.method',
        type: 'keyword',
        count: 800,
        isNested: true,
        parent: 'attributes',
        topValues: [
          { value: 'GET', count: 400, percentage: 50 },
          { value: 'POST', count: 240, percentage: 30 },
          { value: 'PUT', count: 80, percentage: 10 },
          { value: 'DELETE', count: 80, percentage: 10 },
        ],
      },
      {
        name: 'http.status_code',
        path: 'attributes.http.status_code',
        type: 'number',
        count: 800,
        isNested: true,
        parent: 'attributes',
        topValues: [
          { value: 200, count: 600, percentage: 75 },
          { value: 201, count: 80, percentage: 10 },
          { value: 400, count: 64, percentage: 8 },
          { value: 500, count: 56, percentage: 7 },
        ],
      },
      {
        name: 'timestamp',
        path: 'timestamp',
        type: 'date',
        count: 1000,
        isNested: false,
        topValues: [],
      },
      {
        name: 'traceId',
        path: 'traceId',
        type: 'keyword',
        count: 300,
        isNested: false,
        topValues: [],
      },
    ];

    return createSuccessResponse<FieldMetadata[]>(mockFields, 'mock');
  }

  return fetchTelemetryData<FieldMetadata[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.LOGS_FIELDS,
    method: 'GET',
  });
}

// ============================================
// Fetch Log Aggregations
// ============================================

export async function fetchLogAggregations(
  source: DataSourceConfig,
  timeRange: TimeRange,
  groupBy: string
): Promise<TelemetryResponse<Record<string, number>>> {
  if (source.type === 'mock') {
    const logs = generateMockLogs(500, timeRange);
    const aggregations: Record<string, number> = {};

    for (const log of logs) {
      let key: string;
      switch (groupBy) {
        case 'severity':
          key = log.severityText;
          break;
        case 'service':
          key = log.resource['service.name'];
          break;
        default:
          key = 'unknown';
      }
      aggregations[key] = (aggregations[key] ?? 0) + 1;
    }

    return createSuccessResponse<Record<string, number>>(aggregations, 'mock');
  }

  return fetchTelemetryData<Record<string, number>>({
    source,
    endpoint: TFO_V2_ENDPOINTS.LOGS_QUERY,
    method: 'POST',
    body: {
      start: timeRange.start,
      end: timeRange.end,
      aggregation: { groupBy },
    },
  });
}

// ============================================
// Log Services
// ============================================

export async function fetchLogServices(
  source: DataSourceConfig,
  timeRange?: TimeRange
): Promise<TelemetryResponse<string[]>> {
  if (source.type === 'mock') {
    const services = [
      'api-gateway',
      'auth-service',
      'user-service',
      'order-service',
      'payment-service',
      'notification-service',
      'inventory-service',
      'search-service',
    ];
    return createSuccessResponse<string[]>(services, 'mock');
  }

  return fetchTelemetryData<string[]>({
    source,
    endpoint: TFO_V2_ENDPOINTS.LOGS_FIELDS,
    method: 'GET',
    params: { field: 'service.name' },
    timeRange,
  });
}

// ============================================
// Log Stream (WebSocket alternative)
// ============================================

export async function fetchLogStream(
  source: DataSourceConfig,
  query: LogQuery,
  onLog: (log: import('../types').LogRecord) => void,
  options?: { pollingInterval?: number; maxLogs?: number }
): Promise<() => void> {
  const { pollingInterval = 5000, maxLogs = 100 } = options ?? {};
  let isRunning = true;
  let lastTimestamp = query.end ?? Date.now();

  const poll = async () => {
    while (isRunning) {
      const result = await fetchLogs(source, {
        ...query,
        start: lastTimestamp,
        end: Date.now(),
        limit: maxLogs,
      });

      if (result.success && result.data?.data.length) {
        for (const log of result.data.data) {
          onLog(log);
          if (log.timestamp > lastTimestamp) {
            lastTimestamp = log.timestamp;
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
  };

  poll();

  // Return cleanup function
  return () => {
    isRunning = false;
  };
}
