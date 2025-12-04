/**
 * ClickHouse Seeds Index
 *
 * Auto-exports all seed modules for programmatic access
 */

export * as SampleAuditLogs from './1704240000001-seed-sample-audit-logs';
export * as SampleLogs from './1704240000002-seed-sample-logs';
export * as SampleMetrics from './1704240000003-seed-sample-metrics';
export * as SampleTraces from './1704240000004-seed-sample-traces';

// Seed metadata
export const seeds = [
  { id: '1704240000001', name: 'seed-sample-audit-logs', description: 'Sample audit log entries', records: 5, dependencies: [] },
  { id: '1704240000002', name: 'seed-sample-logs', description: 'Sample application logs', records: 10, dependencies: [] },
  { id: '1704240000003', name: 'seed-sample-metrics', description: 'Sample performance metrics', records: 240, dependencies: [] },
  { id: '1704240000004', name: 'seed-sample-traces', description: 'Sample distributed traces', records: 30, dependencies: [] },
];
