/**
 * Metrics Generator
 * Generate mock metrics following OTEL standards
 */

import type {
  Metric,
  MetricType,
  MetricDataPoint,
  MetricSeries,
  HistogramMetric,
  HistogramBucket,
  SummaryMetric,
  SummaryQuantile,
  MetricMetadata,
  TimeRange,
} from '../types';
import {
  createSeededRandom,
  generateTimeSeries,
  getRecommendedInterval,
  getDefaultTimeRange,
} from '../common/generator';
import { MOCK_SERVICES, VM_METRICS, K8S_METRICS, APP_METRICS } from '../constants';

// ============================================
// Metric Generator Config
// ============================================

export interface MetricGeneratorConfig {
  name: string;
  type: MetricType;
  labels: Record<string, string>;
  timeRange: TimeRange;
  interval?: number;
  unit?: string;
  description?: string;
  baseValue?: number;
  variance?: number;
}

// ============================================
// Single Metric Generators
// ============================================

export function generateMetric(config: MetricGeneratorConfig): Metric {
  const {
    name,
    type,
    labels,
    timeRange,
    interval,
    unit,
    description,
    baseValue = 50,
    variance = 10,
  } = config;

  const actualInterval = interval ?? getRecommendedInterval(timeRange.start, timeRange.end);

  const timeSeries = generateTimeSeries({
    start: timeRange.start,
    end: timeRange.end,
    interval: actualInterval,
    baseValue,
    variance,
    noise: 0.1,
  });

  return {
    name,
    type,
    description,
    unit,
    labels: Object.entries(labels).map(([key, value]) => ({ key, value })),
    dataPoints: timeSeries.map(p => ({
      timestamp: p.timestamp,
      value: p.value,
    })),
  };
}

export function generateGaugeMetric(
  name: string,
  labels: Record<string, string>,
  timeRange: TimeRange,
  options?: {
    baseValue?: number;
    variance?: number;
    unit?: string;
    description?: string;
  }
): Metric {
  return generateMetric({
    name,
    type: 'gauge',
    labels,
    timeRange,
    ...options,
  });
}

export function generateCounterMetric(
  name: string,
  labels: Record<string, string>,
  timeRange: TimeRange,
  options?: {
    ratePerSecond?: number;
    unit?: string;
    description?: string;
  }
): Metric {
  const { ratePerSecond = 100, unit, description } = options ?? {};
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);
  const random = createSeededRandom(name.length);

  const dataPoints: MetricDataPoint[] = [];
  let counter = 0;
  const totalPoints = Math.floor((timeRange.end - timeRange.start) / interval);

  for (let i = 0; i <= totalPoints; i++) {
    const timestamp = timeRange.start + i * interval;
    const increment = ratePerSecond * (interval / 1000) * random.nextFloat(0.8, 1.2);
    counter += Math.max(0, increment);
    dataPoints.push({ timestamp, value: Math.floor(counter) });
  }

  return {
    name,
    type: 'counter',
    description,
    unit,
    labels: Object.entries(labels).map(([key, value]) => ({ key, value })),
    dataPoints,
  };
}

export function generateHistogramMetric(
  name: string,
  labels: Record<string, string>,
  timeRange: TimeRange,
  options?: {
    bucketBounds?: number[];
    unit?: string;
    description?: string;
  }
): HistogramMetric {
  const {
    bucketBounds = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    unit,
    description,
  } = options ?? {};

  const random = createSeededRandom(name.length);
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);

  // Generate histogram data
  const totalPoints = Math.floor((timeRange.end - timeRange.start) / interval);
  const dataPoints: MetricDataPoint[] = [];
  let totalSum = 0;
  let totalCount = 0;

  for (let i = 0; i <= totalPoints; i++) {
    const timestamp = timeRange.start + i * interval;
    const count = random.nextInt(10, 100);
    const sum = count * random.nextFloat(10, 100);
    totalSum += sum;
    totalCount += count;
    dataPoints.push({ timestamp, value: sum / count }); // Average as the value
  }

  // Generate bucket counts
  const buckets: HistogramBucket[] = bucketBounds.map(le => ({
    le,
    count: Math.floor(totalCount * random.nextFloat(0.1, 1)),
  }));

  // Ensure bucket counts are cumulative
  for (let i = 1; i < buckets.length; i++) {
    if (buckets[i].count < buckets[i - 1].count) {
      buckets[i].count = buckets[i - 1].count + random.nextInt(0, 10);
    }
  }

  // Add +Inf bucket
  buckets.push({ le: Infinity, count: totalCount });

  return {
    name,
    type: 'histogram',
    description,
    unit,
    labels: Object.entries(labels).map(([key, value]) => ({ key, value })),
    dataPoints,
    buckets,
    sum: totalSum,
    count: totalCount,
  };
}

export function generateSummaryMetric(
  name: string,
  labels: Record<string, string>,
  timeRange: TimeRange,
  options?: {
    quantileValues?: number[];
    unit?: string;
    description?: string;
  }
): SummaryMetric {
  const {
    quantileValues = [0.5, 0.9, 0.95, 0.99],
    unit,
    description,
  } = options ?? {};

  const random = createSeededRandom(name.length);
  const interval = getRecommendedInterval(timeRange.start, timeRange.end);

  const totalPoints = Math.floor((timeRange.end - timeRange.start) / interval);
  const dataPoints: MetricDataPoint[] = [];
  let totalSum = 0;
  let totalCount = 0;

  for (let i = 0; i <= totalPoints; i++) {
    const timestamp = timeRange.start + i * interval;
    const count = random.nextInt(10, 100);
    const sum = count * random.nextFloat(10, 100);
    totalSum += sum;
    totalCount += count;
    dataPoints.push({ timestamp, value: sum / count });
  }

  // Generate quantiles
  const baseValue = totalSum / totalCount;
  const quantiles: SummaryQuantile[] = quantileValues.map(quantile => ({
    quantile,
    value: baseValue * (1 + (quantile - 0.5) * random.nextFloat(0.5, 2)),
  }));

  return {
    name,
    type: 'summary',
    description,
    unit,
    labels: Object.entries(labels).map(([key, value]) => ({ key, value })),
    dataPoints,
    quantiles,
    sum: totalSum,
    count: totalCount,
  };
}

// ============================================
// Metric Series Generator
// ============================================

export function generateMetricSeries(
  configs: MetricGeneratorConfig[]
): MetricSeries[] {
  return configs.map(config => {
    const metric = generateMetric(config);
    return {
      metric: metric.name,
      labels: Object.fromEntries(metric.labels.map(l => [l.key, l.value])),
      values: metric.dataPoints,
    };
  });
}

export function generateMetricSeriesForService(
  service: string,
  timeRange: TimeRange
): MetricSeries[] {
  const metrics: MetricSeries[] = [];

  // HTTP request metrics
  metrics.push({
    metric: APP_METRICS.HTTP.REQUEST_TOTAL,
    labels: { service, method: 'GET', status: '200' },
    values: generateMetric({
      name: APP_METRICS.HTTP.REQUEST_TOTAL,
      type: 'counter',
      labels: { service },
      timeRange,
      baseValue: 1000,
      variance: 200,
    }).dataPoints,
  });

  // Request duration
  metrics.push({
    metric: APP_METRICS.HTTP.REQUEST_DURATION,
    labels: { service, method: 'GET' },
    values: generateMetric({
      name: APP_METRICS.HTTP.REQUEST_DURATION,
      type: 'histogram',
      labels: { service },
      timeRange,
      baseValue: 50,
      variance: 20,
      unit: 'ms',
    }).dataPoints,
  });

  return metrics;
}

// ============================================
// Metadata Generator
// ============================================

export function generateMetricMetadata(): MetricMetadata[] {
  const metadata: MetricMetadata[] = [];

  // VM Metrics
  Object.entries(VM_METRICS).forEach(([category, metrics]) => {
    Object.entries(metrics).forEach(([name, metricName]) => {
      metadata.push({
        name: metricName,
        type: name.includes('TOTAL') || name.includes('COUNT') ? 'counter' : 'gauge',
        help: `${category} ${name.toLowerCase().replace(/_/g, ' ')} metric`,
        unit: getMetricUnit(metricName),
      });
    });
  });

  // K8s Metrics
  Object.entries(K8S_METRICS).forEach(([category, metrics]) => {
    Object.entries(metrics).forEach(([name, metricName]) => {
      metadata.push({
        name: metricName,
        type: name.includes('COUNT') ? 'counter' : 'gauge',
        help: `Kubernetes ${category} ${name.toLowerCase().replace(/_/g, ' ')} metric`,
        unit: getMetricUnit(metricName),
      });
    });
  });

  // App Metrics
  Object.entries(APP_METRICS).forEach(([category, metrics]) => {
    Object.entries(metrics).forEach(([name, metricName]) => {
      metadata.push({
        name: metricName,
        type: name.includes('TOTAL') || name.includes('COUNT') ? 'counter' : 'histogram',
        help: `Application ${category} ${name.toLowerCase().replace(/_/g, ' ')} metric`,
        unit: getMetricUnit(metricName),
      });
    });
  });

  return metadata;
}

function getMetricUnit(name: string): string {
  if (name.includes('duration') || name.includes('time') || name.includes('latency')) {
    return 'ms';
  }
  if (name.includes('bytes') || name.includes('memory') || name.includes('size')) {
    return 'By';
  }
  if (name.includes('utilization') || name.includes('percent')) {
    return '1';
  }
  if (name.includes('rate')) {
    return '1/s';
  }
  return '';
}

// ============================================
// Metric Name Generator
// ============================================

export function generateMetricNames(): string[] {
  const names: string[] = [];

  // Collect all metric names from constants
  Object.values(VM_METRICS).forEach(category => {
    Object.values(category).forEach(name => names.push(name));
  });

  Object.values(K8S_METRICS).forEach(category => {
    Object.values(category).forEach(name => names.push(name));
  });

  Object.values(APP_METRICS).forEach(category => {
    Object.values(category).forEach(name => names.push(name));
  });

  return [...new Set(names)].sort();
}

// ============================================
// Bulk Metric Generators
// ============================================

export function generateMockMetrics(
  count: number,
  timeRange?: TimeRange
): Metric[] {
  const range = timeRange ?? getDefaultTimeRange();
  const random = createSeededRandom(count);
  const metricNames = generateMetricNames();

  return Array.from({ length: count }, () => {
    const name = random.pick(metricNames);
    const service = random.pick(MOCK_SERVICES);
    const type = random.pick<MetricType>(['gauge', 'counter', 'histogram', 'summary']);

    return generateMetric({
      name,
      type,
      labels: { service, instance: `${service}-${random.nextInt(1, 5)}` },
      timeRange: range,
      baseValue: random.nextFloat(10, 100),
      variance: random.nextFloat(5, 20),
    });
  });
}

export function generateMetricsForDashboard(
  services: string[],
  timeRange: TimeRange
): MetricSeries[] {
  const series: MetricSeries[] = [];

  for (const service of services) {
    series.push(...generateMetricSeriesForService(service, timeRange));
  }

  return series;
}
