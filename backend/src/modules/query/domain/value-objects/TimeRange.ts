/**
 * TimeRange Value Object
 * Immutable time window for queries
 */
export class TimeRange {
  private constructor(
    private readonly _from: Date,
    private readonly _to: Date,
  ) {
    if (_from >= _to) {
      throw new Error('Invalid time range: from must be before to');
    }
  }

  static create(from: Date, to: Date): TimeRange {
    return new TimeRange(from, to);
  }

  static fromStrings(from: string, to: string): TimeRange {
    return new TimeRange(new Date(from), new Date(to));
  }

  static last(milliseconds: number): TimeRange {
    const to = new Date();
    const from = new Date(to.getTime() - milliseconds);
    return new TimeRange(from, to);
  }

  static lastMinutes(minutes: number): TimeRange {
    return TimeRange.last(minutes * 60 * 1000);
  }

  static lastHours(hours: number): TimeRange {
    return TimeRange.last(hours * 60 * 60 * 1000);
  }

  static lastDays(days: number): TimeRange {
    return TimeRange.last(days * 24 * 60 * 60 * 1000);
  }

  get from(): Date {
    return this._from;
  }

  get to(): Date {
    return this._to;
  }

  getDurationMs(): number {
    return this._to.getTime() - this._from.getTime();
  }

  getDurationSeconds(): number {
    return Math.floor(this.getDurationMs() / 1000);
  }

  getDurationMinutes(): number {
    return Math.floor(this.getDurationMs() / (60 * 1000));
  }

  getDurationHours(): number {
    return Math.floor(this.getDurationMs() / (60 * 60 * 1000));
  }

  /**
   * Suggests an appropriate aggregation interval based on the time range duration
   */
  suggestInterval(): string {
    const durationHours = this.getDurationHours();

    if (durationHours <= 1) return '1m';
    if (durationHours <= 6) return '5m';
    if (durationHours <= 24) return '15m';
    if (durationHours <= 168) return '1h'; // 7 days
    if (durationHours <= 720) return '6h'; // 30 days
    return '1d';
  }

  /**
   * Check if a timestamp falls within this range
   */
  contains(timestamp: Date): boolean {
    return timestamp >= this._from && timestamp <= this._to;
  }

  /**
   * Expand the range by a percentage on both sides
   */
  expand(percentage: number): TimeRange {
    const expansion = this.getDurationMs() * (percentage / 100);
    return new TimeRange(
      new Date(this._from.getTime() - expansion),
      new Date(this._to.getTime() + expansion),
    );
  }

  /**
   * Shift the time range backward by its duration (for trend comparison)
   * Example: If range is [10:00, 11:00], shiftBackward() returns [09:00, 10:00]
   */
  shiftBackward(): TimeRange {
    const duration = this.getDurationMs();
    return new TimeRange(
      new Date(this._from.getTime() - duration),
      new Date(this._to.getTime() - duration),
    );
  }

  /**
   * Shift the time range forward by its duration
   * Example: If range is [10:00, 11:00], shiftForward() returns [11:00, 12:00]
   */
  shiftForward(): TimeRange {
    const duration = this.getDurationMs();
    return new TimeRange(
      new Date(this._from.getTime() + duration),
      new Date(this._to.getTime() + duration),
    );
  }

  /**
   * Get the from timestamp
   */
  getFrom(): Date {
    return this._from;
  }

  /**
   * Get the to timestamp
   */
  getTo(): Date {
    return this._to;
  }

  toJSON(): { from: string; to: string } {
    return {
      from: this._from.toISOString(),
      to: this._to.toISOString(),
    };
  }
}
