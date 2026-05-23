/**
 * Message Queue Alert Rules
 * RabbitMQ, Kafka, NATS
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import { RuleCategory, DefaultDurations, DefaultIntervals } from "../types";

export const RabbitMQCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.RABBITMQ,
    name: "RabbitMQ",
    description: "Monitor RabbitMQ message broker metrics",
    icon: "logos:rabbitmq",
    exporter: "rabbitmq_exporter",
    documentationUrl: "https://github.com/kbudde/rabbitmq_exporter",
    ruleCount: 6,
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

export const KafkaCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.KAFKA,
    name: "Kafka",
    description: "Monitor Apache Kafka message broker metrics",
    icon: "logos:kafka",
    exporter: "kafka_exporter",
    documentationUrl: "https://github.com/danielqsj/kafka_exporter",
    ruleCount: 5,
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

export const NATSCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.NATS,
    name: "NATS",
    description: "Monitor NATS messaging system metrics",
    icon: "simple-icons:natsdotio",
    exporter: "prometheus-nats-exporter",
    documentationUrl: "https://github.com/nats-io/prometheus-nats-exporter",
    ruleCount: 3,
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

export const MessageQueueRules: AlertRuleTemplate[] = [
  // RabbitMQ
  {
    id: "rabbitmq-node-down",
    name: "RabbitMQ Node Down",
    description: "RabbitMQ node is down",
    category: RuleCategory.RABBITMQ,
    subcategory: "cluster",
    severity: "critical",
    conditions: [
      {
        metric: "rabbitmq_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "rabbitmq" },
    annotations: { summary: "RabbitMQ node down" },
    promql: "rabbitmq_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "rabbitmq-queue-messages-ready",
    name: "RabbitMQ Queue Too Many Messages Ready",
    description: "Queue is filling up (> 1000 messages ready)",
    category: RuleCategory.RABBITMQ,
    subcategory: "queues",
    severity: "warning",
    conditions: [
      {
        metric: "rabbitmq_queue_messages_ready",
        aggregation: "avg",
        operator: "gt",
        threshold: 1000,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "rabbitmq" },
    annotations: { summary: "RabbitMQ queue too many messages" },
    promql: "rabbitmq_queue_messages_ready > 1000",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "rabbitmq-no-consumers",
    name: "RabbitMQ Queue No Consumers",
    description: "Queue has no consumers",
    category: RuleCategory.RABBITMQ,
    subcategory: "consumers",
    severity: "warning",
    conditions: [
      {
        metric: "rabbitmq_queue_consumers",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "rabbitmq" },
    annotations: { summary: "RabbitMQ queue no consumers" },
    promql: "rabbitmq_queue_consumers == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "rabbitmq-memory-high",
    name: "RabbitMQ Memory High",
    description: "RabbitMQ memory usage is high (> 90%)",
    category: RuleCategory.RABBITMQ,
    subcategory: "cluster",
    severity: "warning",
    conditions: [
      {
        metric: "rabbitmq_node_mem_used",
        aggregation: "avg",
        operator: "gt",
        threshold: 90,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "rabbitmq" },
    annotations: { summary: "RabbitMQ memory high" },
    promql: "rabbitmq_node_mem_used / rabbitmq_node_mem_limit * 100 > 90",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Kafka
  {
    id: "kafka-broker-down",
    name: "Kafka Broker Down",
    description: "Kafka broker is down",
    category: RuleCategory.KAFKA,
    subcategory: "cluster",
    severity: "critical",
    conditions: [
      {
        metric: "kafka_brokers",
        aggregation: "rate",
        operator: "lt",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "kafka" },
    annotations: { summary: "Kafka broker down" },
    promql: "kafka_brokers < 3",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kafka-consumer-lag",
    name: "Kafka Consumer Lag",
    description: "Kafka consumer group is lagging behind",
    category: RuleCategory.KAFKA,
    subcategory: "consumers",
    severity: "warning",
    conditions: [
      {
        metric: "kafka_consumergroup_lag",
        aggregation: "sum",
        operator: "gt",
        threshold: 1000,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "kafka" },
    annotations: { summary: "Kafka consumer lag" },
    promql: "sum(kafka_consumergroup_lag) by (consumergroup) > 1000",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kafka-topics-underreplicated",
    name: "Kafka Topics Under Replicated",
    description: "Kafka topic partitions are under-replicated",
    category: RuleCategory.KAFKA,
    subcategory: "topics",
    severity: "critical",
    conditions: [
      {
        metric: "kafka_topic_partition_under_replicated_partition",
        aggregation: "sum",
        operator: "gt",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "kafka" },
    annotations: { summary: "Kafka topics under-replicated" },
    promql: "sum(kafka_topic_partition_under_replicated_partition) > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kafka-offline-partitions",
    name: "Kafka Offline Partitions",
    description: "Kafka has offline partitions",
    category: RuleCategory.KAFKA,
    subcategory: "topics",
    severity: "critical",
    conditions: [
      {
        metric: "kafka_controller_offline_partitions_count",
        aggregation: "sum",
        operator: "gt",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "kafka" },
    annotations: { summary: "Kafka offline partitions" },
    promql: "sum(kafka_controller_offline_partitions_count) > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // NATS
  {
    id: "nats-down",
    name: "NATS Server Down",
    description: "NATS server is down",
    category: RuleCategory.NATS,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "nats_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "nats" },
    annotations: { summary: "NATS down" },
    promql: "nats_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "nats-slow-consumers",
    name: "NATS Slow Consumers",
    description: "NATS has slow consumers",
    category: RuleCategory.NATS,
    subcategory: "performance",
    severity: "warning",
    conditions: [
      {
        metric: "nats_slow_consumers",
        aggregation: "avg",
        operator: "gt",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "nats" },
    annotations: { summary: "NATS slow consumers" },
    promql: "nats_slow_consumers > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
];

export const MessageQueueCategories: AlertRuleCategory[] = [
  RabbitMQCategory,
  KafkaCategory,
  NATSCategory,
];

// Update categories with rules
MessageQueueCategories.forEach((cat) => {
  const categoryRules = MessageQueueRules.filter(
    (r) => r.category === cat.metadata.id,
  );
  cat.groups.forEach((group) => {
    group.rules = categoryRules.filter((rule) => rule.subcategory === group.id);
  });
});
