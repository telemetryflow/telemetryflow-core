export interface PerconaInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerconaOverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
}

export interface PerconaInstanceListResult {
  instances: PerconaInstance[];
  total: number;
}

export interface PerconaTimeSeriesPoint {
  time: string;
  value: number;
}

export interface QRTBucket {
  time: string;
  count: number;
  total: number;
}

export interface QueryResponseTimeMetrics {
  p50: number;
  p95: number;
  p99: number;
  pctBelow1ms: number;
  pctAbove100ms: number;
  buckets: Record<string, QRTBucket[]>;
  timeSeries: {
    p50: PerconaTimeSeriesPoint[];
    p95: PerconaTimeSeriesPoint[];
    p99: PerconaTimeSeriesPoint[];
    pctBelow1ms: PerconaTimeSeriesPoint[];
    pctAbove100ms: PerconaTimeSeriesPoint[];
  };
}

export interface PXCClusterMetrics {
  clusterHealth: number;
  flowControlImpact: number;
  certificationEfficiency: number;
  writeThroughput: number;
  replicationThroughput: number;
  timeSeries: {
    clusterHealth: PerconaTimeSeriesPoint[];
    flowControlImpact: PerconaTimeSeriesPoint[];
    certificationEfficiency: PerconaTimeSeriesPoint[];
    writeThroughput: PerconaTimeSeriesPoint[];
    replicationThroughput: PerconaTimeSeriesPoint[];
  };
}

export interface PerconaThreadPoolMetrics {
  threads: number;
  activeThreads: number;
  idleThreads: number;
  overflows: number;
  waits: number;
  queues: number;
  highPrioThreads: number;
  highPrioOverflows: number;
  utilization: number;
  timeSeries: {
    threads: PerconaTimeSeriesPoint[];
    activeThreads: PerconaTimeSeriesPoint[];
    idleThreads: PerconaTimeSeriesPoint[];
    overflows: PerconaTimeSeriesPoint[];
    waits: PerconaTimeSeriesPoint[];
    queues: PerconaTimeSeriesPoint[];
    highPrioThreads: PerconaTimeSeriesPoint[];
    highPrioOverflows: PerconaTimeSeriesPoint[];
    utilization: PerconaTimeSeriesPoint[];
  };
}

export interface XtraBackupMetrics {
  changedPages: number;
  oldestLsn: number;
  timeSeries: {
    changedPages: PerconaTimeSeriesPoint[];
    oldestLsn: PerconaTimeSeriesPoint[];
  };
}

export interface AuditMetrics {
  events: number;
  eventsFiltered: number;
  eventsLost: number;
  eventsWritten: number;
  logSize: number;
  timeSeries: {
    events: PerconaTimeSeriesPoint[];
    eventsFiltered: PerconaTimeSeriesPoint[];
    eventsLost: PerconaTimeSeriesPoint[];
    eventsWritten: PerconaTimeSeriesPoint[];
    logSize: PerconaTimeSeriesPoint[];
  };
}

export interface PerconaUserStatsRow {
  user: string;
  totalConnections: number;
  concurrentConnections: number;
  cpuTime: number;
  rowsRead: number;
  rowsWritten: number;
  busyTime: number;
  selectCommands: number;
  updateCommands: number;
}

export interface PerconaUserStatsPagination {
  total: number;
  page: number;
  pageSize: number;
}

export interface PerconaUserStats {
  users: PerconaUserStatsRow[];
  pagination: PerconaUserStatsPagination;
}
