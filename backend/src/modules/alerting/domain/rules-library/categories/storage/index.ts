/**
 * Storage Alert Rules
 * Ceph, Minio, ZFS
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#storage
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

// ====================== CEPH ======================
export const CephCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.CEPH,
    name: "Ceph",
    description: "Monitor Ceph distributed storage cluster",
    icon: "logos:ceph",
    exporter: "ceph_exporter",
    documentationUrl: "https://github.com/digitalocean/ceph_exporter",
    ruleCount: 15,
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

export const CephRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("ceph-cluster-health-warning")
    .name("Ceph Cluster Health Warning")
    .description("Ceph cluster health status is HEALTH_WARN")
    .category(RuleCategory.CEPH, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("ceph_health_status")
        .last()
        .eq(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "ceph", type: "health" })
    .annotations({
      summary: "Ceph cluster health warning",
      description: "Ceph cluster health status is HEALTH_WARN",
    })
    .promql("ceph_health_status == 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ceph-cluster-health-error")
    .name("Ceph Cluster Health Error")
    .description("Ceph cluster health status is HEALTH_ERR")
    .category(RuleCategory.CEPH, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("ceph_health_status")
        .last()
        .eq(2)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "ceph", type: "health" })
    .annotations({
      summary: "Ceph cluster health error",
      description: "Ceph cluster health status is HEALTH_ERR",
    })
    .promql("ceph_health_status == 2")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ceph-osd-down")
    .name("Ceph OSD Down")
    .description("Ceph OSD is down")
    .category(RuleCategory.CEPH, "osds")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("ceph_osd_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "ceph", type: "osd" })
    .annotations({
      summary: "Ceph OSD down (osd.{{ $labels.osd }})",
      description: "Ceph OSD is down",
    })
    .promql("ceph_osd_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ceph-osd-nearfull")
    .name("Ceph OSD Near Full")
    .description("Ceph OSD is near full (> 85%)")
    .category(RuleCategory.CEPH, "osds")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("ceph_osd_utilization")
        .avg()
        .gt(85)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "ceph", type: "capacity" })
    .annotations({
      summary: "Ceph OSD near full (osd.{{ $labels.osd }})",
      description: "Ceph OSD is near full (> 85%)",
    })
    .promql("ceph_osd_utilization > 85")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ceph-osd-full")
    .name("Ceph OSD Full")
    .description("Ceph OSD is full (> 90%)")
    .category(RuleCategory.CEPH, "osds")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("ceph_osd_utilization")
        .avg()
        .gt(90)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "ceph", type: "capacity" })
    .annotations({
      summary: "Ceph OSD full (osd.{{ $labels.osd }})",
      description: "Ceph OSD is full (> 90%)",
    })
    .promql("ceph_osd_utilization > 90")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ceph-cluster-near-full")
    .name("Ceph Cluster Near Full")
    .description("Ceph cluster is near full (> 75%)")
    .category(RuleCategory.CEPH, "capacity")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("ceph_cluster_total_used_bytes")
        .avg()
        .gt(75)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "ceph", type: "capacity" })
    .annotations({
      summary: "Ceph cluster near full",
      description: "Ceph cluster is near full (> 75%)",
    })
    .promql(
      "ceph_cluster_total_used_bytes / ceph_cluster_total_bytes * 100 > 75",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ceph-pg-inactive")
    .name("Ceph PG Inactive")
    .description("Ceph has inactive PGs")
    .category(RuleCategory.CEPH, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("ceph_pg_inactive")
        .sum()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "ceph", type: "pg" })
    .annotations({
      summary: "Ceph PG inactive",
      description: "Ceph has {{ $value }} inactive PGs",
    })
    .promql("ceph_pg_inactive > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ceph-pg-unclean")
    .name("Ceph PG Unclean")
    .description("Ceph has unclean PGs")
    .category(RuleCategory.CEPH, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("ceph_pg_unclean")
        .sum()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "ceph", type: "pg" })
    .annotations({
      summary: "Ceph PG unclean",
      description: "Ceph has {{ $value }} unclean PGs",
    })
    .promql("ceph_pg_unclean > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== MINIO ======================
export const MinioCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.MINIO,
    name: "MinIO",
    description: "Monitor MinIO object storage metrics",
    icon: "simple-icons:minio",
    exporter: "minio",
    documentationUrl:
      "https://min.io/docs/minio/linux/operations/monitoring/metrics-and-alerts.html",
    ruleCount: 10,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "capacity",
      name: "Capacity",
      description: "Capacity alerts",
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

export const MinioRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("minio-node-offline")
    .name("MinIO Node Offline")
    .description("MinIO node is offline")
    .category(RuleCategory.MINIO, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("minio_cluster_nodes_offline_total")
        .sum()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "minio", type: "availability" })
    .annotations({
      summary: "MinIO node offline",
      description: "{{ $value }} MinIO nodes are offline",
    })
    .promql("minio_cluster_nodes_offline_total > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("minio-disk-offline")
    .name("MinIO Disk Offline")
    .description("MinIO disk is offline")
    .category(RuleCategory.MINIO, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("minio_cluster_disk_offline_total")
        .sum()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "minio", type: "disk" })
    .annotations({
      summary: "MinIO disk offline",
      description: "{{ $value }} MinIO disks are offline",
    })
    .promql("minio_cluster_disk_offline_total > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("minio-cluster-space-low")
    .name("MinIO Cluster Space Low")
    .description("MinIO cluster space is low (> 80%)")
    .category(RuleCategory.MINIO, "capacity")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("minio_cluster_capacity_usable_total_bytes")
        .avg()
        .gt(80)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "minio", type: "capacity" })
    .annotations({
      summary: "MinIO cluster space low",
      description: "MinIO cluster space is low (> 80%)",
    })
    .promql(
      "(minio_cluster_capacity_usable_total_bytes - minio_cluster_capacity_usable_free_bytes) / minio_cluster_capacity_usable_total_bytes * 100 > 80",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("minio-bucket-usage-high")
    .name("MinIO Bucket Usage High")
    .description("MinIO bucket usage is high")
    .category(RuleCategory.MINIO, "capacity")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("minio_bucket_usage_total_bytes")
        .avg()
        .gt(1073741824000) // 1TB
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "minio", type: "bucket" })
    .annotations({
      summary: "MinIO bucket usage high (bucket {{ $labels.bucket }})",
      description: "MinIO bucket usage is > 1TB",
    })
    .promql("minio_bucket_usage_total_bytes > 1073741824000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== ZFS ======================
export const ZFSCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.ZFS,
    name: "ZFS",
    description: "Monitor ZFS filesystem metrics",
    icon: "simple-icons:openzfs",
    exporter: "zfs_exporter",
    documentationUrl: "https://github.com/pdf/zfs_exporter",
    ruleCount: 8,
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

export const ZFSRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("zfs-pool-degraded")
    .name("ZFS Pool Degraded")
    .description("ZFS pool is degraded")
    .category(RuleCategory.ZFS, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("zfs_pool_health")
        .last()
        .neq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "zfs", type: "health" })
    .annotations({
      summary: "ZFS pool degraded (pool {{ $labels.pool }})",
      description: "ZFS pool is degraded",
    })
    .promql("zfs_pool_health != 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("zfs-pool-full")
    .name("ZFS Pool Near Full")
    .description("ZFS pool is near full (> 80%)")
    .category(RuleCategory.ZFS, "capacity")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("zfs_pool_free_bytes")
        .avg()
        .lt(20)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "zfs", type: "capacity" })
    .annotations({
      summary: "ZFS pool near full (pool {{ $labels.pool }})",
      description: "ZFS pool is near full (> 80%)",
    })
    .promql("zfs_pool_free_bytes / zfs_pool_size_bytes * 100 < 20")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("zfs-pool-critical")
    .name("ZFS Pool Critical")
    .description("ZFS pool is critical (> 90%)")
    .category(RuleCategory.ZFS, "capacity")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("zfs_pool_free_bytes")
        .avg()
        .lt(10)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "zfs", type: "capacity" })
    .annotations({
      summary: "ZFS pool critical (pool {{ $labels.pool }})",
      description: "ZFS pool is critical (> 90%)",
    })
    .promql("zfs_pool_free_bytes / zfs_pool_size_bytes * 100 < 10")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("zfs-scrub-errors")
    .name("ZFS Scrub Errors")
    .description("ZFS scrub found errors")
    .category(RuleCategory.ZFS, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("zfs_pool_scrub_errors")
        .sum()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "zfs", type: "scrub" })
    .annotations({
      summary: "ZFS scrub errors (pool {{ $labels.pool }})",
      description: "ZFS scrub found {{ $value }} errors",
    })
    .promql("zfs_pool_scrub_errors > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// Update categories with rules
CephCategory.groups.forEach((group) => {
  group.rules = CephRules.filter((rule) => rule.subcategory === group.id);
});

MinioCategory.groups.forEach((group) => {
  group.rules = MinioRules.filter((rule) => rule.subcategory === group.id);
});

ZFSCategory.groups.forEach((group) => {
  group.rules = ZFSRules.filter((rule) => rule.subcategory === group.id);
});

// Combined export
export const StorageRules: AlertRuleTemplate[] = [
  ...CephRules,
  ...MinioRules,
  ...ZFSRules,
];

export const StorageCategories: AlertRuleCategory[] = [
  CephCategory,
  MinioCategory,
  ZFSCategory,
];
