/**
 * Metrics Transformer
 * Transform metrics between OTEL v1 and TFO v2 formats
 */

import type {
  Metric,
  MetricSeries,
  MetricDataPoint,
  OTELv1Metric,
  OTELv1NumberDataPoint,
} from '../types';
import {
  otelKeyValueToRecord,
  recordToOtelKeyValue,
  nanosToMillis,
  millisToNanos,
  recordToMetricLabels,
  metricLabelsToRecord,
} from '../common/transformer';

// ============================================
// OTEL v1 to TFO Transformation
// ============================================

export function transformOTELv1ToTFO(otelMetric: OTELv1Metric): Metric {
  const dataPoints: MetricDataPoint[] = otelMetric.data.dataPoints.map(dp => ({
    timestamp: nanosToMillis(dp.timeUnixNano),
    value: extractDataPointValue(dp),
  }));

  // Extract labels from first data point
  const labels = otelMetric.data.dataPoints.length > 0
    ? otelKeyValueToRecord(otelMetric.data.dataPoints[0].attributes)
    : {};

  return {
    name: otelMetric.name,
    type: 'gauge', // OTEL v1 doesn't specify type in this format
    description: otelMetric.description,
    unit: otelMetric.unit,
    labels: recordToMetricLabels(labels as Record<string, string>),
    dataPoints,
  };
}

export function transformOTELv1MetricsToTFO(
  otelMetrics: OTELv1Metric[]
): Metric[] {
  return otelMetrics.map(transformOTELv1ToTFO);
}

// ============================================
// TFO to OTEL v1 Transformation
// ============================================

export function transformTFOToOTELv1(metric: Metric): OTELv1Metric {
  const labels = metricLabelsToRecord(metric.labels);

  return {
    name: metric.name,
    description: metric.description,
    unit: metric.unit,
    data: {
      dataPoints: metric.dataPoints.map(dp => ({
        attributes: recordToOtelKeyValue(labels),
        timeUnixNano: millisToNanos(dp.timestamp),
        asDouble: dp.value,
      })),
    },
  };
}

export function transformTFOMetricsToOTELv1(
  metrics: Metric[]
): OTELv1Metric[] {
  return metrics.map(transformTFOToOTELv1);
}

// ============================================
// MetricSeries Transformations
// ============================================

export function metricToSeries(metric: Metric): MetricSeries {
  return {
    metric: metric.name,
    labels: metricLabelsToRecord(metric.labels),
    values: metric.dataPoints,
  };
}

export function seriesToMetric(
  series: MetricSeries,
  options?: { type?: Metric['type']; description?: string; unit?: string }
): Metric {
  return {
    name: series.metric,
    type: options?.type ?? 'gauge',
    description: options?.description,
    unit: options?.unit,
    labels: recordToMetricLabels(series.labels),
    dataPoints: series.values,
  };
}

// ============================================
// Helper Functions
// ============================================

function extractDataPointValue(dp: OTELv1NumberDataPoint): number {
  if (dp.asDouble !== undefined) return dp.asDouble;
  if (dp.asInt !== undefined) return parseInt(dp.asInt, 10);
  return 0;
}

// ============================================
// Query Transformations
// ============================================

export function transformPromQLToTFQL(promql: string): string {
  let tfql = promql;

  // Handle metric{label="value"} format
  const metricMatch = tfql.match(/^(\w+)\{([^}]*)\}$/);
  if (metricMatch) {
    const [, metricName, labelStr] = metricMatch;
    const conditions = labelStr.split(',').map(label => {
      const match = label.trim().match(/(\w+)([=!~]+)"([^"]*)"/);
      if (!match) return '';

      const [, key, op, value] = match;
      switch (op) {
        case '=':
          return `${key}:${value}`;
        case '!=':
          return `NOT ${key}:${value}`;
        case '=~':
          return `${key}:/${value}/`;
        case '!~':
          return `NOT ${key}:/${value}/`;
        default:
          return `${key}:${value}`;
      }
    }).filter(Boolean);

    return `${metricName} | where ${conditions.join(' and ')}`;
  }

  // Handle aggregations
  tfql = tfql.replace(/sum\s+by\s+\(([^)]+)\)\s+\(([^)]+)\)/g, '$2 | sum by $1');
  tfql = tfql.replace(/avg\s+by\s+\(([^)]+)\)\s+\(([^)]+)\)/g, '$2 | avg by $1');
  tfql = tfql.replace(/max\s+by\s+\(([^)]+)\)\s+\(([^)]+)\)/g, '$2 | max by $1');
  tfql = tfql.replace(/min\s+by\s+\(([^)]+)\)\s+\(([^)]+)\)/g, '$2 | min by $1');

  // Handle rate
  tfql = tfql.replace(/rate\(([^[]+)\[([^\]]+)\]\)/g, '$1 | rate($2)');

  // Handle irate
  tfql = tfql.replace(/irate\(([^[]+)\[([^\]]+)\]\)/g, '$1 | irate($2)');

  return tfql;
}

export function transformTFQLToPromQL(tfql: string): string {
  let promql = tfql;

  // Handle metric | where conditions
  const whereMatch = promql.match(/^(\w+)\s*\|\s*where\s+(.+)$/);
  if (whereMatch) {
    const [, metric, conditions] = whereMatch;
    const labels = conditions.split(/\s+and\s+/i).map(cond => {
      const [key, value] = cond.split(':');
      if (value.startsWith('/') && value.endsWith('/')) {
        return `${key}=~"${value.slice(1, -1)}"`;
      }
      if (cond.startsWith('NOT ')) {
        const [notKey, notValue] = cond.replace('NOT ', '').split(':');
        return `${notKey}!="${notValue}"`;
      }
      return `${key}="${value}"`;
    });

    promql = `${metric}{${labels.join(',')}}`;
  }

  // Handle aggregations
  promql = promql.replace(/(\w+)\s*\|\s*sum\s+by\s+(\w+)/g, 'sum by ($2) ($1)');
  promql = promql.replace(/(\w+)\s*\|\s*avg\s+by\s+(\w+)/g, 'avg by ($2) ($1)');
  promql = promql.replace(/(\w+)\s*\|\s*max\s+by\s+(\w+)/g, 'max by ($2) ($1)');
  promql = promql.replace(/(\w+)\s*\|\s*min\s+by\s+(\w+)/g, 'min by ($2) ($1)');

  // Handle rate
  promql = promql.replace(/(\w+)\s*\|\s*rate\(([^)]+)\)/g, 'rate($1[$2])');

  return promql;
}

// ============================================
// Aggregation Helpers
// ============================================

export function aggregateSeriesByLabel(
  series: MetricSeries[],
  labelKey: string
): Map<string, MetricSeries[]> {
  const groups = new Map<string, MetricSeries[]>();

  for (const s of series) {
    const labelValue = s.labels[labelKey] ?? 'unknown';
    if (!groups.has(labelValue)) {
      groups.set(labelValue, []);
    }
    groups.get(labelValue)!.push(s);
  }

  return groups;
}

export function sumSeries(series: MetricSeries[]): MetricSeries {
  if (series.length === 0) {
    return { metric: '', labels: {}, values: [] };
  }

  const firstSeries = series[0];
  const summedValues: MetricDataPoint[] = firstSeries.values.map((v, i) => ({
    timestamp: v.timestamp,
    value: series.reduce((sum, s) => sum + (s.values[i]?.value ?? 0), 0),
  }));

  return {
    metric: firstSeries.metric,
    labels: { aggregation: 'sum' },
    values: summedValues,
  };
}

export function avgSeries(series: MetricSeries[]): MetricSeries {
  if (series.length === 0) {
    return { metric: '', labels: {}, values: [] };
  }

  const summed = sumSeries(series);
  return {
    ...summed,
    labels: { aggregation: 'avg' },
    values: summed.values.map(v => ({
      timestamp: v.timestamp,
      value: v.value / series.length,
    })),
  };
}
