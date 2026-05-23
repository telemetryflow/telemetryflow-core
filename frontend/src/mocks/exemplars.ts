/**
 * Exemplars Mock Data Generator
 * Generates realistic exemplar data linking metrics to traces
 */

import type { Exemplar } from "@/types";
import {
  SERVICES,
  HTTP_METHODS,
  API_PATHS,
  randomId,
  randomItem,
  randomBetween,
  generateTimestamp,
} from "./shared";

// Metrics that support exemplars
export const EXEMPLAR_METRICS = [
  "http_request_duration_seconds",
  "http_requests_total",
  "database_query_duration_seconds",
  "cache_operation_duration_seconds",
  "grpc_request_duration_seconds",
] as const;

// Status codes for exemplars
const EXEMPLAR_STATUS_CODES = ["200", "201", "400", "500"] as const;

/**
 * Generate a single exemplar
 */
export function generateExemplar(timestamp?: number): Exemplar {
  const now = timestamp || Date.now();
  const service = randomItem(SERVICES);
  const metricName = randomItem(EXEMPLAR_METRICS);

  return {
    id: randomId(16),
    timestamp: now,
    metricName,
    value: randomBetween(0.01, 2.5),
    traceId: randomId(32),
    spanId: randomId(16),
    labels: {
      service,
      instance: `${service}:8080`,
      method: randomItem(HTTP_METHODS),
      status: randomItem(EXEMPLAR_STATUS_CODES),
      path: randomItem(API_PATHS),
    },
  };
}

/**
 * Generate multiple exemplars for a time range
 */
export function generateExemplars(
  start: number,
  end: number,
  count: number = 50,
): Exemplar[] {
  const exemplars: Exemplar[] = [];
  for (let i = 0; i < count; i++) {
    exemplars.push(generateExemplar(generateTimestamp(start, end)));
  }
  return exemplars.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generate exemplars grouped by metric name
 */
export function generateExemplarsGroupedByMetric(
  start: number,
  end: number,
  count: number = 50,
): Record<string, Exemplar[]> {
  const exemplars = generateExemplars(start, end, count);
  const grouped: Record<string, Exemplar[]> = {};

  exemplars.forEach((exemplar) => {
    if (!grouped[exemplar.metricName]) {
      grouped[exemplar.metricName] = [];
    }
    grouped[exemplar.metricName].push(exemplar);
  });

  return grouped;
}

/**
 * Generate exemplars with correlation data
 */
export function generateExemplarsWithCorrelation(
  start: number,
  end: number,
  count: number = 50,
): Array<Exemplar & { hasTrace: boolean; hasLogs: boolean }> {
  const exemplars = generateExemplars(start, end, count);

  return exemplars.map((exemplar) => ({
    ...exemplar,
    hasTrace: Math.random() > 0.2, // 80% have associated trace
    hasLogs: Math.random() > 0.3, // 70% have associated logs
  }));
}

/**
 * Get available exemplar metric names
 */
export function getExemplarMetrics(): string[] {
  return [...EXEMPLAR_METRICS];
}

// Export exemplars mock data service
export const exemplarsMock = {
  generateExemplar,
  getExemplars: generateExemplars,
  getExemplarsGroupedByMetric: generateExemplarsGroupedByMetric,
  getExemplarsWithCorrelation: generateExemplarsWithCorrelation,
  getExemplarMetrics,
};
