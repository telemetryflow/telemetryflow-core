/**
 * Exemplars Generator
 * Generate mock exemplars linking metrics to traces
 */

import type {
  Exemplar,
  ExemplarCorrelation,
  MetricExemplarSeries,
  TimeRange,
} from '../types';
import {
  createSeededRandom,
  generateTraceId,
  generateSpanId,
  generateTimestamps,
  getDefaultTimeRange,
} from '../common/generator';
import { MOCK_SERVICES, APP_METRICS } from '../constants';

// ============================================
// Exemplar Generator Config
// ============================================

export interface ExemplarGeneratorConfig {
  metricName: string;
  labels: Record<string, string>;
  timeRange: TimeRange;
  count?: number;
}

// ============================================
// Single Exemplar Generator
// ============================================

export function generateExemplar(
  metricName: string,
  labels: Record<string, string>,
  timestamp?: number
): Exemplar {
  const ts = timestamp ?? Date.now();
  const random = createSeededRandom(ts);

  return {
    id: `exemplar_${random.nextInt(100000, 999999)}`,
    timestamp: ts,
    value: random.nextFloat(10, 500),
    traceId: generateTraceId(ts),
    spanId: generateSpanId(ts),
    labels,
    metricName,
  };
}

// ============================================
// Bulk Exemplar Generator
// ============================================

export function generateExemplars(config: ExemplarGeneratorConfig): Exemplar[] {
  const { metricName, labels, timeRange, count = 10 } = config;
  const timestamps = generateTimestamps(timeRange.start, timeRange.end, count);

  return timestamps.map(ts => generateExemplar(metricName, labels, ts));
}

export function generateMockExemplars(
  count: number,
  timeRange?: TimeRange
): Exemplar[] {
  const range = timeRange ?? getDefaultTimeRange();
  const random = createSeededRandom(count);
  const timestamps = generateTimestamps(range.start, range.end, count);

  const metricNames = [
    APP_METRICS.HTTP.REQUEST_DURATION,
    APP_METRICS.HTTP.REQUEST_TOTAL,
    APP_METRICS.DB.CLIENT_OPERATION_DURATION,
    APP_METRICS.RPC.REQUEST_DURATION,
  ];

  return timestamps.map(ts => {
    const service = random.pick(MOCK_SERVICES);
    const metricName = random.pick(metricNames);

    return generateExemplar(
      metricName,
      {
        service,
        instance: `${service}-${random.nextInt(1, 5)}`,
        method: random.pick(['GET', 'POST', 'PUT', 'DELETE']),
        status: random.pick(['200', '201', '400', '500']),
      },
      ts
    );
  });
}

export function generateExemplarsForMetric(
  metricName: string,
  services: string[],
  timeRange: TimeRange,
  countPerService = 5
): Exemplar[] {
  const exemplars: Exemplar[] = [];

  for (const service of services) {
    exemplars.push(
      ...generateExemplars({
        metricName,
        labels: { service },
        timeRange,
        count: countPerService,
      })
    );
  }

  return exemplars.sort((a, b) => a.timestamp - b.timestamp);
}

// ============================================
// Exemplar Correlation Generator
// ============================================

export function generateExemplarCorrelation(
  exemplar: Exemplar
): ExemplarCorrelation {
  const random = createSeededRandom(exemplar.timestamp);

  return {
    exemplar,
    trace: {
      traceId: exemplar.traceId,
      rootService: exemplar.labels['service'] ?? random.pick(MOCK_SERVICES),
      duration: random.nextInt(50, 500),
    },
    logs: {
      count: random.nextInt(5, 50),
      errorCount: random.nextInt(0, 5),
    },
  };
}

export function generateExemplarCorrelations(
  exemplars: Exemplar[]
): ExemplarCorrelation[] {
  return exemplars.map(generateExemplarCorrelation);
}

// ============================================
// Metric Exemplar Series Generator
// ============================================

export function generateMetricExemplarSeries(
  metricName: string,
  labels: Record<string, string>,
  timeRange: TimeRange,
  count = 10
): MetricExemplarSeries {
  return {
    metricName,
    labels,
    exemplars: generateExemplars({ metricName, labels, timeRange, count }),
  };
}

export function generateMetricExemplarSeriesForServices(
  metricName: string,
  services: string[],
  timeRange: TimeRange
): MetricExemplarSeries[] {
  return services.map(service =>
    generateMetricExemplarSeries(
      metricName,
      { service },
      timeRange,
      5
    )
  );
}

// ============================================
// High Cardinality Exemplars
// ============================================

export function generateHighValueExemplars(
  metricName: string,
  threshold: number,
  timeRange: TimeRange,
  count = 5
): Exemplar[] {
  const random = createSeededRandom(threshold);
  const timestamps = generateTimestamps(timeRange.start, timeRange.end, count);

  return timestamps.map(ts => ({
    id: `exemplar_high_${random.nextInt(100000, 999999)}`,
    timestamp: ts,
    value: threshold + random.nextFloat(10, 200), // Above threshold
    traceId: generateTraceId(ts),
    spanId: generateSpanId(ts),
    labels: {
      service: random.pick(MOCK_SERVICES),
      outlier: 'true',
    },
    metricName,
  }));
}

export function generateErrorExemplars(
  metricName: string,
  timeRange: TimeRange,
  count = 5
): Exemplar[] {
  const random = createSeededRandom(count);
  const timestamps = generateTimestamps(timeRange.start, timeRange.end, count);

  return timestamps.map(ts => ({
    id: `exemplar_error_${random.nextInt(100000, 999999)}`,
    timestamp: ts,
    value: random.nextFloat(100, 1000),
    traceId: generateTraceId(ts),
    spanId: generateSpanId(ts),
    labels: {
      service: random.pick(MOCK_SERVICES),
      status: '500',
      error: 'true',
    },
    metricName,
  }));
}
