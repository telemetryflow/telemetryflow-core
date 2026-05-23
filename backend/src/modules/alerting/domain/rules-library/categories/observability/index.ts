/**
 * Observability Alert Rules
 * Prometheus, Loki, Thanos, Grafana, OpenTelemetry
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#observability
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

// ====================== PROMETHEUS ======================
export const PrometheusCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.PROMETHEUS,
    name: "Prometheus",
    description: "Monitor Prometheus server metrics",
    icon: "logos:prometheus",
    exporter: "prometheus",
    documentationUrl:
      "https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/",
    ruleCount: 15,
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

export const PrometheusRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("prometheus-job-missing")
    .name("Prometheus Job Missing")
    .description("A Prometheus job has disappeared")
    .category(RuleCategory.PROMETHEUS, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("up")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "prometheus", type: "job" })
    .annotations({
      summary: "Prometheus job missing (job {{ $labels.job }})",
      description: "A Prometheus job has disappeared",
    })
    .promql('absent(up{job="prometheus"})')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-target-missing")
    .name("Prometheus Target Missing")
    .description("A Prometheus target has disappeared")
    .category(RuleCategory.PROMETHEUS, "targets")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "prometheus", type: "target" })
    .annotations({
      summary: "Prometheus target missing (instance {{ $labels.instance }})",
      description: "A Prometheus target has disappeared",
    })
    .promql("up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-config-reload-failed")
    .name("Prometheus Configuration Reload Failed")
    .description("Prometheus configuration reload error")
    .category(RuleCategory.PROMETHEUS, "config")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("prometheus_config_last_reload_successful")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "prometheus", type: "config" })
    .annotations({
      summary:
        "Prometheus configuration reload failed (instance {{ $labels.instance }})",
      description: "Prometheus configuration reload error",
    })
    .promql("prometheus_config_last_reload_successful != 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-too-many-restarts")
    .name("Prometheus Too Many Restarts")
    .description(
      "Prometheus has restarted more than twice in the last 15 minutes",
    )
    .category(RuleCategory.PROMETHEUS, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("prometheus_build_info")
        .rate()
        .gt(2)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "prometheus", type: "restart" })
    .annotations({
      summary: "Prometheus too many restarts (instance {{ $labels.instance }})",
      description: "Prometheus has restarted more than twice",
    })
    .promql("changes(prometheus_build_info[15m]) > 2")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-alertmanager-missing")
    .name("Prometheus Alertmanager Missing")
    .description("Alertmanager target is missing")
    .category(RuleCategory.PROMETHEUS, "targets")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("prometheus_notifications_alertmanagers_discovered")
        .last()
        .lt(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "prometheus", type: "alertmanager" })
    .annotations({
      summary: "Prometheus Alertmanager missing",
      description: "Prometheus cannot discover Alertmanager",
    })
    .promql("prometheus_notifications_alertmanagers_discovered < 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-target-scraping-slow")
    .name("Prometheus Target Scraping Slow")
    .description("Prometheus target scraping is slow (> 60 seconds)")
    .category(RuleCategory.PROMETHEUS, "targets")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("scrape_duration_seconds")
        .avg()
        .gt(60)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "prometheus", type: "scrape" })
    .annotations({
      summary:
        "Prometheus target scraping slow (instance {{ $labels.instance }})",
      description: "Target scraping is taking more than 60 seconds",
    })
    .promql("scrape_duration_seconds > 60")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-large-scrape")
    .name("Prometheus Large Scrape")
    .description("Prometheus is scraping a large number of samples")
    .category(RuleCategory.PROMETHEUS, "targets")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("scrape_samples_scraped")
        .avg()
        .gt(10000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "prometheus", type: "scrape" })
    .annotations({
      summary: "Prometheus large scrape (instance {{ $labels.instance }})",
      description: "Prometheus is scraping {{ $value }} samples",
    })
    .promql("scrape_samples_scraped > 10000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-tsdb-checkpoint-creation-failed")
    .name("Prometheus TSDB Checkpoint Creation Failed")
    .description("Prometheus TSDB checkpoint creation failed")
    .category(RuleCategory.PROMETHEUS, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("prometheus_tsdb_checkpoint_creations_failed_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "prometheus", type: "tsdb" })
    .annotations({
      summary: "Prometheus TSDB checkpoint creation failed",
      description: "Prometheus TSDB checkpoint creation failed",
    })
    .promql(
      "increase(prometheus_tsdb_checkpoint_creations_failed_total[1m]) > 0",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-rule-evaluation-slow")
    .name("Prometheus Rule Evaluation Slow")
    .description("Prometheus rule evaluation is slow")
    .category(RuleCategory.PROMETHEUS, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("prometheus_rule_evaluation_duration_seconds")
        .p99()
        .gt(10)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "prometheus", type: "rules" })
    .annotations({
      summary: "Prometheus rule evaluation slow",
      description: "Prometheus rule evaluation is slow",
    })
    .promql('prometheus_rule_evaluation_duration_seconds{quantile="0.99"} > 10')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== LOKI ======================
export const LokiCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.LOKI,
    name: "Loki",
    description: "Monitor Grafana Loki log aggregation",
    icon: "simple-icons:grafana",
    exporter: "loki",
    documentationUrl: "https://grafana.com/docs/loki/latest/",
    ruleCount: 10,
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

export const LokiRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("loki-process-too-many-restarts")
    .name("Loki Process Too Many Restarts")
    .description(
      "Loki process has restarted more than twice in the last 15 minutes",
    )
    .category(RuleCategory.LOKI, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("loki_build_info")
        .rate()
        .gt(2)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "loki", type: "restart" })
    .annotations({
      summary:
        "Loki process too many restarts (instance {{ $labels.instance }})",
      description: "Loki process has restarted more than twice",
    })
    .promql("changes(loki_build_info[15m]) > 2")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("loki-request-errors")
    .name("Loki Request Errors")
    .description("Loki request error rate is high (> 10%)")
    .category(RuleCategory.LOKI, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("loki_request_duration_seconds_count")
        .rate()
        .gt(10)
        .duration(DefaultDurations.MEDIUM)
        .label("status_code", "~5..")
        .build(),
    )
    .labels({ component: "loki", type: "errors" })
    .annotations({
      summary: "Loki request errors",
      description: "Loki request error rate is high (> 10%)",
    })
    .promql(
      'sum(rate(loki_request_duration_seconds_count{status_code=~"5.."}[5m])) / sum(rate(loki_request_duration_seconds_count[5m])) * 100 > 10',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("loki-request-panic")
    .name("Loki Request Panic")
    .description("Loki requests are causing panics")
    .category(RuleCategory.LOKI, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("loki_panic_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "loki", type: "panic" })
    .annotations({
      summary: "Loki request panic (instance {{ $labels.instance }})",
      description: "Loki requests are causing panics",
    })
    .promql("increase(loki_panic_total[5m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("loki-ingestion-rate-error")
    .name("Loki Ingestion Rate Error")
    .description("Loki ingestion rate errors are high")
    .category(RuleCategory.LOKI, "ingestion")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("loki_distributor_bytes_received_total")
        .rate()
        .lt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "loki", type: "ingestion" })
    .annotations({
      summary: "Loki ingestion rate error",
      description: "Loki is not receiving logs",
    })
    .promql("rate(loki_distributor_bytes_received_total[5m]) < 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== THANOS ======================
export const ThanosCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.THANOS,
    name: "Thanos",
    description: "Monitor Thanos distributed Prometheus",
    icon: "simple-icons:thanos",
    exporter: "thanos",
    documentationUrl: "https://thanos.io/tip/operating/troubleshooting.md/",
    ruleCount: 10,
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

export const ThanosRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("thanos-sidecar-prometheus-down")
    .name("Thanos Sidecar Prometheus Down")
    .description("Thanos Sidecar cannot connect to Prometheus")
    .category(RuleCategory.THANOS, "components")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("thanos_sidecar_prometheus_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "thanos", type: "sidecar" })
    .annotations({
      summary: "Thanos Sidecar Prometheus down",
      description: "Thanos Sidecar cannot connect to Prometheus",
    })
    .promql("thanos_sidecar_prometheus_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("thanos-compaction-halted")
    .name("Thanos Compaction Halted")
    .description("Thanos compaction has halted")
    .category(RuleCategory.THANOS, "compaction")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("thanos_compact_halted")
        .last()
        .eq(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "thanos", type: "compaction" })
    .annotations({
      summary: "Thanos compaction halted",
      description: "Thanos compaction has halted",
    })
    .promql("thanos_compact_halted == 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("thanos-bucket-operation-failures")
    .name("Thanos Bucket Operation Failures")
    .description("Thanos Bucket operations are failing")
    .category(RuleCategory.THANOS, "components")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("thanos_objstore_bucket_operation_failures_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "thanos", type: "bucket" })
    .annotations({
      summary: "Thanos bucket operation failures",
      description: "Thanos bucket operations are failing",
    })
    .promql("rate(thanos_objstore_bucket_operation_failures_total[5m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("thanos-query-high-dns-failures")
    .name("Thanos Query High DNS Failures")
    .description("Thanos Query has high DNS failure rate")
    .category(RuleCategory.THANOS, "components")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("thanos_query_store_apis_dns_failures_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "thanos", type: "query" })
    .annotations({
      summary: "Thanos Query high DNS failures",
      description: "Thanos Query has high DNS failure rate",
    })
    .promql("rate(thanos_query_store_apis_dns_failures_total[5m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== GRAFANA ======================
export const GrafanaCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.GRAFANA,
    name: "Grafana",
    description: "Monitor Grafana dashboard metrics",
    icon: "logos:grafana",
    exporter: "grafana",
    documentationUrl: "https://grafana.com/docs/grafana/latest/alerting/",
    ruleCount: 6,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
  ],
};

export const GrafanaRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("grafana-alerting-error")
    .name("Grafana Alerting Error")
    .description("Grafana alerting has errors")
    .category(RuleCategory.GRAFANA, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("grafana_alerting_result_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .label("state", "alerting")
        .build(),
    )
    .labels({ component: "grafana", type: "alerting" })
    .annotations({
      summary: "Grafana alerting error",
      description: "Grafana alerting has errors",
    })
    .promql('rate(grafana_alerting_result_total{state="alerting"}[5m]) > 0')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("grafana-api-failure")
    .name("Grafana API Failure")
    .description("Grafana API failure rate is high")
    .category(RuleCategory.GRAFANA, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("grafana_http_request_duration_seconds_count")
        .rate()
        .gt(5)
        .duration(DefaultDurations.MEDIUM)
        .label("status_code", "~5..")
        .build(),
    )
    .labels({ component: "grafana", type: "api" })
    .annotations({
      summary: "Grafana API failure",
      description: "Grafana API failure rate is high",
    })
    .promql(
      'sum(rate(grafana_http_request_duration_seconds_count{status_code=~"5.."}[5m])) / sum(rate(grafana_http_request_duration_seconds_count[5m])) * 100 > 5',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== OPENTELEMETRY ======================
export const OpenTelemetryCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.OPENTELEMETRY,
    name: "OpenTelemetry",
    description: "Monitor OpenTelemetry Collector metrics",
    icon: "simple-icons:opentelemetry",
    exporter: "otelcol",
    documentationUrl: "https://opentelemetry.io/docs/collector/",
    ruleCount: 8,
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

export const OpenTelemetryRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("otel-collector-queue-size")
    .name("OpenTelemetry Collector Queue Size")
    .description("OpenTelemetry Collector queue size is high")
    .category(RuleCategory.OPENTELEMETRY, "pipeline")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("otelcol_exporter_queue_size")
        .avg()
        .gt(100)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "otel", type: "queue" })
    .annotations({
      summary: "OpenTelemetry Collector queue size high",
      description: "OpenTelemetry Collector queue size is {{ $value }}",
    })
    .promql("otelcol_exporter_queue_size > 100")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("otel-collector-exporter-failed")
    .name("OpenTelemetry Collector Exporter Failed")
    .description("OpenTelemetry Collector exporter is failing")
    .category(RuleCategory.OPENTELEMETRY, "pipeline")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("otelcol_exporter_send_failed_spans")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "otel", type: "exporter" })
    .annotations({
      summary: "OpenTelemetry Collector exporter failed",
      description: "OpenTelemetry Collector is failing to send data",
    })
    .promql("rate(otelcol_exporter_send_failed_spans[5m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("otel-collector-receiver-refused")
    .name("OpenTelemetry Collector Receiver Refused")
    .description("OpenTelemetry Collector receiver is refusing data")
    .category(RuleCategory.OPENTELEMETRY, "pipeline")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("otelcol_receiver_refused_spans")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "otel", type: "receiver" })
    .annotations({
      summary: "OpenTelemetry Collector receiver refused",
      description: "OpenTelemetry Collector receiver is refusing data",
    })
    .promql("rate(otelcol_receiver_refused_spans[5m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("otel-collector-dropped")
    .name("OpenTelemetry Collector Dropped Data")
    .description("OpenTelemetry Collector is dropping data")
    .category(RuleCategory.OPENTELEMETRY, "pipeline")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("otelcol_processor_dropped_spans")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "otel", type: "processor" })
    .annotations({
      summary: "OpenTelemetry Collector dropping data",
      description: "OpenTelemetry Collector is dropping data",
    })
    .promql("rate(otelcol_processor_dropped_spans[5m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// Update categories with rules
PrometheusCategory.groups.forEach((group) => {
  group.rules = PrometheusRules.filter((rule) => rule.subcategory === group.id);
});

LokiCategory.groups.forEach((group) => {
  group.rules = LokiRules.filter((rule) => rule.subcategory === group.id);
});

ThanosCategory.groups.forEach((group) => {
  group.rules = ThanosRules.filter((rule) => rule.subcategory === group.id);
});

GrafanaCategory.groups.forEach((group) => {
  group.rules = GrafanaRules.filter((rule) => rule.subcategory === group.id);
});

OpenTelemetryCategory.groups.forEach((group) => {
  group.rules = OpenTelemetryRules.filter(
    (rule) => rule.subcategory === group.id,
  );
});

// ====================== GENERAL RULES (kube-prometheus-stack) ======================
// These are additional rules from kube-prometheus-stack general.rules group

PrometheusRules.push(
  AlertRuleBuilder.create("prometheus-watchdog")
    .name("Prometheus Watchdog")
    .description(
      "This is an alert meant to ensure that the entire alerting pipeline is functional. It fires at all times as a sentinel. If this alert is not firing, something is broken in the alerting pipeline.",
    )
    .category(RuleCategory.PROMETHEUS, "health")
    .severity("info")
    .condition(
      ConditionBuilder.create()
        .metric("vector")
        .last()
        .eq(1)
        .duration(DefaultDurations.INSTANT)
        .build(),
    )
    .labels({ component: "prometheus", type: "sentinel" })
    .annotations({
      summary:
        "An alert that should always be firing to certify that Alertmanager is working properly",
      description:
        "This is an alert meant to ensure that the entire alerting pipeline is functional. It fires at all times as a sentinel. If this alert is not firing, something is broken.",
    })
    .promql("vector(1)")
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),

  AlertRuleBuilder.create("prometheus-info-inhibits-warning")
    .name("Prometheus Info Inhibits Warning")
    .description(
      "This is an alert that is used to inhibit warning alerts when a corresponding info alert is present",
    )
    .category(RuleCategory.PROMETHEUS, "health")
    .severity("info")
    .condition(
      ConditionBuilder.create()
        .metric("ALERTS")
        .last()
        .eq(1)
        .duration(DefaultDurations.INSTANT)
        .label("severity", "info")
        .build(),
    )
    .labels({ component: "prometheus", type: "inhibit" })
    .annotations({
      summary: "Info-level alert is inhibiting a warning-level alert",
      description:
        "This alert fires whenever there is a info alert that should inhibit a corresponding warning alert. Only relevant to the Alertmanager configuration.",
    })
    .promql('ALERTS{severity="info"} == 1')
    .source(
      "kube-prometheus-stack",
      "https://github.com/prometheus-operator/kube-prometheus",
    )
    .build(),
);

// Combined export
export const ObservabilityRules: AlertRuleTemplate[] = [
  ...PrometheusRules,
  ...LokiRules,
  ...ThanosRules,
  ...GrafanaRules,
  ...OpenTelemetryRules,
];

export const ObservabilityCategories: AlertRuleCategory[] = [
  PrometheusCategory,
  LokiCategory,
  ThanosCategory,
  GrafanaCategory,
  OpenTelemetryCategory,
];
