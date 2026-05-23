export interface GraphPanelDef {
  id: string;
  title: string;
  description: string;
  chartType: 'line' | 'area' | 'bar' | 'pie';
  metricQueries: string[];
  axes?: { y?: { label: string; unit?: string }; y2?: { label: string; unit?: string } };
  legend?: string[];
}

export const dbmPostgresqlGraphPanels: GraphPanelDef[] = [
  { id: 'DBM10101', title: 'Connections Over Time', description: 'PostgreSQL connection states over time', chartType: 'line', metricQueries: ['db.postgresql.connections.active', 'db.postgresql.connections.idle', 'db.postgresql.connections.idle_in_transaction', 'db.postgresql.connections.waiting'], axes: { y: { label: 'Connections' } }, legend: ['Active', 'Idle', 'Idle in Transaction', 'Waiting'] },
  { id: 'DBM10102', title: 'Transaction Rate', description: 'Commit and rollback rates over time', chartType: 'area', metricQueries: ['rate(db.postgresql.xact_commit[1m])', 'rate(db.postgresql.xact_rollback[1m])'], axes: { y: { label: 'Transactions/sec' } }, legend: ['Commits', 'Rollbacks'] },
  { id: 'DBM10103', title: 'Tuple Operations', description: 'Tuple insert, update, and delete rates', chartType: 'line', metricQueries: ['rate(db.postgresql.tup_inserted[1m])', 'rate(db.postgresql.tup_updated[1m])', 'rate(db.postgresql.tup_deleted[1m])'], axes: { y: { label: 'Tuples/sec' } }, legend: ['Inserted', 'Updated', 'Deleted'] },
  { id: 'DBM10104', title: 'Cache Hit Ratio', description: 'Buffer cache hit ratio over time', chartType: 'line', metricQueries: ['db.postgresql.cache_hit_ratio'], axes: { y: { label: 'Hit Ratio', unit: '%' } }, legend: ['Hit Ratio'] },
  { id: 'DBM10105', title: 'Checkpoint Activity', description: 'Checkpoint frequency: timed vs requested', chartType: 'bar', metricQueries: ['rate(db.postgresql.checkpoints_timed[5m])', 'rate(db.postgresql.checkpoints_req[5m])'], axes: { y: { label: 'Checkpoints' } }, legend: ['Timed', 'Requested'] },
  { id: 'DBM10106', title: 'WAL Generation Rate', description: 'Write-Ahead Log generation rate', chartType: 'area', metricQueries: ['rate(db.postgresql.wal_bytes[1m])'], axes: { y: { label: 'Bytes/sec' } }, legend: ['WAL Rate'] },
  { id: 'DBM10107', title: 'Dead Tuples by Table', description: 'Dead tuple counts per table', chartType: 'bar', metricQueries: ['db.postgresql.stat_user_tables.n_dead_tup'], axes: { y: { label: 'Dead Tuples' } }, legend: ['Dead Tuples'] },
  { id: 'DBM10108', title: 'Lock Contention', description: 'Lock contention: waiting locks and max wait duration', chartType: 'line', metricQueries: ['db.postgresql.locks.waiting', 'db.postgresql.locks.max_wait_seconds'], axes: { y: { label: 'Locks' }, y2: { label: 'Wait', unit: 'seconds' } }, legend: ['Waiting', 'Max Wait (s)'] },
  { id: 'DBM10109', title: 'Database Size', description: 'Database size growth over time', chartType: 'area', metricQueries: ['db.postgresql.database_size_bytes'], axes: { y: { label: 'Size', unit: 'bytes' } }, legend: ['Size'] },
  { id: 'DBM10110', title: 'Replication Lag', description: 'Replication lag in bytes and seconds', chartType: 'line', metricQueries: ['db.postgresql.replication.lag_bytes', 'db.postgresql.replication.lag_seconds'], axes: { y: { label: 'Lag', unit: 'bytes' }, y2: { label: 'Lag', unit: 'seconds' } }, legend: ['Lag Bytes', 'Lag Seconds'] },
  { id: 'DBM10111', title: 'Query Time Heatmap', description: 'Query execution time distribution', chartType: 'line', metricQueries: ['db.postgresql.query.duration_bucket'], axes: { y: { label: 'Duration', unit: 'ms' } }, legend: ['p50', 'p95', 'p99'] },
  { id: 'DBM10112', title: 'Temp Files', description: 'Temporary file creation count and bytes', chartType: 'line', metricQueries: ['rate(db.postgresql.temp_files[1m])', 'rate(db.postgresql.temp_bytes[1m])'], axes: { y: { label: 'Files/sec' }, y2: { label: 'Bytes/sec' } }, legend: ['Temp Files', 'Temp Bytes'] },
];
