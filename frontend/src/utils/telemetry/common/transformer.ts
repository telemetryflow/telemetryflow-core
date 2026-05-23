/**
 * Common Transformer Utilities
 * Data transformation between OTEL v1 and TFO v2 formats
 */

import type {
  OTELv1KeyValue,
  OTELv1AnyValue,
  OTELResource,
  MetricLabel,
} from "../types";
import {
  OTEL_SEVERITY_TEXT,
  OTEL_SPAN_KIND_TEXT,
  OTEL_SPAN_STATUS_TEXT,
} from "../constants";

// ============================================
// OTEL KeyValue Transformers
// ============================================

export function otelKeyValueToRecord(
  kvList: OTELv1KeyValue[],
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  for (const kv of kvList) {
    const value = extractAnyValue(kv.value);
    if (value !== undefined) {
      result[kv.key] = value;
    }
  }

  return result;
}

export function recordToOtelKeyValue(
  record: Record<string, string | number | boolean>,
): OTELv1KeyValue[] {
  return Object.entries(record).map(([key, value]) => ({
    key,
    value: valueToAnyValue(value),
  }));
}

export function extractAnyValue(
  anyValue: OTELv1AnyValue,
): string | number | boolean | undefined {
  if (anyValue.stringValue !== undefined) return anyValue.stringValue;
  if (anyValue.intValue !== undefined) return parseInt(anyValue.intValue, 10);
  if (anyValue.doubleValue !== undefined) return anyValue.doubleValue;
  if (anyValue.boolValue !== undefined) return anyValue.boolValue;
  return undefined;
}

export function valueToAnyValue(
  value: string | number | boolean,
): OTELv1AnyValue {
  if (typeof value === "string") {
    return { stringValue: value };
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { intValue: String(value) };
    }
    return { doubleValue: value };
  }
  if (typeof value === "boolean") {
    return { boolValue: value };
  }
  return { stringValue: String(value) };
}

// ============================================
// Metric Label Transformers
// ============================================

export function metricLabelsToRecord(
  labels: MetricLabel[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const label of labels) {
    result[label.key] = label.value;
  }
  return result;
}

export function recordToMetricLabels(
  record: Record<string, string>,
): MetricLabel[] {
  return Object.entries(record).map(([key, value]) => ({ key, value }));
}

// ============================================
// Resource Transformers
// ============================================

export function flattenResource(
  resource: OTELResource,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(resource)) {
    if (value !== undefined) {
      result[key] = String(value);
    }
  }

  return result;
}

export function extractServiceFromResource(resource: OTELResource): string {
  return resource["service.name"] ?? "unknown-service";
}

export function extractNamespaceFromResource(resource: OTELResource): string {
  return (
    resource["service.namespace"] ?? resource["k8s.namespace.name"] ?? "default"
  );
}

// ============================================
// Timestamp Transformers
// ============================================

export function nanosToMillis(nanos: string | number): number {
  const value = typeof nanos === "string" ? parseInt(nanos, 10) : nanos;
  return Math.floor(value / 1_000_000);
}

export function millisToNanos(millis: number): string {
  return String(millis * 1_000_000);
}

export function isoToMillis(iso: string): number {
  return new Date(iso).getTime();
}

export function millisToIso(millis: number): string {
  return new Date(millis).toISOString();
}

// ============================================
// Severity Transformers
// ============================================

export function severityNumberToText(severityNumber: number): string {
  return OTEL_SEVERITY_TEXT[severityNumber] ?? "UNSPECIFIED";
}

export function severityTextToNumber(severityText: string): number {
  const upper = severityText.toUpperCase();
  const entry = Object.entries(OTEL_SEVERITY_TEXT).find(
    ([, text]) => text === upper,
  );
  return entry ? parseInt(entry[0], 10) : 9; // Default to INFO
}

export function severityToLogLevel(severityNumber: number): string {
  if (severityNumber <= 4) return "trace";
  if (severityNumber <= 8) return "debug";
  if (severityNumber <= 12) return "info";
  if (severityNumber <= 16) return "warn";
  if (severityNumber <= 20) return "error";
  return "fatal";
}

export function logLevelToSeverity(level: string): number {
  const lowerLevel = level.toLowerCase();
  switch (lowerLevel) {
    case "trace":
      return 1;
    case "debug":
      return 5;
    case "info":
      return 9;
    case "warn":
    case "warning":
      return 13;
    case "error":
      return 17;
    case "fatal":
    case "critical":
      return 21;
    default:
      return 9;
  }
}

// ============================================
// Span Kind Transformers
// ============================================

export function spanKindToString(kind: number): string {
  return OTEL_SPAN_KIND_TEXT[kind] ?? "unspecified";
}

export function stringToSpanKind(kind: string): number {
  const lower = kind.toLowerCase();
  const entry = Object.entries(OTEL_SPAN_KIND_TEXT).find(
    ([, text]) => text === lower,
  );
  return entry ? parseInt(entry[0], 10) : 0;
}

// ============================================
// Span Status Transformers
// ============================================

export function spanStatusCodeToString(code: number): string {
  return OTEL_SPAN_STATUS_TEXT[code] ?? "unset";
}

export function stringToSpanStatusCode(status: string): number {
  const lower = status.toLowerCase();
  const entry = Object.entries(OTEL_SPAN_STATUS_TEXT).find(
    ([, text]) => text === lower,
  );
  return entry ? parseInt(entry[0], 10) : 0;
}

// ============================================
// Duration Transformers
// ============================================

export function nanosToDuration(startNanos: string, endNanos: string): number {
  const start = parseInt(startNanos, 10);
  const end = parseInt(endNanos, 10);
  return Math.floor((end - start) / 1_000_000); // Convert to milliseconds
}

export function durationToNanos(durationMs: number): string {
  return String(durationMs * 1_000_000);
}

// ============================================
// Bytes/Memory Transformers (Standardized)
// ============================================

/**
 * Binary (IEC) units - base 1024
 * Used by: RAM, disk storage, file sizes (traditional)
 */
export const BINARY_UNITS = {
  B: 1,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  PiB: 1024 ** 5,
} as const;

/**
 * Decimal (SI) units - base 1000
 * Used by: Network speeds, hard drive marketing, scientific notation
 */
export const DECIMAL_UNITS = {
  B: 1,
  KB: 1000,
  MB: 1000 ** 2,
  GB: 1000 ** 3,
  TB: 1000 ** 4,
  PB: 1000 ** 5,
} as const;

export type BinaryUnit = keyof typeof BINARY_UNITS;
export type DecimalUnit = keyof typeof DECIMAL_UNITS;
export type ByteUnit = BinaryUnit | DecimalUnit;

// ---- Conversion Functions (Binary - IEC) ----

/** Convert bytes to KiB (Kibibytes, 1024 bytes) */
export function bytesToKiB(bytes: number): number {
  return bytes / BINARY_UNITS.KiB;
}

/** Convert bytes to MiB (Mebibytes, 1024² bytes) */
export function bytesToMiB(bytes: number): number {
  return bytes / BINARY_UNITS.MiB;
}

/** Convert bytes to GiB (Gibibytes, 1024³ bytes) */
export function bytesToGiB(bytes: number): number {
  return bytes / BINARY_UNITS.GiB;
}

/** Convert bytes to TiB (Tebibytes, 1024⁴ bytes) */
export function bytesToTiB(bytes: number): number {
  return bytes / BINARY_UNITS.TiB;
}

/** Convert KiB to bytes */
export function kibToBytes(kib: number): number {
  return kib * BINARY_UNITS.KiB;
}

/** Convert MiB to bytes */
export function mibToBytes(mib: number): number {
  return mib * BINARY_UNITS.MiB;
}

/** Convert GiB to bytes */
export function gibToBytes(gib: number): number {
  return gib * BINARY_UNITS.GiB;
}

/** Convert TiB to bytes */
export function tibToBytes(tib: number): number {
  return tib * BINARY_UNITS.TiB;
}

// ---- Conversion Functions (Decimal - SI) ----

/** Convert bytes to KB (Kilobytes, 1000 bytes) */
export function bytesToKB(bytes: number): number {
  return bytes / DECIMAL_UNITS.KB;
}

/** Convert bytes to MB (Megabytes, 1000² bytes) */
export function bytesToMB(bytes: number): number {
  return bytes / DECIMAL_UNITS.MB;
}

/** Convert bytes to GB (Gigabytes, 1000³ bytes) */
export function bytesToGB(bytes: number): number {
  return bytes / DECIMAL_UNITS.GB;
}

/** Convert bytes to TB (Terabytes, 1000⁴ bytes) */
export function bytesToTB(bytes: number): number {
  return bytes / DECIMAL_UNITS.TB;
}

/** Convert KB to bytes */
export function kbToBytes(kb: number): number {
  return kb * DECIMAL_UNITS.KB;
}

/** Convert MB to bytes */
export function mbToBytes(mb: number): number {
  return mb * DECIMAL_UNITS.MB;
}

/** Convert GB to bytes */
export function gbToBytes(gb: number): number {
  return gb * DECIMAL_UNITS.GB;
}

/** Convert TB to bytes */
export function tbToBytes(tb: number): number {
  return tb * DECIMAL_UNITS.TB;
}

// ---- Auto-Format Functions ----

export interface FormatBytesOptions {
  /** Use binary (IEC: KiB, MiB, GiB) or decimal (SI: KB, MB, GB) units */
  binary?: boolean;
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Include space between number and unit (default: true) */
  space?: boolean;
  /** Force specific unit (skip auto-detection) */
  unit?: ByteUnit;
}

/**
 * Format bytes to human-readable string with auto-detection of best unit
 * @param bytes - Number of bytes
 * @param options - Formatting options
 * @returns Formatted string (e.g., "1.5 GiB" or "1.5 GB")
 */
export function formatBytes(
  bytes: number,
  options: FormatBytesOptions = {},
): string {
  const { binary = true, decimals = 2, space = true } = options;

  if (bytes === 0) return `0${space ? " " : ""}B`;

  const absBytes = Math.abs(bytes);
  const units = binary ? BINARY_UNITS : DECIMAL_UNITS;
  const unitNames = Object.keys(units) as (BinaryUnit | DecimalUnit)[];

  // Find the best unit
  let selectedUnit: BinaryUnit | DecimalUnit = "B";
  for (let i = unitNames.length - 1; i >= 0; i--) {
    const unitName = unitNames[i];
    if (absBytes >= units[unitName as keyof typeof units]) {
      selectedUnit = unitName;
      break;
    }
  }

  // If unit is forced, use it
  const finalUnit = options.unit ?? selectedUnit;
  const divisor = units[finalUnit as keyof typeof units] ?? 1;
  const value = bytes / divisor;

  return `${value.toFixed(decimals)}${space ? " " : ""}${finalUnit}`;
}

/**
 * Format bytes using binary units (IEC) - for RAM, file sizes
 */
export function formatBytesBinary(bytes: number, decimals = 2): string {
  return formatBytes(bytes, { binary: true, decimals });
}

/**
 * Format bytes using decimal units (SI) - for network, disk marketing
 */
export function formatBytesDecimal(bytes: number, decimals = 2): string {
  return formatBytes(bytes, { binary: false, decimals });
}

/**
 * Format bytes in short format without space (e.g., "1.5GiB")
 */
export function formatBytesShort(bytes: number, binary = true): string {
  return formatBytes(bytes, { binary, decimals: 1, space: false });
}

// ---- Parse Functions ----

/**
 * Parse a byte string to number of bytes
 * Supports: B, KB, MB, GB, TB, KiB, MiB, GiB, TiB, K, M, G, T
 * @param value - String like "1.5 GiB", "500MB", "1T", etc.
 * @returns Number of bytes
 */
export function parseBytes(value: string): number {
  if (!value) return 0;

  const trimmed = value.trim();
  const match = trimmed.match(
    /^(-?\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB|PB|KiB|MiB|GiB|TiB|PiB|K|M|G|T|P|Ki|Mi|Gi|Ti|Pi)?$/i,
  );

  if (!match) return parseFloat(trimmed) || 0;

  const num = parseFloat(match[1]);
  const unit = (match[2] || "B").toUpperCase();

  // Map shorthand units
  const unitMap: Record<string, number> = {
    B: 1,
    // Decimal (SI)
    K: DECIMAL_UNITS.KB,
    KB: DECIMAL_UNITS.KB,
    M: DECIMAL_UNITS.MB,
    MB: DECIMAL_UNITS.MB,
    G: DECIMAL_UNITS.GB,
    GB: DECIMAL_UNITS.GB,
    T: DECIMAL_UNITS.TB,
    TB: DECIMAL_UNITS.TB,
    P: DECIMAL_UNITS.PB,
    PB: DECIMAL_UNITS.PB,
    // Binary (IEC)
    KI: BINARY_UNITS.KiB,
    KIB: BINARY_UNITS.KiB,
    MI: BINARY_UNITS.MiB,
    MIB: BINARY_UNITS.MiB,
    GI: BINARY_UNITS.GiB,
    GIB: BINARY_UNITS.GiB,
    TI: BINARY_UNITS.TiB,
    TIB: BINARY_UNITS.TiB,
    PI: BINARY_UNITS.PiB,
    PIB: BINARY_UNITS.PiB,
  };

  return num * (unitMap[unit] ?? 1);
}

/**
 * Parse Kubernetes resource value (memory or CPU)
 * Memory: 128Mi, 1Gi, 1024Ki, 1G, 500M
 * CPU: 100m (millicores), 2 (cores), 0.5 (cores)
 */
export function parseK8sResourceValue(value: string): number {
  if (!value) return 0;

  const trimmed = value.trim();

  // CPU millicores (e.g., "100m", "500m")
  if (trimmed.endsWith("m") && !trimmed.match(/[GMK]i?$/i)) {
    return parseInt(trimmed.slice(0, -1), 10) / 1000;
  }

  // Memory/storage values - use parseBytes for consistency
  const memoryMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti|Pi|K|M|G|T|P)?$/i,
  );
  if (memoryMatch) {
    return parseBytes(trimmed);
  }

  return parseFloat(trimmed) || 0;
}

/**
 * Format K8s resource value to human-readable string
 */
export function formatK8sResourceValue(
  bytes: number,
  type: "memory" | "cpu" = "memory",
): string {
  if (type === "cpu") {
    if (bytes < 1) {
      return `${Math.round(bytes * 1000)}m`;
    }
    return `${bytes.toFixed(2)} cores`;
  }
  return formatBytesBinary(bytes);
}

/**
 * Render a K8s/VM resource string (e.g., "512Mi", "2Gi", "100m", raw bytes)
 * to a human-readable formatted string.
 * Reusable in datatable render() functions across K8s, VM, and Agent views.
 *
 * @param value - Resource string like "512Mi", "2Gi", "100m", "1073741824"
 * @param type  - 'memory' (default) formats as bytes, 'cpu' formats as cores/millicores
 * @returns Formatted string (e.g., "512.00 MiB", "2.00 GiB", "100m")
 */
export function renderResourceValue(
  value: string | number | null | undefined,
  type: "memory" | "cpu" = "memory",
): string {
  if (value == null || value === "" || value === "-") return "-";
  const str = String(value).trim();
  if (!str) return "-";

  if (type === "cpu") {
    const parsed = parseK8sResourceValue(str);
    return formatK8sResourceValue(parsed, "cpu");
  }

  // Try parsing as K8s resource string (Ki, Mi, Gi, Ti, etc.)
  const parsed = parseBytes(str);
  if (parsed > 0) return formatBytesBinary(parsed);

  // Try raw numeric bytes
  const rawBytes = parseFloat(str);
  if (!isNaN(rawBytes) && rawBytes > 0) return formatBytesBinary(rawBytes);

  return str;
}

// ---- Bandwidth/Rate Functions ----

/**
 * Format bandwidth (bits per second)
 * @param bitsPerSecond - Bits per second
 * @returns Formatted string (e.g., "1.5 Gbps")
 */
export function formatBandwidth(bitsPerSecond: number): string {
  const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
  let unitIndex = 0;
  let value = bitsPerSecond;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format bytes per second as transfer rate
 * @param bytesPerSecond - Bytes per second
 * @param binary - Use binary units (default: true)
 * @returns Formatted string (e.g., "1.5 MiB/s")
 */
export function formatTransferRate(
  bytesPerSecond: number,
  binary = true,
): string {
  return `${formatBytes(bytesPerSecond, { binary, decimals: 2 })}/s`;
}

/**
 * Convert bytes/sec to bits/sec
 */
export function bytesToBits(bytes: number): number {
  return bytes * 8;
}

/**
 * Convert bits/sec to bytes/sec
 */
export function bitsToBytes(bits: number): number {
  return bits / 8;
}

// ============================================
// Percentage Transformers
// ============================================

export function ratioToPercent(ratio: number): number {
  return Math.round(ratio * 10000) / 100;
}

export function percentToRatio(percent: number): number {
  return percent / 100;
}

export function calculateUtilization(used: number, total: number): number {
  if (total === 0) return 0;
  return ratioToPercent(used / total);
}

// ============================================
// Query Transformers
// ============================================

export function transformPromQLToTFQL(promql: string): string {
  // Basic transformation - more complex transformations can be added
  let tfql = promql;

  // Replace metric name pattern
  tfql = tfql.replace(/(\w+)\{([^}]*)\}/g, (_, name, labels) => {
    const labelParts = labels.split(",").map((l: string) => {
      const [key, value] = l.trim().split("=");
      return `${key}:${value}`;
    });
    return `${name} | where ${labelParts.join(" and ")}`;
  });

  return tfql;
}

export function transformTFQLToPromQL(tfql: string): string {
  // Basic transformation
  let promql = tfql;

  // Replace where clauses with label selectors
  const whereMatch = promql.match(/(\w+)\s*\|\s*where\s+(.+)/);
  if (whereMatch) {
    const [, metric, conditions] = whereMatch;
    const labels = conditions.split(/\s+and\s+/i).map((c: string) => {
      const [key, value] = c.split(":");
      return `${key}=${value}`;
    });
    promql = `${metric}{${labels.join(",")}}`;
  }

  return promql;
}
