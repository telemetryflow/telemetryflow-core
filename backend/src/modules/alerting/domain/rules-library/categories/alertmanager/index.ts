/**
 * Alertmanager Alert Rules
 * Based on kube-prometheus-stack alertmanager.rules
 * @see https://github.com/prometheus-operator/kube-prometheus
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

export const AlertmanagerCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.ALERTMANAGER,
    name: "Alertmanager",
    description:
      "Monitor Prometheus Alertmanager cluster health and operations",
    icon: "logos:prometheus",
    exporter: "alertmanager",
    documentationUrl:
      "https://prometheus.io/docs/alerting/latest/alertmanager/",
    ruleCount: 9,
  },
  groups: [
    {
      id: "health",
      name: "Health",
      description: "Alertmanager instance health",
      rules: [],
    },
    {
      id: "cluster",
      name: "Cluster",
      description: "Alertmanager cluster consistency",
      rules: [],
    },
    {
      id: "notifications",
      name: "Notifications",
      description: "Alert delivery and routing",
      rules: [],
    },
  ],
};

export const AlertmanagerRules: AlertRuleTemplate[] = [
  // ==================== HEALTH ====================
  AlertRuleBuilder.create("alertmanager-failed-reload")
    .name("Alertmanager Failed Reload")
    .description("Reloading Alertmanager configuration has failed")
    .category(RuleCategory.ALERTMANAGER, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("alertmanager_config_last_reload_successful")
        .last()
        .eq(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "alertmanager", type: "config" })
    .annotations({
      summary:
        "Alertmanager configuration reload has failed (instance {{ $labels.instance }})",
      description:
        "Reloading Alertmanager's configuration has failed for {{ $labels.namespace }}/{{ $labels.pod }}",
    })
    .promql(
      '# Without rerating:\nalerting for alertmanager_config_last_reload_successful == 0\n# kube-prometheus-stack:\nalerting for max_over_time(alertmanager_config_last_reload_successful{job="alertmanager-main",namespace="monitoring"}[5m]) == 0',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  AlertRuleBuilder.create("alertmanager-config-inconsistent")
    .name("Alertmanager Config Inconsistent")
    .description(
      "Alertmanager configuration is not matching across all instances in the cluster",
    )
    .category(RuleCategory.ALERTMANAGER, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("alertmanager_config_hash")
        .last()
        .neq(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "alertmanager", type: "config" })
    .annotations({
      summary:
        "Alertmanager instances have different configurations (instance {{ $labels.instance }})",
      description:
        "Alertmanager instances within the {{ $labels.namespace }}/{{ $labels.service }} cluster have different configurations",
    })
    .promql(
      'count by (namespace,service) (count_values by (namespace,service) ("config_hash", alertmanager_config_hash{job="alertmanager-main",namespace="monitoring"})) != 1',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  AlertRuleBuilder.create("alertmanager-cluster-down")
    .name("Alertmanager Cluster Down")
    .description(
      "Half or more of the Alertmanager instances within the same cluster are down",
    )
    .category(RuleCategory.ALERTMANAGER, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("alertmanager_cluster_members")
        .last()
        .lt(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "alertmanager", type: "availability" })
    .annotations({
      summary:
        "Half or more of the Alertmanager instances within the same cluster are down",
      description:
        "{{ $value | humanizePercentage }} of Alertmanager instances within the {{ $labels.namespace }}/{{ $labels.service }} cluster are down",
    })
    .promql(
      '(count by (namespace,service,cluster) (alertmanager_cluster_members{job="alertmanager-main",namespace="monitoring"}) < on (namespace,service,cluster) (count by (namespace,service,cluster) (up{job="alertmanager-main",namespace="monitoring"}) / 2 + 1))',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  AlertRuleBuilder.create("alertmanager-members-inconsistent")
    .name("Alertmanager Members Inconsistent")
    .description("Alertmanager has not found all other members of the cluster")
    .category(RuleCategory.ALERTMANAGER, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("alertmanager_cluster_members")
        .last()
        .lt(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "alertmanager", type: "cluster" })
    .annotations({
      summary:
        "Alertmanager has not found all other cluster members (instance {{ $labels.instance }})",
      description:
        "Alertmanager {{ $labels.namespace }}/{{ $labels.pod }} has only found {{ $value }} members of the {{ $labels.job }} cluster",
    })
    .promql(
      'alertmanager_cluster_members{job="alertmanager-main",namespace="monitoring"} < on (namespace,service,cluster) group_left() count by (namespace,service,cluster) (alertmanager_cluster_members{job="alertmanager-main",namespace="monitoring"})',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  AlertRuleBuilder.create("alertmanager-cluster-crashlooping")
    .name("Alertmanager Cluster Crashlooping")
    .description(
      "At least half of all Alertmanager instances within the same cluster are crashlooping",
    )
    .category(RuleCategory.ALERTMANAGER, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("alertmanager_config_last_reload_successful")
        .rate()
        .lt(0)
        .duration(DefaultDurations.EXTENDED)
        .build(),
    )
    .labels({ component: "alertmanager", type: "crashloop" })
    .annotations({
      summary:
        "At least half of all Alertmanager instances within the same cluster are crashlooping",
      description:
        "{{ $value | humanizePercentage }} of Alertmanager instances within the {{ $labels.namespace }}/{{ $labels.service }} cluster have restarted at least 5 times in the last 10m",
    })
    .promql(
      '(count by (namespace,service,cluster) (changes(alertmanager_config_last_reload_successful{job="alertmanager-main",namespace="monitoring"}[(10m)]) > 4) > on (namespace,service,cluster) (count by (namespace,service,cluster) (up{job="alertmanager-main",namespace="monitoring"}) / 2 + 1))',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  // ==================== NOTIFICATIONS ====================
  AlertRuleBuilder.create("alertmanager-failed-to-send-alerts")
    .name("Alertmanager Failed to Send Alerts")
    .description(
      "An Alertmanager instance failed to send notifications to a non-critical integration",
    )
    .category(RuleCategory.ALERTMANAGER, "notifications")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("alertmanager_notifications_failed_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "alertmanager", type: "notification" })
    .annotations({
      summary:
        "An Alertmanager instance failed to send notifications to a non-critical integration (instance {{ $labels.instance }})",
      description:
        "Alertmanager {{ $labels.namespace }}/{{ $labels.pod }} failed to send {{ $value | humanizePercentage }} of notifications to {{ $labels.integration }}",
    })
    .promql(
      'rate(alertmanager_notifications_failed_total{job="alertmanager-main",namespace="monitoring"}[5m]) / rate(alertmanager_notifications_total{job="alertmanager-main",namespace="monitoring"}[5m]) > 0.01',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  AlertRuleBuilder.create("alertmanager-cluster-failed-to-send-alerts")
    .name("Alertmanager Cluster Failed to Send Alerts")
    .description(
      "All Alertmanager instances in a cluster failed to send notifications to a critical integration",
    )
    .category(RuleCategory.ALERTMANAGER, "notifications")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("alertmanager_notifications_failed_total")
        .rate()
        .gt(0.01)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "alertmanager", type: "notification" })
    .annotations({
      summary:
        "All Alertmanager instances in a cluster failed to send notifications to a critical integration (instance {{ $labels.instance }})",
      description:
        "The minimum notification failure rate to {{ $labels.integration }} sent from any instance in the {{ $labels.namespace }}/{{ $labels.service }} cluster is {{ $value | humanizePercentage }}",
    })
    .promql(
      'min by (namespace,service,integration) (rate(alertmanager_notifications_failed_total{job="alertmanager-main",namespace="monitoring",integration=~".*"}[5m]) / rate(alertmanager_notifications_total{job="alertmanager-main",namespace="monitoring",integration=~".*"}[5m])) > 0.01',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  AlertRuleBuilder.create("alertmanager-notification-latency-high")
    .name("Alertmanager Notification Latency High")
    .description("Alertmanager notification sending is taking too long")
    .category(RuleCategory.ALERTMANAGER, "notifications")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("alertmanager_notification_latency_seconds_bucket")
        .avg()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "alertmanager", type: "latency" })
    .annotations({
      summary:
        "Alertmanager notification latency is high (instance {{ $labels.instance }})",
      description:
        "Alertmanager {{ $labels.namespace }}/{{ $labels.pod }} takes {{ $value | humanizeDuration }} to send notifications",
    })
    .promql(
      'histogram_quantile(0.99, sum by (namespace,service,le) (rate(alertmanager_notification_latency_seconds_bucket{job="alertmanager-main",namespace="monitoring"}[5m]))) > 1',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  AlertRuleBuilder.create("config-reloader-errors")
    .name("Config Reloader Sidecar Errors")
    .description(
      "Errors encountered while the config-reloader sidecar attempts to sync config in agent-based pods",
    )
    .category(RuleCategory.ALERTMANAGER, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("reloader_last_reload_successful")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "config-reloader", type: "reload" })
    .annotations({
      summary:
        "Config reloader sidecar has not reconciled due to errors (instance {{ $labels.instance }})",
      description:
        "Errors encountered while the config-reloader sidecar attempts to sync config for {{ $labels.namespace }}/{{ $labels.pod }}",
    })
    .promql(
      'max_over_time(reloader_last_reload_successful{namespace=~".+"}[5m]) == 0',
    )
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),
];

// Update category with rules
AlertmanagerCategory.groups.forEach((group) => {
  group.rules = AlertmanagerRules.filter(
    (rule) => rule.subcategory === group.id,
  );
});
