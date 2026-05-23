/**
 * Kubernetes Alert Rules
 * Based on kube-state-metrics
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#kubernetes
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

/**
 * Kubernetes Category Metadata
 */
export const KubernetesCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.KUBERNETES,
    name: "Kubernetes",
    description:
      "Monitor Kubernetes cluster components, workloads, resources, and system health",
    icon: "logos:kubernetes",
    exporter: "kube-state-metrics",
    documentationUrl: "https://github.com/kubernetes/kube-state-metrics",
    ruleCount: 45,
  },
  groups: [
    {
      id: "cluster",
      name: "Cluster",
      description: "Cluster-wide alerts",
      rules: [],
    },
    {
      id: "nodes",
      name: "Nodes",
      description: "Node health and resource alerts",
      rules: [],
    },
    {
      id: "pods",
      name: "Pods",
      description: "Pod health and status alerts",
      rules: [],
    },
    {
      id: "deployments",
      name: "Deployments",
      description: "Deployment, StatefulSet, DaemonSet status alerts",
      rules: [],
    },
    {
      id: "resources",
      name: "Resources",
      description: "CPU/memory quotas and overcommit alerts",
      rules: [],
    },
    {
      id: "storage",
      name: "Storage",
      description: "PVC and storage alerts",
      rules: [],
    },
    {
      id: "jobs",
      name: "Jobs",
      description: "Job and CronJob alerts",
      rules: [],
    },
    {
      id: "system",
      name: "System",
      description: "Kubernetes system component alerts (kubelet, API server, scheduler)",
      rules: [],
    },
    {
      id: "absent",
      name: "Absent",
      description: "Alerts for missing Kubernetes control plane components",
      rules: [],
    },
  ],
};

/**
 * Kubernetes Alert Rules
 */
export const KubernetesRules: AlertRuleTemplate[] = [
  // ==================== CLUSTER ====================
  AlertRuleBuilder.create("kubernetes-node-not-ready")
    .name("Kubernetes Node Not Ready")
    .description("Node has been unready for a while")
    .category(RuleCategory.KUBERNETES, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kube_node_status_condition")
        .last()
        .eq(1)
        .duration(DefaultDurations.LONG)
        .label("condition", "Ready")
        .label("status", "false")
        .build(),
    )
    .labels({ component: "node", type: "health" })
    .annotations({
      summary: "Kubernetes Node not ready (node {{ $labels.node }})",
      description:
        "Node {{ $labels.node }} has been unready for more than 15 minutes",
    })
    .promql('kube_node_status_condition{condition="Ready",status="false"} == 1')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-memory-pressure")
    .name("Kubernetes Memory Pressure")
    .description("Node has memory pressure")
    .category(RuleCategory.KUBERNETES, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kube_node_status_condition")
        .last()
        .eq(1)
        .duration(DefaultDurations.MEDIUM)
        .label("condition", "MemoryPressure")
        .label("status", "true")
        .build(),
    )
    .labels({ component: "node", type: "pressure" })
    .annotations({
      summary: "Kubernetes memory pressure (node {{ $labels.node }})",
      description: "Node {{ $labels.node }} has MemoryPressure condition",
    })
    .promql(
      'kube_node_status_condition{condition="MemoryPressure",status="true"} == 1',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-disk-pressure")
    .name("Kubernetes Disk Pressure")
    .description("Node has disk pressure")
    .category(RuleCategory.KUBERNETES, "cluster")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kube_node_status_condition")
        .last()
        .eq(1)
        .duration(DefaultDurations.MEDIUM)
        .label("condition", "DiskPressure")
        .label("status", "true")
        .build(),
    )
    .labels({ component: "node", type: "pressure" })
    .annotations({
      summary: "Kubernetes disk pressure (node {{ $labels.node }})",
      description: "Node {{ $labels.node }} has DiskPressure condition",
    })
    .promql(
      'kube_node_status_condition{condition="DiskPressure",status="true"} == 1',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-out-of-capacity")
    .name("Kubernetes Out of Capacity")
    .description("Node is out of capacity for pods")
    .category(RuleCategory.KUBERNETES, "cluster")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_node_status_capacity")
        .avg()
        .lt(1)
        .duration(DefaultDurations.MEDIUM)
        .label("resource", "pods")
        .build(),
    )
    .labels({ component: "node", type: "capacity" })
    .annotations({
      summary: "Kubernetes out of capacity (node {{ $labels.node }})",
      description: "Node {{ $labels.node }} is out of capacity for pods",
    })
    .promql(
      'sum(kube_pod_info) by (node) / sum(kube_node_status_capacity{resource="pods"}) by (node) * 100 > 90',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== NODES ====================
  AlertRuleBuilder.create("kubernetes-node-readiness-flapping")
    .name("Kubernetes Node Readiness Flapping")
    .description("Node readiness status is flapping")
    .category(RuleCategory.KUBERNETES, "nodes")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_node_status_condition")
        .rate()
        .gt(2)
        .duration(DefaultDurations.LONG)
        .label("condition", "Ready")
        .build(),
    )
    .labels({ component: "node", type: "flapping" })
    .annotations({
      summary: "Kubernetes Node readiness flapping (node {{ $labels.node }})",
      description: "Node readiness status is flapping",
    })
    .promql(
      'sum(changes(kube_node_status_condition{condition="Ready",status="true"}[15m])) by (node) > 2',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== PODS ====================
  AlertRuleBuilder.create("kubernetes-pod-not-healthy")
    .name("Kubernetes Pod Not Healthy")
    .description("Pod has been in a non-ready state for longer than 15 minutes")
    .category(RuleCategory.KUBERNETES, "pods")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kube_pod_status_phase")
        .last()
        .eq(1)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "pod", type: "health" })
    .annotations({
      summary:
        "Kubernetes Pod not healthy ({{ $labels.namespace }}/{{ $labels.pod }})",
      description:
        "Pod has been in a non-ready state for longer than 15 minutes",
    })
    .promql(
      'sum by (namespace, pod) (kube_pod_status_phase{phase=~"Pending|Unknown|Failed"}) > 0',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-pod-crash-looping")
    .name("Kubernetes Pod Crash Looping")
    .description("Pod is crash looping")
    .category(RuleCategory.KUBERNETES, "pods")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_pod_container_status_restarts_total")
        .rate()
        .gt(3)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "pod", type: "crashloop" })
    .annotations({
      summary:
        "Kubernetes pod crash looping ({{ $labels.namespace }}/{{ $labels.pod }})",
      description:
        "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash looping",
    })
    .promql("increase(kube_pod_container_status_restarts_total[15m]) > 3")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-container-oom-killed")
    .name("Kubernetes Container OOM Killed")
    .description("Container has been OOM killed")
    .category(RuleCategory.KUBERNETES, "pods")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_pod_container_status_last_terminated_reason")
        .last()
        .eq(1)
        .duration(DefaultDurations.SHORT)
        .label("reason", "OOMKilled")
        .build(),
    )
    .labels({ component: "container", type: "oom" })
    .annotations({
      summary:
        "Kubernetes container OOM killed ({{ $labels.namespace }}/{{ $labels.pod }})",
      description: "Container was OOM killed",
    })
    .promql(
      'kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} == 1',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-pod-restart-too-frequently")
    .name("Kubernetes Pod Restart Too Frequently")
    .description("Pod is restarting more than 5 times in 30 minutes")
    .category(RuleCategory.KUBERNETES, "pods")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_pod_container_status_restarts_total")
        .rate()
        .gt(5)
        .duration(DefaultDurations.EXTENDED)
        .build(),
    )
    .labels({ component: "pod", type: "restart" })
    .annotations({
      summary:
        "Kubernetes Pod restart too frequently ({{ $labels.namespace }}/{{ $labels.pod }})",
      description: "Pod is restarting more than 5 times in 30 minutes",
    })
    .promql("increase(kube_pod_container_status_restarts_total[30m]) > 5")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-container-cpu-throttling-high")
    .name("Kubernetes Container CPU Throttling High")
    .description("Container is being throttled")
    .category(RuleCategory.KUBERNETES, "pods")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_cpu_cfs_throttled_periods_total")
        .rate()
        .gt(25)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "throttle" })
    .annotations({
      summary:
        "Kubernetes container CPU throttling high ({{ $labels.namespace }}/{{ $labels.pod }})",
      description: "Container is experiencing CPU throttling > 25%",
    })
    .promql(
      "sum(increase(container_cpu_cfs_throttled_periods_total[5m])) by (container, pod, namespace) / sum(increase(container_cpu_cfs_periods_total[5m])) by (container, pod, namespace) > 0.25",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== DEPLOYMENTS ====================
  AlertRuleBuilder.create("kubernetes-deployment-replica-mismatch")
    .name("Kubernetes Deployment Replica Mismatch")
    .description("Deployment replicas mismatch")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_deployment_spec_replicas")
        .last()
        .neq(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "deployment", type: "replicas" })
    .annotations({
      summary:
        "Kubernetes Deployment replica mismatch ({{ $labels.namespace }}/{{ $labels.deployment }})",
      description: "Deployment replicas mismatch",
    })
    .promql(
      "kube_deployment_spec_replicas != kube_deployment_status_replicas_available",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-deployment-generation-mismatch")
    .name("Kubernetes Deployment Generation Mismatch")
    .description("Deployment has failed but has not been rolled back")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kube_deployment_status_observed_generation")
        .last()
        .neq(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "deployment", type: "generation" })
    .annotations({
      summary:
        "Kubernetes Deployment generation mismatch ({{ $labels.namespace }}/{{ $labels.deployment }})",
      description: "A Deployment has failed but has not been rolled back",
    })
    .promql(
      "kube_deployment_status_observed_generation != kube_deployment_metadata_generation",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-statefulset-replica-mismatch")
    .name("Kubernetes StatefulSet Replica Mismatch")
    .description("StatefulSet replicas mismatch")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_statefulset_status_replicas")
        .last()
        .neq(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "statefulset", type: "replicas" })
    .annotations({
      summary:
        "Kubernetes StatefulSet replica mismatch ({{ $labels.namespace }}/{{ $labels.statefulset }})",
      description: "StatefulSet replicas mismatch",
    })
    .promql(
      "kube_statefulset_status_replicas_ready != kube_statefulset_status_replicas",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-daemonset-not-scheduled")
    .name("Kubernetes DaemonSet Not Scheduled")
    .description("DaemonSet pods are not scheduled")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_daemonset_status_desired_number_scheduled")
        .last()
        .neq(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "daemonset", type: "scheduling" })
    .annotations({
      summary:
        "Kubernetes DaemonSet not scheduled ({{ $labels.namespace }}/{{ $labels.daemonset }})",
      description: "DaemonSet pods are not scheduled",
    })
    .promql(
      "kube_daemonset_status_desired_number_scheduled - kube_daemonset_status_current_number_scheduled > 0",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-daemonset-misscheduled")
    .name("Kubernetes DaemonSet Misscheduled")
    .description("DaemonSet pods are mis-scheduled")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_daemonset_status_number_misscheduled")
        .last()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "daemonset", type: "scheduling" })
    .annotations({
      summary:
        "Kubernetes DaemonSet misscheduled ({{ $labels.namespace }}/{{ $labels.daemonset }})",
      description: "DaemonSet has misscheduled pods",
    })
    .promql("kube_daemonset_status_number_misscheduled > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-hpa-max-capacity")
    .name("Kubernetes HPA Max Capacity")
    .description("HPA is running at max replicas")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_horizontalpodautoscaler_status_current_replicas")
        .last()
        .gte(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "hpa", type: "capacity" })
    .annotations({
      summary:
        "Kubernetes HPA max capacity ({{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }})",
      description: "HPA is running at max replicas",
    })
    .promql(
      "kube_horizontalpodautoscaler_status_current_replicas == kube_horizontalpodautoscaler_spec_max_replicas",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== STORAGE ====================
  AlertRuleBuilder.create("kubernetes-pvc-pending")
    .name("Kubernetes PVC Pending")
    .description("PVC is pending for more than 5 minutes")
    .category(RuleCategory.KUBERNETES, "storage")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_persistentvolumeclaim_status_phase")
        .last()
        .eq(1)
        .duration(DefaultDurations.MEDIUM)
        .label("phase", "Pending")
        .build(),
    )
    .labels({ component: "pvc", type: "pending" })
    .annotations({
      summary:
        "Kubernetes PVC pending ({{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }})",
      description: "PVC is pending for more than 5 minutes",
    })
    .promql('kube_persistentvolumeclaim_status_phase{phase="Pending"} == 1')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-pv-warning")
    .name("Kubernetes PV Warning")
    .description("PersistentVolume is in warning state")
    .category(RuleCategory.KUBERNETES, "storage")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_persistentvolume_status_phase")
        .last()
        .eq(1)
        .duration(DefaultDurations.MEDIUM)
        .label("phase", "Failed")
        .build(),
    )
    .labels({ component: "pv", type: "status" })
    .annotations({
      summary: "Kubernetes PV warning ({{ $labels.persistentvolume }})",
      description: "PersistentVolume is in warning/failed state",
    })
    .promql('kube_persistentvolume_status_phase{phase=~"Failed|Pending"} == 1')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== JOBS ====================
  AlertRuleBuilder.create("kubernetes-job-failed")
    .name("Kubernetes Job Failed")
    .description("Job failed to complete")
    .category(RuleCategory.KUBERNETES, "jobs")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_job_status_failed")
        .last()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "job", type: "failed" })
    .annotations({
      summary:
        "Kubernetes Job failed ({{ $labels.namespace }}/{{ $labels.job_name }})",
      description: "Job failed to complete",
    })
    .promql("kube_job_status_failed > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-cronjob-suspended")
    .name("Kubernetes CronJob Suspended")
    .description("CronJob has been suspended")
    .category(RuleCategory.KUBERNETES, "jobs")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_cronjob_spec_suspend")
        .last()
        .eq(1)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "cronjob", type: "suspended" })
    .annotations({
      summary:
        "Kubernetes CronJob suspended ({{ $labels.namespace }}/{{ $labels.cronjob }})",
      description: "CronJob is suspended",
    })
    .promql("kube_cronjob_spec_suspend == 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("kubernetes-cronjob-too-long")
    .name("Kubernetes CronJob Running Too Long")
    .description("CronJob is running for more than 1 hour")
    .category(RuleCategory.KUBERNETES, "jobs")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_cronjob_next_schedule_time")
        .last()
        .lt(0)
        .duration(DefaultDurations.HOUR)
        .build(),
    )
    .labels({ component: "cronjob", type: "duration" })
    .annotations({
      summary:
        "Kubernetes CronJob running too long ({{ $labels.namespace }}/{{ $labels.cronjob }})",
      description: "CronJob is running for more than 1 hour",
    })
    .promql("time() - kube_cronjob_next_schedule_time > 3600")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== RESOURCES ====================
  AlertRuleBuilder.create("kubernetes-cpu-overcommit")
    .name("Kubernetes CPU Overcommit")
    .description("Cluster has overcommitted CPU resource requests and cannot tolerate node failure")
    .category(RuleCategory.KUBERNETES, "resources")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_pod_container_resource_requests")
        .sum()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .label("resource", "cpu")
        .build(),
    )
    .labels({ component: "cluster", type: "resource" })
    .annotations({
      summary: "Kubernetes cluster has overcommitted CPU resource requests",
      description: "Cluster has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate a node failure",
    })
    .promql('sum(namespace_cpu:kube_pod_container_resource_requests:sum{}) - sum(kube_node_status_allocatable{resource="cpu"}) > 0')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-memory-overcommit")
    .name("Kubernetes Memory Overcommit")
    .description("Cluster has overcommitted memory resource requests and cannot tolerate node failure")
    .category(RuleCategory.KUBERNETES, "resources")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_pod_container_resource_requests")
        .sum()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .label("resource", "memory")
        .build(),
    )
    .labels({ component: "cluster", type: "resource" })
    .annotations({
      summary: "Kubernetes cluster has overcommitted memory resource requests",
      description: "Cluster has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate a node failure",
    })
    .promql('sum(namespace_memory:kube_pod_container_resource_requests:sum{}) - sum(kube_node_status_allocatable{resource="memory"}) > 0')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-quota-almost-full")
    .name("Kubernetes Resource Quota Almost Full")
    .description("Resource quota utilization is approaching the limit")
    .category(RuleCategory.KUBERNETES, "resources")
    .severity("info")
    .condition(
      ConditionBuilder.create()
        .metric("kube_resourcequota")
        .last()
        .gt(90)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "namespace", type: "quota" })
    .annotations({
      summary: "Kubernetes ResourceQuota almost full ({{ $labels.namespace }}/{{ $labels.resourcequota }})",
      description: "Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} {{ $labels.type }} quota",
    })
    .promql("kube_resourcequota{job=\"kube-state-metrics\", type=\"used\"} / ignoring(instance, job, type) (kube_resourcequota{job=\"kube-state-metrics\", type=\"hard\"} > 0) > 0.9 < 1")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-quota-fully-used")
    .name("Kubernetes Resource Quota Fully Used")
    .description("Resource quota has been fully used")
    .category(RuleCategory.KUBERNETES, "resources")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_resourcequota")
        .last()
        .gte(100)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "namespace", type: "quota" })
    .annotations({
      summary: "Kubernetes ResourceQuota is fully used ({{ $labels.namespace }}/{{ $labels.resourcequota }})",
      description: "Namespace {{ $labels.namespace }} is using 100% of its {{ $labels.resource }} {{ $labels.type }} quota",
    })
    .promql("kube_resourcequota{job=\"kube-state-metrics\", type=\"used\"} / ignoring(instance, job, type) (kube_resourcequota{job=\"kube-state-metrics\", type=\"hard\"} > 0) == 1")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-container-waiting")
    .name("Kubernetes Container Waiting")
    .description("Container is in waiting state for too long")
    .category(RuleCategory.KUBERNETES, "pods")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_pod_container_status_waiting_reason")
        .last()
        .gt(0)
        .duration(DefaultDurations.HOUR)
        .build(),
    )
    .labels({ component: "container", type: "waiting" })
    .annotations({
      summary: "Kubernetes container waiting ({{ $labels.namespace }}/{{ $labels.pod }})",
      description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} container {{ $labels.container }} has been in waiting state for longer than 1 hour",
    })
    .promql("sum by (namespace, pod, container) (kube_pod_container_status_waiting_reason{job=\"kube-state-metrics\", reason!=\"ContainerCreating\"}) > 0")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-deployment-rollout-stuck")
    .name("Kubernetes Deployment Rollout Stuck")
    .description("Kubernetes Deployment rollout is stuck")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_deployment_status_condition")
        .last()
        .neq(1)
        .duration(DefaultDurations.LONG)
        .label("condition", "Progressing")
        .label("status", "false")
        .build(),
    )
    .labels({ component: "deployment", type: "rollout" })
    .annotations({
      summary: "Kubernetes Deployment rollout is stuck ({{ $labels.namespace }}/{{ $labels.deployment }})",
      description: "Rollout of deployment {{ $labels.namespace }}/{{ $labels.deployment }} is not progressing for longer than 15 minutes",
    })
    .promql("kube_deployment_status_condition{condition=\"Progressing\", status=\"false\", job=\"kube-state-metrics\"}")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-statefulset-generation-mismatch")
    .name("Kubernetes StatefulSet Generation Mismatch")
    .description("StatefulSet has failed but has not been rolled back")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_statefulset_status_observed_generation")
        .last()
        .neq(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "statefulset", type: "generation" })
    .annotations({
      summary: "Kubernetes StatefulSet generation mismatch ({{ $labels.namespace }}/{{ $labels.statefulset }})",
      description: "StatefulSet generation for {{ $labels.namespace }}/{{ $labels.statefulset }} does not match — this indicates a failed rollback or an ongoing rollout",
    })
    .promql("kube_statefulset_status_observed_generation != kube_statefulset_metadata_generation")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-statefulset-update-not-rolled-out")
    .name("Kubernetes StatefulSet Update Not Rolled Out")
    .description("StatefulSet update has not been rolled out")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_statefulset_status_current_revision")
        .last()
        .neq(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "statefulset", type: "update" })
    .annotations({
      summary: "Kubernetes StatefulSet update not rolled out ({{ $labels.namespace }}/{{ $labels.statefulset }})",
      description: "StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} update has not been rolled out — {{ $value }} pods have not been updated",
    })
    .promql("(max without (revision) (kube_statefulset_status_current_revision unless kube_statefulset_status_update_revision) * (kube_statefulset_replicas != kube_statefulset_status_replicas_updated)) > 0")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-daemonset-rollout-stuck")
    .name("Kubernetes DaemonSet Rollout Stuck")
    .description("Only some Pods of a DaemonSet are scheduled and ready")
    .category(RuleCategory.KUBERNETES, "deployments")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kube_daemonset_status_updated_number_scheduled")
        .last()
        .lt(0)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "daemonset", type: "rollout" })
    .annotations({
      summary: "Kubernetes DaemonSet rollout is stuck ({{ $labels.namespace }}/{{ $labels.daemonset }})",
      description: "Only {{ $value | humanizePercentage }} of the desired Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are scheduled and ready",
    })
    .promql("kube_daemonset_status_number_ready / kube_daemonset_status_desired_number_scheduled * 100 < 100 or kube_daemonset_status_desired_number_scheduled - kube_daemonset_status_updated_number_scheduled > 0")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-pv-filling-up")
    .name("Kubernetes PersistentVolume Filling Up")
    .description("PersistentVolume is filling up and will run out of space within 4 days")
    .category(RuleCategory.KUBERNETES, "storage")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kubelet_volume_stats_available_bytes")
        .last()
        .lt(20)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "pv", type: "capacity" })
    .annotations({
      summary: "Kubernetes PersistentVolume is filling up ({{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }})",
      description: "Based on recent sampling, PV {{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }} is expected to fill up within 4 days ({{ $value | humanizePercentage }} used)",
    })
    .promql("(kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes) < 0.2 and predict_linear(kubelet_volume_stats_available_bytes[6h], 4 * 24 * 3600) < 0")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-pv-filling-up-critical")
    .name("Kubernetes PersistentVolume Filling Up Critical")
    .description("PersistentVolume is filling up and will run out of space in less than 24 hours")
    .category(RuleCategory.KUBERNETES, "storage")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("kubelet_volume_stats_available_bytes")
        .last()
        .lt(3)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "pv", type: "capacity" })
    .annotations({
      summary: "Kubernetes PersistentVolume is critically full ({{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }})",
      description: "Based on recent sampling, PV {{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }} is expected to fill up within 24 hours ({{ $value | humanizePercentage }} used)",
    })
    .promql("(kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes) < 0.03 and predict_linear(kubelet_volume_stats_available_bytes[6h], 24 * 3600) < 0")
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  // ==================== SYSTEM ====================
  AlertRuleBuilder.create("kubernetes-kubelet-too-many-pods")
    .name("Kubernetes Kubelet Too Many Pods")
    .description("Kubelet is running at capacity and close to the pod limit")
    .category(RuleCategory.KUBERNETES, "system")
    .severity("info")
    .condition(
      ConditionBuilder.create()
        .metric("kubelet_running_pods")
        .last()
        .gt(90)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "kubelet", type: "capacity" })
    .annotations({
      summary: "Kubelet is running at capacity (instance {{ $labels.instance }})",
      description: "Kubelet {{ $labels.node }} is running {{ $value }} Pods, close to the limit of {{ $labels.capacity }}",
    })
    .promql('max(max(kubelet_running_pods{job="kubelet", metrics_path="/metrics"}) by(instance) * on(instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"}) by(node) / max(kube_node_status_capacity{job="kube-state-metrics",resource="pods"}) by(node) * 100 > 95')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-api-error-budget-burn-rate-high")
    .name("Kubernetes API Server Error Budget Burn Rate High")
    .description("API server is burning through its error budget at a high rate")
    .category(RuleCategory.KUBERNETES, "system")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("apiserver_request_total")
        .rate()
        .gt(14.4)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "apiserver", type: "slo" })
    .annotations({
      summary: "Kubernetes API server is burning too much error budget",
      description: "At current burn rate, the API server SLO error budget will be exhausted in {{ $value | humanizeDuration }}",
    })
    .promql('sum(rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[5m])) / sum(rate(apiserver_request_total{job="apiserver"}[5m])) > 0.1')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-version-mismatch")
    .name("Kubernetes Version Mismatch")
    .description("Different semantic versions of Kubernetes components running")
    .category(RuleCategory.KUBERNETES, "system")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("kubernetes_build_info")
        .count()
        .gt(1)
        .duration(DefaultDurations.HOUR)
        .build(),
    )
    .labels({ component: "cluster", type: "version" })
    .annotations({
      summary: "Different semantic versions of Kubernetes components running",
      description: "There are {{ $value }} different semantic versions of Kubernetes components running",
    })
    .promql('count(count by (git_version) (label_replace(kubernetes_build_info{job!~"kube-dns|coredns"}, "git_version", "$1", "git_version", "(v[0-9]*.[0-9]*).*"))) > 1')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-client-errors-high")
    .name("Kubernetes Client Errors High")
    .description("Kubernetes API client is experiencing high error rate")
    .category(RuleCategory.KUBERNETES, "system")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rest_client_requests_total")
        .rate()
        .gt(0.01)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "client", type: "errors" })
    .annotations({
      summary: "Kubernetes API client errors are high ({{ $labels.namespace }}/{{ $labels.pod }})",
      description: "Kubernetes API server client {{ $labels.job }}/{{ $labels.instance }} is experiencing {{ $value | humanizePercentage }} errors",
    })
    .promql('(sum(rate(rest_client_requests_total{code=~"5.."}[5m])) by (instance, job, namespace, pod) / sum(rate(rest_client_requests_total[5m])) by (instance, job, namespace, pod)) > 0.01')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  // ==================== ABSENT ====================
  AlertRuleBuilder.create("kubernetes-api-server-down")
    .name("Kubernetes API Server Down")
    .description("KubeAPI has disappeared from Prometheus target discovery")
    .category(RuleCategory.KUBERNETES, "absent")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("up")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .label("job", "apiserver")
        .build(),
    )
    .labels({ component: "apiserver", type: "absent" })
    .annotations({
      summary: "Target disappeared from Prometheus target discovery",
      description: "KubeAPI has disappeared from Prometheus target discovery",
    })
    .promql('absent(up{job="apiserver"} == 1)')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-controller-manager-down")
    .name("Kubernetes Controller Manager Down")
    .description("KubeControllerManager has disappeared from Prometheus target discovery")
    .category(RuleCategory.KUBERNETES, "absent")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("up")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .label("job", "kube-controller-manager")
        .build(),
    )
    .labels({ component: "controller-manager", type: "absent" })
    .annotations({
      summary: "Target disappeared from Prometheus target discovery",
      description: "KubeControllerManager has disappeared from Prometheus target discovery",
    })
    .promql('absent(up{job="kube-controller-manager"} == 1)')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-scheduler-down")
    .name("Kubernetes Scheduler Down")
    .description("KubeScheduler has disappeared from Prometheus target discovery")
    .category(RuleCategory.KUBERNETES, "absent")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("up")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .label("job", "kube-scheduler")
        .build(),
    )
    .labels({ component: "scheduler", type: "absent" })
    .annotations({
      summary: "Target disappeared from Prometheus target discovery",
      description: "KubeScheduler has disappeared from Prometheus target discovery",
    })
    .promql('absent(up{job="kube-scheduler"} == 1)')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-kubelet-down")
    .name("Kubernetes Kubelet Down")
    .description("Kubelet has disappeared from Prometheus target discovery")
    .category(RuleCategory.KUBERNETES, "absent")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("up")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .label("job", "kubelet")
        .build(),
    )
    .labels({ component: "kubelet", type: "absent" })
    .annotations({
      summary: "Target disappeared from Prometheus target discovery",
      description: "Kubelet has disappeared from Prometheus target discovery",
    })
    .promql('absent(up{job="kubelet",metrics_path="/metrics"} == 1)')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),

  AlertRuleBuilder.create("kubernetes-proxy-down")
    .name("Kubernetes Proxy Down")
    .description("KubeProxy has disappeared from Prometheus target discovery")
    .category(RuleCategory.KUBERNETES, "absent")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("up")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .label("job", "kube-proxy")
        .build(),
    )
    .labels({ component: "proxy", type: "absent" })
    .annotations({
      summary: "Target disappeared from Prometheus target discovery",
      description: "KubeProxy has disappeared from Prometheus target discovery",
    })
    .promql('absent(up{job="kube-proxy"} == 1)')
    .source("kube-prometheus-stack", "https://github.com/prometheus-operator/kube-prometheus")
    .build(),
];

// Update category with rules
KubernetesCategory.groups.forEach((group) => {
  group.rules = KubernetesRules.filter((rule) => rule.subcategory === group.id);
});
