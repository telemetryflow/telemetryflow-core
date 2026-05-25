/**
 * Web Servers & Proxies Alert Rules
 * Nginx, Apache, HAProxy, Traefik
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#web-servers
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

// ====================== NGINX ======================
export const NginxCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.NGINX,
    name: "Nginx",
    description: "Monitor Nginx web server metrics",
    icon: "logos:nginx",
    exporter: "nginx_exporter",
    documentationUrl: "https://github.com/nginxinc/nginx-prometheus-exporter",
    ruleCount: 10,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "performance",
      name: "Performance",
      description: "Performance alerts",
      rules: [],
    },
    { id: "errors", name: "Errors", description: "Error alerts", rules: [] },
  ],
};

export const NginxRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("nginx-down")
    .name("Nginx Down")
    .description("Nginx is down")
    .category(RuleCategory.NGINX, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("nginx_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "nginx", type: "availability" })
    .annotations({
      summary: "Nginx down (instance {{ $labels.instance }})",
      description: "Nginx is down",
    })
    .promql("nginx_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("nginx-high-http-4xx-error-rate")
    .name("Nginx High HTTP 4xx Error Rate")
    .description("Too many HTTP 4xx errors (> 5%)")
    .category(RuleCategory.NGINX, "errors")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("nginx_http_requests_total")
        .rate()
        .gt(5)
        .duration(DefaultDurations.MEDIUM)
        .label("status", "~4..")
        .build(),
    )
    .labels({ component: "nginx", type: "errors" })
    .annotations({
      summary:
        "Nginx high HTTP 4xx error rate (instance {{ $labels.instance }})",
      description: "Too many HTTP 4xx errors (> 5%)",
    })
    .promql(
      'sum(rate(nginx_http_requests_total{status=~"4.."}[5m])) / sum(rate(nginx_http_requests_total[5m])) * 100 > 5',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("nginx-high-http-5xx-error-rate")
    .name("Nginx High HTTP 5xx Error Rate")
    .description("Too many HTTP 5xx errors (> 5%)")
    .category(RuleCategory.NGINX, "errors")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("nginx_http_requests_total")
        .rate()
        .gt(5)
        .duration(DefaultDurations.MEDIUM)
        .label("status", "~5..")
        .build(),
    )
    .labels({ component: "nginx", type: "errors" })
    .annotations({
      summary:
        "Nginx high HTTP 5xx error rate (instance {{ $labels.instance }})",
      description: "Too many HTTP 5xx errors (> 5%)",
    })
    .promql(
      'sum(rate(nginx_http_requests_total{status=~"5.."}[5m])) / sum(rate(nginx_http_requests_total[5m])) * 100 > 5',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("nginx-high-latency")
    .name("Nginx High Latency")
    .description("Nginx latency is high (> 3 seconds)")
    .category(RuleCategory.NGINX, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("nginx_http_request_duration_seconds")
        .p95()
        .gt(3)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "nginx", type: "latency" })
    .annotations({
      summary: "Nginx high latency (instance {{ $labels.instance }})",
      description: "Nginx p95 latency is > 3 seconds",
    })
    .promql(
      "histogram_quantile(0.95, sum(rate(nginx_http_request_duration_seconds_bucket[5m])) by (le)) > 3",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== APACHE ======================
export const ApacheCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.APACHE,
    name: "Apache",
    description: "Monitor Apache HTTP Server metrics",
    icon: "logos:apache",
    exporter: "apache_exporter",
    documentationUrl: "https://github.com/Lusitaniae/apache_exporter",
    ruleCount: 8,
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

export const ApacheRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("apache-down")
    .name("Apache Down")
    .description("Apache is down")
    .category(RuleCategory.APACHE, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("apache_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "apache", type: "availability" })
    .annotations({
      summary: "Apache down (instance {{ $labels.instance }})",
      description: "Apache is down",
    })
    .promql("apache_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("apache-workers-busy")
    .name("Apache Workers Busy")
    .description("Apache workers are busy (> 80%)")
    .category(RuleCategory.APACHE, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("apache_workers")
        .avg()
        .gt(80)
        .duration(DefaultDurations.MEDIUM)
        .label("state", "busy")
        .build(),
    )
    .labels({ component: "apache", type: "workers" })
    .annotations({
      summary: "Apache workers busy (instance {{ $labels.instance }})",
      description: "Apache workers are busy (> 80%)",
    })
    .promql(
      'apache_workers{state="busy"} / (apache_workers{state="busy"} + apache_workers{state="idle"}) * 100 > 80',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("apache-restart")
    .name("Apache Restarted")
    .description("Apache has been restarted")
    .category(RuleCategory.APACHE, "health")
    .severity("info")
    .condition(
      ConditionBuilder.create()
        .metric("apache_uptime_seconds_total")
        .rate()
        .lt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "apache", type: "restart" })
    .annotations({
      summary: "Apache restarted (instance {{ $labels.instance }})",
      description: "Apache has been restarted",
    })
    .promql("apache_uptime_seconds_total < 60")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== HAPROXY ======================
export const HAProxyCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.HAPROXY,
    name: "HAProxy",
    description: "Monitor HAProxy load balancer metrics",
    icon: "simple-icons:haproxy",
    exporter: "haproxy_exporter",
    documentationUrl: "https://github.com/prometheus/haproxy_exporter",
    ruleCount: 12,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    {
      id: "backend",
      name: "Backend",
      description: "Backend alerts",
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

export const HAProxyRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("haproxy-down")
    .name("HAProxy Down")
    .description("HAProxy is down")
    .category(RuleCategory.HAPROXY, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("haproxy_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "haproxy", type: "availability" })
    .annotations({
      summary: "HAProxy down (instance {{ $labels.instance }})",
      description: "HAProxy is down",
    })
    .promql("haproxy_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("haproxy-backend-down")
    .name("HAProxy Backend Down")
    .description("HAProxy backend is down")
    .category(RuleCategory.HAPROXY, "backend")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("haproxy_backend_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "haproxy", type: "backend" })
    .annotations({
      summary: "HAProxy backend down (backend {{ $labels.backend }})",
      description: "HAProxy backend is down",
    })
    .promql("haproxy_backend_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("haproxy-server-down")
    .name("HAProxy Server Down")
    .description("HAProxy server is down")
    .category(RuleCategory.HAPROXY, "backend")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("haproxy_server_up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "haproxy", type: "server" })
    .annotations({
      summary: "HAProxy server down (server {{ $labels.server }})",
      description: "HAProxy server is down",
    })
    .promql("haproxy_server_up == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("haproxy-frontend-session-usage")
    .name("HAProxy Frontend Session Usage")
    .description("HAProxy frontend session usage is high (> 80%)")
    .category(RuleCategory.HAPROXY, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("haproxy_frontend_current_sessions")
        .avg()
        .gt(80)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "haproxy", type: "sessions" })
    .annotations({
      summary:
        "HAProxy frontend session usage (frontend {{ $labels.frontend }})",
      description: "HAProxy frontend session usage is > 80%",
    })
    .promql(
      "haproxy_frontend_current_sessions / haproxy_frontend_limit_sessions * 100 > 80",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("haproxy-high-http-4xx-rate")
    .name("HAProxy High HTTP 4xx Rate")
    .description("HAProxy is returning too many 4xx responses")
    .category(RuleCategory.HAPROXY, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("haproxy_frontend_http_responses_total")
        .rate()
        .gt(5)
        .duration(DefaultDurations.MEDIUM)
        .label("code", "4xx")
        .build(),
    )
    .labels({ component: "haproxy", type: "errors" })
    .annotations({
      summary: "HAProxy high HTTP 4xx rate",
      description: "HAProxy is returning too many 4xx responses",
    })
    .promql(
      'sum(rate(haproxy_frontend_http_responses_total{code="4xx"}[5m])) / sum(rate(haproxy_frontend_http_responses_total[5m])) * 100 > 5',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("haproxy-high-http-5xx-rate")
    .name("HAProxy High HTTP 5xx Rate")
    .description("HAProxy is returning too many 5xx responses")
    .category(RuleCategory.HAPROXY, "performance")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("haproxy_frontend_http_responses_total")
        .rate()
        .gt(5)
        .duration(DefaultDurations.MEDIUM)
        .label("code", "5xx")
        .build(),
    )
    .labels({ component: "haproxy", type: "errors" })
    .annotations({
      summary: "HAProxy high HTTP 5xx rate",
      description: "HAProxy is returning too many 5xx responses",
    })
    .promql(
      'sum(rate(haproxy_frontend_http_responses_total{code="5xx"}[5m])) / sum(rate(haproxy_frontend_http_responses_total[5m])) * 100 > 5',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("haproxy-pending-requests")
    .name("HAProxy Pending Requests")
    .description("HAProxy has pending requests")
    .category(RuleCategory.HAPROXY, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("haproxy_backend_current_queue")
        .avg()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "haproxy", type: "queue" })
    .annotations({
      summary: "HAProxy pending requests (backend {{ $labels.backend }})",
      description: "HAProxy has pending requests in the queue",
    })
    .promql("haproxy_backend_current_queue > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== TRAEFIK ======================
export const TraefikCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.TRAEFIK,
    name: "Traefik",
    description: "Monitor Traefik edge router metrics",
    icon: "logos:traefik",
    exporter: "traefik",
    documentationUrl:
      "https://doc.traefik.io/traefik/observability/metrics/prometheus/",
    ruleCount: 8,
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

export const TraefikRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("traefik-backend-down")
    .name("Traefik Backend Down")
    .description("All Traefik backends are down")
    .category(RuleCategory.TRAEFIK, "health")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("traefik_backend_server_up")
        .count()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "traefik", type: "backend" })
    .annotations({
      summary: "Traefik backend down",
      description: "All Traefik backends are down",
    })
    .promql("count(traefik_backend_server_up) == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("traefik-high-http-4xx-error-rate")
    .name("Traefik High HTTP 4xx Error Rate")
    .description("Traefik service 4xx error rate is above 5%")
    .category(RuleCategory.TRAEFIK, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("traefik_entrypoint_requests_total")
        .rate()
        .gt(5)
        .duration(DefaultDurations.MEDIUM)
        .label("code", "~4..")
        .build(),
    )
    .labels({ component: "traefik", type: "errors" })
    .annotations({
      summary: "Traefik high HTTP 4xx error rate",
      description: "Traefik 4xx error rate is above 5%",
    })
    .promql(
      'sum(rate(traefik_entrypoint_requests_total{code=~"4.."}[5m])) / sum(rate(traefik_entrypoint_requests_total[5m])) * 100 > 5',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("traefik-high-http-5xx-error-rate")
    .name("Traefik High HTTP 5xx Error Rate")
    .description("Traefik service 5xx error rate is above 5%")
    .category(RuleCategory.TRAEFIK, "performance")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("traefik_entrypoint_requests_total")
        .rate()
        .gt(5)
        .duration(DefaultDurations.MEDIUM)
        .label("code", "~5..")
        .build(),
    )
    .labels({ component: "traefik", type: "errors" })
    .annotations({
      summary: "Traefik high HTTP 5xx error rate",
      description: "Traefik 5xx error rate is above 5%",
    })
    .promql(
      'sum(rate(traefik_entrypoint_requests_total{code=~"5.."}[5m])) / sum(rate(traefik_entrypoint_requests_total[5m])) * 100 > 5',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("traefik-high-latency")
    .name("Traefik High Latency")
    .description("Traefik latency is high (> 1 second)")
    .category(RuleCategory.TRAEFIK, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("traefik_entrypoint_request_duration_seconds")
        .p95()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "traefik", type: "latency" })
    .annotations({
      summary: "Traefik high latency",
      description: "Traefik p95 latency is > 1 second",
    })
    .promql(
      "histogram_quantile(0.95, sum(rate(traefik_entrypoint_request_duration_seconds_bucket[5m])) by (le, entrypoint)) > 1",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// Update categories with rules
NginxCategory.groups.forEach((group) => {
  group.rules = NginxRules.filter((rule) => rule.subcategory === group.id);
});

ApacheCategory.groups.forEach((group) => {
  group.rules = ApacheRules.filter((rule) => rule.subcategory === group.id);
});

HAProxyCategory.groups.forEach((group) => {
  group.rules = HAProxyRules.filter((rule) => rule.subcategory === group.id);
});

TraefikCategory.groups.forEach((group) => {
  group.rules = TraefikRules.filter((rule) => rule.subcategory === group.id);
});

// Combined export
export const WebServerRules: AlertRuleTemplate[] = [
  ...NginxRules,
  ...ApacheRules,
  ...HAProxyRules,
  ...TraefikRules,
];

export const WebServerCategories: AlertRuleCategory[] = [
  NginxCategory,
  ApacheCategory,
  HAProxyCategory,
  TraefikCategory,
];
