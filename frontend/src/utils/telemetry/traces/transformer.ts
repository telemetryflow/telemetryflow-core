/**
 * Traces Transformer
 * Transform traces between OTEL v1 and TFO v2 formats
 */

import type {
  Span,
  SpanKind,
  SpanStatusCode,
  Trace,
  OTELv1Span,
  OTELv1SpanEvent,
  OTELv1SpanStatus,
} from '../types';
import {
  otelKeyValueToRecord,
  recordToOtelKeyValue,
  nanosToMillis,
  millisToNanos,
  spanKindToString,
  stringToSpanKind,
  spanStatusCodeToString,
  stringToSpanStatusCode,
} from '../common/transformer';

// ============================================
// OTEL v1 to TFO Transformation
// ============================================

export function transformOTELv1SpanToTFO(otelSpan: OTELv1Span): Span {
  const startTime = nanosToMillis(otelSpan.startTimeUnixNano);
  const endTime = nanosToMillis(otelSpan.endTimeUnixNano);
  const duration = endTime - startTime;

  const attributes = otelKeyValueToRecord(otelSpan.attributes);
  const serviceName = String(attributes['service.name'] ?? 'unknown-service');

  return {
    traceId: otelSpan.traceId,
    spanId: otelSpan.spanId,
    parentSpanId: otelSpan.parentSpanId,
    name: otelSpan.name,
    kind: spanKindToString(otelSpan.kind) as SpanKind,
    startTime,
    endTime,
    duration,
    status: transformOTELv1StatusToTFO(otelSpan.status),
    attributes,
    events: otelSpan.events.map(transformOTELv1EventToTFO),
    links: otelSpan.links.map(link => ({
      traceId: link.traceId,
      spanId: link.spanId,
      traceState: link.traceState,
      attributes: otelKeyValueToRecord(link.attributes),
    })),
    resource: {}, // Resource typically comes from a separate structure
    serviceName,
  };
}

export function transformOTELv1SpansToTFO(otelSpans: OTELv1Span[]): Span[] {
  return otelSpans.map(transformOTELv1SpanToTFO);
}

function transformOTELv1EventToTFO(
  event: OTELv1SpanEvent
): import('../types').SpanEvent {
  return {
    name: event.name,
    timestamp: nanosToMillis(event.timeUnixNano),
    attributes: otelKeyValueToRecord(event.attributes),
  };
}

function transformOTELv1StatusToTFO(
  status: OTELv1SpanStatus
): import('../types').SpanStatus {
  return {
    code: spanStatusCodeToString(status.code) as SpanStatusCode,
    message: status.message,
  };
}

// ============================================
// TFO to OTEL v1 Transformation
// ============================================

export function transformTFOSpanToOTELv1(span: Span): OTELv1Span {
  return {
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    name: span.name,
    kind: stringToSpanKind(span.kind),
    startTimeUnixNano: millisToNanos(span.startTime),
    endTimeUnixNano: millisToNanos(span.endTime),
    attributes: recordToOtelKeyValue(span.attributes),
    events: span.events.map(event => ({
      timeUnixNano: millisToNanos(event.timestamp),
      name: event.name,
      attributes: recordToOtelKeyValue(event.attributes),
    })),
    links: span.links.map(link => ({
      traceId: link.traceId,
      spanId: link.spanId,
      traceState: link.traceState,
      attributes: recordToOtelKeyValue(link.attributes),
    })),
    status: {
      code: stringToSpanStatusCode(span.status.code),
      message: span.status.message,
    },
  };
}

export function transformTFOSpansToOTELv1(spans: Span[]): OTELv1Span[] {
  return spans.map(transformTFOSpanToOTELv1);
}

// ============================================
// Span Kind Transformers
// ============================================

export { spanKindToString, stringToSpanKind };

export function getSpanKindLabel(kind: SpanKind | number): string {
  const kindStr = typeof kind === 'number' ? spanKindToString(kind) : kind;
  const labels: Record<string, string> = {
    unspecified: 'Unspecified',
    internal: 'Internal',
    server: 'Server',
    client: 'Client',
    producer: 'Producer',
    consumer: 'Consumer',
  };
  return labels[kindStr] ?? 'Unknown';
}

export function isClientSpan(span: Span): boolean {
  return span.kind === 'client';
}

export function isServerSpan(span: Span): boolean {
  return span.kind === 'server';
}

// ============================================
// Span Status Transformers
// ============================================

export { spanStatusCodeToString, stringToSpanStatusCode };

export function isErrorSpan(span: Span): boolean {
  return span.status.code === 'error';
}

export function isSuccessSpan(span: Span): boolean {
  return span.status.code === 'ok';
}

// ============================================
// Trace Building
// ============================================

export function buildTraceFromSpans(spans: Span[]): Trace | null {
  if (spans.length === 0) return null;

  // Find root span (no parent)
  const rootSpan = spans.find(s => !s.parentSpanId);
  if (!rootSpan) return null;

  const services = [...new Set(spans.map(s => s.serviceName))];
  const errorCount = spans.filter(s => s.status.code === 'error').length;

  // Calculate total duration from root span
  const startTime = rootSpan.startTime;
  const endTime = Math.max(...spans.map(s => s.endTime));
  const duration = endTime - startTime;

  return {
    traceId: rootSpan.traceId,
    rootSpan,
    spans,
    services,
    duration,
    spanCount: spans.length,
    errorCount,
    startTime,
  };
}

// ============================================
// Span Tree Building
// ============================================

export interface SpanTreeNode {
  span: Span;
  children: SpanTreeNode[];
  depth: number;
}

export function buildSpanTree(spans: Span[]): SpanTreeNode | null {
  if (spans.length === 0) return null;

  const spanMap = new Map<string, Span>();
  const childrenMap = new Map<string, Span[]>();

  // Build maps
  for (const span of spans) {
    spanMap.set(span.spanId, span);

    const parentId = span.parentSpanId ?? 'root';
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(span);
  }

  // Find root
  const rootSpan = spans.find(s => !s.parentSpanId);
  if (!rootSpan) return null;

  // Build tree recursively
  function buildNode(span: Span, depth: number): SpanTreeNode {
    const children = childrenMap.get(span.spanId) ?? [];
    return {
      span,
      children: children
        .sort((a, b) => a.startTime - b.startTime)
        .map(child => buildNode(child, depth + 1)),
      depth,
    };
  }

  return buildNode(rootSpan, 0);
}

export function flattenSpanTree(root: SpanTreeNode): Span[] {
  const result: Span[] = [root.span];
  for (const child of root.children) {
    result.push(...flattenSpanTree(child));
  }
  return result;
}

// ============================================
// Span Filtering
// ============================================

export function filterSpansByService(
  spans: Span[],
  service: string
): Span[] {
  return spans.filter(s => s.serviceName === service);
}

export function filterSpansByKind(
  spans: Span[],
  kind: SpanKind
): Span[] {
  return spans.filter(s => s.kind === kind);
}

export function filterErrorSpans(spans: Span[]): Span[] {
  return spans.filter(isErrorSpan);
}

// ============================================
// Duration Calculations
// ============================================

export function calculateSelfTime(span: Span, allSpans: Span[]): number {
  const childSpans = allSpans.filter(s => s.parentSpanId === span.spanId);
  const childDuration = childSpans.reduce((sum, s) => sum + s.duration, 0);
  return Math.max(0, span.duration - childDuration);
}

export function calculateCriticalPath(trace: Trace): Span[] {
  const criticalPath: Span[] = [];

  // Simple critical path: follow the longest child at each level
  let current: Span | undefined = trace.rootSpan;

  while (current) {
    criticalPath.push(current);
    const children = trace.spans.filter(s => s.parentSpanId === current!.spanId);
    if (children.length === 0) break;
    current = children.reduce((longest, s) => (s.duration > longest.duration ? s : longest));
  }

  return criticalPath;
}

// ============================================
// Attribute Extraction
// ============================================

export function extractHttpAttributes(span: Span): {
  method?: string;
  url?: string;
  statusCode?: number;
  route?: string;
} {
  return {
    method: span.attributes['http.method'] as string | undefined,
    url: span.attributes['http.url'] as string | undefined,
    statusCode: span.attributes['http.status_code'] as number | undefined,
    route: span.attributes['http.route'] as string | undefined,
  };
}

export function extractDbAttributes(span: Span): {
  system?: string;
  statement?: string;
  operation?: string;
} {
  return {
    system: span.attributes['db.system'] as string | undefined,
    statement: span.attributes['db.statement'] as string | undefined,
    operation: span.attributes['db.operation'] as string | undefined,
  };
}
