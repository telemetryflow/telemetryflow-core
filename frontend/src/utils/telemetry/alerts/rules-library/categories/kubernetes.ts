/**
 * Kubernetes Alert Rules
 * Based on kube-state-metrics
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import { RuleCategory, DefaultDurations, DefaultIntervals } from "../types";

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
      description:
        "Kubernetes system component alerts (kubelet, API server, scheduler)",
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

export const KubernetesRules: AlertRuleTemplate[] = [
  // Cluster
  {
    id: "kubernetes-node-not-ready",
    name: "Kubernetes Node Not Ready",
    description: "Node has been unready for a while",
    category: RuleCategory.KUBERNETES,
    subcategory: "cluster",
    severity: "critical",
    conditions: [
      {
        metric: "kube_node_status_condition",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "15m",
        labels: { condition: "Ready", status: "false" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "node", type: "health" },
    annotations: {
      summary: "Kubernetes Node not ready (node {{ $labels.node }})",
    },
    promql: 'kube_node_status_condition{condition="Ready",status="false"} == 1',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kubernetes-memory-pressure",
    name: "Kubernetes Memory Pressure",
    description: "Node has memory pressure",
    category: RuleCategory.KUBERNETES,
    subcategory: "cluster",
    severity: "critical",
    conditions: [
      {
        metric: "kube_node_status_condition",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "5m",
        labels: { condition: "MemoryPressure", status: "true" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "node", type: "pressure" },
    annotations: {
      summary: "Kubernetes memory pressure (node {{ $labels.node }})",
    },
    promql:
      'kube_node_status_condition{condition="MemoryPressure",status="true"} == 1',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kubernetes-disk-pressure",
    name: "Kubernetes Disk Pressure",
    description: "Node has disk pressure",
    category: RuleCategory.KUBERNETES,
    subcategory: "cluster",
    severity: "critical",
    conditions: [
      {
        metric: "kube_node_status_condition",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "5m",
        labels: { condition: "DiskPressure", status: "true" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "node", type: "pressure" },
    annotations: {
      summary: "Kubernetes disk pressure (node {{ $labels.node }})",
    },
    promql:
      'kube_node_status_condition{condition="DiskPressure",status="true"} == 1',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // Pods
  {
    id: "kubernetes-pod-not-healthy",
    name: "Kubernetes Pod Not Healthy",
    description: "Pod has been in a non-ready state for longer than 15 minutes",
    category: RuleCategory.KUBERNETES,
    subcategory: "pods",
    severity: "critical",
    conditions: [
      {
        metric: "kube_pod_status_phase",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "15m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "pod", type: "health" },
    annotations: {
      summary:
        "Kubernetes Pod not healthy ({{ $labels.namespace }}/{{ $labels.pod }})",
    },
    promql:
      'sum by (namespace, pod) (kube_pod_status_phase{phase=~"Pending|Unknown|Failed"}) > 0',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kubernetes-pod-crash-looping",
    name: "Kubernetes Pod Crash Looping",
    description: "Pod is crash looping",
    category: RuleCategory.KUBERNETES,
    subcategory: "pods",
    severity: "warning",
    conditions: [
      {
        metric: "kube_pod_container_status_restarts_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 3,
        duration: "15m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "pod", type: "crashloop" },
    annotations: {
      summary:
        "Kubernetes pod crash looping ({{ $labels.namespace }}/{{ $labels.pod }})",
    },
    promql: "increase(kube_pod_container_status_restarts_total[15m]) > 3",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kubernetes-container-oom-killed",
    name: "Kubernetes Container OOM Killed",
    description: "Container has been OOM killed",
    category: RuleCategory.KUBERNETES,
    subcategory: "pods",
    severity: "warning",
    conditions: [
      {
        metric: "kube_pod_container_status_last_terminated_reason",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "1m",
        labels: { reason: "OOMKilled" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "container", type: "oom" },
    annotations: {
      summary:
        "Kubernetes container OOM killed ({{ $labels.namespace }}/{{ $labels.pod }})",
    },
    promql:
      'kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} == 1',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // Deployments
  {
    id: "kubernetes-deployment-replica-mismatch",
    name: "Kubernetes Deployment Replica Mismatch",
    description: "Deployment replicas mismatch",
    category: RuleCategory.KUBERNETES,
    subcategory: "deployments",
    severity: "warning",
    conditions: [
      {
        metric: "kube_deployment_spec_replicas",
        aggregation: "last",
        operator: "neq",
        threshold: 0,
        duration: "15m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "deployment", type: "replicas" },
    annotations: {
      summary:
        "Kubernetes Deployment replica mismatch ({{ $labels.namespace }}/{{ $labels.deployment }})",
    },
    promql:
      "kube_deployment_spec_replicas != kube_deployment_status_replicas_available",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kubernetes-statefulset-replica-mismatch",
    name: "Kubernetes StatefulSet Replica Mismatch",
    description: "StatefulSet replicas mismatch",
    category: RuleCategory.KUBERNETES,
    subcategory: "deployments",
    severity: "warning",
    conditions: [
      {
        metric: "kube_statefulset_status_replicas",
        aggregation: "last",
        operator: "neq",
        threshold: 0,
        duration: "15m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "statefulset", type: "replicas" },
    annotations: {
      summary:
        "Kubernetes StatefulSet replica mismatch ({{ $labels.namespace }}/{{ $labels.statefulset }})",
    },
    promql:
      "kube_statefulset_status_replicas_ready != kube_statefulset_status_replicas",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kubernetes-hpa-max-capacity",
    name: "Kubernetes HPA Max Capacity",
    description: "HPA is running at max replicas",
    category: RuleCategory.KUBERNETES,
    subcategory: "deployments",
    severity: "warning",
    conditions: [
      {
        metric: "kube_horizontalpodautoscaler_status_current_replicas",
        aggregation: "last",
        operator: "gte",
        threshold: 0,
        duration: "15m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "hpa", type: "capacity" },
    annotations: {
      summary:
        "Kubernetes HPA max capacity ({{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler }})",
    },
    promql:
      "kube_horizontalpodautoscaler_status_current_replicas == kube_horizontalpodautoscaler_spec_max_replicas",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // Storage
  {
    id: "kubernetes-pvc-pending",
    name: "Kubernetes PVC Pending",
    description: "PVC is pending for more than 5 minutes",
    category: RuleCategory.KUBERNETES,
    subcategory: "storage",
    severity: "warning",
    conditions: [
      {
        metric: "kube_persistentvolumeclaim_status_phase",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "5m",
        labels: { phase: "Pending" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "pvc", type: "pending" },
    annotations: {
      summary:
        "Kubernetes PVC pending ({{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }})",
    },
    promql: 'kube_persistentvolumeclaim_status_phase{phase="Pending"} == 1',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // Jobs
  {
    id: "kubernetes-job-failed",
    name: "Kubernetes Job Failed",
    description: "Job failed to complete",
    category: RuleCategory.KUBERNETES,
    subcategory: "jobs",
    severity: "warning",
    conditions: [
      {
        metric: "kube_job_status_failed",
        aggregation: "last",
        operator: "gt",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "job", type: "failed" },
    annotations: {
      summary:
        "Kubernetes Job failed ({{ $labels.namespace }}/{{ $labels.job_name }})",
    },
    promql: "kube_job_status_failed > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "kubernetes-cronjob-suspended",
    name: "Kubernetes CronJob Suspended",
    description: "CronJob has been suspended",
    category: RuleCategory.KUBERNETES,
    subcategory: "jobs",
    severity: "warning",
    conditions: [
      {
        metric: "kube_cronjob_spec_suspend",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "cronjob", type: "suspended" },
    annotations: {
      summary:
        "Kubernetes CronJob suspended ({{ $labels.namespace }}/{{ $labels.cronjob }})",
    },
    promql: "kube_cronjob_spec_suspend == 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Resources
  {
    id: "kubernetes-cpu-overcommit",
    name: "Kubernetes CPU Overcommit",
    description:
      "Cluster has overcommitted CPU resource requests and cannot tolerate node failure",
    category: RuleCategory.KUBERNETES,
    subcategory: "resources",
    severity: "warning",
    conditions: [
      {
        metric: "kube_pod_container_resource_requests",
        aggregation: "sum",
        operator: "gt",
        threshold: 0,
        duration: "5m",
        labels: { resource: "cpu" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "cluster", type: "resource" },
    annotations: {
      summary: "Kubernetes cluster has overcommitted CPU resource requests",
    },
    promql:
      'sum(namespace_cpu:kube_pod_container_resource_requests:sum{}) - sum(kube_node_status_allocatable{resource="cpu"}) > 0',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-memory-overcommit",
    name: "Kubernetes Memory Overcommit",
    description:
      "Cluster has overcommitted memory resource requests and cannot tolerate node failure",
    category: RuleCategory.KUBERNETES,
    subcategory: "resources",
    severity: "warning",
    conditions: [
      {
        metric: "kube_pod_container_resource_requests",
        aggregation: "sum",
        operator: "gt",
        threshold: 0,
        duration: "5m",
        labels: { resource: "memory" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "cluster", type: "resource" },
    annotations: {
      summary: "Kubernetes cluster has overcommitted memory resource requests",
    },
    promql:
      'sum(namespace_memory:kube_pod_container_resource_requests:sum{}) - sum(kube_node_status_allocatable{resource="memory"}) > 0',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-quota-almost-full",
    name: "Kubernetes Resource Quota Almost Full",
    description: "Resource quota utilization is approaching the limit",
    category: RuleCategory.KUBERNETES,
    subcategory: "resources",
    severity: "info",
    conditions: [
      {
        metric: "kube_resourcequota",
        aggregation: "last",
        operator: "gt",
        threshold: 90,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "namespace", type: "quota" },
    annotations: {
      summary:
        "Kubernetes ResourceQuota almost full ({{ $labels.namespace }}/{{ $labels.resourcequota }})",
    },
    promql:
      'kube_resourcequota{job="kube-state-metrics", type="used"} / ignoring(instance, job, type) (kube_resourcequota{job="kube-state-metrics", type="hard"} > 0) > 0.9 < 1',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-quota-fully-used",
    name: "Kubernetes Resource Quota Fully Used",
    description: "Resource quota has been fully used",
    category: RuleCategory.KUBERNETES,
    subcategory: "resources",
    severity: "warning",
    conditions: [
      {
        metric: "kube_resourcequota",
        aggregation: "last",
        operator: "gte",
        threshold: 100,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "namespace", type: "quota" },
    annotations: {
      summary:
        "Kubernetes ResourceQuota is fully used ({{ $labels.namespace }}/{{ $labels.resourcequota }})",
    },
    promql:
      'kube_resourcequota{job="kube-state-metrics", type="used"} / ignoring(instance, job, type) (kube_resourcequota{job="kube-state-metrics", type="hard"} > 0) == 1',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  // Additional Pod rules
  {
    id: "kubernetes-container-waiting",
    name: "Kubernetes Container Waiting",
    description: "Container is in waiting state for too long",
    category: RuleCategory.KUBERNETES,
    subcategory: "pods",
    severity: "warning",
    conditions: [
      {
        metric: "kube_pod_container_status_waiting_reason",
        aggregation: "last",
        operator: "gt",
        threshold: 0,
        duration: DefaultDurations.HOUR,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.HOUR,
    labels: { component: "container", type: "waiting" },
    annotations: {
      summary:
        "Kubernetes container waiting ({{ $labels.namespace }}/{{ $labels.pod }})",
    },
    promql:
      'sum by (namespace, pod, container) (kube_pod_container_status_waiting_reason{job="kube-state-metrics", reason!="ContainerCreating"}) > 0',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  // Additional Deployment rules
  {
    id: "kubernetes-deployment-rollout-stuck",
    name: "Kubernetes Deployment Rollout Stuck",
    description: "Kubernetes Deployment rollout is stuck",
    category: RuleCategory.KUBERNETES,
    subcategory: "deployments",
    severity: "warning",
    conditions: [
      {
        metric: "kube_deployment_status_condition",
        aggregation: "last",
        operator: "neq",
        threshold: 1,
        duration: DefaultDurations.LONG,
        labels: { condition: "Progressing", status: "false" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "deployment", type: "rollout" },
    annotations: {
      summary:
        "Kubernetes Deployment rollout is stuck ({{ $labels.namespace }}/{{ $labels.deployment }})",
    },
    promql:
      'kube_deployment_status_condition{condition="Progressing", status="false", job="kube-state-metrics"}',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-statefulset-generation-mismatch",
    name: "Kubernetes StatefulSet Generation Mismatch",
    description: "StatefulSet has failed but has not been rolled back",
    category: RuleCategory.KUBERNETES,
    subcategory: "deployments",
    severity: "warning",
    conditions: [
      {
        metric: "kube_statefulset_status_observed_generation",
        aggregation: "last",
        operator: "neq",
        threshold: 0,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "statefulset", type: "generation" },
    annotations: {
      summary:
        "Kubernetes StatefulSet generation mismatch ({{ $labels.namespace }}/{{ $labels.statefulset }})",
    },
    promql:
      "kube_statefulset_status_observed_generation != kube_statefulset_metadata_generation",
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-statefulset-update-not-rolled-out",
    name: "Kubernetes StatefulSet Update Not Rolled Out",
    description: "StatefulSet update has not been rolled out",
    category: RuleCategory.KUBERNETES,
    subcategory: "deployments",
    severity: "warning",
    conditions: [
      {
        metric: "kube_statefulset_status_current_revision",
        aggregation: "last",
        operator: "neq",
        threshold: 0,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "statefulset", type: "update" },
    annotations: {
      summary:
        "Kubernetes StatefulSet update not rolled out ({{ $labels.namespace }}/{{ $labels.statefulset }})",
    },
    promql:
      "(max without (revision) (kube_statefulset_status_current_revision unless kube_statefulset_status_update_revision) * (kube_statefulset_replicas != kube_statefulset_status_replicas_updated)) > 0",
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-daemonset-rollout-stuck",
    name: "Kubernetes DaemonSet Rollout Stuck",
    description: "Only some Pods of a DaemonSet are scheduled and ready",
    category: RuleCategory.KUBERNETES,
    subcategory: "deployments",
    severity: "warning",
    conditions: [
      {
        metric: "kube_daemonset_status_updated_number_scheduled",
        aggregation: "last",
        operator: "lt",
        threshold: 0,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "daemonset", type: "rollout" },
    annotations: {
      summary:
        "Kubernetes DaemonSet rollout is stuck ({{ $labels.namespace }}/{{ $labels.daemonset }})",
    },
    promql:
      "kube_daemonset_status_number_ready / kube_daemonset_status_desired_number_scheduled * 100 < 100 or kube_daemonset_status_desired_number_scheduled - kube_daemonset_status_updated_number_scheduled > 0",
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  // Additional Storage rules
  {
    id: "kubernetes-pv-filling-up",
    name: "Kubernetes PersistentVolume Filling Up",
    description:
      "PersistentVolume is filling up and will run out of space within 4 days",
    category: RuleCategory.KUBERNETES,
    subcategory: "storage",
    severity: "warning",
    conditions: [
      {
        metric: "kubelet_volume_stats_available_bytes",
        aggregation: "last",
        operator: "lt",
        threshold: 20,
        duration: DefaultDurations.SHORT,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "pv", type: "capacity" },
    annotations: {
      summary:
        "Kubernetes PersistentVolume is filling up ({{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }})",
    },
    promql:
      "(kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes) < 0.2 and predict_linear(kubelet_volume_stats_available_bytes[6h], 4 * 24 * 3600) < 0",
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-pv-filling-up-critical",
    name: "Kubernetes PersistentVolume Filling Up Critical",
    description:
      "PersistentVolume is filling up and will run out of space in less than 24 hours",
    category: RuleCategory.KUBERNETES,
    subcategory: "storage",
    severity: "critical",
    conditions: [
      {
        metric: "kubelet_volume_stats_available_bytes",
        aggregation: "last",
        operator: "lt",
        threshold: 3,
        duration: DefaultDurations.SHORT,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "pv", type: "capacity" },
    annotations: {
      summary:
        "Kubernetes PersistentVolume is critically full ({{ $labels.namespace }}/{{ $labels.persistentvolumeclaim }})",
    },
    promql:
      "(kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes) < 0.03 and predict_linear(kubelet_volume_stats_available_bytes[6h], 24 * 3600) < 0",
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  // System
  {
    id: "kubernetes-kubelet-too-many-pods",
    name: "Kubernetes Kubelet Too Many Pods",
    description: "Kubelet is running at capacity and close to the pod limit",
    category: RuleCategory.KUBERNETES,
    subcategory: "system",
    severity: "info",
    conditions: [
      {
        metric: "kubelet_running_pods",
        aggregation: "last",
        operator: "gt",
        threshold: 90,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "kubelet", type: "capacity" },
    annotations: {
      summary:
        "Kubelet is running at capacity (instance {{ $labels.instance }})",
    },
    promql:
      'max(max(kubelet_running_pods{job="kubelet", metrics_path="/metrics"}) by(instance) * on(instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"}) by(node) / max(kube_node_status_capacity{job="kube-state-metrics",resource="pods"}) by(node) * 100 > 95',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-api-error-budget-burn-rate-high",
    name: "Kubernetes API Server Error Budget Burn Rate High",
    description:
      "API server is burning through its error budget at a high rate",
    category: RuleCategory.KUBERNETES,
    subcategory: "system",
    severity: "critical",
    conditions: [
      {
        metric: "apiserver_request_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 0.1,
        duration: DefaultDurations.MEDIUM,
      },
    ],
    evaluationInterval: DefaultIntervals.FAST,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "apiserver", type: "slo" },
    annotations: {
      summary: "Kubernetes API server is burning too much error budget",
    },
    promql:
      'sum(rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[5m])) / sum(rate(apiserver_request_total{job="apiserver"}[5m])) > 0.1',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-version-mismatch",
    name: "Kubernetes Version Mismatch",
    description: "Different semantic versions of Kubernetes components running",
    category: RuleCategory.KUBERNETES,
    subcategory: "system",
    severity: "warning",
    conditions: [
      {
        metric: "kubernetes_build_info",
        aggregation: "count",
        operator: "gt",
        threshold: 1,
        duration: DefaultDurations.HOUR,
      },
    ],
    evaluationInterval: DefaultIntervals.SLOW,
    forDuration: DefaultDurations.HOUR,
    labels: { component: "cluster", type: "version" },
    annotations: {
      summary: "Different semantic versions of Kubernetes components running",
    },
    promql:
      'count(count by (git_version) (label_replace(kubernetes_build_info{job!~"kube-dns|coredns"}, "git_version", "$1", "git_version", "(v[0-9]*.[0-9]*).*"))) > 1',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-client-errors-high",
    name: "Kubernetes Client Errors High",
    description: "Kubernetes API client is experiencing high error rate",
    category: RuleCategory.KUBERNETES,
    subcategory: "system",
    severity: "warning",
    conditions: [
      {
        metric: "rest_client_requests_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 0.01,
        duration: DefaultDurations.LONG,
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "client", type: "errors" },
    annotations: {
      summary:
        "Kubernetes API client errors are high ({{ $labels.namespace }}/{{ $labels.pod }})",
    },
    promql:
      '(sum(rate(rest_client_requests_total{code=~"5.."}[5m])) by (instance, job, namespace, pod) / sum(rate(rest_client_requests_total[5m])) by (instance, job, namespace, pod)) > 0.01',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  // Absent
  {
    id: "kubernetes-api-server-down",
    name: "Kubernetes API Server Down",
    description: "KubeAPI has disappeared from Prometheus target discovery",
    category: RuleCategory.KUBERNETES,
    subcategory: "absent",
    severity: "critical",
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: DefaultDurations.MEDIUM,
        labels: { job: "apiserver" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "apiserver", type: "absent" },
    annotations: {
      summary: "KubeAPI has disappeared from Prometheus target discovery",
    },
    promql: 'absent(up{job="apiserver"} == 1)',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-controller-manager-down",
    name: "Kubernetes Controller Manager Down",
    description:
      "KubeControllerManager has disappeared from Prometheus target discovery",
    category: RuleCategory.KUBERNETES,
    subcategory: "absent",
    severity: "critical",
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: DefaultDurations.MEDIUM,
        labels: { job: "kube-controller-manager" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "controller-manager", type: "absent" },
    annotations: {
      summary:
        "KubeControllerManager has disappeared from Prometheus target discovery",
    },
    promql: 'absent(up{job="kube-controller-manager"} == 1)',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-scheduler-down",
    name: "Kubernetes Scheduler Down",
    description:
      "KubeScheduler has disappeared from Prometheus target discovery",
    category: RuleCategory.KUBERNETES,
    subcategory: "absent",
    severity: "critical",
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: DefaultDurations.MEDIUM,
        labels: { job: "kube-scheduler" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "scheduler", type: "absent" },
    annotations: {
      summary: "KubeScheduler has disappeared from Prometheus target discovery",
    },
    promql: 'absent(up{job="kube-scheduler"} == 1)',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-kubelet-down",
    name: "Kubernetes Kubelet Down",
    description: "Kubelet has disappeared from Prometheus target discovery",
    category: RuleCategory.KUBERNETES,
    subcategory: "absent",
    severity: "critical",
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: DefaultDurations.MEDIUM,
        labels: { job: "kubelet" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "kubelet", type: "absent" },
    annotations: {
      summary: "Kubelet has disappeared from Prometheus target discovery",
    },
    promql: 'absent(up{job="kubelet",metrics_path="/metrics"} == 1)',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "kubernetes-proxy-down",
    name: "Kubernetes Proxy Down",
    description: "KubeProxy has disappeared from Prometheus target discovery",
    category: RuleCategory.KUBERNETES,
    subcategory: "absent",
    severity: "critical",
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: DefaultDurations.MEDIUM,
        labels: { job: "kube-proxy" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "proxy", type: "absent" },
    annotations: {
      summary: "KubeProxy has disappeared from Prometheus target discovery",
    },
    promql: 'absent(up{job="kube-proxy"} == 1)',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
];

// Update category with rules
KubernetesCategory.groups.forEach((group) => {
  group.rules = KubernetesRules.filter((rule) => rule.subcategory === group.id);
});
