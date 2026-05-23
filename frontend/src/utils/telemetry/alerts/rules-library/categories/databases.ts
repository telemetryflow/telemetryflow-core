/**
 * Database Alert Rules
 * MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import { RuleCategory, DefaultDurations, DefaultIntervals } from "../types";

// MySQL
export const MySQLCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.MYSQL,
    name: "MySQL",
    description: "Monitor MySQL database metrics",
    icon: "logos:mysql",
    exporter: "mysqld_exporter",
    documentationUrl: "https://github.com/prometheus/mysqld_exporter",
    ruleCount: 6,
  },
  groups: [
    {
      id: "connections",
      name: "Connections",
      description: "Connection alerts",
      rules: [],
    },
    {
      id: "replication",
      name: "Replication",
      description: "Replication alerts",
      rules: [],
    },
    {
      id: "performance",
      name: "Performance",
      description: "Performance alerts",
      rules: [],
    },
  ],
};

// PostgreSQL
export const PostgreSQLCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.POSTGRESQL,
    name: "PostgreSQL",
    description: "Monitor PostgreSQL database metrics",
    icon: "logos:postgresql",
    exporter: "postgres_exporter",
    documentationUrl:
      "https://github.com/prometheus-community/postgres_exporter",
    ruleCount: 6,
  },
  groups: [
    {
      id: "connections",
      name: "Connections",
      description: "Connection alerts",
      rules: [],
    },
    {
      id: "replication",
      name: "Replication",
      description: "Replication alerts",
      rules: [],
    },
    {
      id: "performance",
      name: "Performance",
      description: "Performance alerts",
      rules: [],
    },
  ],
};

// MongoDB
export const MongoDBCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.MONGODB,
    name: "MongoDB",
    description: "Monitor MongoDB database metrics",
    icon: "logos:mongodb",
    exporter: "mongodb_exporter",
    documentationUrl: "https://github.com/percona/mongodb_exporter",
    ruleCount: 5,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "replication",
      name: "Replication",
      description: "Replication alerts",
      rules: [],
    },
  ],
};

// Redis
export const RedisCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.REDIS,
    name: "Redis",
    description: "Monitor Redis database metrics",
    icon: "logos:redis",
    exporter: "redis_exporter",
    documentationUrl: "https://github.com/oliver006/redis_exporter",
    ruleCount: 6,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    { id: "memory", name: "Memory", description: "Memory alerts", rules: [] },
    {
      id: "replication",
      name: "Replication",
      description: "Replication alerts",
      rules: [],
    },
  ],
};

// Elasticsearch
export const ElasticsearchCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.ELASTICSEARCH,
    name: "Elasticsearch",
    description: "Monitor Elasticsearch cluster metrics",
    icon: "logos:elasticsearch",
    exporter: "elasticsearch_exporter",
    documentationUrl:
      "https://github.com/prometheus-community/elasticsearch_exporter",
    ruleCount: 8,
  },
  groups: [
    {
      id: "cluster",
      name: "Cluster",
      description: "Cluster health alerts",
      rules: [],
    },
    { id: "nodes", name: "Nodes", description: "Node alerts", rules: [] },
    { id: "shards", name: "Shards", description: "Shard alerts", rules: [] },
  ],
};

export const DatabaseRules: AlertRuleTemplate[] = [
  // MySQL
  {
    id: "mysql-down",
    name: "MySQL Down",
    description: "MySQL instance is down",
    category: RuleCategory.MYSQL,
    subcategory: "connections",
    severity: "critical",
    conditions: [
      {
        metric: "mysql_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "mysql" },
    annotations: { summary: "MySQL down (instance {{ $labels.instance }})" },
    promql: "mysql_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "mysql-too-many-connections",
    name: "MySQL Too Many Connections",
    description: "More than 80% of MySQL connections are in use",
    category: RuleCategory.MYSQL,
    subcategory: "connections",
    severity: "warning",
    conditions: [
      {
        metric: "mysql_global_status_threads_connected",
        aggregation: "avg",
        operator: "gt",
        threshold: 80,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "mysql" },
    annotations: { summary: "MySQL too many connections" },
    promql:
      "mysql_global_status_threads_connected / mysql_global_variables_max_connections * 100 > 80",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "mysql-replication-lag",
    name: "MySQL Replication Lag",
    description: "MySQL replication lag is too high",
    category: RuleCategory.MYSQL,
    subcategory: "replication",
    severity: "warning",
    conditions: [
      {
        metric: "mysql_slave_status_seconds_behind_master",
        aggregation: "avg",
        operator: "gt",
        threshold: 30,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "mysql" },
    annotations: { summary: "MySQL replication lag" },
    promql: "mysql_slave_status_seconds_behind_master > 30",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // PostgreSQL
  {
    id: "postgresql-down",
    name: "PostgreSQL Down",
    description: "PostgreSQL instance is down",
    category: RuleCategory.POSTGRESQL,
    subcategory: "connections",
    severity: "critical",
    conditions: [
      {
        metric: "pg_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "postgresql" },
    annotations: {
      summary: "PostgreSQL down (instance {{ $labels.instance }})",
    },
    promql: "pg_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "postgresql-too-many-connections",
    name: "PostgreSQL Too Many Connections",
    description: "PostgreSQL instance has too many connections (> 80%)",
    category: RuleCategory.POSTGRESQL,
    subcategory: "connections",
    severity: "warning",
    conditions: [
      {
        metric: "pg_stat_activity_count",
        aggregation: "avg",
        operator: "gt",
        threshold: 80,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "postgresql" },
    annotations: { summary: "PostgreSQL too many connections" },
    promql:
      "sum by (instance) (pg_stat_activity_count) / sum by (instance) (pg_settings_max_connections) * 100 > 80",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "postgresql-dead-locks",
    name: "PostgreSQL Dead Locks",
    description: "PostgreSQL has deadlocks",
    category: RuleCategory.POSTGRESQL,
    subcategory: "performance",
    severity: "warning",
    conditions: [
      {
        metric: "pg_stat_database_deadlocks",
        aggregation: "rate",
        operator: "gt",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "postgresql" },
    annotations: { summary: "PostgreSQL dead locks" },
    promql: "increase(pg_stat_database_deadlocks[1m]) > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // MongoDB
  {
    id: "mongodb-down",
    name: "MongoDB Down",
    description: "MongoDB instance is down",
    category: RuleCategory.MONGODB,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "mongodb_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "mongodb" },
    annotations: { summary: "MongoDB down (instance {{ $labels.instance }})" },
    promql: "mongodb_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "mongodb-replication-lag",
    name: "MongoDB Replication Lag",
    description: "MongoDB replication lag is too high",
    category: RuleCategory.MONGODB,
    subcategory: "replication",
    severity: "warning",
    conditions: [
      {
        metric: "mongodb_mongod_replset_member_optime_date",
        aggregation: "avg",
        operator: "gt",
        threshold: 10,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "mongodb" },
    annotations: { summary: "MongoDB replication lag" },
    promql:
      'mongodb_mongod_replset_member_optime_date{state="PRIMARY"} - mongodb_mongod_replset_member_optime_date{state="SECONDARY"} > 10',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Redis
  {
    id: "redis-down",
    name: "Redis Down",
    description: "Redis instance is down",
    category: RuleCategory.REDIS,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "redis_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "redis" },
    annotations: { summary: "Redis down (instance {{ $labels.instance }})" },
    promql: "redis_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "redis-out-of-memory",
    name: "Redis Out of Memory",
    description: "Redis is running out of memory (> 90%)",
    category: RuleCategory.REDIS,
    subcategory: "memory",
    severity: "warning",
    conditions: [
      {
        metric: "redis_memory_used_bytes",
        aggregation: "avg",
        operator: "gt",
        threshold: 90,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "redis" },
    annotations: { summary: "Redis out of memory" },
    promql: "redis_memory_used_bytes / redis_memory_max_bytes * 100 > 90",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "redis-missing-master",
    name: "Redis Missing Master",
    description: "Redis cluster has no node marked as master",
    category: RuleCategory.REDIS,
    subcategory: "replication",
    severity: "critical",
    conditions: [
      {
        metric: "redis_instance_info",
        aggregation: "count",
        operator: "eq",
        threshold: 0,
        duration: "1m",
        labels: { role: "master" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "redis" },
    annotations: { summary: "Redis missing master" },
    promql: 'count(redis_instance_info{role="master"}) == 0',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Elasticsearch
  {
    id: "elasticsearch-down",
    name: "Elasticsearch Down",
    description: "Elasticsearch node is down",
    category: RuleCategory.ELASTICSEARCH,
    subcategory: "cluster",
    severity: "critical",
    conditions: [
      {
        metric: "elasticsearch_cluster_health_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "elasticsearch" },
    annotations: { summary: "Elasticsearch down" },
    promql: "elasticsearch_cluster_health_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "elasticsearch-cluster-red",
    name: "Elasticsearch Cluster Red",
    description: "Elasticsearch Cluster is RED",
    category: RuleCategory.ELASTICSEARCH,
    subcategory: "cluster",
    severity: "critical",
    conditions: [
      {
        metric: "elasticsearch_cluster_health_status",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "1m",
        labels: { color: "red" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "elasticsearch" },
    annotations: { summary: "Elasticsearch Cluster Red" },
    promql: 'elasticsearch_cluster_health_status{color="red"} == 1',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "elasticsearch-cluster-yellow",
    name: "Elasticsearch Cluster Yellow",
    description: "Elasticsearch Cluster is YELLOW",
    category: RuleCategory.ELASTICSEARCH,
    subcategory: "cluster",
    severity: "warning",
    conditions: [
      {
        metric: "elasticsearch_cluster_health_status",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "5m",
        labels: { color: "yellow" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "elasticsearch" },
    annotations: { summary: "Elasticsearch Cluster Yellow" },
    promql: 'elasticsearch_cluster_health_status{color="yellow"} == 1',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "elasticsearch-unassigned-shards",
    name: "Elasticsearch Unassigned Shards",
    description: "Elasticsearch has unassigned shards",
    category: RuleCategory.ELASTICSEARCH,
    subcategory: "shards",
    severity: "critical",
    conditions: [
      {
        metric: "elasticsearch_cluster_health_unassigned_shards",
        aggregation: "avg",
        operator: "gt",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "elasticsearch" },
    annotations: { summary: "Elasticsearch unassigned shards" },
    promql: "elasticsearch_cluster_health_unassigned_shards > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
];

export const DatabaseCategories: AlertRuleCategory[] = [
  MySQLCategory,
  PostgreSQLCategory,
  MongoDBCategory,
  RedisCategory,
  ElasticsearchCategory,
];

// Update categories with rules
DatabaseCategories.forEach((cat) => {
  const categoryRules = DatabaseRules.filter(
    (r) => r.category === cat.metadata.id,
  );
  cat.groups.forEach((group) => {
    group.rules = categoryRules.filter((rule) => rule.subcategory === group.id);
  });
});
