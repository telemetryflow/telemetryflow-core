/**
 * Database Alert Rules
 * MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#databases
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultThresholds,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

// ====================== MYSQL ======================
export const MySQLCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.MYSQL,
    name: "MySQL",
    description: "Monitor MySQL database metrics",
    icon: "logos:mysql",
    exporter: "mysqld_exporter",
    documentationUrl: "https://github.com/prometheus/mysqld_exporter",
    ruleCount: 12,
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

export const MySQLRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("mysql-down")
    .name("MySQL Down")
    .description("MySQL instance is down")
    .category(RuleCategory.MYSQL, "connections")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("mysql_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "mysql", type: "availability" })
    .annotations({
      summary: "MySQL down (instance {{ $labels.instance }})",
      description: "MySQL instance is down",
    })
    .promql("mysql_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mysql-too-many-connections")
    .name("MySQL Too Many Connections")
    .description("More than 80% of MySQL connections are in use")
    .category(RuleCategory.MYSQL, "connections")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("mysql_global_status_threads_connected")
        .avg()
        .gt(DefaultThresholds.DB_CONNECTION_USAGE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mysql", type: "connections" })
    .annotations({
      summary: "MySQL too many connections (instance {{ $labels.instance }})",
      description: "More than 80% of MySQL connections are in use",
    })
    .promql(
      "mysql_global_status_threads_connected / mysql_global_variables_max_connections * 100 > 80",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mysql-high-threads-running")
    .name("MySQL High Threads Running")
    .description("More than 60% of MySQL threads are running")
    .category(RuleCategory.MYSQL, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("mysql_global_status_threads_running")
        .avg()
        .gt(60)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mysql", type: "threads" })
    .annotations({
      summary: "MySQL high threads running (instance {{ $labels.instance }})",
      description: "More than 60% of MySQL threads are running",
    })
    .promql(
      "mysql_global_status_threads_running / mysql_global_variables_max_connections * 100 > 60",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mysql-slave-io-not-running")
    .name("MySQL Slave IO Thread Not Running")
    .description("MySQL Slave IO thread not running")
    .category(RuleCategory.MYSQL, "replication")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("mysql_slave_status_slave_io_running")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "mysql", type: "replication" })
    .annotations({
      summary: "MySQL Slave IO not running (instance {{ $labels.instance }})",
      description: "MySQL Slave IO thread not running",
    })
    .promql("mysql_slave_status_slave_io_running == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mysql-slave-sql-not-running")
    .name("MySQL Slave SQL Thread Not Running")
    .description("MySQL Slave SQL thread not running")
    .category(RuleCategory.MYSQL, "replication")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("mysql_slave_status_slave_sql_running")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "mysql", type: "replication" })
    .annotations({
      summary: "MySQL Slave SQL not running (instance {{ $labels.instance }})",
      description: "MySQL Slave SQL thread not running",
    })
    .promql("mysql_slave_status_slave_sql_running == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mysql-replication-lag")
    .name("MySQL Replication Lag")
    .description("MySQL replication lag is too high")
    .category(RuleCategory.MYSQL, "replication")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("mysql_slave_status_seconds_behind_master")
        .avg()
        .gt(DefaultThresholds.DB_REPLICATION_LAG_WARNING_SEC)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mysql", type: "replication" })
    .annotations({
      summary: "MySQL replication lag (instance {{ $labels.instance }})",
      description: "MySQL replication lag is {{ $value }} seconds",
    })
    .promql("mysql_slave_status_seconds_behind_master > 30")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mysql-slow-queries")
    .name("MySQL Slow Queries")
    .description("MySQL server has too many slow queries")
    .category(RuleCategory.MYSQL, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("mysql_global_status_slow_queries")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mysql", type: "performance" })
    .annotations({
      summary: "MySQL slow queries (instance {{ $labels.instance }})",
      description: "MySQL has slow queries",
    })
    .promql("increase(mysql_global_status_slow_queries[1m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== POSTGRESQL ======================
export const PostgreSQLCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.POSTGRESQL,
    name: "PostgreSQL",
    description: "Monitor PostgreSQL database metrics",
    icon: "logos:postgresql",
    exporter: "postgres_exporter",
    documentationUrl:
      "https://github.com/prometheus-community/postgres_exporter",
    ruleCount: 12,
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

export const PostgreSQLRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("postgresql-down")
    .name("PostgreSQL Down")
    .description("PostgreSQL instance is down")
    .category(RuleCategory.POSTGRESQL, "connections")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("pg_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "postgresql", type: "availability" })
    .annotations({
      summary: "PostgreSQL down (instance {{ $labels.instance }})",
      description: "PostgreSQL instance is down",
    })
    .promql("pg_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("postgresql-too-many-connections")
    .name("PostgreSQL Too Many Connections")
    .description("PostgreSQL instance has too many connections (> 80%)")
    .category(RuleCategory.POSTGRESQL, "connections")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("pg_stat_activity_count")
        .avg()
        .gt(DefaultThresholds.DB_CONNECTION_USAGE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "postgresql", type: "connections" })
    .annotations({
      summary:
        "PostgreSQL too many connections (instance {{ $labels.instance }})",
      description: "PostgreSQL instance has too many connections (> 80%)",
    })
    .promql(
      "sum by (instance) (pg_stat_activity_count) / sum by (instance) (pg_settings_max_connections) * 100 > 80",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("postgresql-not-enough-connections")
    .name("PostgreSQL Not Enough Connections")
    .description("PostgreSQL instance needs more connections (> 90%)")
    .category(RuleCategory.POSTGRESQL, "connections")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("pg_stat_activity_count")
        .avg()
        .gt(DefaultThresholds.DB_CONNECTION_USAGE_CRITICAL)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "postgresql", type: "connections" })
    .annotations({
      summary:
        "PostgreSQL not enough connections (instance {{ $labels.instance }})",
      description: "PostgreSQL instance needs more connections (> 90%)",
    })
    .promql(
      "sum by (instance) (pg_stat_activity_count) / sum by (instance) (pg_settings_max_connections) * 100 > 90",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("postgresql-dead-locks")
    .name("PostgreSQL Dead Locks")
    .description("PostgreSQL has deadlocks")
    .category(RuleCategory.POSTGRESQL, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("pg_stat_database_deadlocks")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "postgresql", type: "deadlocks" })
    .annotations({
      summary: "PostgreSQL dead locks (instance {{ $labels.instance }})",
      description: "PostgreSQL has deadlocks",
    })
    .promql("increase(pg_stat_database_deadlocks[1m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("postgresql-replication-lag")
    .name("PostgreSQL Replication Lag")
    .description("PostgreSQL replication lag is too high")
    .category(RuleCategory.POSTGRESQL, "replication")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("pg_replication_lag")
        .avg()
        .gt(DefaultThresholds.DB_REPLICATION_LAG_WARNING_SEC)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "postgresql", type: "replication" })
    .annotations({
      summary: "PostgreSQL replication lag (instance {{ $labels.instance }})",
      description: "PostgreSQL replication lag is {{ $value }} seconds",
    })
    .promql("pg_replication_lag > 30")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("postgresql-high-rollback-rate")
    .name("PostgreSQL High Rollback Rate")
    .description("PostgreSQL has high rollback rate")
    .category(RuleCategory.POSTGRESQL, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("pg_stat_database_xact_rollback")
        .rate()
        .gt(2)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "postgresql", type: "performance" })
    .annotations({
      summary:
        "PostgreSQL high rollback rate (instance {{ $labels.instance }})",
      description:
        "Ratio of transactions being aborted compared to committed is > 2%",
    })
    .promql(
      "sum(rate(pg_stat_database_xact_rollback[3m])) / sum(rate(pg_stat_database_xact_commit[3m])) > 0.02",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== MONGODB ======================
export const MongoDBCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.MONGODB,
    name: "MongoDB",
    description: "Monitor MongoDB database metrics",
    icon: "logos:mongodb",
    exporter: "mongodb_exporter",
    documentationUrl: "https://github.com/percona/mongodb_exporter",
    ruleCount: 10,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
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

export const MongoDBRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("mongodb-down")
    .name("MongoDB Down")
    .description("MongoDB instance is down")
    .category(RuleCategory.MONGODB, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("mongodb_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "mongodb", type: "availability" })
    .annotations({
      summary: "MongoDB down (instance {{ $labels.instance }})",
      description: "MongoDB instance is down",
    })
    .promql("mongodb_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mongodb-replication-lag")
    .name("MongoDB Replication Lag")
    .description("MongoDB replication lag is too high")
    .category(RuleCategory.MONGODB, "replication")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("mongodb_mongod_replset_member_optime_date")
        .avg()
        .gt(10)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mongodb", type: "replication" })
    .annotations({
      summary: "MongoDB replication lag (instance {{ $labels.instance }})",
      description: "MongoDB replication lag is {{ $value }} seconds",
    })
    .promql(
      'mongodb_mongod_replset_member_optime_date{state="PRIMARY"} - mongodb_mongod_replset_member_optime_date{state="SECONDARY"} > 10',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mongodb-replica-set-unhealthy")
    .name("MongoDB Replica Set Member Unhealthy")
    .description("MongoDB replica set member is unhealthy")
    .category(RuleCategory.MONGODB, "replication")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("mongodb_mongod_replset_member_health")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "mongodb", type: "health" })
    .annotations({
      summary:
        "MongoDB replica set member unhealthy (instance {{ $labels.instance }})",
      description: "MongoDB replica set member is unhealthy",
    })
    .promql("mongodb_mongod_replset_member_health == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mongodb-too-many-connections")
    .name("MongoDB Too Many Connections")
    .description("Too many connections (> 80%)")
    .category(RuleCategory.MONGODB, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("mongodb_ss_connections")
        .avg()
        .gt(80)
        .duration(DefaultDurations.MEDIUM)
        .label("conn_type", "current")
        .build(),
    )
    .labels({ component: "mongodb", type: "connections" })
    .annotations({
      summary: "MongoDB too many connections (instance {{ $labels.instance }})",
      description: "MongoDB has too many connections (> 80%)",
    })
    .promql(
      'mongodb_ss_connections{conn_type="current"} / mongodb_ss_connections{conn_type="available"} * 100 > 80',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("mongodb-virtual-memory-usage")
    .name("MongoDB Virtual Memory Usage")
    .description("MongoDB instance using high virtual memory")
    .category(RuleCategory.MONGODB, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("mongodb_ss_mem_virtual")
        .avg()
        .gt(3)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mongodb", type: "memory" })
    .annotations({
      summary: "MongoDB virtual memory usage (instance {{ $labels.instance }})",
      description: "Virtual memory usage is too high",
    })
    .promql(
      "(mongodb_ss_mem_virtual - mongodb_ss_mem_resident) / mongodb_ss_mem_resident * 100 > 3",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== REDIS ======================
export const RedisCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.REDIS,
    name: "Redis",
    description: "Monitor Redis database metrics",
    icon: "logos:redis",
    exporter: "redis_exporter",
    documentationUrl: "https://github.com/oliver006/redis_exporter",
    ruleCount: 12,
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

export const RedisRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("redis-down")
    .name("Redis Down")
    .description("Redis instance is down")
    .category(RuleCategory.REDIS, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("redis_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "redis", type: "availability" })
    .annotations({
      summary: "Redis down (instance {{ $labels.instance }})",
      description: "Redis instance is down",
    })
    .promql("redis_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("redis-missing-master")
    .name("Redis Missing Master")
    .description("Redis cluster has no node marked as master")
    .category(RuleCategory.REDIS, "replication")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("redis_instance_info")
        .count()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .label("role", "master")
        .build(),
    )
    .labels({ component: "redis", type: "replication" })
    .annotations({
      summary: "Redis missing master (instance {{ $labels.instance }})",
      description: "Redis cluster has no node marked as master",
    })
    .promql('count(redis_instance_info{role="master"}) == 0')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("redis-too-many-masters")
    .name("Redis Too Many Masters")
    .description("Redis cluster has too many nodes marked as master")
    .category(RuleCategory.REDIS, "replication")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("redis_instance_info")
        .count()
        .gt(1)
        .duration(DefaultDurations.SHORT)
        .label("role", "master")
        .build(),
    )
    .labels({ component: "redis", type: "replication" })
    .annotations({
      summary: "Redis too many masters (instance {{ $labels.instance }})",
      description: "Redis cluster has too many nodes marked as master",
    })
    .promql('count(redis_instance_info{role="master"}) > 1')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("redis-disconnected-slaves")
    .name("Redis Disconnected Slaves")
    .description("Redis not replicating for all slaves")
    .category(RuleCategory.REDIS, "replication")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("redis_connected_slaves")
        .rate()
        .lt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "redis", type: "replication" })
    .annotations({
      summary: "Redis disconnected slaves (instance {{ $labels.instance }})",
      description: "Redis not replicating for all slaves",
    })
    .promql("delta(redis_connected_slaves[1m]) < 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("redis-out-of-memory")
    .name("Redis Out of Memory")
    .description("Redis is running out of memory (> 90%)")
    .category(RuleCategory.REDIS, "memory")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("redis_memory_used_bytes")
        .avg()
        .gt(90)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "redis", type: "memory" })
    .annotations({
      summary: "Redis out of memory (instance {{ $labels.instance }})",
      description: "Redis is running out of memory (> 90%)",
    })
    .promql("redis_memory_used_bytes / redis_memory_max_bytes * 100 > 90")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("redis-too-many-connections")
    .name("Redis Too Many Connections")
    .description("Redis has too many connections")
    .category(RuleCategory.REDIS, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("redis_connected_clients")
        .avg()
        .gt(100)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "redis", type: "connections" })
    .annotations({
      summary: "Redis too many connections (instance {{ $labels.instance }})",
      description: "Redis has too many connections",
    })
    .promql("redis_connected_clients > 100")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("redis-rejected-connections")
    .name("Redis Rejected Connections")
    .description("Redis is rejecting connections")
    .category(RuleCategory.REDIS, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("redis_rejected_connections_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "redis", type: "connections" })
    .annotations({
      summary: "Redis rejected connections (instance {{ $labels.instance }})",
      description: "Some connections to Redis have been rejected",
    })
    .promql("increase(redis_rejected_connections_total[1m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== ELASTICSEARCH ======================
export const ElasticsearchCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.ELASTICSEARCH,
    name: "Elasticsearch",
    description: "Monitor Elasticsearch cluster metrics",
    icon: "logos:elasticsearch",
    exporter: "elasticsearch_exporter",
    documentationUrl:
      "https://github.com/prometheus-community/elasticsearch_exporter",
    ruleCount: 15,
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

export const ElasticsearchRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("elasticsearch-down")
    .name("Elasticsearch Down")
    .description("Elasticsearch node is down")
    .category(RuleCategory.ELASTICSEARCH, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_cluster_health_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "elasticsearch", type: "availability" })
    .annotations({
      summary: "Elasticsearch down (instance {{ $labels.instance }})",
      description: "Elasticsearch node is down",
    })
    .promql("elasticsearch_cluster_health_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-cluster-red")
    .name("Elasticsearch Cluster Red")
    .description("Elasticsearch Cluster is RED")
    .category(RuleCategory.ELASTICSEARCH, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_cluster_health_status")
        .last()
        .eq(1)
        .duration(DefaultDurations.SHORT)
        .label("color", "red")
        .build(),
    )
    .labels({ component: "elasticsearch", type: "health" })
    .annotations({
      summary: "Elasticsearch Cluster Red (instance {{ $labels.instance }})",
      description:
        "Elasticsearch Cluster is RED - Not all primary and replica shards are allocated",
    })
    .promql('elasticsearch_cluster_health_status{color="red"} == 1')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-cluster-yellow")
    .name("Elasticsearch Cluster Yellow")
    .description("Elasticsearch Cluster is YELLOW")
    .category(RuleCategory.ELASTICSEARCH, "cluster")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_cluster_health_status")
        .last()
        .eq(1)
        .duration(DefaultDurations.MEDIUM)
        .label("color", "yellow")
        .build(),
    )
    .labels({ component: "elasticsearch", type: "health" })
    .annotations({
      summary: "Elasticsearch Cluster Yellow (instance {{ $labels.instance }})",
      description:
        "Elasticsearch Cluster is YELLOW - Replica shards are not allocated",
    })
    .promql('elasticsearch_cluster_health_status{color="yellow"} == 1')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-healthy-nodes")
    .name("Elasticsearch Healthy Nodes")
    .description("Elasticsearch fewer healthy nodes than expected")
    .category(RuleCategory.ELASTICSEARCH, "nodes")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_cluster_health_number_of_nodes")
        .rate()
        .lt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "elasticsearch", type: "nodes" })
    .annotations({
      summary: "Elasticsearch healthy nodes (instance {{ $labels.instance }})",
      description: "Missing nodes in Elasticsearch cluster",
    })
    .promql("elasticsearch_cluster_health_number_of_nodes < 3")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-relocating-shards")
    .name("Elasticsearch Relocating Shards")
    .description("Elasticsearch is relocating shards")
    .category(RuleCategory.ELASTICSEARCH, "shards")
    .severity("info")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_cluster_health_relocating_shards")
        .avg()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "elasticsearch", type: "shards" })
    .annotations({
      summary:
        "Elasticsearch relocating shards (instance {{ $labels.instance }})",
      description: "Elasticsearch is relocating shards",
    })
    .promql("elasticsearch_cluster_health_relocating_shards > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-initializing-shards")
    .name("Elasticsearch Initializing Shards")
    .description("Elasticsearch is initializing shards")
    .category(RuleCategory.ELASTICSEARCH, "shards")
    .severity("info")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_cluster_health_initializing_shards")
        .avg()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "elasticsearch", type: "shards" })
    .annotations({
      summary:
        "Elasticsearch initializing shards (instance {{ $labels.instance }})",
      description: "Elasticsearch is initializing shards",
    })
    .promql("elasticsearch_cluster_health_initializing_shards > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-unassigned-shards")
    .name("Elasticsearch Unassigned Shards")
    .description("Elasticsearch has unassigned shards")
    .category(RuleCategory.ELASTICSEARCH, "shards")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_cluster_health_unassigned_shards")
        .avg()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "elasticsearch", type: "shards" })
    .annotations({
      summary:
        "Elasticsearch unassigned shards (instance {{ $labels.instance }})",
      description: "Elasticsearch has unassigned shards",
    })
    .promql("elasticsearch_cluster_health_unassigned_shards > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-pending-tasks")
    .name("Elasticsearch Pending Tasks")
    .description("Elasticsearch has pending tasks")
    .category(RuleCategory.ELASTICSEARCH, "cluster")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_cluster_health_number_of_pending_tasks")
        .avg()
        .gt(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "elasticsearch", type: "tasks" })
    .annotations({
      summary: "Elasticsearch pending tasks (instance {{ $labels.instance }})",
      description: "Elasticsearch has pending tasks. Cluster works slowly.",
    })
    .promql("elasticsearch_cluster_health_number_of_pending_tasks > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-disk-space-low")
    .name("Elasticsearch Disk Space Low")
    .description("The disk usage is over 80%")
    .category(RuleCategory.ELASTICSEARCH, "nodes")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_filesystem_data_available_bytes")
        .avg()
        .lt(20)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "elasticsearch", type: "disk" })
    .annotations({
      summary: "Elasticsearch disk space low (instance {{ $labels.instance }})",
      description: "The disk usage is over 80%",
    })
    .promql(
      "elasticsearch_filesystem_data_available_bytes / elasticsearch_filesystem_data_size_bytes * 100 < 20",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("elasticsearch-heap-usage-high")
    .name("Elasticsearch Heap Usage High")
    .description("Elasticsearch heap usage is over 90%")
    .category(RuleCategory.ELASTICSEARCH, "nodes")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("elasticsearch_jvm_memory_used_bytes")
        .avg()
        .gt(90)
        .duration(DefaultDurations.MEDIUM)
        .label("area", "heap")
        .build(),
    )
    .labels({ component: "elasticsearch", type: "memory" })
    .annotations({
      summary:
        "Elasticsearch heap usage high (instance {{ $labels.instance }})",
      description: "Elasticsearch heap usage is over 90%",
    })
    .promql(
      'elasticsearch_jvm_memory_used_bytes{area="heap"} / elasticsearch_jvm_memory_max_bytes{area="heap"} * 100 > 90',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// Update categories with rules
MySQLCategory.groups.forEach((group) => {
  group.rules = MySQLRules.filter((rule) => rule.subcategory === group.id);
});

PostgreSQLCategory.groups.forEach((group) => {
  group.rules = PostgreSQLRules.filter((rule) => rule.subcategory === group.id);
});

MongoDBCategory.groups.forEach((group) => {
  group.rules = MongoDBRules.filter((rule) => rule.subcategory === group.id);
});

RedisCategory.groups.forEach((group) => {
  group.rules = RedisRules.filter((rule) => rule.subcategory === group.id);
});

ElasticsearchCategory.groups.forEach((group) => {
  group.rules = ElasticsearchRules.filter(
    (rule) => rule.subcategory === group.id,
  );
});

// ====================== MARIADB ======================
export const MariaDBCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.MARIADB,
    name: "MariaDB",
    description: "Monitor MariaDB database metrics with query cache, Aria, thread pool, ColumnStore, and Spider engine monitoring",
    icon: "logos:mariadb",
    exporter: "telemetryflow-agent",
    documentationUrl: "https://mariadb.com/kb/en/library/monitoring",
    ruleCount: 8,
  },
  groups: [
    {
      id: "query-cache",
      name: "Query Cache",
      description: "Query cache performance and memory",
      rules: [],
    },
    {
      id: "aria",
      name: "Aria Engine",
      description: "Aria storage engine metrics",
      rules: [],
    },
    {
      id: "thread-pool",
      name: "Thread Pool",
      description: "Thread pool utilization and performance",
      rules: [],
    },
    {
      id: "columnstore",
      name: "ColumnStore",
      description: "ColumnStore analytics engine metrics",
      rules: [],
    },
    {
      id: "spider",
      name: "Spider Engine",
      description: "Spider sharding engine metrics",
      rules: [],
    },
  ],
};

export const MariaDBRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("mariadb-query-cache-hit-ratio-low")
    .name("MariaDB Query Cache Hit Ratio Low")
    .description("Query cache hit ratio is below 50% (query cache may not be effective)")
    .category(RuleCategory.MARIADB, "query-cache")
    .severity("warning")
    .enabled(false) // Disabled by default, conditionally suggested
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.qcache.hit_ratio")
        .avg()
        .lt(0.5)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mariadb", type: "query-cache", feature: "query_cache" })
    .annotations({
      summary: "MariaDB query cache hit ratio low (instance {{ $labels.instance }})",
      description:
        "MariaDB query cache hit ratio is below 50%. Consider disabling query cache if workload is write-heavy or cache effectiveness remains low.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.qcache.hit_ratio" AND instance_id = {instanceId} AGGREGATE avg(value_float) < 0.5',
    )
    .source("telemetryflow", "MariaDB monitoring best practices")
    .build(),

  AlertRuleBuilder.create("mariadb-query-cache-lowmem-prunes-high")
    .name("MariaDB Query Cache Low-Memory Prunes High")
    .description("Query cache is experiencing frequent low-memory prunes (>100/min)")
    .category(RuleCategory.MARIADB, "query-cache")
    .severity("warning")
    .enabled(false) // Disabled by default, conditionally suggested
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.qcache.lowmem_prunes")
        .rate()
        .gt(100)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "mariadb", type: "query-cache", feature: "query_cache" })
    .annotations({
      summary: "MariaDB query cache low-memory prunes high (instance {{ $labels.instance }})",
      description:
        "MariaDB query cache is experiencing frequent low-memory prunes due to memory pressure. Consider increasing query_cache_size or disabling query cache.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.qcache.lowmem_prunes" AND instance_id = {instanceId} AGGREGATE rate(value_float[1m]) > 100',
    )
    .source("telemetryflow", "MariaDB monitoring best practices")
    .build(),

  AlertRuleBuilder.create("mariadb-query-cache-fragmentation-high")
    .name("MariaDB Query Cache Fragmentation High")
    .description("Query cache fragmentation is above 20% (may impact performance)")
    .category(RuleCategory.MARIADB, "query-cache")
    .severity("info")
    .enabled(false) // Disabled by default, conditionally suggested
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.qcache.fragmentation")
        .avg()
        .gt(0.2)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "mariadb", type: "query-cache", feature: "query_cache" })
    .annotations({
      summary: "MariaDB query cache fragmentation high (instance {{ $labels.instance }})",
      description:
        "MariaDB query cache fragmentation is above 20%. High fragmentation can reduce query cache effectiveness. Consider flushing query cache or increasing query_cache_size.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.qcache.fragmentation" AND instance_id = {instanceId} AGGREGATE avg(value_float) > 0.2',
    )
    .source("telemetryflow", "MariaDB monitoring best practices")
    .build(),

  AlertRuleBuilder.create("mariadb-aria-pagecache-hit-ratio-low")
    .name("MariaDB Aria Pagecache Hit Ratio Low")
    .description("Aria engine pagecache hit ratio is below 95%")
    .category(RuleCategory.MARIADB, "aria")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.aria.pagecache.hit_ratio")
        .avg()
        .lt(0.95)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mariadb", type: "aria", feature: "aria_engine" })
    .annotations({
      summary: "MariaDB Aria pagecache hit ratio low (instance {{ $labels.instance }})",
      description:
        "MariaDB Aria engine pagecache hit ratio is below 95%. Consider increasing aria_pagecache_buffer_size for better performance.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.aria.pagecache.hit_ratio" AND instance_id = {instanceId} AGGREGATE avg(value_float) < 0.95',
    )
    .source("telemetryflow", "MariaDB monitoring best practices")
    .build(),

  AlertRuleBuilder.create("mariadb-thread-pool-utilization-high")
    .name("MariaDB Thread Pool Utilization High")
    .description("Thread pool utilization is above 90% (potential connection saturation)")
    .category(RuleCategory.MARIADB, "thread-pool")
    .severity("warning")
    .enabled(false) // Disabled by default, only for pool-of-threads
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.threadpool.utilization")
        .avg()
        .gt(0.9)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "mariadb", type: "thread-pool", feature: "pool-of-threads" })
    .annotations({
      summary: "MariaDB thread pool utilization high (instance {{ $labels.instance }})",
      description:
        "MariaDB thread pool utilization is above 90%. The system may be experiencing connection saturation. Consider increasing thread_pool_size or thread_pool_max_threads.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.threadpool.utilization" AND instance_id = {instanceId} AGGREGATE avg(value_float) > 0.9',
    )
    .source("telemetryflow", "MariaDB monitoring best practices")
    .build(),

  AlertRuleBuilder.create("mariadb-thread-pool-overflows")
    .name("MariaDB Thread Pool Overflows Detected")
    .description("Thread pool is experiencing overflows (critical: thread pool too small)")
    .category(RuleCategory.MARIADB, "thread-pool")
    .severity("critical")
    .enabled(false) // Disabled by default, only for pool-of-threads
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.threadpool.overflows")
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "mariadb", type: "thread-pool", feature: "pool-of-threads" })
    .annotations({
      summary: "MariaDB thread pool overflows detected (instance {{ $labels.instance }})",
      description:
        "MariaDB thread pool is experiencing overflows, indicating the thread pool is too small for the current workload. Immediately increase thread_pool_size and thread_pool_max_threads.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.threadpool.overflows" AND instance_id = {instanceId} AGGREGATE rate(value_float[1m]) > 0',
    )
    .source("telemetryflow", "MariaDB monitoring best practices")
    .build(),

  AlertRuleBuilder.create("mariadb-spider-conn-pool-utilization-high")
    .name("MariaDB Spider Connection Pool Utilization High")
    .description("Spider engine connection pool utilization is above 80%")
    .category(RuleCategory.MARIADB, "spider")
    .severity("warning")
    .enabled(false) // Disabled by default, Spider-specific
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.spider.conn_pool.utilization")
        .avg()
        .gt(0.8)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mariadb", type: "spider", feature: "spider_engine" })
    .annotations({
      summary: "MariaDB Spider connection pool utilization high (instance {{ $labels.instance }})",
      description:
        "MariaDB Spider engine connection pool utilization is above 80%. Consider increasing Spider connection pool size for better sharding performance.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.spider.conn_pool.used" AND instance_id = {instanceId} AGGREGATE avg(value_float) / FETCH db_mysql_metrics WHERE metric_name = "db.mysql.spider.conn_pool.total" AND instance_id = {instanceId} AGGREGATE avg(value_float) > 0.8',
    )
    .source("telemetryflow", "MariaDB monitoring best practices")
    .build(),

  AlertRuleBuilder.create("mariadb-columnstore-pm-cache-hit-ratio-low")
    .name("MariaDB ColumnStore PM Cache Hit Ratio Low")
    .description("ColumnStore Performance Module cache hit ratio is below 90%")
    .category(RuleCategory.MARIADB, "columnstore")
    .severity("warning")
    .enabled(false) // Disabled by default, ColumnStore-specific
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.columnstore.pm.cache.hit_ratio")
        .avg()
        .lt(0.9)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "mariadb", type: "columnstore", feature: "columnstore_engine" })
    .annotations({
      summary: "MariaDB ColumnStore PM cache hit ratio low (instance {{ $labels.instance }})",
      description:
        "MariaDB ColumnStore Performance Module cache hit ratio is below 90%. Consider increasing PM cache size for better analytical query performance.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.columnstore.pm.cache.hit_ratio" AND instance_id = {instanceId} AGGREGATE avg(value_float) < 0.9',
    )
    .source("telemetryflow", "MariaDB monitoring best practices")
    .build(),
];

// ====================== PERCONA ======================
export const PerconaCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.PERCONA,
    name: "Percona",
    description: "Monitor Percona Server metrics including QRT histograms, PXC cluster, thread pool, XtraBackup, and audit plugin",
    icon: "logos:percona",
    exporter: "telemetryflow-agent",
    documentationUrl: "https://docs.percona.com/percona-server/monitoring.html",
    ruleCount: 9,
  },
  groups: [
    {
      id: "qrt",
      name: "Query Response Time",
      description: "Query response time distribution alerts",
      rules: [],
    },
    {
      id: "pxc",
      name: "PXC Cluster",
      description: "Percona XtraDB Cluster health alerts",
      rules: [],
    },
    {
      id: "thread-pool",
      name: "Thread Pool",
      description: "Thread pool utilization and overflow alerts",
      rules: [],
    },
    {
      id: "xtrabackup",
      name: "XtraBackup",
      description: "XtraBackup changed pages monitoring",
      rules: [],
    },
    {
      id: "audit",
      name: "Audit Plugin",
      description: "Audit plugin event monitoring",
      rules: [],
    },
  ],
};

export const PerconaRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("percona-slow-queries-rising")
    .name("Percona Slow Queries Percentage Rising")
    .description("More than 10% of queries take longer than 100ms")
    .category(RuleCategory.PERCONA, "qrt")
    .severity("warning")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.query_response_time.pct_above_100ms")
        .avg()
        .gt(0.1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "percona", type: "qrt", feature: "query_response_time" })
    .annotations({
      summary: "Percona slow queries percentage rising (instance {{ $labels.instance }})",
      description: "More than 10% of queries are taking longer than 100ms. Investigate slow query patterns.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.query_response_time.pct_above_100ms" AND instance_id = {instanceId} AGGREGATE avg(value_float) > 0.1',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),

  AlertRuleBuilder.create("percona-pxc-cluster-unhealthy")
    .name("Percona PXC Cluster Unhealthy")
    .description("PXC node cluster health check failed (not in synced state)")
    .category(RuleCategory.PERCONA, "pxc")
    .severity("critical")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.pxc.cluster_health")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "percona", type: "pxc", feature: "pxc_cluster" })
    .annotations({
      summary: "Percona PXC cluster unhealthy (instance {{ $labels.instance }})",
      description: "PXC node is not in synced state. Cluster may be degraded or partitioned.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.pxc.cluster_health" AND instance_id = {instanceId} AGGREGATE last(value_float) == 0',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),

  AlertRuleBuilder.create("percona-pxc-flow-control-active")
    .name("Percona PXC Flow Control Active")
    .description("PXC flow control is throttling write throughput (>5% paused)")
    .category(RuleCategory.PERCONA, "pxc")
    .severity("warning")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.pxc.flow_control_impact")
        .avg()
        .gt(0.05)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "percona", type: "pxc", feature: "pxc_cluster" })
    .annotations({
      summary: "Percona PXC flow control active (instance {{ $labels.instance }})",
      description: "PXC flow control is throttling writes. Slow nodes may be causing writeset backpressure.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.pxc.flow_control_impact" AND instance_id = {instanceId} AGGREGATE avg(value_float) > 0.05',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),

  AlertRuleBuilder.create("percona-pxc-cert-efficiency-low")
    .name("Percona PXC Certification Efficiency Low")
    .description("PXC certification efficiency below 99% (conflict rate high)")
    .category(RuleCategory.PERCONA, "pxc")
    .severity("warning")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.pxc.certification_efficiency")
        .avg()
        .lt(0.99)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "percona", type: "pxc", feature: "pxc_cluster" })
    .annotations({
      summary: "Percona PXC certification efficiency low (instance {{ $labels.instance }})",
      description: "PXC certification efficiency is below 99%, indicating high write conflict rate between nodes.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.pxc.certification_efficiency" AND instance_id = {instanceId} AGGREGATE avg(value_float) < 0.99',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),

  AlertRuleBuilder.create("percona-thread-pool-utilization-high")
    .name("Percona Thread Pool Utilization High")
    .description("Thread pool utilization is above 90% (potential connection saturation)")
    .category(RuleCategory.PERCONA, "thread-pool")
    .severity("warning")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.threadpool.utilization")
        .avg()
        .gt(0.9)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "percona", type: "thread-pool", feature: "pool-of-threads" })
    .annotations({
      summary: "Percona thread pool utilization high (instance {{ $labels.instance }})",
      description: "Percona thread pool utilization is above 90%. Consider increasing thread_pool_size or thread_pool_max_threads.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.threadpool.utilization" AND instance_id = {instanceId} AGGREGATE avg(value_float) > 0.9',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),

  AlertRuleBuilder.create("percona-thread-pool-overflows")
    .name("Percona Thread Pool Overflows Detected")
    .description("Thread pool is experiencing overflows")
    .category(RuleCategory.PERCONA, "thread-pool")
    .severity("critical")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.threadpool.overflows")
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "percona", type: "thread-pool", feature: "pool-of-threads" })
    .annotations({
      summary: "Percona thread pool overflows detected (instance {{ $labels.instance }})",
      description: "Percona thread pool is overflowing. Immediately increase thread_pool_size and thread_pool_max_threads.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.threadpool.overflows" AND instance_id = {instanceId} AGGREGATE rate(value_float[1m]) > 0',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),

  AlertRuleBuilder.create("percona-xtrabackup-changed-pages-high")
    .name("Percona XtraBackup Changed Pages Accumulating")
    .description("XtraBackup changed pages count is above 100000 (backup lagging)")
    .category(RuleCategory.PERCONA, "xtrabackup")
    .severity("warning")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.xtrabackup.changed_pages")
        .avg()
        .gt(100000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "percona", type: "xtrabackup", feature: "xtrabackup" })
    .annotations({
      summary: "Percona XtraBackup changed pages accumulating (instance {{ $labels.instance }})",
      description: "XtraBackup changed pages count is high, indicating incremental backups may be lagging. Run a full backup.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.xtrabackup.changed_pages" AND instance_id = {instanceId} AGGREGATE avg(value_float) > 100000',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),

  AlertRuleBuilder.create("percona-audit-events-lost")
    .name("Percona Audit Events Lost")
    .description("Audit plugin is losing events (buffer overflow or disk I/O bottleneck)")
    .category(RuleCategory.PERCONA, "audit")
    .severity("critical")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.audit.events_lost")
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "percona", type: "audit", feature: "audit_plugin" })
    .annotations({
      summary: "Percona audit events lost (instance {{ $labels.instance }})",
      description: "Percona audit plugin is losing events due to buffer overflow or disk I/O bottleneck. Investigate audit logging configuration.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.audit.events_lost" AND instance_id = {instanceId} AGGREGATE rate(value_float[1m]) > 0',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),

  AlertRuleBuilder.create("percona-audit-log-size-growing")
    .name("Percona Audit Log Size Growing Rapidly")
    .description("Audit log size is above 1GB (may need rotation)")
    .category(RuleCategory.PERCONA, "audit")
    .severity("info")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.audit.log_size")
        .avg()
        .gt(1073741824)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "percona", type: "audit", feature: "audit_plugin" })
    .annotations({
      summary: "Percona audit log size growing rapidly (instance {{ $labels.instance }})",
      description: "Audit log size exceeds 1GB. Consider setting up log rotation to prevent disk space issues.",
    })
    .tfqlQuery(
      'FETCH db_mysql_metrics WHERE metric_name = "db.mysql.audit.log_size" AND instance_id = {instanceId} AGGREGATE avg(value_float) > 1073741824',
    )
    .source("telemetryflow", "Percona monitoring best practices")
    .build(),
];

// ====================== SQLITE3 ======================
export const SQLite3Category: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.SQLITE3,
    name: "SQLite3",
    description: "Monitor SQLite3 database file metrics, integrity, and PRAGMA configuration drift",
    icon: "logos:sqlite",
    exporter: "telemetryflow-agent",
    documentationUrl: "https://www.sqlite.org/pragma.html",
    ruleCount: 6,
  },
  groups: [
    {
      id: "integrity",
      name: "Integrity",
      description: "Database integrity check alerts",
      rules: [],
    },
    {
      id: "performance",
      name: "Performance",
      description: "Cache and utilization performance alerts",
      rules: [],
    },
    {
      id: "configuration",
      name: "Configuration",
      description: "PRAGMA configuration drift alerts",
      rules: [],
    },
  ],
};

export const SQLite3Rules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("sqlite3-integrity-check-failed")
    .name("SQLite3 Integrity Check Failed")
    .description("Database integrity check returned errors")
    .category(RuleCategory.SQLITE3, "integrity")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("db.sqlite3.integrity")
        .last()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .label("status", "FAIL")
        .build(),
    )
    .labels({ component: "sqlite3", type: "integrity" })
    .annotations({
      summary: "SQLite3 integrity check failed (database {{ $labels.sqlite3_database }})",
      description:
        "SQLite3 database integrity check has returned errors. The database may be corrupted. Investigate immediately.",
    })
    .tfqlQuery(
      'FETCH db_sqlite3_integrity WHERE status = "FAIL" AND database_id = {databaseId}',
    )
    .source("telemetryflow", "SQLite3 monitoring best practices")
    .build(),

  AlertRuleBuilder.create("sqlite3-database-stale")
    .name("SQLite3 Database Stale")
    .description("Database has not been seen by the agent for over 5 minutes")
    .category(RuleCategory.SQLITE3, "integrity")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.sqlite3.last_seen_ago")
        .avg()
        .gt(300)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "sqlite3", type: "staleness" })
    .annotations({
      summary: "SQLite3 database stale (database {{ $labels.sqlite3_database }})",
      description:
        "SQLite3 database has not been seen by the monitoring agent for over 5 minutes. The agent may have lost access to the file.",
    })
    .source("telemetryflow", "SQLite3 monitoring best practices")
    .build(),

  AlertRuleBuilder.create("sqlite3-file-size-large")
    .name("SQLite3 File Size Threshold")
    .description("Database file size exceeds 1GB")
    .category(RuleCategory.SQLITE3, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.sqlite3.file.size")
        .avg()
        .gt(1073741824)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "sqlite3", type: "file-size" })
    .annotations({
      summary: "SQLite3 file size large (database {{ $labels.sqlite3_database }})",
      description:
        "SQLite3 database file size exceeds 1GB. Consider VACUUM to reclaim space or archiving old data.",
    })
    .tfqlQuery(
      'FETCH db_sqlite3_metrics WHERE metric_name = "db.sqlite3.file.size" AND database_id = {databaseId} AGGREGATE avg(value_float) > 1073741824',
    )
    .source("telemetryflow", "SQLite3 monitoring best practices")
    .build(),

  AlertRuleBuilder.create("sqlite3-utilization-high")
    .name("SQLite3 High Utilization")
    .description("Database page utilization exceeds 95%")
    .category(RuleCategory.SQLITE3, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.sqlite3.utilization")
        .avg()
        .gt(95)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "sqlite3", type: "utilization" })
    .annotations({
      summary: "SQLite3 utilization high (database {{ $labels.sqlite3_database }})",
      description:
        "SQLite3 database page utilization is above 95%. The database may need VACUUM or page count increase.",
    })
    .tfqlQuery(
      'FETCH db_sqlite3_metrics WHERE metric_name = "db.sqlite3.utilization" AND database_id = {databaseId} AGGREGATE avg(value_float) > 95',
    )
    .source("telemetryflow", "SQLite3 monitoring best practices")
    .build(),

  AlertRuleBuilder.create("sqlite3-wal-size-large")
    .name("SQLite3 WAL Size Threshold")
    .description("WAL file size exceeds 100MB")
    .category(RuleCategory.SQLITE3, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.sqlite3.file.wal_size")
        .avg()
        .gt(104857600)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "sqlite3", type: "wal" })
    .annotations({
      summary: "SQLite3 WAL size large (database {{ $labels.sqlite3_database }})",
      description:
        "SQLite3 WAL file exceeds 100MB. Checkpoint may not be running frequently enough. Consider adjusting wal_autocheckpoint.",
    })
    .tfqlQuery(
      'FETCH db_sqlite3_metrics WHERE metric_name = "db.sqlite3.file.wal_size" AND database_id = {databaseId} AGGREGATE avg(value_float) > 104857600',
    )
    .source("telemetryflow", "SQLite3 monitoring best practices")
    .build(),

  AlertRuleBuilder.create("sqlite3-pragma-drift")
    .name("SQLite3 PRAGMA Configuration Drift")
    .description("PRAGMA value has changed from previous snapshot")
    .category(RuleCategory.SQLITE3, "configuration")
    .severity("info")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.sqlite3.pragma.changed")
        .last()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "sqlite3", type: "configuration" })
    .annotations({
      summary: "SQLite3 PRAGMA changed (database {{ $labels.sqlite3_database }})",
      description:
        "A SQLite3 PRAGMA configuration value has changed. This may affect performance or data safety.",
    })
    .source("telemetryflow", "SQLite3 monitoring best practices")
    .build(),
];

// Update SQLite3 category groups with rules
SQLite3Category.groups.forEach((group) => {
  group.rules = SQLite3Rules.filter((rule) => rule.subcategory === group.id);
});

// ====================== QUERY ANALYTICS (QAN) ======================
export const QANCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.QUERY_ANALYTICS,
    name: "Query Analytics",
    description: "Monitor database query performance across all engines",
    icon: "carbon:query",
    exporter: "telemetryflow-agent",
    documentationUrl: "https://docs.telemetryflow.io/db-monitoring/qan",
    ruleCount: 3,
  },
  groups: [
    {
      id: "query-performance",
      name: "Query Performance",
      description: "Query latency and execution alerts",
      rules: [],
    },
    {
      id: "slow-queries",
      name: "Slow Queries",
      description: "Slow query detection and thresholds",
      rules: [],
    },
    {
      id: "index-usage",
      name: "Index Usage",
      description: "Full table scan and index coverage alerts",
      rules: [],
    },
  ],
};

export const QANRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("qan-avg-query-latency-high")
    .name("High Average Query Latency")
    .description("Average query latency exceeds threshold across engines")
    .category(RuleCategory.QUERY_ANALYTICS, "query-performance")
    .severity("warning")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.*.queries.avg_duration_ms")
        .avg()
        .gt(100)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "qan", type: "performance" })
    .annotations({
      summary: "High query latency (engine {{ $labels.engine }})",
      description:
        "Average query duration is {{ $value }}ms on engine {{ $labels.engine }}. " +
        "Review the query analytics dashboard for the slowest queries.",
    })
    .source("telemetryflow", "QAN monitoring best practices")
    .build(),

  AlertRuleBuilder.create("qan-slow-query-count-high")
    .name("Slow Query Count Exceeds Threshold")
    .description("Number of slow queries exceeds acceptable limit")
    .category(RuleCategory.QUERY_ANALYTICS, "slow-queries")
    .severity("warning")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.*.queries.calls_rate")
        .rate()
        .gt(100)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "qan", type: "slow-queries" })
    .annotations({
      summary: "High query call rate (engine {{ $labels.engine }})",
      description:
        "Query call rate is {{ $value }}/s for fingerprint {{ $labels.fingerprint }}. " +
        "Consider optimizing this query or adding appropriate indexes.",
    })
    .source("telemetryflow", "QAN monitoring best practices")
    .build(),

  AlertRuleBuilder.create("qan-no-index-usage-high")
    .name("Queries Without Index Exceeds Threshold")
    .description("Number of queries performing full table scans is too high")
    .category(RuleCategory.QUERY_ANALYTICS, "index-usage")
    .severity("warning")
    .enabled(false)
    .condition(
      ConditionBuilder.create()
        .metric("db.mysql.query.rows_examined")
        .rate()
        .gt(1000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "qan", type: "index-usage" })
    .annotations({
      summary: "High rows examined (digest {{ $labels.digest }})",
      description:
        "Query is examining {{ $value }} rows/s without proper index usage. " +
        "Review the query fingerprint and add appropriate indexes.",
    })
    .source("telemetryflow", "QAN monitoring best practices")
    .build(),
];

QANCategory.groups.forEach((group) => {
  group.rules = QANRules.filter((rule) => rule.subcategory === group.id);
});

// Combined export
export const DatabaseRules: AlertRuleTemplate[] = [
  ...MySQLRules,
  ...PostgreSQLRules,
  ...MongoDBRules,
  ...RedisRules,
  ...ElasticsearchRules,
  ...MariaDBRules,
  ...PerconaRules,
  ...SQLite3Rules,
  ...QANRules,
];

export const DatabaseCategories: AlertRuleCategory[] = [
  MySQLCategory,
  PostgreSQLCategory,
  MongoDBCategory,
  RedisCategory,
  ElasticsearchCategory,
  MariaDBCategory,
  PerconaCategory,
  SQLite3Category,
  QANCategory,
];
