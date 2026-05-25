/**
 * Logs Transformer
 * Transform logs between OTEL v1 and TFO v2 formats
 */

import type {
  LogRecord,
  LogLevel,
  LogSeverityNumber,
  OTELv1LogRecord,
} from '../types';
import {
  otelKeyValueToRecord,
  recordToOtelKeyValue,
  nanosToMillis,
  millisToNanos,
  severityNumberToText,
  severityTextToNumber,
  severityToLogLevel,
  logLevelToSeverity,
  extractAnyValue,
  valueToAnyValue,
} from '../common/transformer';
import { generateLogId } from '../common/generator';
import { OTEL_SEVERITY_TEXT } from '../constants';

// ============================================
// OTEL v1 to TFO Transformation
// ============================================

export function transformOTELv1LogToTFO(otelLog: OTELv1LogRecord): LogRecord {
  const timestamp = nanosToMillis(otelLog.timeUnixNano);
  const observedTimestamp = nanosToMillis(otelLog.observedTimeUnixNano);
  const attributes = otelKeyValueToRecord(otelLog.attributes);
  const severityNumber = otelLog.severityNumber as LogSeverityNumber;

  return {
    id: generateLogId(timestamp),
    timestamp,
    observedTimestamp,
    severityNumber,
    severityText: severityToLogLevel(severityNumber) as LogLevel,
    body: extractOTELBody(otelLog.body),
    attributes,
    resource: {}, // Resource is usually in a separate structure in OTEL
    traceId: otelLog.traceId,
    spanId: otelLog.spanId,
    traceFlags: otelLog.flags,
  };
}

export function transformOTELv1LogsToTFO(
  otelLogs: OTELv1LogRecord[]
): LogRecord[] {
  return otelLogs.map(transformOTELv1LogToTFO);
}

// ============================================
// TFO to OTEL v1 Transformation
// ============================================

export function transformTFOLogToOTELv1(log: LogRecord): OTELv1LogRecord {
  return {
    timeUnixNano: millisToNanos(log.timestamp),
    observedTimeUnixNano: millisToNanos(log.observedTimestamp),
    severityNumber: log.severityNumber,
    severityText: OTEL_SEVERITY_TEXT[log.severityNumber],
    body: valueToAnyValue(log.body),
    attributes: recordToOtelKeyValue(log.attributes),
    droppedAttributesCount: 0,
    traceId: log.traceId,
    spanId: log.spanId,
    flags: log.traceFlags,
  };
}

export function transformTFOLogsToOTELv1(
  logs: LogRecord[]
): OTELv1LogRecord[] {
  return logs.map(transformTFOLogToOTELv1);
}

// ============================================
// Severity Transformations
// ============================================

export { severityNumberToText, severityTextToNumber };

export function normalizeLogLevel(level: string): LogLevel {
  const lower = level.toLowerCase();
  switch (lower) {
    case 'trace':
    case 'finest':
    case 'verbose':
      return 'trace';
    case 'debug':
    case 'fine':
      return 'debug';
    case 'info':
    case 'information':
    case 'notice':
      return 'info';
    case 'warn':
    case 'warning':
      return 'warn';
    case 'error':
    case 'severe':
    case 'err':
      return 'error';
    case 'fatal':
    case 'critical':
    case 'emergency':
    case 'alert':
      return 'fatal';
    default:
      return 'info';
  }
}

export function logLevelToSeverityRange(level: LogLevel): [number, number] {
  switch (level) {
    case 'trace':
      return [1, 4];
    case 'debug':
      return [5, 8];
    case 'info':
      return [9, 12];
    case 'warn':
      return [13, 16];
    case 'error':
      return [17, 20];
    case 'fatal':
      return [21, 24];
    default:
      return [9, 12];
  }
}

// ============================================
// Body Extraction Helpers
// ============================================

function extractOTELBody(body: import('../types').OTELv1AnyValue): string {
  const value = extractAnyValue(body);
  if (value !== undefined) {
    return String(value);
  }
  return '';
}

// ============================================
// Log Formatting
// ============================================

export function formatLogMessage(log: LogRecord): string {
  const timestamp = new Date(log.timestamp).toISOString();
  const level = log.severityText.toUpperCase().padEnd(5);
  const service = log.resource['service.name'] ?? 'unknown';
  return `${timestamp} [${level}] [${service}] ${log.body}`;
}

export function formatLogAsJson(log: LogRecord): string {
  return JSON.stringify({
    timestamp: new Date(log.timestamp).toISOString(),
    level: log.severityText,
    message: log.body,
    service: log.resource['service.name'],
    attributes: log.attributes,
    traceId: log.traceId,
    spanId: log.spanId,
  }, null, 2);
}

// ============================================
// Log Filtering Helpers
// ============================================

export function filterLogsByLevel(
  logs: LogRecord[],
  minLevel: LogLevel
): LogRecord[] {
  const minSeverity = logLevelToSeverity(minLevel);
  return logs.filter(log => log.severityNumber >= minSeverity);
}

export function filterLogsByService(
  logs: LogRecord[],
  services: string[]
): LogRecord[] {
  const serviceSet = new Set(services);
  return logs.filter(log => serviceSet.has(log.resource['service.name']));
}

export function filterLogsByTimeRange(
  logs: LogRecord[],
  start: number,
  end: number
): LogRecord[] {
  return logs.filter(log => log.timestamp >= start && log.timestamp <= end);
}

export function filterLogsByQuery(
  logs: LogRecord[],
  query: string
): LogRecord[] {
  const lowerQuery = query.toLowerCase();
  return logs.filter(log => {
    // Search in body
    if (log.body.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    // Search in attributes
    for (const value of Object.values(log.attributes)) {
      if (String(value).toLowerCase().includes(lowerQuery)) {
        return true;
      }
    }
    // Search in resource
    for (const value of Object.values(log.resource)) {
      if (value.toLowerCase().includes(lowerQuery)) {
        return true;
      }
    }
    return false;
  });
}

// ============================================
// Log Aggregation Helpers
// ============================================

export function groupLogsByLevel(
  logs: LogRecord[]
): Map<LogLevel, LogRecord[]> {
  const groups = new Map<LogLevel, LogRecord[]>();

  for (const log of logs) {
    const level = log.severityText;
    if (!groups.has(level)) {
      groups.set(level, []);
    }
    groups.get(level)!.push(log);
  }

  return groups;
}

export function groupLogsByService(
  logs: LogRecord[]
): Map<string, LogRecord[]> {
  const groups = new Map<string, LogRecord[]>();

  for (const log of logs) {
    const service = log.resource['service.name'] ?? 'unknown';
    if (!groups.has(service)) {
      groups.set(service, []);
    }
    groups.get(service)!.push(log);
  }

  return groups;
}

export function countLogsByLevel(
  logs: LogRecord[]
): Record<LogLevel, number> {
  const counts: Record<LogLevel, number> = {
    trace: 0,
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0,
  };

  for (const log of logs) {
    counts[log.severityText]++;
  }

  return counts;
}
