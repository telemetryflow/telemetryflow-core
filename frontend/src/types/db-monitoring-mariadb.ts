export interface MariadbInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MariadbOverviewStats {
  totalInstances: number;
  healthyInstances: number;
  warningInstances: number;
  criticalInstances: number;
}

export interface MariadbInstanceListResult {
  instances: MariadbInstance[];
  total: number;
}

/**
 * Time series data point
 */
export interface MariaDBTimeSeriesPoint {
  time: string;
  value: number;
}

/**
 * Query cache metrics
 */
export interface QueryCacheMetrics {
  hitRatio: number;
  fragmentation: number;
  memoryUtilization: number;
  queriesInCache: number;
  freeMemory: number;
  lowmemPrunes: number;
  timeSeries: {
    hitRatio: MariaDBTimeSeriesPoint[];
    fragmentation: MariaDBTimeSeriesPoint[];
    memoryUtilization: MariaDBTimeSeriesPoint[];
    queriesInCache: MariaDBTimeSeriesPoint[];
    freeMemory: MariaDBTimeSeriesPoint[];
    lowmemPrunes: MariaDBTimeSeriesPoint[];
  };
}

/**
 * Aria engine metrics
 */
export interface AriaMetrics {
  pagecacheHitRatio: number;
  blocksUsed: number;
  blocksUnused: number;
  blocksNotFlushed: number;
  readRequests: number;
  reads: number;
  writeRequests: number;
  writes: number;
  timeSeries: {
    pagecacheHitRatio: MariaDBTimeSeriesPoint[];
    blocksUsed: MariaDBTimeSeriesPoint[];
    blocksUnused: MariaDBTimeSeriesPoint[];
    blocksNotFlushed: MariaDBTimeSeriesPoint[];
    readRequests: MariaDBTimeSeriesPoint[];
    reads: MariaDBTimeSeriesPoint[];
    writeRequests: MariaDBTimeSeriesPoint[];
    writes: MariaDBTimeSeriesPoint[];
  };
}

/**
 * ColumnStore metrics
 */
export interface ColumnStoreMetrics {
  extentTotal: number;
  extentUsed: number;
  pmCacheHitRatio: number;
  pmCacheBlocksUsed: number;
  pmCacheBlocksTotal: number;
  batchInsertRows: number;
  batchInsertBlocks: number;
  timeSeries: {
    extentTotal: MariaDBTimeSeriesPoint[];
    extentUsed: MariaDBTimeSeriesPoint[];
    pmCacheHitRatio: MariaDBTimeSeriesPoint[];
    pmCacheBlocksUsed: MariaDBTimeSeriesPoint[];
    pmCacheBlocksTotal: MariaDBTimeSeriesPoint[];
    batchInsertRows: MariaDBTimeSeriesPoint[];
    batchInsertBlocks: MariaDBTimeSeriesPoint[];
  };
}

/**
 * Spider engine metrics
 */
export interface SpiderMetrics {
  connPoolUsed: number;
  connPoolTotal: number;
  linkErrors: number;
  linkThreadsRunning: number;
  directErrors: number;
  connPoolUtilization: number;
  timeSeries: {
    connPoolUsed: MariaDBTimeSeriesPoint[];
    connPoolTotal: MariaDBTimeSeriesPoint[];
    linkErrors: MariaDBTimeSeriesPoint[];
    linkThreadsRunning: MariaDBTimeSeriesPoint[];
    directErrors: MariaDBTimeSeriesPoint[];
  };
}

/**
 * Thread pool metrics
 */
export interface ThreadPoolMetrics {
  threads: number;
  activeThreads: number;
  idleThreads: number;
  overflows: number;
  waits: number;
  queues: number;
  utilization: number;
  timeSeries: {
    threads: MariaDBTimeSeriesPoint[];
    activeThreads: MariaDBTimeSeriesPoint[];
    idleThreads: MariaDBTimeSeriesPoint[];
    overflows: MariaDBTimeSeriesPoint[];
    waits: MariaDBTimeSeriesPoint[];
    queues: MariaDBTimeSeriesPoint[];
  };
}

/**
 * Replication channel status
 */
export interface ReplicationChannel {
  name: string;
  ioRunning: boolean;
  sqlRunning: boolean;
  lagSeconds: number;
  gtidPos: string;
  lastError: string;
  retriedTransactions: number;
  ioState: string;
  sqlState: string;
  masterHost: string;
  masterPort: number;
  masterServerId: number;
  connectionName: string;
}

/**
 * Replication channels response
 */
export interface ReplicationChannels {
  channels: ReplicationChannel[];
  total: number;
  healthyChannels: number;
  unhealthyChannels: number;
  maxLagSeconds: number;
  hasErrors: boolean;
}

/**
 * User statistics row
 */
export interface UserStatsRow {
  user: string;
  totalConnections: number;
  concurrentConnections: number;
  cpuTime: number;
  rowsRead: number;
  rowsWritten: number;
  busyTime: number;
  selectCommands: number;
  updateCommands: number;
  otherCommands: number;
}

/**
 * Pagination metadata
 */
export interface UserStatsPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * User statistics response
 */
export interface UserStats {
  users: UserStatsRow[];
  pagination: UserStatsPagination;
}
