export interface StatPanelDef {
  id: string;
  title: string;
  description: string;
  metricQuery: string;
  format: 'integer' | 'bytes' | 'percent' | 'duration' | 'number';
  icon: string;
  thresholds?: { warning?: number; critical?: number };
}

export const dbmStatPanels: StatPanelDef[] = [
  { id: 'DBM20701', title: 'Active Queries', description: 'Currently running queries', metricQuery: 'db.clickhouse.system.Query', format: 'integer', icon: 'carbon:query' },
  { id: 'DBM20702', title: 'Memory Usage', description: 'Total memory tracked by ClickHouse', metricQuery: 'db.clickhouse.system.MemoryTracking', format: 'bytes', icon: 'carbon:memory', thresholds: { warning: 4294967296, critical: 6442450944 } },
  { id: 'DBM20703', title: 'Insert Rows/sec', description: 'Rate of inserted rows per second', metricQuery: 'rate(db.clickhouse.events.InsertedRows[1m])', format: 'number', icon: 'carbon:add' },
  { id: 'DBM20704', title: 'Select Queries/sec', description: 'Rate of query log entries per second', metricQuery: 'rate(db.clickhouse.query_log.count[1m])', format: 'number', icon: 'carbon:search' },
  { id: 'DBM20705', title: 'Active Merges', description: 'Currently running background merges', metricQuery: 'db.clickhouse.system.Merge', format: 'integer', icon: 'carbon:merge' },
  { id: 'DBM20706', title: 'Max Replication Lag', description: 'Maximum absolute delay across replicas in seconds', metricQuery: 'db.clickhouse.async.ReplicasMaxAbsoluteDelay', format: 'duration', icon: 'carbon:time', thresholds: { warning: 60, critical: 300 } },
  { id: 'DBM20707', title: 'Disk Usage %', description: 'Average disk utilization percentage', metricQuery: 'db.clickhouse.disk.used_percent', format: 'percent', icon: 'carbon:hard-disk', thresholds: { warning: 80, critical: 90 } },
  { id: 'DBM20708', title: 'Failed Queries', description: 'Rate of failed queries per second', metricQuery: 'rate(db.clickhouse.events.FailedQuery[5m])', format: 'number', icon: 'carbon:warning', thresholds: { warning: 1, critical: 10 } },
];
