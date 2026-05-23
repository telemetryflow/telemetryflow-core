/**
 * Common Utilities Export
 */

// Fetcher utilities
export {
  fetchTelemetryData,
  fetchMultiple,
  fetchWithRetry,
  createFetchOptions,
  createSuccessResponse,
  createErrorResponse,
  buildUrl,
  getEndpoint,
  createMockSource,
  createOTELv1Source,
  createTFOv2Source,
  isValidSource,
} from './fetcher';
export type { FetchOptions } from './fetcher';

// Generator utilities
export {
  SeededRandom,
  setGlobalSeed,
  getGlobalRandom,
  createSeededRandom,
  generateTimeSeries,
  generatePercentageTimeSeries,
  generateCounterTimeSeries,
  generateTraceId,
  generateSpanId,
  generateMetricId,
  generateLogId,
  generateAlertId,
  generateUUID,
  generateOTELResource,
  generateVMResource,
  generateK8sResource,
  generateHostname,
  generatePodName,
  generateNodeName,
  generateTimestamp,
  generateTimestamps,
  getDefaultTimeRange,
  getRecommendedInterval,
  // Chart-friendly series generators
  generateChartSeries,
  generateChartSeriesMultiple,
  toChartSeries,
  fromChartSeries,
} from './generator';
export type { ChartSeries } from './generator';

// Transformer utilities
export {
  // OTEL transformers
  otelKeyValueToRecord,
  recordToOtelKeyValue,
  extractAnyValue,
  valueToAnyValue,
  metricLabelsToRecord,
  recordToMetricLabels,
  flattenResource,
  extractServiceFromResource,
  extractNamespaceFromResource,
  // Timestamp transformers
  nanosToMillis,
  millisToNanos,
  isoToMillis,
  millisToIso,
  // Severity transformers
  severityNumberToText,
  severityTextToNumber,
  severityToLogLevel,
  logLevelToSeverity,
  // Span transformers
  spanKindToString,
  stringToSpanKind,
  spanStatusCodeToString,
  stringToSpanStatusCode,
  // Duration transformers
  nanosToDuration,
  durationToNanos,
  // Byte units (constants)
  BINARY_UNITS,
  DECIMAL_UNITS,
  // Binary (IEC) byte conversions
  bytesToKiB,
  bytesToMiB,
  bytesToGiB,
  bytesToTiB,
  kibToBytes,
  mibToBytes,
  gibToBytes,
  tibToBytes,
  // Decimal (SI) byte conversions
  bytesToKB,
  bytesToMB,
  bytesToGB,
  bytesToTB,
  kbToBytes,
  mbToBytes,
  gbToBytes,
  tbToBytes,
  // Auto-format byte functions
  formatBytes,
  formatBytesBinary,
  formatBytesDecimal,
  formatBytesShort,
  // Parse byte functions
  parseBytes,
  parseK8sResourceValue,
  formatK8sResourceValue,
  renderResourceValue,
  // Bandwidth/rate functions
  formatBandwidth,
  formatTransferRate,
  bytesToBits,
  bitsToBytes,
  // Percentage transformers
  ratioToPercent,
  percentToRatio,
  calculateUtilization,
  // Query transformers
  transformPromQLToTFQL,
  transformTFQLToPromQL,
} from './transformer';
export type { FormatBytesOptions, BinaryUnit, DecimalUnit, ByteUnit } from './transformer';
