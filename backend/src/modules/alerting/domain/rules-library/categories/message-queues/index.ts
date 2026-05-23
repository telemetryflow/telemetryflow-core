/**
 * Message Queue Alert Rules
 * RabbitMQ, Kafka, NATS
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#message-queues
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

// ====================== RABBITMQ ======================
export const RabbitMQCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.RABBITMQ,
    name: "RabbitMQ",
    description: "Monitor RabbitMQ message broker metrics",
    icon: "logos:rabbitmq",
    exporter: "rabbitmq_exporter",
    documentationUrl: "https://github.com/kbudde/rabbitmq_exporter",
    ruleCount: 12,
  },
  groups: [
    {
      id: "cluster",
      name: "Cluster",
      description: "Cluster health alerts",
      rules: [],
    },
    { id: "queues", name: "Queues", description: "Queue alerts", rules: [] },
    {
      id: "consumers",
      name: "Consumers",
      description: "Consumer alerts",
      rules: [],
    },
  ],
};

export const RabbitMQRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("rabbitmq-node-down")
    .name("RabbitMQ Node Down")
    .description("RabbitMQ node is down")
    .category(RuleCategory.RABBITMQ, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("rabbitmq_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "rabbitmq", type: "availability" })
    .annotations({
      summary: "RabbitMQ node down (instance {{ $labels.instance }})",
      description: "RabbitMQ node is down",
    })
    .promql("rabbitmq_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("rabbitmq-node-not-distributed")
    .name("RabbitMQ Node Not Distributed")
    .description("RabbitMQ node is not running in a distributed cluster")
    .category(RuleCategory.RABBITMQ, "cluster")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rabbitmq_running")
        .count()
        .lt(3)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "rabbitmq", type: "cluster" })
    .annotations({
      summary:
        "RabbitMQ node not distributed (instance {{ $labels.instance }})",
      description: "RabbitMQ node is not running in a distributed cluster",
    })
    .promql("erlang_vm_dist_node_state < 3")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("rabbitmq-queue-messages-ready")
    .name("RabbitMQ Queue Too Many Messages Ready")
    .description("Queue is filling up (> 1000 messages ready)")
    .category(RuleCategory.RABBITMQ, "queues")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rabbitmq_queue_messages_ready")
        .avg()
        .gt(1000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "rabbitmq", type: "queue" })
    .annotations({
      summary:
        "RabbitMQ queue too many messages ready (queue {{ $labels.queue }})",
      description: "Queue is filling up (> 1000 messages ready)",
    })
    .promql("rabbitmq_queue_messages_ready > 1000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("rabbitmq-queue-messages-unacked")
    .name("RabbitMQ Queue Too Many Messages Unacked")
    .description("Queue has too many unacknowledged messages (> 1000)")
    .category(RuleCategory.RABBITMQ, "queues")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rabbitmq_queue_messages_unacked")
        .avg()
        .gt(1000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "rabbitmq", type: "queue" })
    .annotations({
      summary:
        "RabbitMQ queue too many messages unacked (queue {{ $labels.queue }})",
      description: "Queue has too many unacknowledged messages (> 1000)",
    })
    .promql("rabbitmq_queue_messages_unacked > 1000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("rabbitmq-no-consumers")
    .name("RabbitMQ Queue No Consumers")
    .description("Queue has no consumers")
    .category(RuleCategory.RABBITMQ, "consumers")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rabbitmq_queue_consumers")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "rabbitmq", type: "consumers" })
    .annotations({
      summary: "RabbitMQ queue no consumers (queue {{ $labels.queue }})",
      description: "Queue has no consumers",
    })
    .promql("rabbitmq_queue_consumers == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("rabbitmq-memory-high")
    .name("RabbitMQ Memory High")
    .description("RabbitMQ memory usage is high (> 90%)")
    .category(RuleCategory.RABBITMQ, "cluster")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rabbitmq_node_mem_used")
        .avg()
        .gt(90)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "rabbitmq", type: "memory" })
    .annotations({
      summary: "RabbitMQ memory high (instance {{ $labels.instance }})",
      description: "RabbitMQ memory usage is high (> 90%)",
    })
    .promql("rabbitmq_node_mem_used / rabbitmq_node_mem_limit * 100 > 90")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("rabbitmq-file-descriptors-usage")
    .name("RabbitMQ File Descriptors Usage")
    .description("RabbitMQ is running low on file descriptors")
    .category(RuleCategory.RABBITMQ, "cluster")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rabbitmq_node_fd_used")
        .avg()
        .gt(90)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "rabbitmq", type: "resources" })
    .annotations({
      summary:
        "RabbitMQ file descriptors usage (instance {{ $labels.instance }})",
      description: "RabbitMQ is running low on file descriptors",
    })
    .promql("rabbitmq_node_fd_used / rabbitmq_node_fd_total * 100 > 90")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("rabbitmq-too-many-connections")
    .name("RabbitMQ Too Many Connections")
    .description("RabbitMQ has too many connections (> 1000)")
    .category(RuleCategory.RABBITMQ, "cluster")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rabbitmq_connections")
        .avg()
        .gt(1000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "rabbitmq", type: "connections" })
    .annotations({
      summary:
        "RabbitMQ too many connections (instance {{ $labels.instance }})",
      description: "RabbitMQ has too many connections (> 1000)",
    })
    .promql("rabbitmq_connections > 1000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== KAFKA ======================
export const KafkaCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.KAFKA,
    name: "Kafka",
    description: "Monitor Apache Kafka message broker metrics",
    icon: "logos:kafka",
    exporter: "kafka_exporter",
    documentationUrl: "https://github.com/danielqsj/kafka_exporter",
    ruleCount: 10,
  },
  groups: [
    {
      id: "cluster",
      name: "Cluster",
      description: "Cluster health alerts",
      rules: [],
    },
    { id: "topics", name: "Topics", description: "Topic alerts", rules: [] },
    {
      id: "consumers",
      name: "Consumers",
      description: "Consumer group alerts",
      rules: [],
    },
  ],
};

export const KafkaRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("kafka-broker-down")
    .name("Kafka Broker Down")
    .description("Kafka broker is down")
    .category(RuleCategory.KAFKA, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kafka_brokers")
        .rate()
        .lt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "kafka", type: "availability" })
    .annotations({
      summary: "Kafka broker down",
      description: "One or more Kafka brokers are down",
    })
    .promql("kafka_brokers < 3")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kafka-topics-underreplicated")
    .name("Kafka Topics Under Replicated")
    .description("Kafka topic partitions are under-replicated")
    .category(RuleCategory.KAFKA, "topics")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kafka_topic_partition_under_replicated_partition")
        .sum()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "kafka", type: "replication" })
    .annotations({
      summary: "Kafka topics under-replicated",
      description: "Kafka topic partitions are under-replicated",
    })
    .promql("sum(kafka_topic_partition_under_replicated_partition) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kafka-consumer-lag")
    .name("Kafka Consumer Lag")
    .description("Kafka consumer group is lagging behind")
    .category(RuleCategory.KAFKA, "consumers")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kafka_consumergroup_lag")
        .sum()
        .gt(1000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "kafka", type: "consumers" })
    .annotations({
      summary: "Kafka consumer lag (group {{ $labels.consumergroup }})",
      description:
        "Consumer group {{ $labels.consumergroup }} is lagging behind by {{ $value }} messages",
    })
    .promql("sum(kafka_consumergroup_lag) by (consumergroup) > 1000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kafka-consumer-lag-critical")
    .name("Kafka Consumer Lag Critical")
    .description("Kafka consumer group lag is critically high")
    .category(RuleCategory.KAFKA, "consumers")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kafka_consumergroup_lag")
        .sum()
        .gt(10000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "kafka", type: "consumers" })
    .annotations({
      summary:
        "Kafka consumer lag critical (group {{ $labels.consumergroup }})",
      description:
        "Consumer group {{ $labels.consumergroup }} is critically lagging by {{ $value }} messages",
    })
    .promql("sum(kafka_consumergroup_lag) by (consumergroup) > 10000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kafka-no-active-controller")
    .name("Kafka No Active Controller")
    .description("No active controller in Kafka cluster")
    .category(RuleCategory.KAFKA, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kafka_controller_active_controller_count")
        .sum()
        .neq(1)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "kafka", type: "controller" })
    .annotations({
      summary: "Kafka no active controller",
      description: "No active controller in Kafka cluster",
    })
    .promql("sum(kafka_controller_active_controller_count) != 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kafka-offline-partitions")
    .name("Kafka Offline Partitions")
    .description("Kafka has offline partitions")
    .category(RuleCategory.KAFKA, "topics")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kafka_controller_offline_partitions_count")
        .sum()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "kafka", type: "partitions" })
    .annotations({
      summary: "Kafka offline partitions",
      description: "Kafka has {{ $value }} offline partitions",
    })
    .promql("sum(kafka_controller_offline_partitions_count) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kafka-isr-shrink")
    .name("Kafka ISR Shrinking")
    .description("Kafka In-Sync Replicas (ISR) is shrinking")
    .category(RuleCategory.KAFKA, "topics")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kafka_topic_partition_in_sync_replica")
        .rate()
        .lt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "kafka", type: "replication" })
    .annotations({
      summary: "Kafka ISR shrinking",
      description: "Kafka ISR is shrinking - may indicate broker issues",
    })
    .promql("sum(delta(kafka_topic_partition_in_sync_replica[5m])) < 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== NATS ======================
export const NATSCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.NATS,
    name: "NATS",
    description: "Monitor NATS messaging system metrics",
    icon: "simple-icons:natsdotio",
    exporter: "prometheus-nats-exporter",
    documentationUrl: "https://github.com/nats-io/prometheus-nats-exporter",
    ruleCount: 6,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "performance",
      name: "Performance",
      description: "Performance alerts",
      rules: [],
    },
  ],
};

export const NATSRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("nats-down")
    .name("NATS Server Down")
    .description("NATS server is down")
    .category(RuleCategory.NATS, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("nats_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "nats", type: "availability" })
    .annotations({
      summary: "NATS down (instance {{ $labels.instance }})",
      description: "NATS server is down",
    })
    .promql("nats_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("nats-slow-consumers")
    .name("NATS Slow Consumers")
    .description("NATS has slow consumers")
    .category(RuleCategory.NATS, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("nats_slow_consumers")
        .avg()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "nats", type: "consumers" })
    .annotations({
      summary: "NATS slow consumers (instance {{ $labels.instance }})",
      description: "NATS has {{ $value }} slow consumers",
    })
    .promql("nats_slow_consumers > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("nats-connections-high")
    .name("NATS Connections High")
    .description("NATS connection count is high")
    .category(RuleCategory.NATS, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("nats_connections")
        .avg()
        .gt(1000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "nats", type: "connections" })
    .annotations({
      summary: "NATS connections high (instance {{ $labels.instance }})",
      description: "NATS has {{ $value }} connections",
    })
    .promql("nats_connections > 1000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("nats-subscriptions-high")
    .name("NATS Subscriptions High")
    .description("NATS subscription count is high")
    .category(RuleCategory.NATS, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("nats_subscriptions")
        .avg()
        .gt(10000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "nats", type: "subscriptions" })
    .annotations({
      summary: "NATS subscriptions high (instance {{ $labels.instance }})",
      description: "NATS has {{ $value }} subscriptions",
    })
    .promql("nats_subscriptions > 10000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// Update categories with rules
RabbitMQCategory.groups.forEach((group) => {
  group.rules = RabbitMQRules.filter((rule) => rule.subcategory === group.id);
});

KafkaCategory.groups.forEach((group) => {
  group.rules = KafkaRules.filter((rule) => rule.subcategory === group.id);
});

NATSCategory.groups.forEach((group) => {
  group.rules = NATSRules.filter((rule) => rule.subcategory === group.id);
});

// Combined export
export const MessageQueueRules: AlertRuleTemplate[] = [
  ...RabbitMQRules,
  ...KafkaRules,
  ...NATSRules,
];

export const MessageQueueCategories: AlertRuleCategory[] = [
  RabbitMQCategory,
  KafkaCategory,
  NATSCategory,
];
