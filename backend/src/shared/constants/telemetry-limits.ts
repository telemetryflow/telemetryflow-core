/**
 * Telemetry data fetch limits.
 *
 * TELEMETRYFLOW_SOFT_LIMIT — Default rows returned per query when the caller does
 *   not specify a limit.  Configurable via TELEMETRYFLOW_LIMIT_DATA env var.
 *
 * TELEMETRYFLOW_HARD_LIMIT — Absolute server-side cap.  No query may return more
 *   than this many rows regardless of what the caller requests.
 *   Configurable via TELEMETRYFLOW_LIMIT_DATA_MAX env var.
 *
 * TELEMETRYFLOW_SCAN_LIMIT — Max rows ClickHouse may READ (scan) for aggregation
 *   queries (patterns, stats, top-errors).  These queries scan all logs in a
 *   time window but return a small result set, so the scan limit must be much
 *   larger than the result limit.  Derived from HARD_LIMIT × 50 so staging and
 *   prod scale proportionally.  Override via TELEMETRYFLOW_SCAN_LIMIT_DATA.
 *
 * Usage pattern in controllers:
 *   const effectiveLimit = Math.min(body.limit ?? TELEMETRYFLOW_SOFT_LIMIT, TELEMETRYFLOW_HARD_LIMIT);
 */
export const TELEMETRYFLOW_SOFT_LIMIT = parseInt(
  process.env.TELEMETRYFLOW_LIMIT_DATA || '50000',
  10,
);

export const TELEMETRYFLOW_HARD_LIMIT = parseInt(
  process.env.TELEMETRYFLOW_LIMIT_DATA_MAX || '100000',
  10,
);

export const TELEMETRYFLOW_SCAN_LIMIT = parseInt(
  process.env.TELEMETRYFLOW_SCAN_LIMIT_DATA || String(TELEMETRYFLOW_HARD_LIMIT * 50),
  10,
);

export { TELEMETRYFLOW_SOFT_LIMIT as TELEMETRY_SOFT_LIMIT };
export { TELEMETRYFLOW_HARD_LIMIT as TELEMETRY_HARD_LIMIT };
export { TELEMETRYFLOW_SCAN_LIMIT as TELEMETRY_SCAN_LIMIT };
