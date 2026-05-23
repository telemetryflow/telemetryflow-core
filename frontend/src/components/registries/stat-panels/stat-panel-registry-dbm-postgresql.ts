export interface StatPanelDef {
  id: string;
  title: string;
  description: string;
  metricQuery: string;
  format: 'integer' | 'bytes' | 'percent' | 'duration' | 'number';
  icon: string;
  thresholds?: { warning?: number; critical?: number };
}

export const dbmPostgresqlStatPanels: StatPanelDef[] = [
  { id: 'DBM20101', title: 'Active Connections', description: 'Currently active PostgreSQL connections', metricQuery: 'db.postgresql.connections.active', format: 'integer', icon: 'carbon:connect' },
  { id: 'DBM20102', title: 'Transactions/sec', description: 'Average transactions per second', metricQuery: 'rate(db.postgresql.xact_commit[1m]) + rate(db.postgresql.xact_rollback[1m])', format: 'number', icon: 'carbon:chart-line-data' },
  { id: 'DBM20103', title: 'Cache Hit Ratio', description: 'Buffer cache hit ratio percentage', metricQuery: 'db.postgresql.cache_hit_ratio', format: 'percent', icon: 'carbon:cached', thresholds: { warning: 95, critical: 90 } },
  { id: 'DBM20104', title: 'Replication Lag', description: 'Replication lag in seconds', metricQuery: 'db.postgresql.replication.lag_seconds', format: 'duration', icon: 'carbon:time', thresholds: { warning: 5, critical: 30 } },
  { id: 'DBM20105', title: 'Dead Tuples', description: 'Total dead tuples across all tables', metricQuery: 'db.postgresql.stat_user_tables.n_dead_tup', format: 'integer', icon: 'carbon:warning' },
  { id: 'DBM20106', title: 'XID Age %', description: 'Transaction ID age as percentage of wraparound limit', metricQuery: 'db.postgresql.xid_age_percent', format: 'percent', icon: 'carbon:progress-bar', thresholds: { warning: 50, critical: 70 } },
  { id: 'DBM20107', title: 'Database Size', description: 'Total database size in bytes', metricQuery: 'db.postgresql.database_size_bytes', format: 'bytes', icon: 'carbon:database' },
  { id: 'DBM20108', title: 'Active Locks', description: 'Currently active locks across all databases', metricQuery: 'db.postgresql.locks.waiting', format: 'integer', icon: 'carbon:locked' },
];
