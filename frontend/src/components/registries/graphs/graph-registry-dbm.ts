export interface GraphPanelDef {
  id: string;
  title: string;
  description: string;
  chartType: 'line' | 'area' | 'bar' | 'pie';
  metricQueries: string[];
  axes?: { y?: { label: string; unit?: string }; y2?: { label: string; unit?: string } };
  legend?: string[];
}

export const dbmGraphPanels: GraphPanelDef[] = [
  { id: 'DBM10701', title: 'Queries Over Time', description: 'Active queries over time', chartType: 'line', metricQueries: ['db.clickhouse.system.Query'], axes: { y: { label: 'Queries', unit: '' } }, legend: ['Active Queries'] },
  { id: 'DBM10702', title: 'Memory Usage Over Time', description: 'Memory tracking over time', chartType: 'area', metricQueries: ['db.clickhouse.system.MemoryTracking'], axes: { y: { label: 'Memory', unit: 'bytes' } }, legend: ['Memory'] },
  { id: 'DBM10703', title: 'Insert/Select Throughput', description: 'Row throughput for inserts and selects', chartType: 'line', metricQueries: ['rate(db.clickhouse.events.InsertedRows[1m])', 'rate(db.clickhouse.events.SelectedRows[1m])'], axes: { y: { label: 'Rows/sec' }, y2: { label: 'Rows/sec' } }, legend: ['Inserts', 'Selects'] },
  { id: 'DBM10704', title: 'Merge Activity', description: 'Concurrent merges over time', chartType: 'line', metricQueries: ['db.clickhouse.system.Merge'], axes: { y: { label: 'Merges' } }, legend: ['Merges'] },
  { id: 'DBM10705', title: 'Replication Lag', description: 'Absolute delay per replica', chartType: 'line', metricQueries: ['db.clickhouse.replica.absolute_delay'], axes: { y: { label: 'Delay', unit: 'seconds' } }, legend: ['Lag'] },
  { id: 'DBM10706', title: 'Disk I/O', description: 'Network receive and send bytes', chartType: 'area', metricQueries: ['rate(db.clickhouse.events.NetworkReceiveBytes[1m])', 'rate(db.clickhouse.events.NetworkSendBytes[1m])'], axes: { y: { label: 'Bytes/sec' } }, legend: ['Read', 'Write'] },
  { id: 'DBM10707', title: 'Network Traffic', description: 'Network bytes sent and received', chartType: 'area', metricQueries: ['rate(db.clickhouse.events.NetworkReceiveBytes[1m])', 'rate(db.clickhouse.events.NetworkSendBytes[1m])'], axes: { y: { label: 'Bytes/sec' } }, legend: ['Inbound', 'Outbound'] },
  { id: 'DBM10708', title: 'Query Duration Distribution', description: 'p50, p95, p99 latency', chartType: 'line', metricQueries: ['db.clickhouse.query_log.duration_ms_p50', 'db.clickhouse.query_log.duration_ms_p95', 'db.clickhouse.query_log.duration_ms_p99'], axes: { y: { label: 'Duration', unit: 'ms' } }, legend: ['p50', 'p95', 'p99'] },
  { id: 'DBM10709', title: 'Parts Count Over Time', description: 'Active parts per table over time', chartType: 'line', metricQueries: ['db.clickhouse.mergetree.parts_count'], axes: { y: { label: 'Parts' } }, legend: ['Parts'] },
  { id: 'DBM10710', title: 'ZooKeeper Operations', description: 'ZK transactions, watches, requests', chartType: 'line', metricQueries: ['rate(db.clickhouse.events.ZooKeeperTransactions[1m])', 'rate(db.clickhouse.events.ZooKeeperWatch[1m])', 'rate(db.clickhouse.events.ZooKeeperRequest[1m])'], axes: { y: { label: 'Ops/sec' } }, legend: ['Transactions', 'Watches', 'Requests'] },
  { id: 'DBM10711', title: 'Query Kind Distribution', description: 'Distribution of query types', chartType: 'pie', metricQueries: ['db.clickhouse.query_log.count'], legend: ['Select', 'Insert', 'Create', 'Alter', 'Other'] },
  { id: 'DBM10712', title: 'Compression Ratio by Table', description: 'Compression ratio per table', chartType: 'bar', metricQueries: ['db.clickhouse.columns.compressed_bytes', 'db.clickhouse.columns.uncompressed_bytes'], axes: { y: { label: 'Ratio' } }, legend: ['Ratio'] },
];
