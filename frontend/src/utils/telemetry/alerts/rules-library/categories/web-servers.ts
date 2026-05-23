/**
 * Web Servers & Proxies Alert Rules
 * Nginx, Apache, HAProxy, Traefik
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import { RuleCategory, DefaultDurations, DefaultIntervals } from "../types";

export const NginxCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.NGINX,
    name: "Nginx",
    description: "Monitor Nginx web server metrics",
    icon: "logos:nginx",
    exporter: "nginx_exporter",
    documentationUrl: "https://github.com/nginxinc/nginx-prometheus-exporter",
    ruleCount: 4,
  },
  groups: [
    { id: "health", name: "Health", description: "Health alerts", rules: [] },
    { id: "errors", name: "Errors", description: "Error alerts", rules: [] },
  ],
};

export const ApacheCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.APACHE,
    name: "Apache",
    description: "Monitor Apache HTTP Server metrics",
    icon: "logos:apache",
    exporter: "apache_exporter",
    documentationUrl: "https://github.com/Lusitaniae/apache_exporter",
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

export const HAProxyCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.HAPROXY,
    name: "HAProxy",
    description: "Monitor HAProxy load balancer metrics",
    icon: "simple-icons:haproxy",
    exporter: "haproxy_exporter",
    documentationUrl: "https://github.com/prometheus/haproxy_exporter",
    ruleCount: 5,
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

export const TraefikCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.TRAEFIK,
    name: "Traefik",
    description: "Monitor Traefik edge router metrics",
    icon: "logos:traefik",
    exporter: "traefik",
    documentationUrl:
      "https://doc.traefik.io/traefik/observability/metrics/prometheus/",
    ruleCount: 4,
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

export const WebServerRules: AlertRuleTemplate[] = [
  // Nginx
  {
    id: "nginx-down",
    name: "Nginx Down",
    description: "Nginx is down",
    category: RuleCategory.NGINX,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "nginx_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "nginx" },
    annotations: { summary: "Nginx down" },
    promql: "nginx_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "nginx-high-http-4xx-error-rate",
    name: "Nginx High HTTP 4xx Error Rate",
    description: "Too many HTTP 4xx errors (> 5%)",
    category: RuleCategory.NGINX,
    subcategory: "errors",
    severity: "warning",
    conditions: [
      {
        metric: "nginx_http_requests_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 5,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "nginx" },
    annotations: { summary: "Nginx high HTTP 4xx error rate" },
    promql:
      'sum(rate(nginx_http_requests_total{status=~"4.."}[5m])) / sum(rate(nginx_http_requests_total[5m])) * 100 > 5',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "nginx-high-http-5xx-error-rate",
    name: "Nginx High HTTP 5xx Error Rate",
    description: "Too many HTTP 5xx errors (> 5%)",
    category: RuleCategory.NGINX,
    subcategory: "errors",
    severity: "critical",
    conditions: [
      {
        metric: "nginx_http_requests_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 5,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "nginx" },
    annotations: { summary: "Nginx high HTTP 5xx error rate" },
    promql:
      'sum(rate(nginx_http_requests_total{status=~"5.."}[5m])) / sum(rate(nginx_http_requests_total[5m])) * 100 > 5',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Apache
  {
    id: "apache-down",
    name: "Apache Down",
    description: "Apache is down",
    category: RuleCategory.APACHE,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "apache_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "apache" },
    annotations: { summary: "Apache down" },
    promql: "apache_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "apache-workers-busy",
    name: "Apache Workers Busy",
    description: "Apache workers are busy (> 80%)",
    category: RuleCategory.APACHE,
    subcategory: "performance",
    severity: "warning",
    conditions: [
      {
        metric: "apache_workers",
        aggregation: "avg",
        operator: "gt",
        threshold: 80,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "apache" },
    annotations: { summary: "Apache workers busy" },
    promql:
      'apache_workers{state="busy"} / (apache_workers{state="busy"} + apache_workers{state="idle"}) * 100 > 80',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // HAProxy
  {
    id: "haproxy-down",
    name: "HAProxy Down",
    description: "HAProxy is down",
    category: RuleCategory.HAPROXY,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "haproxy_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "haproxy" },
    annotations: { summary: "HAProxy down" },
    promql: "haproxy_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "haproxy-backend-down",
    name: "HAProxy Backend Down",
    description: "HAProxy backend is down",
    category: RuleCategory.HAPROXY,
    subcategory: "backend",
    severity: "critical",
    conditions: [
      {
        metric: "haproxy_backend_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "haproxy" },
    annotations: { summary: "HAProxy backend down" },
    promql: "haproxy_backend_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "haproxy-server-down",
    name: "HAProxy Server Down",
    description: "HAProxy server is down",
    category: RuleCategory.HAPROXY,
    subcategory: "backend",
    severity: "warning",
    conditions: [
      {
        metric: "haproxy_server_up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "haproxy" },
    annotations: { summary: "HAProxy server down" },
    promql: "haproxy_server_up == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // Traefik
  {
    id: "traefik-backend-down",
    name: "Traefik Backend Down",
    description: "All Traefik backends are down",
    category: RuleCategory.TRAEFIK,
    subcategory: "health",
    severity: "critical",
    conditions: [
      {
        metric: "traefik_backend_server_up",
        aggregation: "count",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "traefik" },
    annotations: { summary: "Traefik backend down" },
    promql: "count(traefik_backend_server_up) == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "traefik-high-http-5xx-error-rate",
    name: "Traefik High HTTP 5xx Error Rate",
    description: "Traefik 5xx error rate is above 5%",
    category: RuleCategory.TRAEFIK,
    subcategory: "performance",
    severity: "critical",
    conditions: [
      {
        metric: "traefik_entrypoint_requests_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 5,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "traefik" },
    annotations: { summary: "Traefik high HTTP 5xx error rate" },
    promql:
      'sum(rate(traefik_entrypoint_requests_total{code=~"5.."}[5m])) / sum(rate(traefik_entrypoint_requests_total[5m])) * 100 > 5',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
];

export const WebServerCategories: AlertRuleCategory[] = [
  NginxCategory,
  ApacheCategory,
  HAProxyCategory,
  TraefikCategory,
];

// Update categories with rules
WebServerCategories.forEach((cat) => {
  const categoryRules = WebServerRules.filter(
    (r) => r.category === cat.metadata.id,
  );
  cat.groups.forEach((group) => {
    group.rules = categoryRules.filter((rule) => rule.subcategory === group.id);
  });
});
