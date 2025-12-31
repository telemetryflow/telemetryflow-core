/**
 * P25 Phase 4: Performance & Sampling
 * Log Sampling Utilities
 *
 * Provides intelligent log sampling to reduce log volume in high-traffic scenarios
 * while preserving important events and error traces.
 */

/**
 * Sampling strategy type
 */
export type SamplingStrategy = 'probability' | 'rate-limit' | 'adaptive' | 'error-only';

/**
 * Sampling configuration
 */
export interface SamplingConfig {
  /** Sampling strategy to use */
  strategy: SamplingStrategy;

  /** Sample rate (0.0 - 1.0) for probability-based sampling */
  sampleRate?: number;

  /** Maximum logs per second for rate limiting */
  maxLogsPerSecond?: number;

  /** Always sample errors and warnings */
  alwaysSampleErrors?: boolean;

  /** Paths to always sample (e.g., critical endpoints) */
  alwaysSamplePaths?: string[];

  /** Paths to never sample (excluded from sampling) */
  neverSamplePaths?: string[];
}

/**
 * Log sampler interface
 */
export interface ILogSampler {
  /**
   * Determine if a log should be sampled
   * @param level Log level
   * @param context Log context (optional)
   * @returns true if log should be emitted, false if sampled out
   */
  shouldSample(level: string, context?: Record<string, unknown>): boolean;

  /**
   * Reset sampler state (for testing or periodic resets)
   */
  reset(): void;

  /**
   * Get sampling statistics
   */
  getStats(): SamplingStats;
}

/**
 * Sampling statistics
 */
export interface SamplingStats {
  totalLogs: number;
  sampledLogs: number;
  emittedLogs: number;
  sampleRate: number;
  errors: number;
  warnings: number;
}

/**
 * Probability-based sampler
 * Samples logs based on a fixed probability (e.g., 10% = 0.1)
 */
export class ProbabilitySampler implements ILogSampler {
  private stats: SamplingStats = {
    totalLogs: 0,
    sampledLogs: 0,
    emittedLogs: 0,
    sampleRate: 0,
    errors: 0,
    warnings: 0,
  };

  constructor(
    private readonly sampleRate: number = 1.0,
    private readonly alwaysSampleErrors: boolean = true,
  ) {
    if (sampleRate < 0 || sampleRate > 1) {
      throw new Error('Sample rate must be between 0.0 and 1.0');
    }
  }

  shouldSample(level: string, _context?: Record<string, unknown>): boolean {
    this.stats.totalLogs++;

    // Always sample errors if configured
    if (this.alwaysSampleErrors && (level === 'error' || level === 'warn')) {
      if (level === 'error') this.stats.errors++;
      if (level === 'warn') this.stats.warnings++;
      this.stats.emittedLogs++;
      return true;
    }

    // Probability-based sampling
    const shouldEmit = Math.random() < this.sampleRate;

    if (shouldEmit) {
      this.stats.emittedLogs++;
    } else {
      this.stats.sampledLogs++;
    }

    return shouldEmit;
  }

  reset(): void {
    this.stats = {
      totalLogs: 0,
      sampledLogs: 0,
      emittedLogs: 0,
      sampleRate: 0,
      errors: 0,
      warnings: 0,
    };
  }

  getStats(): SamplingStats {
    return {
      ...this.stats,
      sampleRate: this.stats.totalLogs > 0
        ? this.stats.emittedLogs / this.stats.totalLogs
        : 0,
    };
  }
}

/**
 * Rate-limiting sampler
 * Limits logs to a maximum number per second using token bucket algorithm
 */
export class RateLimitSampler implements ILogSampler {
  private tokens: number;
  private lastRefill: number;
  private stats: SamplingStats = {
    totalLogs: 0,
    sampledLogs: 0,
    emittedLogs: 0,
    sampleRate: 0,
    errors: 0,
    warnings: 0,
  };

  constructor(
    private readonly maxLogsPerSecond: number = 100,
    private readonly alwaysSampleErrors: boolean = true,
  ) {
    this.tokens = maxLogsPerSecond;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timePassed * this.maxLogsPerSecond;

    this.tokens = Math.min(this.maxLogsPerSecond, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  shouldSample(level: string, _context?: Record<string, unknown>): boolean {
    this.stats.totalLogs++;
    this.refillTokens();

    // Always sample errors if configured
    if (this.alwaysSampleErrors && (level === 'error' || level === 'warn')) {
      if (level === 'error') this.stats.errors++;
      if (level === 'warn') this.stats.warnings++;
      this.stats.emittedLogs++;
      return true;
    }

    // Check if we have tokens available
    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.stats.emittedLogs++;
      return true;
    }

    // No tokens available - sample out
    this.stats.sampledLogs++;
    return false;
  }

  reset(): void {
    this.tokens = this.maxLogsPerSecond;
    this.lastRefill = Date.now();
    this.stats = {
      totalLogs: 0,
      sampledLogs: 0,
      emittedLogs: 0,
      sampleRate: 0,
      errors: 0,
      warnings: 0,
    };
  }

  getStats(): SamplingStats {
    return {
      ...this.stats,
      sampleRate: this.stats.totalLogs > 0
        ? this.stats.emittedLogs / this.stats.totalLogs
        : 0,
    };
  }
}

/**
 * Adaptive sampler
 * Dynamically adjusts sampling rate based on log volume
 * Samples more aggressively during high load, less during normal operation
 */
export class AdaptiveSampler implements ILogSampler {
  private windowLogs: number = 0;
  private windowStart: number = Date.now();
  private currentSampleRate: number = 1.0;
  private stats: SamplingStats = {
    totalLogs: 0,
    sampledLogs: 0,
    emittedLogs: 0,
    sampleRate: 0,
    errors: 0,
    warnings: 0,
  };

  constructor(
    private readonly targetLogsPerSecond: number = 100,
    private readonly windowSizeMs: number = 1000,
    private readonly alwaysSampleErrors: boolean = true,
  ) {}

  private adjustSampleRate(): void {
    const now = Date.now();
    const windowDuration = now - this.windowStart;

    // Check if window has elapsed
    if (windowDuration >= this.windowSizeMs) {
      const logsPerSecond = (this.windowLogs / windowDuration) * 1000;

      // Adjust sample rate based on current load
      if (logsPerSecond > this.targetLogsPerSecond * 2) {
        // Very high load - aggressive sampling
        this.currentSampleRate = Math.max(0.1, this.currentSampleRate * 0.8);
      } else if (logsPerSecond > this.targetLogsPerSecond) {
        // High load - moderate sampling
        this.currentSampleRate = Math.max(0.5, this.currentSampleRate * 0.9);
      } else {
        // Normal load - increase sample rate
        this.currentSampleRate = Math.min(1.0, this.currentSampleRate * 1.1);
      }

      // Reset window
      this.windowLogs = 0;
      this.windowStart = now;
    }
  }

  shouldSample(level: string, _context?: Record<string, unknown>): boolean {
    this.stats.totalLogs++;
    this.windowLogs++;
    this.adjustSampleRate();

    // Always sample errors if configured
    if (this.alwaysSampleErrors && (level === 'error' || level === 'warn')) {
      if (level === 'error') this.stats.errors++;
      if (level === 'warn') this.stats.warnings++;
      this.stats.emittedLogs++;
      return true;
    }

    // Adaptive probability-based sampling
    const shouldEmit = Math.random() < this.currentSampleRate;

    if (shouldEmit) {
      this.stats.emittedLogs++;
    } else {
      this.stats.sampledLogs++;
    }

    return shouldEmit;
  }

  reset(): void {
    this.windowLogs = 0;
    this.windowStart = Date.now();
    this.currentSampleRate = 1.0;
    this.stats = {
      totalLogs: 0,
      sampledLogs: 0,
      emittedLogs: 0,
      sampleRate: 0,
      errors: 0,
      warnings: 0,
    };
  }

  getStats(): SamplingStats {
    return {
      ...this.stats,
      sampleRate: this.stats.totalLogs > 0
        ? this.stats.emittedLogs / this.stats.totalLogs
        : 0,
    };
  }

  /**
   * Get current dynamic sample rate
   */
  getCurrentSampleRate(): number {
    return this.currentSampleRate;
  }
}

/**
 * Error-only sampler
 * Only emits error and warning logs, drops all others
 */
export class ErrorOnlySampler implements ILogSampler {
  private stats: SamplingStats = {
    totalLogs: 0,
    sampledLogs: 0,
    emittedLogs: 0,
    sampleRate: 0,
    errors: 0,
    warnings: 0,
  };

  shouldSample(level: string, _context?: Record<string, unknown>): boolean {
    this.stats.totalLogs++;

    if (level === 'error' || level === 'warn') {
      if (level === 'error') this.stats.errors++;
      if (level === 'warn') this.stats.warnings++;
      this.stats.emittedLogs++;
      return true;
    }

    this.stats.sampledLogs++;
    return false;
  }

  reset(): void {
    this.stats = {
      totalLogs: 0,
      sampledLogs: 0,
      emittedLogs: 0,
      sampleRate: 0,
      errors: 0,
      warnings: 0,
    };
  }

  getStats(): SamplingStats {
    return {
      ...this.stats,
      sampleRate: this.stats.totalLogs > 0
        ? this.stats.emittedLogs / this.stats.totalLogs
        : 0,
    };
  }
}

/**
 * Create a sampler based on configuration
 */
export function createSampler(config: SamplingConfig): ILogSampler {
  switch (config.strategy) {
    case 'probability':
      return new ProbabilitySampler(
        config.sampleRate ?? 1.0,
        config.alwaysSampleErrors ?? true,
      );

    case 'rate-limit':
      return new RateLimitSampler(
        config.maxLogsPerSecond ?? 100,
        config.alwaysSampleErrors ?? true,
      );

    case 'adaptive':
      return new AdaptiveSampler(
        config.maxLogsPerSecond ?? 100,
        1000, // 1 second window
        config.alwaysSampleErrors ?? true,
      );

    case 'error-only':
      return new ErrorOnlySampler();

    default:
      throw new Error(`Unknown sampling strategy: ${config.strategy}`);
  }
}
