/**
 * Network & Security Alert Rules
 * Blackbox Exporter, SSL/TLS, DNS
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import {
  RuleCategory,
  DefaultDurations,
  DefaultIntervals,
  DefaultThresholds,
  AlertSourceType,
  QueryLanguage,
} from "../types";

export const BlackboxCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.BLACKBOX,
    name: "Blackbox Exporter",
    description: "Monitor endpoints, DNS, TCP, ICMP probes",
    icon: "mdi:probe",
    exporter: "blackbox_exporter",
    documentationUrl: "https://github.com/prometheus/blackbox_exporter",
    ruleCount: 4,
  },
  groups: [
    { id: "probe", name: "Probe", description: "Probe alerts", rules: [] },
    { id: "http", name: "HTTP", description: "HTTP probe alerts", rules: [] },
  ],
};

export const SSLTLSCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.SSL_TLS,
    name: "SSL/TLS",
    description: "Monitor SSL/TLS certificate expiration and validity",
    icon: "mdi:certificate",
    exporter: "blackbox_exporter / ssl_exporter / tfo-uptime",
    documentationUrl: "https://github.com/prometheus/blackbox_exporter",
    ruleCount: 6,
  },
  groups: [
    {
      id: "expiry",
      name: "Expiry (Prometheus)",
      description: "Certificate expiry alerts via Blackbox Exporter",
      rules: [],
    },
    {
      id: "tfo-uptime",
      name: "Expiry (TFO Uptime)",
      description: "Certificate expiry alerts via TelemetryFlow Uptime Monitoring",
      rules: [],
    },
  ],
};

export const DNSCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.DNS,
    name: "DNS",
    description: "Monitor DNS resolution and health",
    icon: "mdi:dns",
    exporter: "blackbox_exporter / coredns",
    documentationUrl: "https://github.com/prometheus/blackbox_exporter",
    ruleCount: 3,
  },
  groups: [
    {
      id: "resolution",
      name: "Resolution",
      description: "DNS resolution alerts",
      rules: [],
    },
    {
      id: "performance",
      name: "Performance",
      description: "DNS performance alerts",
      rules: [],
    },
  ],
};

export const NetworkSecurityRules: AlertRuleTemplate[] = [
  // Blackbox
  {
    id: "probe-failed",
    name: "Probe Failed",
    description: "Probe failed",
    category: RuleCategory.BLACKBOX,
    subcategory: "probe",
    severity: "critical",
    conditions: [
      {
        metric: "probe_success",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "blackbox" },
    annotations: { summary: "Probe failed (instance {{ $labels.instance }})" },
    promql: "probe_success == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "probe-slow",
    name: "Probe Slow",
    description: "Probe is slow (> 1 second)",
    category: RuleCategory.BLACKBOX,
    subcategory: "probe",
    severity: "warning",
    conditions: [
      {
        metric: "probe_duration_seconds",
        aggregation: "avg",
        operator: "gt",
        threshold: 1,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "blackbox" },
    annotations: { summary: "Probe slow (instance {{ $labels.instance }})" },
    promql: "avg_over_time(probe_duration_seconds[1m]) > 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "http-status-code-error",
    name: "HTTP Status Code Error",
    description: "HTTP probe returned non-2xx/3xx status code",
    category: RuleCategory.BLACKBOX,
    subcategory: "http",
    severity: "critical",
    conditions: [
      {
        metric: "probe_http_status_code",
        aggregation: "last",
        operator: "lte",
        threshold: 199,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "blackbox" },
    annotations: { summary: "HTTP status code error" },
    promql: "probe_http_status_code <= 199 OR probe_http_status_code >= 400",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // SSL/TLS
  {
    id: "ssl-certificate-expiry-30days",
    name: "SSL Certificate Expiring in 30 Days",
    description: "SSL certificate expires in 30 days",
    category: RuleCategory.SSL_TLS,
    subcategory: "expiry",
    severity: "warning",
    conditions: [
      {
        metric: "probe_ssl_earliest_cert_expiry",
        aggregation: "last",
        operator: "lt",
        threshold: DefaultThresholds.SSL_EXPIRY_WARNING_DAYS * 86400,
        duration: "15m",
      },
    ],
    evaluationInterval: DefaultIntervals.SLOW,
    forDuration: DefaultDurations.LONG,
    labels: { component: "ssl" },
    annotations: { summary: "SSL certificate expiring soon" },
    promql: "probe_ssl_earliest_cert_expiry - time() < 86400 * 30",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "ssl-certificate-expiry-7days",
    name: "SSL Certificate Expiring in 7 Days",
    description: "SSL certificate expires in 7 days",
    category: RuleCategory.SSL_TLS,
    subcategory: "expiry",
    severity: "critical",
    conditions: [
      {
        metric: "probe_ssl_earliest_cert_expiry",
        aggregation: "last",
        operator: "lt",
        threshold: DefaultThresholds.SSL_EXPIRY_CRITICAL_DAYS * 86400,
        duration: "15m",
      },
    ],
    evaluationInterval: DefaultIntervals.SLOW,
    forDuration: DefaultDurations.LONG,
    labels: { component: "ssl" },
    annotations: { summary: "SSL certificate expiring very soon" },
    promql: "probe_ssl_earliest_cert_expiry - time() < 86400 * 7",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "ssl-certificate-expired",
    name: "SSL Certificate Expired",
    description: "SSL certificate has expired",
    category: RuleCategory.SSL_TLS,
    subcategory: "expiry",
    severity: "critical",
    conditions: [
      {
        metric: "probe_ssl_earliest_cert_expiry",
        aggregation: "last",
        operator: "lte",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "ssl" },
    annotations: { summary: "SSL certificate expired" },
    promql: "probe_ssl_earliest_cert_expiry - time() <= 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // ─── TFO Uptime SSL (native TelemetryFlow uptime monitoring) ────────────────
  // These use ssl_days_remaining from ClickHouse uptime_checks via condition query.
  // Source: TFO Uptime Scheduler — HTTPS/SSL_CERTIFICATE monitors only.
  {
    id: "tfo-uptime-ssl-expiry-30days",
    name: "SSL Certificate Expiring in 30 Days (TFO Uptime)",
    description:
      "Alert when an HTTPS monitor's SSL certificate will expire within 30 days. " +
      "Triggered by TFO Uptime monitoring via ClickHouse uptime_checks.",
    category: RuleCategory.SSL_TLS,
    subcategory: "tfo-uptime",
    severity: "warning",
    sourceType: AlertSourceType.TFO_COLLECTOR,
    queryLanguage: QueryLanguage.CONDITION,
    queryTarget: "uptime",
    tfqlQuery: "min(ssl_days_remaining) < 30",
    conditions: [
      {
        metric: "ssl_days_remaining",
        aggregation: "min",
        operator: "lt",
        threshold: DefaultThresholds.SSL_EXPIRY_WARNING_DAYS,
        duration: "1h",
        labels: { type: "uptime" },
      },
    ],
    evaluationInterval: "1h",
    forDuration: "1h",
    labels: { team: "platform", type: "ssl-expiry", component: "certificate" },
    annotations: {
      summary: "SSL certificate for {{ $labels.monitor }} expires in {{ $value }} days",
      description:
        "The SSL certificate will expire in {{ $value }} days. " +
        "Renew before the 7-day critical threshold is reached.",
      runbook: "https://docs.telemetryflow.id/runbooks/ssl-renewal",
    },
    enabled: true,
    source: { name: "TelemetryFlow" },
  },
  {
    id: "tfo-uptime-ssl-expiry-7days",
    name: "SSL Certificate Expiring in 7 Days (TFO Uptime)",
    description:
      "Critical alert when an HTTPS monitor's SSL certificate will expire within 7 days. " +
      "Triggered by TFO Uptime monitoring via ClickHouse uptime_checks.",
    category: RuleCategory.SSL_TLS,
    subcategory: "tfo-uptime",
    severity: "critical",
    sourceType: AlertSourceType.TFO_COLLECTOR,
    queryLanguage: QueryLanguage.CONDITION,
    queryTarget: "uptime",
    tfqlQuery: "min(ssl_days_remaining) < 7",
    conditions: [
      {
        metric: "ssl_days_remaining",
        aggregation: "min",
        operator: "lt",
        threshold: DefaultThresholds.SSL_EXPIRY_CRITICAL_DAYS,
        duration: "30m",
        labels: { type: "uptime" },
      },
    ],
    evaluationInterval: "30m",
    forDuration: "30m",
    labels: { team: "platform", type: "ssl-expiry", component: "certificate", urgency: "high" },
    annotations: {
      summary: "CRITICAL: SSL certificate for {{ $labels.monitor }} expires in {{ $value }} days",
      description:
        "The SSL certificate will expire in {{ $value }} days. " +
        "Immediate renewal required to prevent service disruption.",
      runbook: "https://docs.telemetryflow.id/runbooks/ssl-renewal",
    },
    enabled: true,
    source: { name: "TelemetryFlow" },
  },
  {
    id: "tfo-uptime-ssl-expired",
    name: "SSL Certificate Expired (TFO Uptime)",
    description:
      "Critical alert when an HTTPS monitor's SSL certificate has expired. " +
      "Triggered by TFO Uptime monitoring via ClickHouse uptime_checks.",
    category: RuleCategory.SSL_TLS,
    subcategory: "tfo-uptime",
    severity: "critical",
    sourceType: AlertSourceType.TFO_COLLECTOR,
    queryLanguage: QueryLanguage.CONDITION,
    queryTarget: "uptime",
    tfqlQuery: "min(ssl_days_remaining) <= 0",
    conditions: [
      {
        metric: "ssl_days_remaining",
        aggregation: "min",
        operator: "lte",
        threshold: 0,
        duration: "5m",
        labels: { type: "uptime" },
      },
    ],
    evaluationInterval: "5m",
    forDuration: "5m",
    labels: { team: "platform", type: "ssl-expired", component: "certificate", urgency: "critical" },
    annotations: {
      summary: "SSL certificate for {{ $labels.monitor }} has EXPIRED",
      description:
        "The SSL certificate has expired. HTTPS traffic will fail with certificate errors. " +
        "Renew the certificate immediately.",
      runbook: "https://docs.telemetryflow.id/runbooks/ssl-renewal",
    },
    enabled: true,
    source: { name: "TelemetryFlow" },
  },

  // DNS
  {
    id: "dns-probe-failed",
    name: "DNS Probe Failed",
    description: "DNS probe failed",
    category: RuleCategory.DNS,
    subcategory: "resolution",
    severity: "critical",
    conditions: [
      {
        metric: "probe_dns_lookup_time_seconds",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "dns" },
    annotations: { summary: "DNS probe failed" },
    promql: "probe_dns_lookup_time_seconds == 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "dns-lookup-slow",
    name: "DNS Lookup Slow",
    description: "DNS lookup is slow (> 1 second)",
    category: RuleCategory.DNS,
    subcategory: "performance",
    severity: "warning",
    conditions: [
      {
        metric: "probe_dns_lookup_time_seconds",
        aggregation: "avg",
        operator: "gt",
        threshold: 1,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "dns" },
    annotations: { summary: "DNS lookup slow" },
    promql: "probe_dns_lookup_time_seconds > 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "coredns-down",
    name: "CoreDNS Down",
    description: "CoreDNS is down",
    category: RuleCategory.DNS,
    subcategory: "resolution",
    severity: "critical",
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
        labels: { job: "coredns" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "coredns" },
    annotations: { summary: "CoreDNS down" },
    promql: 'up{job="coredns"} == 0',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
];

export const NetworkSecurityCategories: AlertRuleCategory[] = [
  BlackboxCategory,
  SSLTLSCategory,
  DNSCategory,
];

// Update categories with rules
NetworkSecurityCategories.forEach((cat) => {
  const categoryRules = NetworkSecurityRules.filter(
    (r) => r.category === cat.metadata.id,
  );
  cat.groups.forEach((group) => {
    group.rules = categoryRules.filter((rule) => rule.subcategory === group.id);
  });
});
