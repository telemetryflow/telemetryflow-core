/**
 * Common Fetcher Utilities
 * Universal fetch wrapper for telemetry data
 */

import type { DataSourceConfig, DataSourceType, TelemetryResponse, TimeRange } from '../types';
import { OTEL_V1_ENDPOINTS, TFO_V2_ENDPOINTS } from '../constants';

// ============================================
// Fetch Options Interface
// ============================================

export interface FetchOptions {
  source: DataSourceConfig;
  endpoint: string;
  method?: 'GET' | 'POST';
  params?: Record<string, unknown>;
  body?: unknown;
  timeRange?: TimeRange;
}

// ============================================
// Response Builder
// ============================================

export function createSuccessResponse<T>(
  data: T,
  source: DataSourceType
): TelemetryResponse<T> {
  return {
    success: true,
    data,
    source,
    timestamp: Date.now(),
  };
}

export function createErrorResponse<T>(
  error: string,
  source: DataSourceType
): TelemetryResponse<T> {
  return {
    success: false,
    data: null,
    error,
    source,
    timestamp: Date.now(),
  };
}

// ============================================
// Endpoint Resolution
// ============================================

type TelemetryType = 'metrics' | 'logs' | 'traces' | 'exemplars' | 'kubernetes' | 'alerts' | 'infrastructure';

export function getEndpoint(
  source: DataSourceType,
  telemetryType: TelemetryType,
  subPath?: string
): string {
  const basePath = getBaseEndpoint(source, telemetryType);
  return subPath ? `${basePath}${subPath}` : basePath;
}

function getBaseEndpoint(source: DataSourceType, telemetryType: TelemetryType): string {
  if (source === 'otel-v1') {
    switch (telemetryType) {
      case 'metrics':
        return OTEL_V1_ENDPOINTS.METRICS;
      case 'logs':
        return OTEL_V1_ENDPOINTS.LOGS;
      case 'traces':
        return OTEL_V1_ENDPOINTS.TRACES;
      default:
        throw new Error(`OTEL v1 does not support ${telemetryType}`);
    }
  }

  // TFO v2 endpoints
  switch (telemetryType) {
    case 'metrics':
      return TFO_V2_ENDPOINTS.METRICS;
    case 'logs':
      return TFO_V2_ENDPOINTS.LOGS;
    case 'traces':
      return TFO_V2_ENDPOINTS.TRACES;
    case 'exemplars':
      return TFO_V2_ENDPOINTS.EXEMPLARS;
    case 'kubernetes':
      return TFO_V2_ENDPOINTS.KUBERNETES;
    case 'alerts':
      return TFO_V2_ENDPOINTS.ALERTS;
    case 'infrastructure':
      return TFO_V2_ENDPOINTS.INFRASTRUCTURE;
    default:
      throw new Error(`Unknown telemetry type: ${telemetryType}`);
  }
}

// ============================================
// URL Builder
// ============================================

export function buildUrl(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, unknown>
): string {
  const url = new URL(endpoint, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });
  }

  return url.toString();
}

// ============================================
// Universal Fetch Function
// ============================================

export async function fetchTelemetryData<T>(
  options: FetchOptions
): Promise<TelemetryResponse<T>> {
  const { source, endpoint, method = 'GET', params, body, timeRange } = options;

  // Mock data source returns immediately with success (actual data from generators)
  if (source.type === 'mock') {
    return createSuccessResponse<T>(null as T, 'mock');
  }

  // Build URL with base URL
  const baseUrl = source.baseUrl ?? getDefaultBaseUrl(source.type);

  // Merge time range into params
  const mergedParams = {
    ...params,
    ...(timeRange ? { start: timeRange.start, end: timeRange.end } : {}),
  };

  const url = buildUrl(baseUrl, endpoint, method === 'GET' ? mergedParams : undefined);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...source.headers,
      },
      body: method === 'POST' ? JSON.stringify(body ?? mergedParams) : undefined,
      signal: AbortSignal.timeout(source.timeout ?? 30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return createErrorResponse<T>(
        `HTTP ${response.status}: ${errorText}`,
        source.type
      );
    }

    const data = await response.json();
    return createSuccessResponse<T>(data, source.type);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<T>(message, source.type);
  }
}

// ============================================
// Default Base URLs
// ============================================

function getDefaultBaseUrl(source: DataSourceType): string {
  switch (source) {
    case 'otel-v1':
      return 'http://localhost:4318';
    case 'tfo-v2':
      return 'http://localhost:8080';
    default:
      return 'http://localhost:8080';
  }
}

// ============================================
// Fetch Options Factory
// ============================================

export function createFetchOptions(
  source: DataSourceConfig,
  defaults?: Partial<FetchOptions>
): (options: Partial<FetchOptions>) => FetchOptions {
  return (options: Partial<FetchOptions>): FetchOptions => ({
    source,
    endpoint: '',
    ...defaults,
    ...options,
  });
}

// ============================================
// Batch Fetch Utilities
// ============================================

export async function fetchMultiple<T>(
  requests: FetchOptions[]
): Promise<TelemetryResponse<T>[]> {
  return Promise.all(requests.map(req => fetchTelemetryData<T>(req)));
}

export async function fetchWithRetry<T>(
  options: FetchOptions,
  retries = 3,
  delay = 1000
): Promise<TelemetryResponse<T>> {
  let lastError: TelemetryResponse<T> | null = null;

  for (let i = 0; i < retries; i++) {
    const response = await fetchTelemetryData<T>(options);

    if (response.success) {
      return response;
    }

    lastError = response;

    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }

  return lastError!;
}

// ============================================
// Data Source Helpers
// ============================================

export function createMockSource(): DataSourceConfig {
  return { type: 'mock' };
}

export function createOTELv1Source(baseUrl?: string): DataSourceConfig {
  return {
    type: 'otel-v1',
    baseUrl: baseUrl ?? 'http://localhost:4318',
  };
}

export function createTFOv2Source(baseUrl?: string): DataSourceConfig {
  return {
    type: 'tfo-v2',
    baseUrl: baseUrl ?? 'http://localhost:8080',
  };
}

export function isValidSource(source: DataSourceConfig): boolean {
  return ['mock', 'otel-v1', 'tfo-v2'].includes(source.type);
}
