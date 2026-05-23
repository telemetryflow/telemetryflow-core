/**
 * AggregationInterval Value Object
 * Time-series aggregation intervals
 */
export class AggregationInterval {
  static readonly ONE_MINUTE = new AggregationInterval('1m', 60);
  static readonly FIVE_MINUTES = new AggregationInterval('5m', 5 * 60);
  static readonly FIFTEEN_MINUTES = new AggregationInterval('15m', 15 * 60);
  static readonly THIRTY_MINUTES = new AggregationInterval('30m', 30 * 60);
  static readonly ONE_HOUR = new AggregationInterval('1h', 60 * 60);
  static readonly SIX_HOURS = new AggregationInterval('6h', 6 * 60 * 60);
  static readonly TWELVE_HOURS = new AggregationInterval('12h', 12 * 60 * 60);
  static readonly ONE_DAY = new AggregationInterval('1d', 24 * 60 * 60);
  static readonly ONE_WEEK = new AggregationInterval('1w', 7 * 24 * 60 * 60);

  private static readonly ALL_INTERVALS: AggregationInterval[] = [
    AggregationInterval.ONE_MINUTE,
    AggregationInterval.FIVE_MINUTES,
    AggregationInterval.FIFTEEN_MINUTES,
    AggregationInterval.THIRTY_MINUTES,
    AggregationInterval.ONE_HOUR,
    AggregationInterval.SIX_HOURS,
    AggregationInterval.TWELVE_HOURS,
    AggregationInterval.ONE_DAY,
    AggregationInterval.ONE_WEEK,
  ];

  private constructor(
    private readonly _label: string,
    private readonly _seconds: number,
  ) {}

  get label(): string {
    return this._label;
  }

  get seconds(): number {
    return this._seconds;
  }

  get milliseconds(): number {
    return this._seconds * 1000;
  }

  /**
   * Parse interval from string (e.g., "1m", "5m", "1h", "1d")
   */
  static fromString(value: string): AggregationInterval {
    const interval = this.ALL_INTERVALS.find((i) => i._label === value);
    if (!interval) {
      throw new Error(
        `Invalid interval: ${value}. Valid values: ${this.ALL_INTERVALS.map((i) => i._label).join(', ')}`,
      );
    }
    return interval;
  }

  /**
   * Create interval from seconds
   */
  static fromSeconds(seconds: number): AggregationInterval {
    // Find the closest matching interval
    const sorted = [...this.ALL_INTERVALS].sort(
      (a, b) => Math.abs(a._seconds - seconds) - Math.abs(b._seconds - seconds),
    );
    return sorted[0];
  }

  /**
   * Get ClickHouse INTERVAL expression
   */
  toClickHouseInterval(): string {
    if (this._seconds < 60) {
      return `INTERVAL ${this._seconds} SECOND`;
    } else if (this._seconds < 3600) {
      return `INTERVAL ${this._seconds / 60} MINUTE`;
    } else if (this._seconds < 86400) {
      return `INTERVAL ${this._seconds / 3600} HOUR`;
    } else {
      return `INTERVAL ${this._seconds / 86400} DAY`;
    }
  }

  /**
   * Get ClickHouse toStartOfInterval function
   */
  toClickHouseFunction(): string {
    switch (this._label) {
      case '1m':
        return 'toStartOfMinute';
      case '5m':
        return 'toStartOfFiveMinutes';
      case '15m':
        return 'toStartOfFifteenMinutes';
      case '1h':
        return 'toStartOfHour';
      case '1d':
        return 'toStartOfDay';
      case '1w':
        return 'toStartOfWeek';
      default:
        return `toStartOfInterval(timestamp, ${this.toClickHouseInterval()})`;
    }
  }

  equals(other: AggregationInterval): boolean {
    return this._seconds === other._seconds;
  }

  toString(): string {
    return this._label;
  }
}

/**
 * Aggregation types for metrics
 */
export enum AggregationType {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  P50 = 'p50',
  P75 = 'p75',
  P90 = 'p90',
  P95 = 'p95',
  P99 = 'p99',
  RATE = 'rate',
  INCREASE = 'increase',
  HISTOGRAM = 'histogram',
}

/**
 * Fill strategies for missing data points
 */
export enum FillStrategy {
  NULL = 'null',
  ZERO = 'zero',
  PREVIOUS = 'previous',
  LINEAR = 'linear',
}

/**
 * Sort order for query results
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
