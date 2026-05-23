/**
 * etcd Alert Rules
 * Based on kube-prometheus-stack etcd alerting rules
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import { RuleCategory, DefaultDurations, DefaultIntervals } from "../types";

export const EtcdCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.ETCD,
    name: "etcd",
    description:
      "Monitor etcd distributed key-value store cluster health, consensus, and performance",
    icon: "simple-icons:etcd",
    exporter: "etcd",
    documentationUrl: "https://etcd.io/docs/current/op-guide/monitoring/",
    ruleCount: 13,
  },
  groups: [
    {
      id: "health",
      name: "Health",
      description: "etcd cluster health and availability",
      rules: [],
    },
    {
      id: "consensus",
      name: "Consensus",
      description: "Raft consensus and leader election",
      rules: [],
    },
    {
      id: "performance",
      name: "Performance",
      description: "etcd latency and throughput",
      rules: [],
    },
    {
      id: "storage",
      name: "Storage",
      description: "etcd database and disk usage",
      rules: [],
    },
  ],
};

export const EtcdRules: AlertRuleTemplate[] = [
  // Health
  {
    id: "etcd-members-down",
    name: "etcd Members Down",
    description: "etcd cluster members are unreachable",
    category: RuleCategory.ETCD,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "etcd_server_has_leader",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: DefaultDurations.MEDIUM,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "etcd", type: "health" },
    annotations: {
      summary: "etcd cluster members are unreachable",
      description:
        "{{ $value }} etcd cluster member(s) have been unreachable for more than 3 minutes",
    },
    promql:
      'max without (endpoint) (sum without (instance) (up{job=~".*etcd.*"} == bool 0) or count without (To) (sum without (instance) (rate(etcd_network_peer_sent_failures_total{job=~".*etcd.*"}[120s])) > 0.01)) > 0',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-insufficient-members",
    name: "etcd Insufficient Members",
    description: "etcd cluster has insufficient members to reach consensus",
    category: RuleCategory.ETCD,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "etcd_server_has_leader",
        aggregation: "last",
        operator: "lt",
        threshold: 1,
        duration: DefaultDurations.SHORT,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "etcd", type: "quorum" },
    annotations: {
      summary: "etcd cluster has insufficient members",
      description:
        'etcd cluster "{{ $labels.job }}" has {{ $value }} members — insufficient for consensus',
    },
    promql:
      'sum(up{job=~".*etcd.*"} == bool 1) without (instance) < ((count(up{job=~".*etcd.*"}) without (instance) + 1) / 2)',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  // Consensus
  {
    id: "etcd-no-leader",
    name: "etcd No Leader",
    description: "etcd cluster has no leader",
    category: RuleCategory.ETCD,
    subcategory: "consensus",
    severity: "critical",
    conditions: [
      {
        metric: "etcd_server_has_leader",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "0s",
      },
    ],
    evaluationInterval: DefaultIntervals.FAST,
    forDuration: "0s",
    labels: { component: "etcd", type: "leader" },
    annotations: {
      summary: "etcd cluster has no leader",
      description: 'etcd cluster "{{ $labels.job }}" has no leader',
    },
    promql: 'etcd_server_has_leader{job=~".*etcd.*"} == 0',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-high-leader-changes",
    name: "etcd High Number of Leader Changes",
    description: "etcd cluster is experiencing a high number of leader changes",
    category: RuleCategory.ETCD,
    subcategory: "consensus",
    severity: "warning",
    conditions: [
      {
        metric: "etcd_server_leader_changes_seen_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 4,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "etcd", type: "leader" },
    annotations: {
      summary: "etcd cluster is experiencing a high rate of leader changes",
      description:
        'etcd cluster "{{ $labels.job }}" instance {{ $labels.instance }} has seen {{ $value }} leader changes within the last 15 minutes',
    },
    promql:
      'increase(etcd_server_leader_changes_seen_total{job=~".*etcd.*"}[15m]) > 4',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-high-failed-proposals",
    name: "etcd High Number of Failed Proposals",
    description: "etcd cluster has a high number of failed proposals",
    category: RuleCategory.ETCD,
    subcategory: "consensus",
    severity: "warning",
    conditions: [
      {
        metric: "etcd_server_proposals_failed_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 5,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "etcd", type: "proposals" },
    annotations: {
      summary: "etcd cluster has a high number of failed proposals",
      description:
        'etcd cluster "{{ $labels.job }}" instance {{ $labels.instance }} has seen {{ $value }} proposal failures in the last 15 minutes',
    },
    promql:
      'increase(etcd_server_proposals_failed_total{job=~".*etcd.*"}[15m]) > 5',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  // Performance
  {
    id: "etcd-grpc-requests-slow",
    name: "etcd gRPC Requests Slow",
    description: "etcd gRPC requests are taking too long",
    category: RuleCategory.ETCD,
    subcategory: "performance",
    severity: "critical",
    conditions: [
      {
        metric: "grpc_server_handling_seconds_bucket",
        aggregation: "avg",
        operator: "gt",
        threshold: 0.15,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "etcd", type: "latency" },
    annotations: {
      summary: "etcd gRPC requests are slow",
      description:
        'etcd cluster "{{ $labels.job }}" gRPC requests to {{ $labels.grpc_method }} are taking {{ $value }}s on etcd instance {{ $labels.instance }}',
    },
    promql:
      'histogram_quantile(0.99, sum(rate(grpc_server_handling_seconds_bucket{job=~".*etcd.*", grpc_method!="Defragment", grpc_type="unary"}[5m])) without(grpc_type)) > 0.15',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-high-failed-grpc-requests",
    name: "etcd High Number of Failed gRPC Requests",
    description: "etcd cluster has a high number of failed gRPC requests",
    category: RuleCategory.ETCD,
    subcategory: "performance",
    severity: "warning",
    conditions: [
      {
        metric: "grpc_server_handled_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 0.01,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "etcd", type: "grpc" },
    annotations: {
      summary: "etcd cluster has a high number of failed gRPC requests",
      description:
        'etcd cluster "{{ $labels.job }}" is having {{ $value | humanizePercentage }} errors for gRPC method {{ $labels.grpc_method }} on etcd instance {{ $labels.instance }}',
    },
    promql:
      'sum(rate(grpc_server_handled_total{job=~".*etcd.*", grpc_code=~"Unknown|FailedPrecondition|ResourceExhausted|Internal|Unavailable|DataLoss|DeadlineExceeded"}[5m])) without (grpc_type, grpc_code) / sum(rate(grpc_server_handled_total{job=~".*etcd.*"}[5m])) without (grpc_type, grpc_code) > 0.01',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-member-communication-slow",
    name: "etcd Member Communication Slow",
    description: "etcd cluster member communication is slowing down",
    category: RuleCategory.ETCD,
    subcategory: "performance",
    severity: "warning",
    conditions: [
      {
        metric: "etcd_network_peer_round_trip_time_seconds_bucket",
        aggregation: "avg",
        operator: "gt",
        threshold: 0.15,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "etcd", type: "network" },
    annotations: {
      summary: "etcd cluster member communication is slowing down",
      description:
        'etcd cluster "{{ $labels.job }}" member communication with {{ $labels.To }} is taking {{ $value }}s on etcd instance {{ $labels.instance }}',
    },
    promql:
      'histogram_quantile(0.99, rate(etcd_network_peer_round_trip_time_seconds_bucket{job=~".*etcd.*"}[5m])) > 0.15',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-high-fsync-durations",
    name: "etcd High Fsync Durations",
    description:
      "etcd WAL fsync duration is high indicating slow disk or I/O congestion",
    category: RuleCategory.ETCD,
    subcategory: "performance",
    severity: "warning",
    conditions: [
      {
        metric: "etcd_disk_wal_fsync_duration_seconds_bucket",
        aggregation: "avg",
        operator: "gt",
        threshold: 0.5,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "etcd", type: "disk" },
    annotations: {
      summary: "etcd cluster WAL fsync duration is high",
      description:
        'etcd cluster "{{ $labels.job }}" WAL fsync duration is {{ $value }}s on etcd instance {{ $labels.instance }}',
    },
    promql:
      'histogram_quantile(0.99, rate(etcd_disk_wal_fsync_duration_seconds_bucket{job=~".*etcd.*"}[5m])) > 0.5',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-high-commit-durations",
    name: "etcd High Commit Durations",
    description:
      "etcd commit duration is high indicating slow disk or heavy load",
    category: RuleCategory.ETCD,
    subcategory: "performance",
    severity: "warning",
    conditions: [
      {
        metric: "etcd_disk_backend_commit_duration_seconds_bucket",
        aggregation: "avg",
        operator: "gt",
        threshold: 0.25,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "etcd", type: "disk" },
    annotations: {
      summary: "etcd cluster commit duration is high",
      description:
        'etcd cluster "{{ $labels.job }}" commit duration is {{ $value }}s on etcd instance {{ $labels.instance }}',
    },
    promql:
      'histogram_quantile(0.99, rate(etcd_disk_backend_commit_duration_seconds_bucket{job=~".*etcd.*"}[5m])) > 0.25',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  // Storage
  {
    id: "etcd-database-quota-low-space",
    name: "etcd Database Quota Low Space",
    description:
      "etcd cluster database is running full — urgent defragmentation or quota increase needed",
    category: RuleCategory.ETCD,
    subcategory: "storage",
    severity: "critical",
    conditions: [
      {
        metric: "etcd_mvcc_db_total_size_in_bytes",
        aggregation: "last",
        operator: "gt",
        threshold: 95,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "etcd", type: "storage" },
    annotations: {
      summary: "etcd cluster database is running full",
      description:
        'etcd cluster "{{ $labels.job }}" database size {{ $value | humanize1024 }} is nearing the maximum quota',
    },
    promql:
      '(last_over_time(etcd_mvcc_db_total_size_in_bytes{job=~".*etcd.*"}[5m]) / last_over_time(etcd_server_quota_backend_bytes{job=~".*etcd.*"}[5m])) * 100 > 95',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-excessive-database-growth",
    name: "etcd Excessive Database Growth",
    description:
      "etcd cluster database is growing too quickly and will run out of space in less than 8 hours",
    category: RuleCategory.ETCD,
    subcategory: "storage",
    severity: "warning",
    conditions: [
      {
        metric: "etcd_mvcc_db_total_size_in_bytes",
        aggregation: "rate",
        operator: "gt",
        threshold: 0,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "etcd", type: "storage" },
    annotations: {
      summary: "etcd cluster database is growing too quickly",
      description:
        'Predicting etcd cluster "{{ $labels.job }}" to run out of quota within 8 hours based on current growth rate',
    },
    promql:
      'predict_linear(etcd_mvcc_db_total_size_in_bytes{job=~".*etcd.*"}[4h], 4*60*60) > etcd_server_quota_backend_bytes{job=~".*etcd.*"}',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "etcd-high-fragmentation",
    name: "etcd High Database Fragmentation",
    description:
      "etcd database has high fragmentation and should be defragmented",
    category: RuleCategory.ETCD,
    subcategory: "storage",
    severity: "warning",
    conditions: [
      {
        metric: "etcd_mvcc_db_total_size_in_bytes",
        aggregation: "last",
        operator: "gt",
        threshold: 50,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "etcd", type: "storage" },
    annotations: {
      summary: "etcd database has high fragmentation ratio",
      description:
        'etcd cluster "{{ $labels.job }}" member {{ $labels.instance }} database is {{ $value | humanizePercentage }} fragmented — run etcdctl defrag',
    },
    promql:
      '(1 - etcd_mvcc_db_total_size_in_use_in_bytes{job=~".*etcd.*"} / etcd_mvcc_db_total_size_in_bytes{job=~".*etcd.*"}) > 0.5 and etcd_mvcc_db_total_size_in_use_in_bytes{job=~".*etcd.*"} > 104857600',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
];

// Update category with rules
EtcdCategory.groups.forEach((group) => {
  group.rules = EtcdRules.filter((rule) => rule.subcategory === group.id);
});
