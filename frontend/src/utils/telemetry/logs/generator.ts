/**
 * Logs Generator
 * Generate mock logs following OTEL standards
 */

import type {
  LogRecord,
  LogLevel,
  LogSeverityNumber,
  LogQuery,
  LogPattern,
  TimeRange,
} from '../types';
import {
  createSeededRandom,
  generateLogId,
  generateTraceId,
  generateSpanId,
  generateTimestamps,
  getDefaultTimeRange,
} from '../common/generator';
import { logLevelToSeverity } from '../common/transformer';
import { MOCK_SERVICES, OTEL_SEVERITY_LEVELS } from '../constants';

// ============================================
// Log Generator Config
// ============================================

export interface LogGeneratorConfig {
  service: string;
  level: LogLevel;
  count: number;
  timeRange: TimeRange;
  includeTraceContext?: boolean;
  attributes?: Record<string, string | number | boolean>;
}

// ============================================
// Log Messages Templates
// ============================================

const LOG_MESSAGES: Record<LogLevel, string[]> = {
  trace: [
    'Entering function processRequest',
    'Variable state: initialized',
    'Loop iteration started',
    'Memory allocation completed',
    'Cache lookup initiated',
  ],
  debug: [
    'Processing request with params: {}',
    'Database query executed in {duration}ms',
    'Cache hit for key: {key}',
    'Configuration loaded successfully',
    'Connection pool status: {active}/{max}',
  ],
  info: [
    'Request completed successfully',
    'User {userId} logged in',
    'Order {orderId} created',
    'Service started on port {port}',
    'Scheduled task executed',
    'Health check passed',
  ],
  warn: [
    'Request took longer than expected: {duration}ms',
    'Rate limit approaching for client {clientId}',
    'Deprecated API endpoint called',
    'Memory usage above threshold: {usage}%',
    'Retry attempt {attempt} for operation',
  ],
  error: [
    'Failed to process request: {error}',
    'Database connection failed',
    'Authentication failed for user {userId}',
    'Timeout while calling external service',
    'Invalid request payload received',
  ],
  fatal: [
    'Service crash detected',
    'Out of memory error',
    'Unrecoverable database error',
    'Configuration file missing',
    'Critical security violation detected',
  ],
};


// ============================================
// Single Log Generators
// ============================================

export function generateLogRecord(config: Partial<LogGeneratorConfig>): LogRecord {
  const {
    service = 'unknown-service',
    level = 'info',
    includeTraceContext = false,
    attributes = {},
  } = config;

  const timestamp = config.timeRange?.start ?? Date.now();
  const random = createSeededRandom(timestamp);

  const severityNumber = logLevelToSeverity(level) as LogSeverityNumber;
  const messages = LOG_MESSAGES[level];
  const body = random.pick(messages).replace(
    /\{(\w+)\}/g,
    (_, key) => String(attributes[key] ?? random.nextInt(1, 1000))
  );

  const record: LogRecord = {
    id: generateLogId(timestamp),
    timestamp,
    observedTimestamp: timestamp + random.nextInt(0, 100),
    severityNumber,
    severityText: level,
    body,
    attributes: {
      'log.file.name': `${service}.log`,
      'log.file.path': `/var/log/${service}/${service}.log`,
      ...attributes,
    },
    resource: {
      'service.name': service,
      'service.namespace': 'default',
      'host.name': `${service}-${random.nextInt(1, 5)}`,
    },
  };

  if (includeTraceContext || random.nextBool(0.3)) {
    record.traceId = generateTraceId(timestamp);
    record.spanId = generateSpanId(timestamp);
    record.traceFlags = 1;
  }

  return record;
}

export function generateLogRecords(config: LogGeneratorConfig): LogRecord[] {
  const { service, level, count, timeRange, includeTraceContext, attributes } = config;
  const timestamps = generateTimestamps(timeRange.start, timeRange.end, count);

  return timestamps.map(timestamp =>
    generateLogRecord({
      service,
      level,
      timeRange: { start: timestamp, end: timestamp },
      includeTraceContext,
      attributes,
    })
  );
}

// ============================================
// Specialized Log Generators
// ============================================

export function generateErrorLog(
  service: string,
  error: string | Error,
  timestamp?: number
): LogRecord {
  const ts = timestamp ?? Date.now();
  const random = createSeededRandom(ts);
  const errorMessage = error instanceof Error ? error.message : error;

  return {
    id: generateLogId(ts),
    timestamp: ts,
    observedTimestamp: ts,
    severityNumber: OTEL_SEVERITY_LEVELS.ERROR as LogSeverityNumber,
    severityText: 'error',
    body: `Error occurred: ${errorMessage}`,
    attributes: {
      'exception.type': error instanceof Error ? error.name : 'Error',
      'exception.message': errorMessage,
      'exception.stacktrace': error instanceof Error ? error.stack ?? '' : '',
    },
    resource: {
      'service.name': service,
      'host.name': `${service}-${random.nextInt(1, 5)}`,
    },
  };
}

export function generateAccessLog(
  service: string,
  request: { method: string; path: string; status: number; duration?: number },
  timestamp?: number
): LogRecord {
  const ts = timestamp ?? Date.now();
  const random = createSeededRandom(ts);
  const duration = request.duration ?? random.nextInt(10, 500);

  return {
    id: generateLogId(ts),
    timestamp: ts,
    observedTimestamp: ts,
    severityNumber: OTEL_SEVERITY_LEVELS.INFO as LogSeverityNumber,
    severityText: 'info',
    body: `${request.method} ${request.path} ${request.status} ${duration}ms`,
    attributes: {
      'http.method': request.method,
      'http.route': request.path,
      'http.status_code': request.status,
      'http.request.duration': duration,
      'http.flavor': '1.1',
      'net.host.name': 'localhost',
    },
    resource: {
      'service.name': service,
      'host.name': `${service}-${random.nextInt(1, 5)}`,
    },
  };
}

export function generateK8sLog(
  cluster: string,
  namespace: string,
  pod: string,
  container: string,
  message: string,
  level: LogLevel = 'info',
  timestamp?: number
): LogRecord {
  const ts = timestamp ?? Date.now();

  return {
    id: generateLogId(ts),
    timestamp: ts,
    observedTimestamp: ts,
    severityNumber: logLevelToSeverity(level) as LogSeverityNumber,
    severityText: level,
    body: message,
    attributes: {
      'k8s.cluster.name': cluster,
      'k8s.namespace.name': namespace,
      'k8s.pod.name': pod,
      'k8s.container.name': container,
    },
    resource: {
      'service.name': container,
      'k8s.cluster.name': cluster,
      'k8s.namespace.name': namespace,
      'k8s.pod.name': pod,
    },
  };
}

// ============================================
// Bulk Log Generators
// ============================================

export function generateMockLogs(
  count: number,
  timeRange?: TimeRange
): LogRecord[] {
  const range = timeRange ?? getDefaultTimeRange();
  const random = createSeededRandom(count);
  const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  const levelWeights = [0.05, 0.15, 0.50, 0.15, 0.12, 0.03]; // Realistic distribution

  const timestamps = generateTimestamps(range.start, range.end, count);

  return timestamps.map(ts => {
    // Weighted random level selection
    const rand = random.next();
    let cumulative = 0;
    let level: LogLevel = 'info';
    for (let i = 0; i < levels.length; i++) {
      cumulative += levelWeights[i];
      if (rand < cumulative) {
        level = levels[i];
        break;
      }
    }

    const service = random.pick(MOCK_SERVICES);
    return generateLogRecord({
      service,
      level,
      timeRange: { start: ts, end: ts },
      includeTraceContext: random.nextBool(0.3),
    });
  });
}

export function generateLogsForService(
  service: string,
  count: number,
  timeRange: TimeRange
): LogRecord[] {
  const logs: LogRecord[] = [];

  // Generate a mix of log levels
  const distribution = {
    info: Math.floor(count * 0.5),
    debug: Math.floor(count * 0.2),
    warn: Math.floor(count * 0.15),
    error: Math.floor(count * 0.1),
    trace: Math.floor(count * 0.04),
    fatal: Math.floor(count * 0.01),
  };

  for (const [level, levelCount] of Object.entries(distribution)) {
    logs.push(
      ...generateLogRecords({
        service,
        level: level as LogLevel,
        count: levelCount,
        timeRange,
        includeTraceContext: true,
      })
    );
  }

  // Sort by timestamp
  return logs.sort((a, b) => a.timestamp - b.timestamp);
}

// ============================================
// Log Pattern Generator
// ============================================

export function generateLogPatterns(
  logs: LogRecord[],
  limit = 10
): LogPattern[] {
  const random = createSeededRandom(logs.length);
  const patternMap = new Map<string, { count: number; level: LogLevel; examples: string[] }>();

  // Group similar log messages
  for (const log of logs) {
    // Create pattern by replacing numbers and UUIDs
    const pattern = log.body
      .replace(/\d+/g, '{num}')
      .replace(/[a-f0-9-]{36}/gi, '{uuid}')
      .replace(/[a-f0-9]{32}/gi, '{id}');

    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, { count: 0, level: log.severityText, examples: [] });
    }

    const entry = patternMap.get(pattern)!;
    entry.count++;
    if (entry.examples.length < 3) {
      entry.examples.push(log.body);
    }
  }

  // Convert to LogPattern array
  const totalLogs = logs.length;
  const patterns: LogPattern[] = Array.from(patternMap.entries())
    .map(([pattern, data]) => ({
      id: `pattern_${random.nextInt(1000, 9999)}`,
      pattern,
      count: data.count,
      percentage: (data.count / totalLogs) * 100,
      examples: data.examples,
      level: data.level,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return patterns;
}

// ============================================
// Query Helpers
// ============================================

export function buildLogQuery(options: {
  query?: string;
  services?: string[];
  levels?: LogLevel[];
  timeRange?: TimeRange;
  limit?: number;
}): LogQuery {
  const now = Date.now();

  return {
    query: options.query,
    start: options.timeRange?.start ?? now - 3600000,
    end: options.timeRange?.end ?? now,
    limit: options.limit ?? 100,
    severityLevels: options.levels,
    services: options.services,
  };
}

// ============================================
// Log Stream Generator (Real-time Simulation)
// ============================================

export interface LogStreamConfig {
  services?: string[];
  levels?: LogLevel[];
  ratePerSecond?: number; // Logs per second
  burstMode?: boolean; // Enable burst mode for realistic traffic
  includeTraceContext?: boolean;
}

/**
 * Generate a single streaming log entry
 * Used for real-time log streaming simulation
 */
export function generateStreamLog(config: Partial<LogStreamConfig> = {}): LogRecord {
  const {
    services = MOCK_SERVICES,
    levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    includeTraceContext = false,
  } = config;

  const now = Date.now();
  const random = createSeededRandom(now);

  // Weighted level selection (realistic distribution)
  const levelWeights = {
    trace: 0.05,
    debug: 0.15,
    info: 0.50,
    warn: 0.15,
    error: 0.12,
    fatal: 0.03,
  };

  const rand = random.next();
  let cumulative = 0;
  let selectedLevel: LogLevel = 'info';
  
  for (const level of levels) {
    cumulative += levelWeights[level as keyof typeof levelWeights] || 0;
    if (rand < cumulative) {
      selectedLevel = level;
      break;
    }
  }

  const service = random.pick(services);

  return generateLogRecord({
    service,
    level: selectedLevel,
    timeRange: { start: now, end: now },
    includeTraceContext,
  });
}

/**
 * Generate a batch of streaming logs
 * Used for buffer/batch mode in streaming
 */
export function generateStreamLogBatch(
  count: number,
  config: Partial<LogStreamConfig> = {}
): LogRecord[] {
  const logs: LogRecord[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    // Add slight time variation within the batch (0-1000ms)
    const random = createSeededRandom(now + i);
    const timestamp = now + random.nextInt(0, 1000);
    
    const log = generateStreamLog(config);
    log.timestamp = timestamp;
    log.observedTimestamp = timestamp + random.nextInt(0, 50);
    
    logs.push(log);
  }

  // Sort by timestamp
  return logs.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Generate burst of logs (simulating traffic spike)
 * Used for realistic traffic patterns
 */
export function generateLogBurst(
  burstSize: number,
  config: Partial<LogStreamConfig> = {}
): LogRecord[] {
  const now = Date.now();
  const random = createSeededRandom(now);
  
  // In burst mode, increase error rate
  const burstConfig: Partial<LogStreamConfig> = {
    ...config,
    levels: ['info', 'warn', 'error', 'error', 'fatal'], // More errors in burst
  };

  const logs: LogRecord[] = [];
  
  for (let i = 0; i < burstSize; i++) {
    // Burst logs happen within 100ms window
    const timestamp = now + random.nextInt(0, 100);
    const log = generateStreamLog(burstConfig);
    log.timestamp = timestamp;
    log.observedTimestamp = timestamp + random.nextInt(0, 20);
    logs.push(log);
  }

  return logs.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Stream log generator with realistic patterns
 * Returns an async generator for continuous streaming
 */
export async function* streamLogs(
  config: LogStreamConfig = {}
): AsyncGenerator<LogRecord, void, unknown> {
  const {
    ratePerSecond = 5,
    burstMode = true,
  } = config;

  const intervalMs = 1000 / ratePerSecond;
  const random = createSeededRandom(Date.now());

  while (true) {
    // Simulate burst traffic (10% chance)
    if (burstMode && random.nextBool(0.1)) {
      const burstSize = random.nextInt(5, 15);
      const burstLogs = generateLogBurst(burstSize, config);
      
      for (const log of burstLogs) {
        yield log;
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay between burst logs
      }
    } else {
      // Normal log generation
      const log = generateStreamLog(config);
      yield log;
    }

    // Wait for next interval
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

/**
 * Generate logs for a specific time window (for buffer mode)
 * Used when "Buffer" mode is selected in UI
 */
export function generateLogsForTimeWindow(
  windowSizeMs: number,
  config: Partial<LogStreamConfig> = {}
): LogRecord[] {
  const { ratePerSecond = 5 } = config;
  const count = Math.ceil((windowSizeMs / 1000) * ratePerSecond);
  
  return generateStreamLogBatch(count, config);
}

/**
 * Generate logs with auto-scroll simulation
 * Returns logs in chunks suitable for UI rendering
 */
export function generateLogsChunk(
  chunkSize: number,
  config: Partial<LogStreamConfig> = {}
): LogRecord[] {
  return generateStreamLogBatch(chunkSize, config);
}

/**
 * Simulate paused stream (returns buffered logs)
 * Used when stream is paused and then resumed
 */
export function generateBufferedLogs(
  pauseDurationMs: number,
  config: Partial<LogStreamConfig> = {}
): LogRecord[] {
  const { ratePerSecond = 5 } = config;
  const missedCount = Math.ceil((pauseDurationMs / 1000) * ratePerSecond);
  
  const now = Date.now();
  const logs: LogRecord[] = [];
  
  for (let i = 0; i < missedCount; i++) {
    const random = createSeededRandom(now + i);
    const timestamp = now - pauseDurationMs + (i * (pauseDurationMs / missedCount));
    
    const log = generateStreamLog(config);
    log.timestamp = Math.floor(timestamp);
    log.observedTimestamp = log.timestamp + random.nextInt(0, 50);
    
    logs.push(log);
  }

  return logs.sort((a, b) => a.timestamp - b.timestamp);
}
