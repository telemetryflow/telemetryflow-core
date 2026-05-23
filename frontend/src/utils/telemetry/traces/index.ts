/**
 * Traces Helpers Export
 */

// Generator
export {
  generateSpan,
  generateTrace,
  generateMockTraces,
  generateTracesForService,
  generateServiceMap,
  generateServiceDependency,
  generateLatencyDistribution,
  generateLatencyStatsForServices,
  generateTraceSummary,
  generateTraceSummaries,
  buildTraceQuery,
} from './generator';
export type { TraceGeneratorConfig } from './generator';

// Fetcher
export {
  fetchTraces,
  fetchTraceById,
  fetchServices,
  fetchOperations,
  fetchDependencies,
  fetchLatencyStats,
  fetchServiceMetrics,
} from './fetcher';

// Transformer
export {
  transformOTELv1SpanToTFO,
  transformOTELv1SpansToTFO,
  transformTFOSpanToOTELv1,
  transformTFOSpansToOTELv1,
  spanKindToString,
  stringToSpanKind,
  spanStatusCodeToString,
  stringToSpanStatusCode,
  getSpanKindLabel,
  isClientSpan,
  isServerSpan,
  isErrorSpan,
  isSuccessSpan,
  buildTraceFromSpans,
  buildSpanTree,
  flattenSpanTree,
  filterSpansByService,
  filterSpansByKind,
  filterErrorSpans,
  calculateSelfTime,
  calculateCriticalPath,
  extractHttpAttributes,
  extractDbAttributes,
} from './transformer';
export type { SpanTreeNode } from './transformer';
