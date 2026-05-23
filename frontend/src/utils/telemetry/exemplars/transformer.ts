/**
 * Exemplars Transformer
 * Transform and process exemplar data
 */

import type {
  Exemplar,
  ExemplarCorrelation,
  MetricExemplarSeries,
} from '../types';

// ============================================
// Grouping Functions
// ============================================

export function groupExemplarsByMetric(
  exemplars: Exemplar[]
): Map<string, Exemplar[]> {
  const groups = new Map<string, Exemplar[]>();

  for (const exemplar of exemplars) {
    const metricName = exemplar.metricName;
    if (!groups.has(metricName)) {
      groups.set(metricName, []);
    }
    groups.get(metricName)!.push(exemplar);
  }

  return groups;
}

export function groupExemplarsByService(
  exemplars: Exemplar[]
): Map<string, Exemplar[]> {
  const groups = new Map<string, Exemplar[]>();

  for (const exemplar of exemplars) {
    const service = exemplar.labels['service'] ?? 'unknown';
    if (!groups.has(service)) {
      groups.set(service, []);
    }
    groups.get(service)!.push(exemplar);
  }

  return groups;
}

export function groupExemplarsByTraceId(
  exemplars: Exemplar[]
): Map<string, Exemplar[]> {
  const groups = new Map<string, Exemplar[]>();

  for (const exemplar of exemplars) {
    const traceId = exemplar.traceId;
    if (!groups.has(traceId)) {
      groups.set(traceId, []);
    }
    groups.get(traceId)!.push(exemplar);
  }

  return groups;
}

// ============================================
// Filtering Functions
// ============================================

export function filterExemplarsByTimeRange(
  exemplars: Exemplar[],
  start: number,
  end: number
): Exemplar[] {
  return exemplars.filter(e => e.timestamp >= start && e.timestamp <= end);
}

export function filterExemplarsByValue(
  exemplars: Exemplar[],
  minValue?: number,
  maxValue?: number
): Exemplar[] {
  return exemplars.filter(e => {
    if (minValue !== undefined && e.value < minValue) return false;
    if (maxValue !== undefined && e.value > maxValue) return false;
    return true;
  });
}

export function filterExemplarsByLabel(
  exemplars: Exemplar[],
  labelKey: string,
  labelValue: string
): Exemplar[] {
  return exemplars.filter(e => e.labels[labelKey] === labelValue);
}

export function filterHighLatencyExemplars(
  exemplars: Exemplar[],
  threshold: number
): Exemplar[] {
  return exemplars.filter(e => e.value > threshold);
}

export function filterErrorExemplars(exemplars: Exemplar[]): Exemplar[] {
  return exemplars.filter(e =>
    e.labels['error'] === 'true' ||
    e.labels['status'] === '500' ||
    e.labels['status_code'] === '500'
  );
}

// ============================================
// Sorting Functions
// ============================================

export function sortExemplarsByTimestamp(
  exemplars: Exemplar[],
  descending = false
): Exemplar[] {
  return [...exemplars].sort((a, b) =>
    descending ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  );
}

export function sortExemplarsByValue(
  exemplars: Exemplar[],
  descending = true
): Exemplar[] {
  return [...exemplars].sort((a, b) =>
    descending ? b.value - a.value : a.value - b.value
  );
}

// ============================================
// Statistics Functions
// ============================================

export function calculateExemplarStats(exemplars: Exemplar[]): {
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
} {
  if (exemplars.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, sum: 0 };
  }

  const values = exemplars.map(e => e.value);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    count: exemplars.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / exemplars.length,
    sum,
  };
}

export function calculateExemplarPercentiles(
  exemplars: Exemplar[],
  percentiles: number[] = [50, 90, 95, 99]
): Record<string, number> {
  if (exemplars.length === 0) {
    return Object.fromEntries(percentiles.map(p => [`p${p}`, 0]));
  }

  const sortedValues = exemplars.map(e => e.value).sort((a, b) => a - b);
  const result: Record<string, number> = {};

  for (const p of percentiles) {
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    result[`p${p}`] = sortedValues[Math.max(0, index)];
  }

  return result;
}

// ============================================
// Conversion Functions
// ============================================

export function exemplarsToSeries(
  exemplars: Exemplar[]
): MetricExemplarSeries[] {
  const groups = groupExemplarsByMetric(exemplars);
  const series: MetricExemplarSeries[] = [];

  for (const [metricName, metricExemplars] of groups) {
    // Group by unique label combinations
    const labelGroups = new Map<string, Exemplar[]>();

    for (const e of metricExemplars) {
      const labelKey = JSON.stringify(e.labels);
      if (!labelGroups.has(labelKey)) {
        labelGroups.set(labelKey, []);
      }
      labelGroups.get(labelKey)!.push(e);
    }

    for (const [, labelExemplars] of labelGroups) {
      series.push({
        metricName,
        labels: labelExemplars[0].labels,
        exemplars: labelExemplars,
      });
    }
  }

  return series;
}

export function seriesToExemplars(
  series: MetricExemplarSeries[]
): Exemplar[] {
  return series.flatMap(s => s.exemplars);
}

// ============================================
// Trace Correlation
// ============================================

export function getUniqueTraceIds(exemplars: Exemplar[]): string[] {
  return [...new Set(exemplars.map(e => e.traceId))];
}

export function getUniqueSpanIds(exemplars: Exemplar[]): string[] {
  return [...new Set(exemplars.map(e => e.spanId))];
}

export function correlationToExemplar(
  correlation: ExemplarCorrelation
): Exemplar {
  return correlation.exemplar;
}

export function correlationsToExemplars(
  correlations: ExemplarCorrelation[]
): Exemplar[] {
  return correlations.map(correlationToExemplar);
}

// ============================================
// Bucket Functions (for histograms)
// ============================================

export function bucketExemplarsByValue(
  exemplars: Exemplar[],
  buckets: number[]
): Map<number, Exemplar[]> {
  const result = new Map<number, Exemplar[]>();

  // Initialize buckets
  for (const bucket of buckets) {
    result.set(bucket, []);
  }
  result.set(Infinity, []); // For values above all buckets

  // Distribute exemplars into buckets
  for (const exemplar of exemplars) {
    let assigned = false;
    for (const bucket of buckets.sort((a, b) => a - b)) {
      if (exemplar.value <= bucket) {
        result.get(bucket)!.push(exemplar);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      result.get(Infinity)!.push(exemplar);
    }
  }

  return result;
}

export function bucketExemplarsByTime(
  exemplars: Exemplar[],
  interval: number
): Map<number, Exemplar[]> {
  const result = new Map<number, Exemplar[]>();

  for (const exemplar of exemplars) {
    const bucket = Math.floor(exemplar.timestamp / interval) * interval;
    if (!result.has(bucket)) {
      result.set(bucket, []);
    }
    result.get(bucket)!.push(exemplar);
  }

  return result;
}
