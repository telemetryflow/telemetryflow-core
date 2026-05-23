/**
 * Fluent builder for creating alert conditions
 */

import {
  AlertConditionTemplate,
  ConditionOperator,
  ConditionAggregation,
  DefaultDurations,
} from '../types';

export class ConditionBuilder {
  private condition: Partial<AlertConditionTemplate>;

  constructor() {
    this.condition = {
      aggregation: 'avg',
      duration: DefaultDurations.MEDIUM,
      labels: {},
    };
  }

  /**
   * Create a new builder instance
   */
  static create(): ConditionBuilder {
    return new ConditionBuilder();
  }

  /**
   * Set the metric name
   */
  metric(metric: string): ConditionBuilder {
    this.condition.metric = metric;
    return this;
  }

  /**
   * Set the aggregation function
   */
  aggregation(aggregation: ConditionAggregation): ConditionBuilder {
    this.condition.aggregation = aggregation;
    return this;
  }

  /**
   * Set the comparison operator
   */
  operator(operator: ConditionOperator): ConditionBuilder {
    this.condition.operator = operator;
    return this;
  }

  /**
   * Set the threshold value
   */
  threshold(threshold: number): ConditionBuilder {
    this.condition.threshold = threshold;
    return this;
  }

  /**
   * Set the duration window
   */
  duration(duration: string): ConditionBuilder {
    this.condition.duration = duration;
    return this;
  }

  /**
   * Add a label filter
   */
  label(key: string, value: string): ConditionBuilder {
    this.condition.labels = { ...this.condition.labels, [key]: value };
    return this;
  }

  /**
   * Add multiple label filters
   */
  labels(labels: Record<string, string>): ConditionBuilder {
    this.condition.labels = { ...this.condition.labels, ...labels };
    return this;
  }

  // Shorthand methods for common operators

  /**
   * Greater than
   */
  gt(threshold: number): ConditionBuilder {
    this.condition.operator = 'gt';
    this.condition.threshold = threshold;
    return this;
  }

  /**
   * Greater than or equal
   */
  gte(threshold: number): ConditionBuilder {
    this.condition.operator = 'gte';
    this.condition.threshold = threshold;
    return this;
  }

  /**
   * Less than
   */
  lt(threshold: number): ConditionBuilder {
    this.condition.operator = 'lt';
    this.condition.threshold = threshold;
    return this;
  }

  /**
   * Less than or equal
   */
  lte(threshold: number): ConditionBuilder {
    this.condition.operator = 'lte';
    this.condition.threshold = threshold;
    return this;
  }

  /**
   * Equal to
   */
  eq(threshold: number): ConditionBuilder {
    this.condition.operator = 'eq';
    this.condition.threshold = threshold;
    return this;
  }

  /**
   * Not equal to
   */
  neq(threshold: number): ConditionBuilder {
    this.condition.operator = 'neq';
    this.condition.threshold = threshold;
    return this;
  }

  // Shorthand methods for common aggregations

  /**
   * Average aggregation
   */
  avg(): ConditionBuilder {
    this.condition.aggregation = 'avg';
    return this;
  }

  /**
   * Sum aggregation
   */
  sum(): ConditionBuilder {
    this.condition.aggregation = 'sum';
    return this;
  }

  /**
   * Max aggregation
   */
  max(): ConditionBuilder {
    this.condition.aggregation = 'max';
    return this;
  }

  /**
   * Min aggregation
   */
  min(): ConditionBuilder {
    this.condition.aggregation = 'min';
    return this;
  }

  /**
   * Count aggregation
   */
  count(): ConditionBuilder {
    this.condition.aggregation = 'count';
    return this;
  }

  /**
   * Rate aggregation
   */
  rate(): ConditionBuilder {
    this.condition.aggregation = 'rate';
    return this;
  }

  /**
   * P50 (median) percentile aggregation
   */
  p50(): ConditionBuilder {
    this.condition.aggregation = 'p50';
    return this;
  }

  /**
   * P90 percentile aggregation
   */
  p90(): ConditionBuilder {
    this.condition.aggregation = 'p90';
    return this;
  }

  /**
   * P95 percentile aggregation
   */
  p95(): ConditionBuilder {
    this.condition.aggregation = 'p95';
    return this;
  }

  /**
   * P99 percentile aggregation
   */
  p99(): ConditionBuilder {
    this.condition.aggregation = 'p99';
    return this;
  }

  /**
   * Last value
   */
  last(): ConditionBuilder {
    this.condition.aggregation = 'last';
    return this;
  }

  /**
   * Build the condition
   */
  build(): AlertConditionTemplate {
    if (!this.condition.metric) {
      throw new Error('Condition metric is required');
    }
    if (this.condition.operator === undefined) {
      throw new Error('Condition operator is required');
    }
    if (this.condition.threshold === undefined) {
      throw new Error('Condition threshold is required');
    }

    return this.condition as AlertConditionTemplate;
  }
}

/**
 * Common condition patterns
 */
export const ConditionPatterns = {
  /**
   * CPU usage percentage
   */
  cpuUsage: (threshold: number, duration = '5m') =>
    ConditionBuilder.create()
      .metric('system_cpu_usage_percent')
      .avg()
      .gt(threshold)
      .duration(duration)
      .build(),

  /**
   * Memory usage percentage
   */
  memoryUsage: (threshold: number, duration = '5m') =>
    ConditionBuilder.create()
      .metric('system_memory_usage_percent')
      .avg()
      .gt(threshold)
      .duration(duration)
      .build(),

  /**
   * Disk usage percentage
   */
  diskUsage: (threshold: number, duration = '5m') =>
    ConditionBuilder.create()
      .metric('system_disk_usage_percent')
      .avg()
      .gt(threshold)
      .duration(duration)
      .build(),

  /**
   * Service availability (up/down)
   */
  serviceDown: (metric = 'up', duration = '1m') =>
    ConditionBuilder.create()
      .metric(metric)
      .last()
      .eq(0)
      .duration(duration)
      .build(),

  /**
   * HTTP error rate
   */
  httpErrorRate: (threshold: number, duration = '5m') =>
    ConditionBuilder.create()
      .metric('http_request_errors_rate')
      .rate()
      .gt(threshold)
      .duration(duration)
      .build(),

  /**
   * Response latency
   */
  responseLatency: (thresholdMs: number, duration = '5m') =>
    ConditionBuilder.create()
      .metric('http_request_duration_milliseconds')
      .avg()
      .gt(thresholdMs)
      .duration(duration)
      .build(),

  /**
   * Database connections
   */
  dbConnections: (threshold: number, duration = '5m') =>
    ConditionBuilder.create()
      .metric('database_connections_used_percent')
      .avg()
      .gt(threshold)
      .duration(duration)
      .build(),

  /**
   * Queue depth
   */
  queueDepth: (threshold: number, duration = '5m') =>
    ConditionBuilder.create()
      .metric('queue_messages_ready')
      .avg()
      .gt(threshold)
      .duration(duration)
      .build(),

  /**
   * SSL certificate expiry
   */
  sslExpiry: (daysBeforeExpiry: number) =>
    ConditionBuilder.create()
      .metric('ssl_certificate_expiry_days')
      .last()
      .lt(daysBeforeExpiry)
      .duration('0s')
      .build(),
};
