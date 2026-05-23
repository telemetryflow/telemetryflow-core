/**
 * Graph Registry — MariaDB (DBM)
 * 8 graph definitions
 */

import type { GraphDefinition } from './types';

export const DBM_MARIADB_GRAPHS: GraphDefinition[] = [
  {
    graphId: 'DBM11013',
    module: 'DBM',
    title: 'Query Cache Hit Ratio',
    component: 'TimeSeriesChart',
    chartType: 'timeseries',
    signalType: 'metrics',
    unit: 'ratio',
    description: 'MariaDB query cache hit ratio over time',
    dataSource: 'queryCache.timeSeries.hitRatio',
    defaultQueries: [
      {
        dialect: 'tfql',
        expression:
          "FETCH db_mysql_metrics WHERE metric_name = 'db.mysql.qcache.hit_ratio' AND instance_id = {instanceId} AGGREGATE avg(value_float)",
        legendFormat: 'Query Cache Hit Ratio',
        seriesKey: 'hit_ratio',
      },
    ],
    view: 'monitoring/db-mysql/components/QueryCacheSection.vue',
    position: 'mariadb-query-cache',
    toggleable: true,
  },
  {
    graphId: 'DBM11014',
    module: 'DBM',
    title: 'Aria Pagecache Hit Ratio',
    component: 'TimeSeriesChart',
    chartType: 'timeseries',
    signalType: 'metrics',
    unit: 'ratio',
    description: 'MariaDB Aria engine pagecache hit ratio over time',
    dataSource: 'aria.timeSeries.pagecacheHitRatio',
    defaultQueries: [
      {
        dialect: 'tfql',
        expression:
          "FETCH db_mysql_metrics WHERE metric_name = 'db.mysql.aria.pagecache.hit_ratio' AND instance_id = {instanceId} AGGREGATE avg(value_float)",
        legendFormat: 'Aria Pagecache Hit Ratio',
        seriesKey: 'pagecache_hit_ratio',
      },
    ],
    view: 'monitoring/db-mysql/components/AriaEngineSection.vue',
    position: 'mariadb-aria',
    toggleable: true,
  },
  {
    graphId: 'DBM11015',
    module: 'DBM',
    title: 'Thread Pool Utilization',
    component: 'TimeSeriesChart',
    chartType: 'timeseries',
    signalType: 'metrics',
    unit: 'ratio',
    description: 'MariaDB thread pool utilization over time',
    dataSource: 'threadPool.timeSeries.utilization',
    defaultQueries: [
      {
        dialect: 'tfql',
        expression:
          "FETCH db_mysql_metrics WHERE metric_name = 'db.mysql.threadpool.utilization' AND instance_id = {instanceId} AGGREGATE avg(value_float)",
        legendFormat: 'Thread Pool Utilization',
        seriesKey: 'utilization',
      },
    ],
    view: 'monitoring/db-mysql/components/ThreadPoolSection.vue',
    position: 'mariadb-thread-pool',
    toggleable: true,
  },
  {
    graphId: 'DBM11016',
    module: 'DBM',
    title: 'Thread Pool Queue Depth',
    component: 'TimeSeriesChart',
    chartType: 'timeseries',
    signalType: 'metrics',
    unit: 'count',
    description: 'MariaDB thread pool queue depth over time',
    dataSource: 'threadPool.timeSeries.queues',
    defaultQueries: [
      {
        dialect: 'tfql',
        expression:
          "FETCH db_mysql_metrics WHERE metric_name = 'db.mysql.threadpool.queues' AND instance_id = {instanceId} AGGREGATE avg(value_float)",
        legendFormat: 'Queue Depth',
        seriesKey: 'queues',
      },
    ],
    view: 'monitoring/db-mysql/components/ThreadPoolSection.vue',
    position: 'mariadb-thread-pool',
    toggleable: true,
  },
  {
    graphId: 'DBM11017',
    module: 'DBM',
    title: 'ColumnStore Extent Utilization',
    component: 'TimeSeriesChart',
    chartType: 'bar',
    signalType: 'metrics',
    unit: 'ratio',
    description: 'MariaDB ColumnStore extent map utilization',
    dataSource: 'columnStore.timeSeries.extentUtilization',
    defaultQueries: [
      {
        dialect: 'tfql',
        expression:
          "FETCH db_mysql_metrics WHERE metric_name LIKE 'db.mysql.columnstore.extent.%' AND instance_id = {instanceId} AGGREGATE avg(value_float)",
        legendFormat: 'Extent Utilization',
        seriesKey: 'extent_utilization',
      },
    ],
    view: 'monitoring/db-mysql/components/ColumnStoreSection.vue',
    position: 'mariadb-columnstore',
    toggleable: true,
  },
  {
    graphId: 'DBM11018',
    module: 'DBM',
    title: 'ColumnStore PM Cache Hit Ratio',
    component: 'TimeSeriesChart',
    chartType: 'timeseries',
    signalType: 'metrics',
    unit: 'ratio',
    description: 'MariaDB ColumnStore PM cache hit ratio over time',
    dataSource: 'columnStore.timeSeries.pmCacheHitRatio',
    defaultQueries: [
      {
        dialect: 'tfql',
        expression:
          "FETCH db_mysql_metrics WHERE metric_name = 'db.mysql.columnstore.pm.cache.hit_ratio' AND instance_id = {instanceId} AGGREGATE avg(value_float)",
        legendFormat: 'PM Cache Hit Ratio',
        seriesKey: 'pm_cache_hit_ratio',
      },
    ],
    view: 'monitoring/db-mysql/components/ColumnStoreSection.vue',
    position: 'mariadb-columnstore',
    toggleable: true,
  },
  {
    graphId: 'DBM11019',
    module: 'DBM',
    title: 'Replication Lag by Channel',
    component: 'TimeSeriesChart',
    chartType: 'timeseries',
    signalType: 'metrics',
    unit: 'seconds',
    description: 'MariaDB multi-source replication lag per channel',
    dataSource: 'replicationChannels.channels',
    defaultQueries: [
      {
        dialect: 'tfql',
        expression:
          "FETCH db_mysql_metrics WHERE metric_name = 'db.mysql.replication.lag_seconds' AND instance_id = {instanceId} GROUP BY labels['channel'] AGGREGATE avg(value_float)",
        legendFormat: 'Channel: {channel}',
        seriesKey: 'channel',
      },
    ],
    view: 'monitoring/db-mysql/components/MultiSourceReplicationSection.vue',
    position: 'mariadb-replication',
    toggleable: true,
  },
  {
    graphId: 'DBM11020',
    module: 'DBM',
    title: 'User Statistics - Top Users by CPU Time',
    component: 'TimeSeriesChart',
    chartType: 'bar',
    signalType: 'metrics',
    unit: 'seconds',
    description: 'MariaDB user statistics sorted by CPU time',
    dataSource: 'userStats.users',
    defaultQueries: [
      {
        dialect: 'tfql',
        expression:
          "FETCH db_mysql_metrics WHERE metric_name = 'db.mysql.userstats.cpu_time' AND instance_id = {instanceId} GROUP BY labels['user'] AGGREGATE sum(value_float) ORDER BY sum DESC LIMIT 10",
        legendFormat: '{user}',
        seriesKey: 'user',
      },
    ],
    view: 'monitoring/db-mysql/components/UserStatsTable.vue',
    position: 'mariadb-user-stats',
    toggleable: true,
  },
];
