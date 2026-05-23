/**
 * Observability Alert Rules
 * Prometheus, Loki, Thanos, Grafana, OpenTelemetry
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import { RuleCategory, DefaultDurations, DefaultIntervals } from "../types";

export const PrometheusCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.PROMETHEUS,
    name: "Prometheus",
    description: "Monitor Prometheus server metrics",
    icon: "logos:prometheus",
    exporter: "prometheus",
    documentationUrl:
      "https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/",
    ruleCount: 6,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "config",
      name: "Config",
      description: "Configuration alerts",
      rules: [],
    },
    {
      id: "targets",
      name: "Targets",
      description: "Target scraping alerts",
      rules: [],
    },
  ],
};

export const LokiCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.LOKI,
    name: "Loki",
    description: "Monitor Grafana Loki log aggregation",
    icon: "simple-icons:grafana",
    exporter: "loki",
    documentationUrl: "https://grafana.com/docs/loki/latest/",
    ruleCount: 3,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "ingestion",
      name: "Ingestion",
      description: "Log ingestion alerts",
      rules: [],
    },
  ],
};

export const ThanosCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.THANOS,
    name: "Thanos",
    description: "Monitor Thanos distributed Prometheus",
    icon: "simple-icons:thanos",
    exporter: "thanos",
    documentationUrl: "https://thanos.io/tip/operating/troubleshooting.md/",
    ruleCount: 3,
  },
  groups: [
    {
      id: "components",
      name: "Components",
      description: "Component health alerts",
      rules: [],
    },
    {
      id: "compaction",
      name: "Compaction",
      description: "Compaction alerts",
      rules: [],
    },
  ],
};

export const GrafanaCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.GRAFANA,
    name: "Grafana",
    description: "Monitor Grafana dashboard metrics",
    icon: "logos:grafana",
    exporter: "grafana",
    documentationUrl: "https://grafana.com/docs/grafana/latest/alerting/",
    ruleCount: 2,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
  ],
};

export const OpenTelemetryCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.OPENTELEMETRY,
    name: "OpenTelemetry",
    description: "Monitor OpenTelemetry Collector metrics",
    icon: "simple-icons:opentelemetry",
    exporter: "otelcol",
    documentationUrl: "https://opentelemetry.io/docs/collector/",
    ruleCount: 4,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "pipeline",
      name: "Pipeline",
      description: "Pipeline alerts",
      rules: [],
    },
  ],
};

export const ObservabilityRules: AlertRuleTemplate[] = [
  // Prometheus
  {
    id: "prometheus-job-missing",
    name: "Prometheus Job Missing",
    description: "A Prometheus job has disappeared",
    category: RuleCategory.PROMETHEUS,
    subcategory: "health",
    severity: "warning",
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "prometheus" },
    annotations: { summary: "Prometheus job missing" },
    promql: 'absent(up{job="prometheus"})',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "prometheus-target-missing",
    name: "Prometheus Target Missing",
    description: "A Prometheus target has disappeared",
    category: RuleCategory.PROMETHEUS,
    subcategory: "targets",
    severity: "critical",
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "prometheus" },
    annotations: { summary: "Prometheus target missing" },
    promql: "up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "prometheus-config-reload-failed",
    name: "Prometheus Configuration Reload Failed",
    description: "Prometheus configuration reload error",
    category: RuleCategory.PROMETHEUS,
    subcategory: "config",
    severity: "warning",
    conditions: [
      {
        metric: "prometheus_config_last_reload_successful",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "prometheus" },
    annotations: { summary: "Prometheus configuration reload failed" },
    promql: "prometheus_config_last_reload_successful != 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "prometheus-alertmanager-missing",
    name: "Prometheus Alertmanager Missing",
    description: "Alertmanager target is missing",
    category: RuleCategory.PROMETHEUS,
    subcategory: "targets",
    severity: "critical",
    conditions: [
      {
        metric: "prometheus_notifications_alertmanagers_discovered",
        aggregation: "last",
        operator: "lt",
        threshold: 1,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "prometheus" },
    annotations: { summary: "Prometheus Alertmanager missing" },
    promql: "prometheus_notifications_alertmanagers_discovered < 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Loki
  {
    id: "loki-process-too-many-restarts",
    name: "Loki Process Too Many Restarts",
    description: "Loki process has restarted more than twice",
    category: RuleCategory.LOKI,
    subcategory: "health",
    severity: "warning",
    conditions: [
      {
        metric: "loki_build_info",
        aggregation: "rate",
        operator: "gt",
        threshold: 2,
        duration: "15m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.LONG,
    labels: { component: "loki" },
    annotations: { summary: "Loki process too many restarts" },
    promql: "changes(loki_build_info[15m]) > 2",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "loki-request-errors",
    name: "Loki Request Errors",
    description: "Loki request error rate is high (> 10%)",
    category: RuleCategory.LOKI,
    subcategory: "health",
    severity: "warning",
    conditions: [
      {
        metric: "loki_request_duration_seconds_count",
        aggregation: "rate",
        operator: "gt",
        threshold: 10,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "loki" },
    annotations: { summary: "Loki request errors" },
    promql:
      'sum(rate(loki_request_duration_seconds_count{status_code=~"5.."}[5m])) / sum(rate(loki_request_duration_seconds_count[5m])) * 100 > 10',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Thanos
  {
    id: "thanos-sidecar-prometheus-down",
    name: "Thanos Sidecar Prometheus Down",
    description: "Thanos Sidecar cannot connect to Prometheus",
    category: RuleCategory.THANOS,
    subcategory: "components",
    severity: "critical",
    conditions: [
      {
        metric: "thanos_sidecar_prometheus_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "thanos" },
    annotations: { summary: "Thanos Sidecar Prometheus down" },
    promql: "thanos_sidecar_prometheus_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "thanos-compaction-halted",
    name: "Thanos Compaction Halted",
    description: "Thanos compaction has halted",
    category: RuleCategory.THANOS,
    subcategory: "compaction",
    severity: "critical",
    conditions: [
      {
        metric: "thanos_compact_halted",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "thanos" },
    annotations: { summary: "Thanos compaction halted" },
    promql: "thanos_compact_halted == 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Grafana
  {
    id: "grafana-alerting-error",
    name: "Grafana Alerting Error",
    description: "Grafana alerting has errors",
    category: RuleCategory.GRAFANA,
    subcategory: "health",
    severity: "warning",
    conditions: [
      {
        metric: "grafana_alerting_result_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "grafana" },
    annotations: { summary: "Grafana alerting error" },
    promql: 'rate(grafana_alerting_result_total{state="alerting"}[5m]) > 0',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "grafana-api-failure",
    name: "Grafana API Failure",
    description: "Grafana API failure rate is high",
    category: RuleCategory.GRAFANA,
    subcategory: "health",
    severity: "warning",
    conditions: [
      {
        metric: "grafana_http_request_duration_seconds_count",
        aggregation: "rate",
        operator: "gt",
        threshold: 5,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "grafana" },
    annotations: { summary: "Grafana API failure" },
    promql:
      'sum(rate(grafana_http_request_duration_seconds_count{status_code=~"5.."}[5m])) / sum(rate(grafana_http_request_duration_seconds_count[5m])) * 100 > 5',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // OpenTelemetry
  {
    id: "otel-collector-queue-size",
    name: "OpenTelemetry Collector Queue Size",
    description: "OpenTelemetry Collector queue size is high",
    category: RuleCategory.OPENTELEMETRY,
    subcategory: "pipeline",
    severity: "warning",
    conditions: [
      {
        metric: "otelcol_exporter_queue_size",
        aggregation: "avg",
        operator: "gt",
        threshold: 100,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "otel" },
    annotations: { summary: "OpenTelemetry Collector queue size high" },
    promql: "otelcol_exporter_queue_size > 100",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "otel-collector-exporter-failed",
    name: "OpenTelemetry Collector Exporter Failed",
    description: "OpenTelemetry Collector exporter is failing",
    category: RuleCategory.OPENTELEMETRY,
    subcategory: "pipeline",
    severity: "critical",
    conditions: [
      {
        metric: "otelcol_exporter_send_failed_spans",
        aggregation: "rate",
        operator: "gt",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "otel" },
    annotations: { summary: "OpenTelemetry Collector exporter failed" },
    promql: "rate(otelcol_exporter_send_failed_spans[5m]) > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "otel-collector-dropped",
    name: "OpenTelemetry Collector Dropped Data",
    description: "OpenTelemetry Collector is dropping data",
    category: RuleCategory.OPENTELEMETRY,
    subcategory: "pipeline",
    severity: "critical",
    conditions: [
      {
        metric: "otelcol_processor_dropped_spans",
        aggregation: "rate",
        operator: "gt",
        threshold: 0,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "otel" },
    annotations: { summary: "OpenTelemetry Collector dropping data" },
    promql: "rate(otelcol_processor_dropped_spans[5m]) > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // kube-prometheus-stack general.rules
  {
    id: "prometheus-watchdog",
    name: "Prometheus Watchdog",
    description: "Sentinel alert that fires at all times to certify the alerting pipeline is functional. If not firing, something is broken.",
    category: RuleCategory.PROMETHEUS,
    subcategory: "health",
    severity: "info",
    conditions: [
      { metric: "vector", aggregation: "last", operator: "eq", threshold: 1, duration: "0s" },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: "0s",
    labels: { component: "prometheus", type: "sentinel" },
    annotations: {
      summary: "An alert that should always be firing to certify that Alertmanager is working properly",
      description: "This is an alert meant to ensure that the entire alerting pipeline is functional. If this alert is not firing, something is broken.",
    },
    promql: "vector(1)",
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
  {
    id: "prometheus-info-inhibits-warning",
    name: "Prometheus Info Inhibits Warning",
    description: "Info-level alert that inhibits corresponding warning alerts in Alertmanager",
    category: RuleCategory.PROMETHEUS,
    subcategory: "health",
    severity: "info",
    conditions: [
      { metric: "ALERTS", aggregation: "last", operator: "eq", threshold: 1, duration: "0s", labels: { severity: "info" } },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: "0s",
    labels: { component: "prometheus", type: "inhibit" },
    annotations: {
      summary: "Info-level alert is inhibiting a warning-level alert",
      description: "This alert fires whenever there is an info alert that should inhibit a corresponding warning alert.",
    },
    promql: 'ALERTS{severity="info"} == 1',
    enabled: true,
    source: { name: "kube-prometheus-stack" },
  },
];

export const ObservabilityCategories: AlertRuleCategory[] = [
  PrometheusCategory,
  LokiCategory,
  ThanosCategory,
  GrafanaCategory,
  OpenTelemetryCategory,
];

// Update categories with rules
ObservabilityCategories.forEach((cat) => {
  const categoryRules = ObservabilityRules.filter(
    (r) => r.category === cat.metadata.id,
  );
  cat.groups.forEach((group) => {
    group.rules = categoryRules.filter((rule) => rule.subcategory === group.id);
  });
});
