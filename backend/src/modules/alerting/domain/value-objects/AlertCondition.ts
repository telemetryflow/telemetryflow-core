/**
 * Alert Condition Types
 */
export enum ConditionOperator {
  GREATER_THAN = "gt",
  GREATER_THAN_OR_EQUAL = "gte",
  LESS_THAN = "lt",
  LESS_THAN_OR_EQUAL = "lte",
  EQUAL = "eq",
  NOT_EQUAL = "neq",
  CONTAINS = "contains",
  NOT_CONTAINS = "not_contains",
  REGEX = "regex",
  IS_NULL = "is_null",
  IS_NOT_NULL = "is_not_null",
}

export enum ConditionAggregation {
  AVG = "avg",
  SUM = "sum",
  MIN = "min",
  MAX = "max",
  COUNT = "count",
  RATE = "rate",
  P50 = "p50",
  P90 = "p90",
  P95 = "p95",
  P99 = "p99",
  LAST = "last",
}

export enum AlertSeverity {
  CRITICAL = "critical",
  WARNING = "warning",
  INFO = "info",
}

export interface AlertConditionProps {
  metric: string;
  aggregation: ConditionAggregation;
  operator: ConditionOperator;
  threshold: number;
  duration: string; // e.g., "5m", "1h"
  labels?: Record<string, string>;
}

export class AlertCondition {
  private constructor(
    private readonly metric: string,
    private readonly aggregation: ConditionAggregation,
    private readonly operator: ConditionOperator,
    private readonly threshold: number,
    private readonly duration: string,
    private readonly labels: Record<string, string>,
  ) {}

  static create(props: AlertConditionProps): AlertCondition {
    if (!props.metric) {
      throw new Error("Metric is required for alert condition");
    }

    if (props.threshold === undefined || props.threshold === null) {
      throw new Error("Threshold is required for alert condition");
    }

    if (!props.duration) {
      throw new Error("Duration is required for alert condition");
    }

    return new AlertCondition(
      props.metric,
      props.aggregation || ConditionAggregation.AVG,
      props.operator || ConditionOperator.GREATER_THAN,
      props.threshold,
      props.duration,
      props.labels || {},
    );
  }

  static fromJSON(json: AlertConditionProps): AlertCondition {
    return AlertCondition.create(json);
  }

  toJSON(): AlertConditionProps {
    return {
      metric: this.metric,
      aggregation: this.aggregation,
      operator: this.operator,
      threshold: this.threshold,
      duration: this.duration,
      labels: this.labels,
    };
  }

  getMetric(): string {
    return this.metric;
  }

  getAggregation(): ConditionAggregation {
    return this.aggregation;
  }

  getOperator(): ConditionOperator {
    return this.operator;
  }

  getThreshold(): number {
    return this.threshold;
  }

  getDuration(): string {
    return this.duration;
  }

  getLabels(): Record<string, string> {
    return { ...this.labels };
  }

  /**
   * Evaluate the condition against a value
   */
  evaluate(value: number | string | null): boolean {
    if (this.operator === ConditionOperator.IS_NULL) {
      return value === null || value === undefined;
    }

    if (this.operator === ConditionOperator.IS_NOT_NULL) {
      return value !== null && value !== undefined;
    }

    if (value === null || value === undefined) {
      return false;
    }

    const numValue =
      typeof value === "number" ? value : parseFloat(value as string);

    switch (this.operator) {
      case ConditionOperator.GREATER_THAN:
        return numValue > this.threshold;
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return numValue >= this.threshold;
      case ConditionOperator.LESS_THAN:
        return numValue < this.threshold;
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return numValue <= this.threshold;
      case ConditionOperator.EQUAL:
        return numValue === this.threshold;
      case ConditionOperator.NOT_EQUAL:
        return numValue !== this.threshold;
      case ConditionOperator.CONTAINS:
        return String(value).includes(String(this.threshold));
      case ConditionOperator.NOT_CONTAINS:
        return !String(value).includes(String(this.threshold));
      case ConditionOperator.REGEX:
        try {
          const pattern = String(this.threshold);
          if (pattern.length > 500) return false;
          return new RegExp(pattern).test(String(value));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * Build a human-readable description
   */
  describe(): string {
    const operatorSymbols: Record<ConditionOperator, string> = {
      [ConditionOperator.GREATER_THAN]: ">",
      [ConditionOperator.GREATER_THAN_OR_EQUAL]: ">=",
      [ConditionOperator.LESS_THAN]: "<",
      [ConditionOperator.LESS_THAN_OR_EQUAL]: "<=",
      [ConditionOperator.EQUAL]: "=",
      [ConditionOperator.NOT_EQUAL]: "!=",
      [ConditionOperator.CONTAINS]: "contains",
      [ConditionOperator.NOT_CONTAINS]: "not contains",
      [ConditionOperator.REGEX]: "matches",
      [ConditionOperator.IS_NULL]: "is null",
      [ConditionOperator.IS_NOT_NULL]: "is not null",
    };

    return `${this.aggregation}(${this.metric}) ${operatorSymbols[this.operator]} ${this.threshold} for ${this.duration}`;
  }
}
