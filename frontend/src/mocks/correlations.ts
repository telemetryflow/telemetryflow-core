/**
 * Correlations Mock Data Generator
 * Generates mock data for signal correlation views
 */

import { randomId, randomBetween, generateTimeSeriesData } from "./shared";

// Types for correlation data
export interface CorrelatedEvent {
  type: "log" | "trace" | "metric";
  time: number;
  description: string;
  traceId: string | null;
  severity: "info" | "warning" | "error";
}

export interface CorrelatedTrace {
  traceId: string;
  service: string;
  operation: string;
  duration: number;
  timestamp: number;
  logCount: number;
  exemplarCount: number;
  errorCount: number;
}

export interface TimeSeriesPoint {
  name: string;
  data: Array<[number, number]>;
}

/**
 * Generate request rate time series data
 */
export function generateRequestRateData(
  start: number,
  end: number,
): TimeSeriesPoint[] {
  const data = generateTimeSeriesData(start, end, {
    baseValue: 150,
    variance: 40,
    trendAmplitude: 30,
    spikeChance: 0.02,
    spikeMultiplier: 2,
  });
  return [{ name: "Request Rate (req/s)", data }];
}

/**
 * Generate error rate time series data
 */
export function generateErrorRateData(
  start: number,
  end: number,
): TimeSeriesPoint[] {
  const data: Array<[number, number]> = [];
  const step = (end - start) / 60;

  for (let t = start; t <= end; t += step) {
    // Error spikes occasionally
    const spike = Math.random() < 0.1 ? Math.random() * 15 : 0;
    const base = Math.random() * 5;
    data.push([t, base + spike]);
  }

  return [{ name: "Error Count", data }];
}

/**
 * Generate P99 latency time series data
 */
export function generateP99LatencyData(
  start: number,
  end: number,
): TimeSeriesPoint[] {
  const data: Array<[number, number]> = [];
  const step = (end - start) / 60;

  for (let t = start; t <= end; t += step) {
    const base = 100 + Math.random() * 50;
    const spike = Math.random() < 0.05 ? Math.random() * 200 : 0;
    data.push([t, base + spike]);
  }

  return [{ name: "P99 Latency (ms)", data }];
}

/**
 * Generate correlated events (combining logs, traces, metrics)
 */
export function generateCorrelatedEvents(count: number = 8): CorrelatedEvent[] {
  const now = Date.now();
  const events: CorrelatedEvent[] = [];

  // Generate a mix of event types
  const eventTemplates: Array<Omit<CorrelatedEvent, "time">> = [
    {
      type: "metric",
      description: "Error rate spike to 5%",
      traceId: null,
      severity: "warning",
    },
    {
      type: "log",
      description: "Connection timeout to database",
      traceId: randomId(24),
      severity: "error",
    },
    {
      type: "trace",
      description: "Slow query detected (2.5s)",
      traceId: randomId(24),
      severity: "warning",
    },
    {
      type: "log",
      description: "Retry attempt 1 failed",
      traceId: randomId(24),
      severity: "warning",
    },
    {
      type: "metric",
      description: "Latency P99 reached 3s",
      traceId: null,
      severity: "error",
    },
    {
      type: "log",
      description: "Payment processing failed",
      traceId: randomId(24),
      severity: "error",
    },
    {
      type: "trace",
      description: "Cascade failure in order-service",
      traceId: randomId(24),
      severity: "error",
    },
    {
      type: "log",
      description: "Service recovered successfully",
      traceId: randomId(24),
      severity: "info",
    },
    {
      type: "metric",
      description: "Request rate normalized",
      traceId: null,
      severity: "info",
    },
    {
      type: "trace",
      description: "Health check passed",
      traceId: randomId(24),
      severity: "info",
    },
  ];

  for (let i = 0; i < Math.min(count, eventTemplates.length); i++) {
    events.push({
      ...eventTemplates[i],
      time: now - (i + 1) * 60000 - Math.floor(Math.random() * 30000),
    });
  }

  return events.sort((a, b) => b.time - a.time);
}

/**
 * Generate recent correlated traces
 */
export function generateCorrelatedTraces(): CorrelatedTrace[] {
  const now = Date.now();

  return [
    {
      traceId: randomId(24),
      service: "api-gateway",
      operation: "POST /api/orders",
      duration: 245,
      timestamp: now - 120000,
      logCount: 8,
      exemplarCount: 2,
      errorCount: 0,
    },
    {
      traceId: randomId(24),
      service: "user-service",
      operation: "GET /api/users/:id",
      duration: 89,
      timestamp: now - 180000,
      logCount: 5,
      exemplarCount: 1,
      errorCount: 0,
    },
    {
      traceId: randomId(24),
      service: "payment-service",
      operation: "POST /api/payments",
      duration: 1250,
      timestamp: now - 240000,
      logCount: 12,
      exemplarCount: 3,
      errorCount: 2,
    },
    {
      traceId: randomId(24),
      service: "order-service",
      operation: "PUT /api/orders/:id",
      duration: 156,
      timestamp: now - 300000,
      logCount: 6,
      exemplarCount: 2,
      errorCount: 0,
    },
    {
      traceId: randomId(24),
      service: "inventory-service",
      operation: "GET /api/inventory",
      duration: 432,
      timestamp: now - 360000,
      logCount: 9,
      exemplarCount: 4,
      errorCount: 1,
    },
    {
      traceId: randomId(24),
      service: "notification-service",
      operation: "POST /api/notify",
      duration: 78,
      timestamp: now - 420000,
      logCount: 4,
      exemplarCount: 1,
      errorCount: 0,
    },
  ];
}

/**
 * Get latency distribution buckets
 */
export function getLatencyDistributionBuckets(): string[] {
  return ["0-100ms", "100-250ms", "250-500ms", "500ms-1s", ">1s"];
}

/**
 * Generate latency distribution data from traces
 */
export function generateLatencyDistribution(
  traces: CorrelatedTrace[],
): number[] {
  const buckets = [0, 0, 0, 0, 0];

  traces.forEach((t) => {
    if (t.duration < 100) buckets[0]++;
    else if (t.duration < 250) buckets[1]++;
    else if (t.duration < 500) buckets[2]++;
    else if (t.duration < 1000) buckets[3]++;
    else buckets[4]++;
  });

  return buckets;
}

/**
 * Generate correlation statistics
 */
export function generateCorrelationStats(
  metricsCount: number,
  logsCount: number,
  tracesCount: number,
  exemplarsTraceIds: string[],
  logsWithTraceIds: string[],
): {
  totalSignals: number;
  correlatedTraces: number;
  errorCorrelations: number;
  avgResponseTime: number;
} {
  const allTraceIds = new Set([...exemplarsTraceIds, ...logsWithTraceIds]);

  return {
    totalSignals: metricsCount + logsCount + tracesCount,
    correlatedTraces: allTraceIds.size,
    errorCorrelations: Math.floor(logsWithTraceIds.length * 0.15), // ~15% are error correlations
    avgResponseTime: Math.floor(randomBetween(100, 300)),
  };
}

// Export correlations mock data service
export const correlationsMock = {
  getRequestRateData: generateRequestRateData,
  getErrorRateData: generateErrorRateData,
  getP99LatencyData: generateP99LatencyData,
  getCorrelatedEvents: generateCorrelatedEvents,
  getCorrelatedTraces: generateCorrelatedTraces,
  getLatencyDistributionBuckets,
  getLatencyDistribution: generateLatencyDistribution,
  getCorrelationStats: generateCorrelationStats,
};
