/**
 * Common Generator Utilities
 * Base utilities for generating mock telemetry data
 */

import type { TimeSeriesConfig, TimeSeriesPoint, OTELResource } from '../types';

// ============================================
// Seeded Random Number Generator
// ============================================

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: readonly T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Pick multiple random elements from array
   */
  pickMultiple<T>(array: readonly T[], count: number): T[] {
    const shuffled = this.shuffle([...array]);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Generate random boolean with probability
   */
  nextBool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Generate random gaussian (normal distribution)
   */
  nextGaussian(mean = 0, stddev = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stddev + mean;
  }
}

// ============================================
// Global Seeded Random Instance
// ============================================

let globalSeed = Date.now();
let globalRandom = new SeededRandom(globalSeed);

export function setGlobalSeed(seed: number): void {
  globalSeed = seed;
  globalRandom = new SeededRandom(seed);
}

export function getGlobalRandom(): SeededRandom {
  return globalRandom;
}

export function createSeededRandom(seed?: number): SeededRandom {
  return new SeededRandom(seed ?? Date.now());
}

// ============================================
// Time Series Generator
// ============================================

export function generateTimeSeries(config: TimeSeriesConfig): TimeSeriesPoint[] {
  const {
    start,
    end,
    interval,
    baseValue,
    variance,
    trend = 'stable',
    noise = 0.1,
    spikes,
  } = config;

  const points: TimeSeriesPoint[] = [];
  const totalPoints = Math.floor((end - start) / interval);
  const random = createSeededRandom(start);

  let currentValue = baseValue;
  const trendFactor = trend === 'up' ? 0.001 : trend === 'down' ? -0.001 : 0;

  for (let i = 0; i <= totalPoints; i++) {
    const timestamp = start + i * interval;

    // Apply trend
    currentValue += trendFactor * baseValue;

    // Add noise
    const noiseValue = random.nextGaussian(0, baseValue * noise);

    // Add variance
    const varianceValue = random.nextFloat(-variance, variance);

    // Calculate value
    let value = currentValue + noiseValue + varianceValue;

    // Add spikes
    if (spikes && random.nextBool(spikes.probability)) {
      value += random.nextBool(0.5) ? spikes.magnitude : -spikes.magnitude * 0.5;
    }

    // Ensure non-negative
    value = Math.max(0, value);

    points.push({ timestamp, value });
  }

  return points;
}

/**
 * Generate percentage time series (0-100)
 */
export function generatePercentageTimeSeries(
  start: number,
  end: number,
  interval: number,
  basePercent: number,
  variance = 10
): TimeSeriesPoint[] {
  return generateTimeSeries({
    start,
    end,
    interval,
    baseValue: basePercent,
    variance,
    noise: 0.05,
  }).map(p => ({
    ...p,
    value: Math.min(100, Math.max(0, p.value)),
  }));
}

/**
 * Generate counter time series (monotonically increasing)
 */
export function generateCounterTimeSeries(
  start: number,
  end: number,
  interval: number,
  ratePerSecond: number
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const totalPoints = Math.floor((end - start) / interval);
  const random = createSeededRandom(start);

  let counter = 0;

  for (let i = 0; i <= totalPoints; i++) {
    const timestamp = start + i * interval;
    const increment = ratePerSecond * (interval / 1000) * random.nextFloat(0.8, 1.2);
    counter += Math.max(0, increment);
    points.push({ timestamp, value: Math.floor(counter) });
  }

  return points;
}

// ============================================
// ID Generators
// ============================================

const HEX_CHARS = '0123456789abcdef';

export function generateTraceId(seed?: number): string {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += HEX_CHARS[random.nextInt(0, 15)];
  }
  return result;
}

export function generateSpanId(seed?: number): string {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += HEX_CHARS[random.nextInt(0, 15)];
  }
  return result;
}

export function generateMetricId(seed?: number): string {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  let result = 'metric_';
  for (let i = 0; i < 16; i++) {
    result += HEX_CHARS[random.nextInt(0, 15)];
  }
  return result;
}

export function generateLogId(seed?: number): string {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  let result = 'log_';
  for (let i = 0; i < 24; i++) {
    result += HEX_CHARS[random.nextInt(0, 15)];
  }
  return result;
}

export function generateAlertId(seed?: number): string {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  let result = 'alert_';
  for (let i = 0; i < 12; i++) {
    result += HEX_CHARS[random.nextInt(0, 15)];
  }
  return result;
}

export function generateUUID(seed?: number): string {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  const segments = [8, 4, 4, 4, 12];
  return segments.map(len => {
    let segment = '';
    for (let i = 0; i < len; i++) {
      segment += HEX_CHARS[random.nextInt(0, 15)];
    }
    return segment;
  }).join('-');
}

// ============================================
// Resource Generators
// ============================================

export function generateOTELResource(
  serviceName: string,
  options?: Partial<OTELResource>
): OTELResource {
  const random = createSeededRandom(serviceName.length);

  return {
    'service.name': serviceName,
    'service.namespace': options?.['service.namespace'] ?? 'default',
    'service.version': options?.['service.version'] ?? `1.${random.nextInt(0, 9)}.${random.nextInt(0, 99)}`,
    'service.instance.id': options?.['service.instance.id'] ?? generateUUID(serviceName.length),
    'host.name': options?.['host.name'] ?? `${serviceName}-${random.nextInt(1, 10)}`,
    'host.id': options?.['host.id'] ?? generateUUID(),
    'telemetry.sdk.name': 'opentelemetry',
    'telemetry.sdk.language': options?.['telemetry.sdk.language'] ?? 'nodejs',
    'telemetry.sdk.version': '1.21.0',
    ...options,
  };
}

export function generateVMResource(
  hostname: string,
  options?: {
    provider?: string;
    region?: string;
    os?: string;
  }
): OTELResource {
  const random = createSeededRandom(hostname.length);

  return {
    'service.name': 'host-metrics',
    'host.name': hostname,
    'host.id': generateUUID(hostname.length),
    'host.type': options?.provider ? 'cloud' : 'vm',
    'host.arch': random.pick(['amd64', 'arm64']),
    'os.type': options?.os ?? 'linux',
    'os.name': options?.os === 'windows' ? 'Windows Server 2022' : 'Ubuntu 22.04 LTS',
    'os.version': options?.os === 'windows' ? '10.0.20348' : '22.04',
    'cloud.provider': options?.provider,
    'cloud.region': options?.region,
  };
}

export function generateK8sResource(
  cluster: string,
  namespace: string,
  pod?: string,
  options?: {
    deployment?: string;
    container?: string;
    node?: string;
  }
): OTELResource {
  const random = createSeededRandom((cluster + namespace).length);

  return {
    'service.name': pod ?? `service-${random.nextInt(1, 100)}`,
    'k8s.cluster.name': cluster,
    'k8s.cluster.uid': generateUUID(cluster.length),
    'k8s.namespace.name': namespace,
    'k8s.pod.name': pod,
    'k8s.pod.uid': pod ? generateUUID(pod.length) : undefined,
    'k8s.container.name': options?.container,
    'k8s.node.name': options?.node ?? `node-${random.nextInt(1, 10)}`,
    'k8s.deployment.name': options?.deployment,
  };
}

// ============================================
// Name Generators
// ============================================

const ADJECTIVES = [
  'fast', 'quick', 'smart', 'bright', 'sharp', 'swift', 'keen', 'bold',
  'calm', 'cool', 'warm', 'soft', 'hard', 'light', 'dark', 'clear',
];

const NOUNS = [
  'lion', 'tiger', 'eagle', 'hawk', 'wolf', 'bear', 'fox', 'deer',
  'cloud', 'storm', 'river', 'ocean', 'mountain', 'forest', 'valley', 'plains',
];

export function generateHostname(seed?: number): string {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  const adj = random.pick(ADJECTIVES);
  const noun = random.pick(NOUNS);
  const num = random.nextInt(1, 99);
  return `${adj}-${noun}-${num}`;
}

export function generatePodName(deployment: string, seed?: number): string {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  const suffix = Array.from({ length: 5 }, () =>
    HEX_CHARS[random.nextInt(0, 15)]
  ).join('');
  return `${deployment}-${suffix}`;
}

export function generateNodeName(cluster: string, index: number): string {
  return `${cluster}-node-${index.toString().padStart(2, '0')}`;
}

// ============================================
// Timestamp Utilities
// ============================================

export function generateTimestamp(
  start: number,
  end: number,
  seed?: number
): number {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  return start + random.nextInt(0, end - start);
}

export function generateTimestamps(
  start: number,
  end: number,
  count: number,
  seed?: number
): number[] {
  const random = seed !== undefined ? new SeededRandom(seed) : globalRandom;
  const timestamps: number[] = [];

  for (let i = 0; i < count; i++) {
    timestamps.push(start + random.nextInt(0, end - start));
  }

  return timestamps.sort((a, b) => a - b);
}

/**
 * Get time range defaults (last hour if not specified)
 */
export function getDefaultTimeRange(): { start: number; end: number } {
  const end = Date.now();
  const start = end - 60 * 60 * 1000; // 1 hour ago
  return { start, end };
}

/**
 * Get interval based on time range
 */
export function getRecommendedInterval(start: number, end: number): number {
  const duration = end - start;
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  if (duration <= 15 * MINUTE) return 10 * 1000; // 10 seconds
  if (duration <= HOUR) return 30 * 1000; // 30 seconds
  if (duration <= 6 * HOUR) return MINUTE; // 1 minute
  if (duration <= DAY) return 5 * MINUTE; // 5 minutes
  if (duration <= 7 * DAY) return 15 * MINUTE; // 15 minutes
  return HOUR; // 1 hour
}

// ============================================
// Chart-Friendly Series Generator
// ============================================

/**
 * Named time series format for charts
 */
export interface ChartSeries {
  name: string;
  data: Array<[number, number]>;
  color?: string;
  /** Query origin label (A, B, C...) — set by useQueryPanel for series-query mapping */
  queryRef?: string;
  /** Query origin color — matches the query badge color */
  queryColor?: string;
}

/**
 * Generate named time series for charts
 * This is the chart-friendly format used by views and components
 *
 * @param name - Series name for legend
 * @param baseValue - Base value around which data will fluctuate
 * @param variance - Maximum deviation from base value (default: 10)
 * @param options - Additional options for generation
 */
export function generateChartSeries(
  name: string,
  baseValue: number,
  variance: number = 10,
  options?: {
    start?: number;
    end?: number;
    hours?: number;
    interval?: number;
    trend?: 'up' | 'down' | 'stable';
    noise?: number;
  }
): ChartSeries {
  const endTs = options?.end ?? Date.now();
  const startTs = options?.start ?? (endTs - (options?.hours ?? 24) * 3600000);
  const interval = options?.interval ?? getRecommendedInterval(startTs, endTs);

  const points = generateTimeSeries({
    start: startTs,
    end: endTs,
    interval,
    baseValue,
    variance,
    trend: options?.trend ?? 'stable',
    noise: options?.noise ?? 0.1,
  });

  return {
    name,
    data: points.map(p => [p.timestamp, p.value] as [number, number]),
  };
}

/**
 * Generate multiple named time series for charts
 * Useful for generating multiple series with the same time range
 */
export function generateChartSeriesMultiple(
  configs: Array<{ name: string; baseValue: number; variance?: number }>,
  options?: {
    start?: number;
    end?: number;
    hours?: number;
    interval?: number;
  }
): ChartSeries[] {
  return configs.map(config =>
    generateChartSeries(
      config.name,
      config.baseValue,
      config.variance ?? 10,
      options
    )
  );
}

/**
 * Convert TimeSeriesPoint array to chart-friendly format
 */
export function toChartSeries(name: string, points: TimeSeriesPoint[]): ChartSeries {
  return {
    name,
    data: points.map(p => [p.timestamp, p.value] as [number, number]),
  };
}

/**
 * Convert chart series back to TimeSeriesPoint array
 */
export function fromChartSeries(series: ChartSeries): TimeSeriesPoint[] {
  return series.data.map(([timestamp, value]) => ({ timestamp, value }));
}
