/**
 * Storage Alert Rules
 * Ceph, Minio, ZFS
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import { RuleCategory, DefaultDurations, DefaultIntervals } from "../types";

export const CephCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.CEPH,
    name: "Ceph",
    description: "Monitor Ceph distributed storage cluster",
    icon: "logos:ceph",
    exporter: "ceph_exporter",
    documentationUrl: "https://github.com/digitalocean/ceph_exporter",
    ruleCount: 6,
  },
  groups: [
    {
      id: "health",
      name: "Health",
      description: "Cluster health alerts",
      rules: [],
    },
    { id: "osds", name: "OSDs", description: "OSD alerts", rules: [] },
    {
      id: "capacity",
      name: "Capacity",
      description: "Capacity alerts",
      rules: [],
    },
  ],
};

export const MinioCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.MINIO,
    name: "MinIO",
    description: "Monitor MinIO object storage metrics",
    icon: "simple-icons:minio",
    exporter: "minio",
    documentationUrl:
      "https://min.io/docs/minio/linux/operations/monitoring/metrics-and-alerts.html",
    ruleCount: 4,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "capacity",
      name: "Capacity",
      description: "Capacity alerts",
      rules: [],
    },
  ],
};

export const ZFSCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.ZFS,
    name: "ZFS",
    description: "Monitor ZFS filesystem metrics",
    icon: "simple-icons:openzfs",
    exporter: "zfs_exporter",
    documentationUrl: "https://github.com/pdf/zfs_exporter",
    ruleCount: 4,
  },
  groups: [
    {
      id: "health",
      name: "Health",
      description: "Pool health alerts",
      rules: [],
    },
    {
      id: "capacity",
      name: "Capacity",
      description: "Capacity alerts",
      rules: [],
    },
  ],
};

export const StorageRules: AlertRuleTemplate[] = [
  // Ceph
  {
    id: "ceph-cluster-health-warning",
    name: "Ceph Cluster Health Warning",
    description: "Ceph cluster health status is HEALTH_WARN",
    category: RuleCategory.CEPH,
    subcategory: "health",
    severity: "warning",
    conditions: [
      {
        metric: "ceph_health_status",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "ceph" },
    annotations: { summary: "Ceph cluster health warning" },
    promql: "ceph_health_status == 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "ceph-cluster-health-error",
    name: "Ceph Cluster Health Error",
    description: "Ceph cluster health status is HEALTH_ERR",
    category: RuleCategory.CEPH,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "ceph_health_status",
        aggregation: "last",
        operator: "eq",
        threshold: 2,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "ceph" },
    annotations: { summary: "Ceph cluster health error" },
    promql: "ceph_health_status == 2",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "ceph-osd-down",
    name: "Ceph OSD Down",
    description: "Ceph OSD is down",
    category: RuleCategory.CEPH,
    subcategory: "osds",
    severity: "critical",
    conditions: [
      {
        metric: "ceph_osd_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "ceph" },
    annotations: { summary: "Ceph OSD down" },
    promql: "ceph_osd_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "ceph-cluster-near-full",
    name: "Ceph Cluster Near Full",
    description: "Ceph cluster is near full (> 75%)",
    category: RuleCategory.CEPH,
    subcategory: "capacity",
    severity: "warning",
    conditions: [
      {
        metric: "ceph_cluster_total_used_bytes",
        aggregation: "avg",
        operator: "gt",
        threshold: 75,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "ceph" },
    annotations: { summary: "Ceph cluster near full" },
    promql:
      "ceph_cluster_total_used_bytes / ceph_cluster_total_bytes * 100 > 75",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // MinIO
  {
    id: "minio-node-offline",
    name: "MinIO Node Offline",
    description: "MinIO node is offline",
    category: RuleCategory.MINIO,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "minio_cluster_nodes_offline_total",
        aggregation: "sum",
        operator: "gt",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "minio" },
    annotations: { summary: "MinIO node offline" },
    promql: "minio_cluster_nodes_offline_total > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "minio-disk-offline",
    name: "MinIO Disk Offline",
    description: "MinIO disk is offline",
    category: RuleCategory.MINIO,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "minio_cluster_disk_offline_total",
        aggregation: "sum",
        operator: "gt",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "minio" },
    annotations: { summary: "MinIO disk offline" },
    promql: "minio_cluster_disk_offline_total > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "minio-cluster-space-low",
    name: "MinIO Cluster Space Low",
    description: "MinIO cluster space is low (> 80%)",
    category: RuleCategory.MINIO,
    subcategory: "capacity",
    severity: "warning",
    conditions: [
      {
        metric: "minio_cluster_capacity_usable_total_bytes",
        aggregation: "avg",
        operator: "gt",
        threshold: 80,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "minio" },
    annotations: { summary: "MinIO cluster space low" },
    promql:
      "(minio_cluster_capacity_usable_total_bytes - minio_cluster_capacity_usable_free_bytes) / minio_cluster_capacity_usable_total_bytes * 100 > 80",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // ZFS
  {
    id: "zfs-pool-degraded",
    name: "ZFS Pool Degraded",
    description: "ZFS pool is degraded",
    category: RuleCategory.ZFS,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "zfs_pool_health",
        aggregation: "last",
        operator: "neq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "zfs" },
    annotations: { summary: "ZFS pool degraded" },
    promql: "zfs_pool_health != 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "zfs-pool-full",
    name: "ZFS Pool Near Full",
    description: "ZFS pool is near full (> 80%)",
    category: RuleCategory.ZFS,
    subcategory: "capacity",
    severity: "warning",
    conditions: [
      {
        metric: "zfs_pool_free_bytes",
        aggregation: "avg",
        operator: "lt",
        threshold: 20,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "zfs" },
    annotations: { summary: "ZFS pool near full" },
    promql: "zfs_pool_free_bytes / zfs_pool_size_bytes * 100 < 20",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "zfs-scrub-errors",
    name: "ZFS Scrub Errors",
    description: "ZFS scrub found errors",
    category: RuleCategory.ZFS,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "zfs_pool_scrub_errors",
        aggregation: "sum",
        operator: "gt",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "zfs" },
    annotations: { summary: "ZFS scrub errors" },
    promql: "zfs_pool_scrub_errors > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
];

export const StorageCategories: AlertRuleCategory[] = [
  CephCategory,
  MinioCategory,
  ZFSCategory,
];

// Update categories with rules
StorageCategories.forEach((cat) => {
  const categoryRules = StorageRules.filter(
    (r) => r.category === cat.metadata.id,
  );
  cat.groups.forEach((group) => {
    group.rules = categoryRules.filter((rule) => rule.subcategory === group.id);
  });
});
