export interface StatPanelDef {
  id: string;
  title: string;
  description: string;
  metricQuery: string;
  format: 'integer' | 'bytes' | 'percent' | 'duration' | 'number';
  icon: string;
  thresholds?: { warning?: number; critical?: number };
}

export const dbmAwsRdsPostgresqlStatPanels: StatPanelDef[] = [
  {
    id: 'DBM20411',
    title: 'Total Instances',
    description: 'Total number of monitored RDS PostgreSQL instances',
    metricQuery: 'aws.rds.postgresql.instances.total',
    format: 'integer',
    icon: 'carbon:data-base',
  },
  {
    id: 'DBM20412',
    title: 'Healthy Instances',
    description: 'Number of instances in available state',
    metricQuery: 'aws.rds.postgresql.instances.healthy',
    format: 'integer',
    icon: 'carbon:checkmark-filled',
  },
  {
    id: 'DBM20413',
    title: 'CPU Utilization',
    description: 'Average CPU utilization across all instances',
    metricQuery: 'aws.rds.postgresql.CPUUtilization',
    format: 'percent',
    icon: 'carbon:chip',
    thresholds: { warning: 80, critical: 95 },
  },
  {
    id: 'DBM20414',
    title: 'Active Connections',
    description: 'Total active database connections',
    metricQuery: 'aws.rds.postgresql.DatabaseConnections',
    format: 'integer',
    icon: 'carbon:connect',
  },
  {
    id: 'DBM20415',
    title: 'Storage Used',
    description: 'Total storage allocated across instances',
    metricQuery: 'aws.rds.postgresql.AllocatedStorage',
    format: 'bytes',
    icon: 'carbon:hard-disk',
  },
  {
    id: 'DBM20416',
    title: 'Read IOPS',
    description: 'Average read IOPS across instances',
    metricQuery: 'aws.rds.postgresql.ReadIOPS',
    format: 'number',
    icon: 'carbon:data-enrichment',
  },
  {
    id: 'DBM20417',
    title: 'Write IOPS',
    description: 'Average write IOPS across instances',
    metricQuery: 'aws.rds.postgresql.WriteIOPS',
    format: 'number',
    icon: 'carbon:data-enrichment',
  },
  {
    id: 'DBM20418',
    title: 'Replica Lag',
    description: 'Maximum replication lag in seconds',
    metricQuery: 'aws.rds.postgresql.ReplicaLag',
    format: 'duration',
    icon: 'carbon:time',
    thresholds: { warning: 5, critical: 30 },
  },
  {
    id: 'DBM20419',
    title: 'Max Transaction ID Usage',
    description: 'Highest transaction ID usage approaching wraparound',
    metricQuery: 'aws.rds.postgresql.MaximumUsedTransactionIDs',
    format: 'number',
    icon: 'carbon:progress-bar',
    thresholds: { warning: 500000000, critical: 700000000 },
  },
  {
    id: 'DBM20420',
    title: 'WAL Disk Usage',
    description: 'Total WAL disk usage across instances',
    metricQuery: 'aws.rds.postgresql.TransactionLogsDiskUsage',
    format: 'bytes',
    icon: 'carbon:document',
  },
];
