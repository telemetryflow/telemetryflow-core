/**
 * Materialized View Rollup Table Resolver
 *
 * Maps a base ClickHouse table + requested aggregation step to the optimal
 * materialized view. Picks the LARGEST MV interval that is ≤ the requested
 * step so the MV can be re-bucketed to the target interval.
 *
 * Falls back to the raw base table when no suitable MV exists.
 */

export interface RollupResolution {
  /** Table to query (MV table name, or raw base table) */
  table: string;
  /** Timestamp column name in the resolved table */
  timestampCol: string;
  /** Whether the resolved table is a materialized view */
  isMaterializedView: boolean;
  /** Engine type — determines aggregation function syntax */
  engineType: "aggregating" | "summing" | "raw";
  /** The MV's native interval in seconds (0 for raw) */
  intervalSeconds: number;
}

interface MVEntry {
  intervalSec: number;
  table: string;
  tsCol: string;
  engine: "aggregating" | "summing";
}

/**
 * Registry of all materialized views per base table.
 * Entries MUST be sorted ascending by intervalSec.
 */
const MV_REGISTRY: Record<string, MVEntry[]> = {
  metrics: [
    {
      intervalSec: 60,
      table: "metrics_1m",
      tsCol: "minute",
      engine: "aggregating",
    },
    {
      intervalSec: 300,
      table: "metrics_5m",
      tsCol: "five_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 900,
      table: "metrics_15m",
      tsCol: "fifteen_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 3600,
      table: "metrics_1h",
      tsCol: "hour",
      engine: "aggregating",
    },
    {
      intervalSec: 21600,
      table: "metrics_6h",
      tsCol: "six_hours",
      engine: "aggregating",
    },
  ],
  logs: [
    {
      intervalSec: 300,
      table: "logs_5m",
      tsCol: "five_minutes",
      engine: "summing",
    },
    {
      intervalSec: 900,
      table: "logs_15m",
      tsCol: "fifteen_minutes",
      engine: "summing",
    },
    {
      intervalSec: 21600,
      table: "logs_6h",
      tsCol: "six_hours",
      engine: "summing",
    },
  ],
  traces: [
    {
      intervalSec: 300,
      table: "traces_5m",
      tsCol: "five_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 900,
      table: "traces_15m",
      tsCol: "fifteen_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 21600,
      table: "traces_6h",
      tsCol: "six_hours",
      engine: "aggregating",
    },
  ],
  audit_logs: [
    {
      intervalSec: 300,
      table: "audit_logs_5m",
      tsCol: "five_minutes",
      engine: "summing",
    },
    {
      intervalSec: 900,
      table: "audit_logs_15m",
      tsCol: "fifteen_minutes",
      engine: "summing",
    },
    {
      intervalSec: 3600,
      table: "audit_logs_1h",
      tsCol: "hour",
      engine: "summing",
    },
    {
      intervalSec: 21600,
      table: "audit_logs_6h",
      tsCol: "six_hours",
      engine: "summing",
    },
  ],
  uptime_checks: [
    {
      intervalSec: 300,
      table: "uptime_checks_5m",
      tsCol: "five_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 900,
      table: "uptime_checks_15m",
      tsCol: "fifteen_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 3600,
      table: "uptime_checks_1h",
      tsCol: "hour",
      engine: "aggregating",
    },
    {
      intervalSec: 21600,
      table: "uptime_checks_6h",
      tsCol: "six_hours",
      engine: "aggregating",
    },
    {
      intervalSec: 86400,
      table: "uptime_checks_1d",
      tsCol: "day",
      engine: "aggregating",
    },
  ],
  exemplars: [
    {
      intervalSec: 300,
      table: "exemplars_5m",
      tsCol: "five_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 900,
      table: "exemplars_15m",
      tsCol: "fifteen_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 3600,
      table: "exemplars_1h",
      tsCol: "hour",
      engine: "aggregating",
    },
  ],
  signal_correlations: [
    {
      intervalSec: 300,
      table: "signal_correlations_5m",
      tsCol: "five_minutes",
      engine: "summing",
    },
    {
      intervalSec: 900,
      table: "signal_correlations_15m",
      tsCol: "fifteen_minutes",
      engine: "summing",
    },
    {
      intervalSec: 3600,
      table: "signal_correlations_1h",
      tsCol: "hour",
      engine: "summing",
    },
  ],
  kubernetes_metrics: [
    {
      intervalSec: 60,
      table: "kubernetes_metrics_1m",
      tsCol: "one_minute",
      engine: "aggregating",
    },
    {
      intervalSec: 300,
      table: "kubernetes_metrics_5m",
      tsCol: "five_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 900,
      table: "kubernetes_metrics_15m",
      tsCol: "fifteen_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 3600,
      table: "kubernetes_metrics_1h",
      tsCol: "hour",
      engine: "aggregating",
    },
    {
      intervalSec: 21600,
      table: "kubernetes_metrics_6h",
      tsCol: "six_hours",
      engine: "aggregating",
    },
    {
      intervalSec: 86400,
      table: "kubernetes_metrics_1d",
      tsCol: "day",
      engine: "aggregating",
    },
  ],
  vm_metrics: [
    {
      intervalSec: 300,
      table: "vm_metrics_5m",
      tsCol: "five_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 900,
      table: "vm_metrics_15m",
      tsCol: "fifteen_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 3600,
      table: "vm_metrics_1h",
      tsCol: "hour",
      engine: "aggregating",
    },
    {
      intervalSec: 21600,
      table: "vm_metrics_6h",
      tsCol: "six_hours",
      engine: "aggregating",
    },
    {
      intervalSec: 86400,
      table: "vm_metrics_1d",
      tsCol: "day",
      engine: "aggregating",
    },
  ],
  llm_usage_raw: [
    {
      intervalSec: 300,
      table: "llm_usage_5m_mv",
      tsCol: "five_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 900,
      table: "llm_usage_15m_mv",
      tsCol: "fifteen_minutes",
      engine: "aggregating",
    },
    {
      intervalSec: 3600,
      table: "llm_usage_1h_mv",
      tsCol: "hour",
      engine: "aggregating",
    },
    {
      intervalSec: 21600,
      table: "llm_usage_6h_mv",
      tsCol: "six_hours",
      engine: "aggregating",
    },
    {
      intervalSec: 86400,
      table: "llm_usage_1d_mv",
      tsCol: "day",
      engine: "aggregating",
    },
  ],
  service_map_metrics: [
    {
      intervalSec: 300,
      table: "service_map_metrics_5m",
      tsCol: "five_minutes",
      engine: "summing",
    },
    {
      intervalSec: 900,
      table: "service_map_metrics_15m",
      tsCol: "fifteen_minutes",
      engine: "summing",
    },
    {
      intervalSec: 3600,
      table: "service_map_metrics_1h",
      tsCol: "hour",
      engine: "summing",
    },
    {
      intervalSec: 21600,
      table: "service_map_metrics_6h",
      tsCol: "six_hours",
      engine: "summing",
    },
    {
      intervalSec: 86400,
      table: "service_map_metrics_1d",
      tsCol: "day",
      engine: "summing",
    },
  ],
  network_map_traffic: [
    {
      intervalSec: 300,
      table: "network_map_traffic_5m",
      tsCol: "five_minutes",
      engine: "summing",
    },
    {
      intervalSec: 900,
      table: "network_map_traffic_15m",
      tsCol: "fifteen_minutes",
      engine: "summing",
    },
    {
      intervalSec: 3600,
      table: "network_map_traffic_1h",
      tsCol: "hour",
      engine: "summing",
    },
    {
      intervalSec: 21600,
      table: "network_map_traffic_6h",
      tsCol: "six_hours",
      engine: "summing",
    },
    {
      intervalSec: 86400,
      table: "network_map_traffic_1d",
      tsCol: "day",
      engine: "summing",
    },
  ],
  network_map_connection_metrics: [
    {
      intervalSec: 300,
      table: "network_map_connection_metrics_5m",
      tsCol: "five_minutes",
      engine: "summing",
    },
    {
      intervalSec: 900,
      table: "network_map_connection_metrics_15m",
      tsCol: "fifteen_minutes",
      engine: "summing",
    },
    {
      intervalSec: 3600,
      table: "network_map_connection_metrics_1h",
      tsCol: "hour",
      engine: "summing",
    },
    {
      intervalSec: 21600,
      table: "network_map_connection_metrics_6h",
      tsCol: "six_hours",
      engine: "summing",
    },
    {
      intervalSec: 86400,
      table: "network_map_connection_metrics_1d",
      tsCol: "day",
      engine: "summing",
    },
  ],
};

/**
 * Resolve the optimal materialized view for a given base table and step.
 *
 * Algorithm: pick the LARGEST MV interval ≤ stepSeconds.
 * If no MV qualifies (step < smallest MV interval), returns the raw table.
 *
 * @param baseTable   The raw base table name (e.g. 'metrics', 'logs', 'traces')
 * @param stepSeconds The requested aggregation interval in seconds
 * @returns           Resolution with table name, timestamp column, and engine info
 */
export function resolveRollupTable(
  baseTable: string,
  stepSeconds: number,
): RollupResolution {
  const entries = MV_REGISTRY[baseTable];

  if (!entries || entries.length === 0 || stepSeconds <= 0) {
    return {
      table: baseTable,
      timestampCol: baseTable === "uptime_checks" ? "checked_at" : "timestamp",
      isMaterializedView: false,
      engineType: "raw",
      intervalSeconds: 0,
    };
  }

  // Find the largest MV interval that fits within the requested step
  let bestMatch: MVEntry | null = null;
  for (const entry of entries) {
    if (entry.intervalSec <= stepSeconds) {
      bestMatch = entry;
    } else {
      break;
    }
  }

  if (!bestMatch) {
    return {
      table: baseTable,
      timestampCol: baseTable === "uptime_checks" ? "checked_at" : "timestamp",
      isMaterializedView: false,
      engineType: "raw",
      intervalSeconds: 0,
    };
  }

  return {
    table: bestMatch.table,
    timestampCol: bestMatch.tsCol,
    isMaterializedView: true,
    engineType: bestMatch.engine,
    intervalSeconds: bestMatch.intervalSec,
  };
}

/**
 * Build the time-bucket SELECT expression.
 *
 * - Raw table: `toStartOfInterval(timestamp, INTERVAL N SECOND) as ts`
 * - MV where step == MV interval: `{tsCol} as ts`
 * - MV where step > MV interval: `toStartOfInterval({tsCol}, INTERVAL N SECOND) as ts`
 */
export function buildTimeBucket(
  rollup: RollupResolution,
  stepSeconds: number,
  alias = "ts",
  timezone?: string,
): string {
  // ClickHouse toStartOfInterval accepts optional timezone for correct day/hour boundaries
  const tzSuffix = timezone ? `, '${timezone}'` : "";

  if (!rollup.isMaterializedView) {
    return `toStartOfInterval(${rollup.timestampCol}, INTERVAL ${stepSeconds} SECOND${tzSuffix}) as ${alias}`;
  }

  if (stepSeconds === rollup.intervalSeconds) {
    return `${rollup.timestampCol} as ${alias}`;
  }

  return `toStartOfInterval(${rollup.timestampCol}, INTERVAL ${stepSeconds} SECOND${tzSuffix}) as ${alias}`;
}

/**
 * Build time-range WHERE conditions using the correct timestamp column.
 * Uses fromUnixTimestamp64Milli for parameterised queries.
 */
export function buildTimeConditions(
  rollup: RollupResolution,
): [string, string] {
  const col = rollup.isMaterializedView
    ? rollup.timestampCol
    : rollup.timestampCol;
  return [
    `${col} >= fromUnixTimestamp64Milli({startMs:UInt64})`,
    `${col} <= fromUnixTimestamp64Milli({endMs:UInt64})`,
  ];
}

/**
 * Map a raw-table aggregation function to its MV-compatible equivalent.
 *
 * AggregatingMergeTree stores *State() columns → query with *Merge().
 * SummingMergeTree stores pre-summed counts → query with sum(count).
 */
export function mapMVAggregation(
  aggType: string,
  rollup: RollupResolution,
  signalType: "metrics" | "logs" | "traces" | "exemplars",
): string {
  if (!rollup.isMaterializedView) {
    // Raw table — return standard aggregation
    return rawAggregation(aggType, signalType);
  }

  if (rollup.engineType === "summing") {
    // SummingMergeTree — count column is pre-summed
    return "sum(count)";
  }

  // AggregatingMergeTree — use *Merge() functions
  if (signalType === "metrics") {
    return metricsAggMerge(aggType);
  }
  if (signalType === "traces") {
    return tracesAggMerge(aggType);
  }
  if (signalType === "exemplars") {
    return exemplarsAggMerge(aggType);
  }
  return "countMerge(count)";
}

function rawAggregation(aggType: string, signalType: string): string {
  if (signalType === "logs") return "count()";

  if (signalType === "exemplars") {
    switch (aggType) {
      case "avg":
        return "avg(value)";
      case "min":
        return "min(value)";
      case "max":
        return "max(value)";
      case "count":
      case "rate":
        return "count()";
      default:
        return "avg(value)";
    }
  }

  if (signalType === "traces") {
    switch (aggType) {
      case "count":
      case "rate":
        return "count()";
      case "p50":
        return "quantile(0.5)(duration_ns) / 1000000";
      case "p75":
        return "quantile(0.75)(duration_ns) / 1000000";
      case "p90":
        return "quantile(0.9)(duration_ns) / 1000000";
      case "p95":
        return "quantile(0.95)(duration_ns) / 1000000";
      case "p99":
        return "quantile(0.99)(duration_ns) / 1000000";
      case "avg":
        return "avg(duration_ns) / 1000000";
      default:
        return `avg(duration_ns) / 1000000`;
    }
  }

  // metrics
  switch (aggType) {
    case "avg":
      return "avg(value)";
    case "sum":
      return "sum(value)";
    case "min":
      return "min(value)";
    case "max":
      return "max(value)";
    case "count":
    case "rate":
      return "count()";
    default:
      return "avg(value)";
  }
}

function metricsAggMerge(aggType: string): string {
  switch (aggType) {
    case "avg":
      return "avgMerge(avg_value)";
    case "sum":
      return "sumMerge(sum_value)";
    case "min":
      return "minMerge(min_value)";
    case "max":
      return "maxMerge(max_value)";
    case "count":
    case "rate":
      return "countMerge(count)";
    case "p50":
      return "quantileMerge(0.5)(p50_value)";
    case "p75":
      return "quantileMerge(0.75)(p75_value)";
    case "p90":
      return "quantileMerge(0.9)(p90_value)";
    case "p95":
      return "quantileMerge(0.95)(p95_value)";
    case "p99":
      return "quantileMerge(0.99)(p99_value)";
    default:
      return "avgMerge(avg_value)";
  }
}

function tracesAggMerge(aggType: string): string {
  switch (aggType) {
    case "count":
    case "rate":
      return "countMerge(count)";
    case "avg":
      return "avgMerge(avg_duration_ns) / 1000000";
    case "p50":
      return "quantileMerge(0.5)(p50_duration_ns) / 1000000";
    case "p75":
      return "quantileMerge(0.75)(p75_duration_ns) / 1000000";
    case "p90":
      return "quantileMerge(0.9)(p90_duration_ns) / 1000000";
    case "p95":
      return "quantileMerge(0.95)(p95_duration_ns) / 1000000";
    case "p99":
      return "quantileMerge(0.99)(p99_duration_ns) / 1000000";
    case "min":
      return "minMerge(min_duration_ns) / 1000000";
    case "max":
      return "maxMerge(max_duration_ns) / 1000000";
    default:
      return "countMerge(count)";
  }
}

function exemplarsAggMerge(aggType: string): string {
  switch (aggType) {
    case "avg":
      return "avgMerge(avg_value)";
    case "min":
      return "minMerge(min_value)";
    case "max":
      return "maxMerge(max_value)";
    case "count":
    case "rate":
      return "countMerge(count)";
    default:
      return "avgMerge(avg_value)";
  }
}

/**
 * Compute the optimal aggregation step from a time range,
 * matching the frontend's INTERVAL_RECOMMENDATIONS.
 *
 * | Time Range    | Interval | Seconds |
 * |---------------|----------|---------|
 * | ≤ 1 hour      | 1m       | 60      |
 * | ≤ 6 hours     | 5m       | 300     |
 * | ≤ 24 hours    | 15m      | 900     |
 * | ≤ 7 days      | 1h       | 3600    |
 * | ≤ 30 days     | 6h       | 21600   |
 * | > 30 days     | 1d       | 86400   |
 */
export function recommendedStep(startMs: number, endMs: number): number {
  const durationMs = endMs - startMs;
  const HOUR = 3_600_000;
  const DAY = 86_400_000;

  if (durationMs <= 1 * HOUR) return 60;
  if (durationMs <= 6 * HOUR) return 300;
  if (durationMs <= 24 * HOUR) return 900;
  if (durationMs <= 7 * DAY) return 3600;
  if (durationMs <= 30 * DAY) return 21600;
  return 86400;
}
