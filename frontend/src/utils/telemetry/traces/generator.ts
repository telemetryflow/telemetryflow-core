/**
 * Traces Generator
 * Generate mock traces following OTEL standards
 */

import type {
  Span,
  SpanKind,
  Trace,
  TraceQuery,
  TraceSummary,
  TraceLatencyStats,
  ServiceDependency,
  TimeRange,
} from '../types';
import {
  createSeededRandom,
  generateTraceId,
  generateSpanId,
  getDefaultTimeRange,
  generateTimestamps,
} from '../common/generator';
import { MOCK_SERVICES, MOCK_OPERATIONS } from '../constants';

// ============================================
// Trace Generator Config
// ============================================

export interface TraceGeneratorConfig {
  service: string;
  operation: string;
  spanCount?: number;
  duration?: number;
  hasError?: boolean;
  childServices?: string[];
  timestamp?: number;
}

// ============================================
// Single Span Generator
// ============================================

export function generateSpan(
  traceId: string,
  parentSpanId?: string,
  options?: Partial<Span>
): Span {
  const random = createSeededRandom(traceId.length + (parentSpanId?.length ?? 0));
  const startTime = options?.startTime ?? Date.now();
  const duration = options?.duration ?? random.nextInt(10, 500);
  const endTime = startTime + duration;

  const serviceName = options?.serviceName ?? random.pick(MOCK_SERVICES);
  const spanId = options?.spanId ?? generateSpanId(startTime);

  return {
    traceId,
    spanId,
    parentSpanId,
    name: options?.name ?? random.pick(MOCK_OPERATIONS),
    kind: options?.kind ?? 'server',
    startTime,
    endTime,
    duration,
    status: options?.status ?? { code: 'ok' },
    attributes: options?.attributes ?? {
      'http.method': 'GET',
      'http.url': `http://${serviceName}/api/v1/resource`,
      'http.status_code': 200,
      'http.flavor': '1.1',
    },
    events: options?.events ?? [],
    links: options?.links ?? [],
    resource: {
      'service.name': serviceName,
      ...options?.resource,
    },
    serviceName,
  };
}

// ============================================
// Trace Generator
// ============================================

export function generateTrace(config: TraceGeneratorConfig): Trace {
  const {
    service,
    operation,
    spanCount = 5,
    duration = 200,
    hasError = false,
    childServices = [],
    timestamp = Date.now(),
  } = config;

  const traceId = generateTraceId(timestamp);
  const random = createSeededRandom(timestamp);

  // Generate root span
  const rootSpanId = generateSpanId(timestamp);
  const rootSpan = generateSpan(traceId, undefined, {
    spanId: rootSpanId,
    name: operation,
    kind: 'server',
    startTime: timestamp,
    duration,
    status: hasError ? { code: 'error', message: 'Internal error' } : { code: 'ok' },
    serviceName: service,
    attributes: {
      'http.method': operation.split(' ')[0] ?? 'GET',
      'http.route': operation.split(' ')[1] ?? '/api/v1/unknown',
      'http.status_code': hasError ? 500 : 200,
    },
  });

  const spans: Span[] = [rootSpan];
  let errorCount = hasError ? 1 : 0;

  // Determine services to use for child spans
  const allServices = childServices.length > 0
    ? childServices
    : random.pickMultiple(MOCK_SERVICES.filter(s => s !== service), Math.min(spanCount - 1, 4));

  // Generate child spans
  let parentSpanId = rootSpanId;
  let currentTime = timestamp + random.nextInt(5, 20);

  for (let i = 1; i < spanCount; i++) {
    const childService = allServices[(i - 1) % allServices.length];
    const childDuration = random.nextInt(10, Math.floor(duration / 2));
    const childHasError = hasError && i === spanCount - 1; // Last span has error if trace has error

    const childSpan = generateSpan(traceId, parentSpanId, {
      name: random.pick(MOCK_OPERATIONS),
      kind: random.pick<SpanKind>(['client', 'internal', 'server']),
      startTime: currentTime,
      duration: childDuration,
      status: childHasError ? { code: 'error', message: 'Service error' } : { code: 'ok' },
      serviceName: childService,
      attributes: {
        'http.method': 'GET',
        'http.status_code': childHasError ? 500 : 200,
        'span.kind': 'client',
      },
    });

    if (childHasError) errorCount++;

    spans.push(childSpan);

    // Update for next iteration - sometimes keep same parent (siblings), sometimes use this as parent (children)
    if (random.nextBool(0.7)) {
      parentSpanId = childSpan.spanId;
    }
    currentTime += childDuration + random.nextInt(1, 10);
  }

  // Add events to some spans
  spans.forEach(span => {
    if (random.nextBool(0.3)) {
      span.events.push({
        name: random.pick(['request_received', 'processing_started', 'cache_hit', 'db_query']),
        timestamp: span.startTime + random.nextInt(1, span.duration),
        attributes: {},
      });
    }
  });

  const services = [...new Set(spans.map(s => s.serviceName))];

  return {
    traceId,
    rootSpan,
    spans,
    services,
    duration,
    spanCount: spans.length,
    errorCount,
    startTime: timestamp,
  };
}

// ============================================
// Bulk Trace Generator
// ============================================

export function generateMockTraces(
  count: number,
  timeRange?: TimeRange
): Trace[] {
  const range = timeRange ?? getDefaultTimeRange();
  const random = createSeededRandom(count);
  const timestamps = generateTimestamps(range.start, range.end, count);

  return timestamps.map(ts => {
    const service = random.pick(MOCK_SERVICES);
    const operation = random.pick(MOCK_OPERATIONS);
    const hasError = random.nextBool(0.1); // 10% error rate

    return generateTrace({
      service,
      operation,
      spanCount: random.nextInt(3, 10),
      duration: random.nextInt(50, 1000),
      hasError,
      timestamp: ts,
    });
  });
}

export function generateTracesForService(
  service: string,
  count: number,
  timeRange: TimeRange
): Trace[] {
  const random = createSeededRandom(service.length);
  const timestamps = generateTimestamps(timeRange.start, timeRange.end, count);

  return timestamps.map(ts => {
    const operation = random.pick(MOCK_OPERATIONS);
    const hasError = random.nextBool(0.1);

    return generateTrace({
      service,
      operation,
      spanCount: random.nextInt(3, 8),
      duration: random.nextInt(50, 500),
      hasError,
      timestamp: ts,
    });
  });
}

// ============================================
// Service Map Generator
// ============================================

export function generateServiceMap(services: string[]): ServiceDependency[] {
  const random = createSeededRandom(services.length);
  const dependencies: ServiceDependency[] = [];

  // Create a realistic service dependency graph
  for (let i = 0; i < services.length; i++) {
    // Each service can call 1-3 other services
    const targetCount = random.nextInt(1, Math.min(3, services.length - 1));
    const targets = random.shuffle(services.filter(s => s !== services[i])).slice(0, targetCount);

    for (const target of targets) {
      dependencies.push({
        source: services[i],
        target,
        callCount: random.nextInt(100, 10000),
        avgDuration: random.nextFloat(10, 200),
        errorRate: random.nextFloat(0, 5),
      });
    }
  }

  return dependencies;
}

export function generateServiceDependency(
  source: string,
  target: string,
  seed?: number
): ServiceDependency {
  const random = createSeededRandom(seed ?? (source + target).length);

  return {
    source,
    target,
    callCount: random.nextInt(100, 10000),
    avgDuration: random.nextFloat(10, 200),
    errorRate: random.nextFloat(0, 5),
  };
}

// ============================================
// Latency Distribution Generator
// ============================================

export function generateLatencyDistribution(
  service: string,
  operation: string,
  _timeRange?: TimeRange
): TraceLatencyStats {
  const random = createSeededRandom((service + operation).length);
  const baseLatency = random.nextFloat(20, 100);

  return {
    service,
    operation,
    requests: random.nextInt(1000, 100000),
    errors: random.nextInt(10, 1000),
    errorRate: random.nextFloat(0.1, 5),
    p50: baseLatency,
    p95: baseLatency * random.nextFloat(2, 4),
    p99: baseLatency * random.nextFloat(4, 8),
  };
}

export function generateLatencyStatsForServices(
  services: string[]
): TraceLatencyStats[] {
  const stats: TraceLatencyStats[] = [];
  const random = createSeededRandom(services.length);

  for (const service of services) {
    // Generate 2-5 operations per service
    const opCount = random.nextInt(2, 5);
    const operations = random.pickMultiple(MOCK_OPERATIONS, opCount);

    for (const operation of operations) {
      stats.push(generateLatencyDistribution(service, operation));
    }
  }

  return stats;
}

// ============================================
// Trace Summary Generator
// ============================================

export function generateTraceSummary(trace: Trace): TraceSummary {
  return {
    traceId: trace.traceId,
    rootService: trace.rootSpan.serviceName,
    rootOperation: trace.rootSpan.name,
    startTime: trace.startTime,
    duration: trace.duration,
    spanCount: trace.spanCount,
    errorCount: trace.errorCount,
    services: trace.services,
    p50: trace.duration * 0.5,
    p95: trace.duration * 0.95,
    p99: trace.duration * 0.99,
  };
}

export function generateTraceSummaries(traces: Trace[]): TraceSummary[] {
  return traces.map(generateTraceSummary);
}

// ============================================
// Query Builder
// ============================================

export function buildTraceQuery(options: {
  service?: string;
  operation?: string;
  tags?: Record<string, string>;
  timeRange?: TimeRange;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
}): TraceQuery {
  const now = Date.now();

  return {
    service: options.service,
    operation: options.operation,
    tags: options.tags,
    start: options.timeRange?.start ?? now - 3600000,
    end: options.timeRange?.end ?? now,
    minDuration: options.minDuration,
    maxDuration: options.maxDuration,
    limit: options.limit ?? 20,
  };
}
