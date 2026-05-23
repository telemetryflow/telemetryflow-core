/**
 * Network & Security Alert Rules
 * Blackbox Exporter, SSL/TLS, DNS
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#network
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultThresholds,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

// ====================== BLACKBOX ======================
export const BlackboxCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.BLACKBOX,
    name: "Blackbox Exporter",
    description: "Monitor endpoints, DNS, TCP, ICMP probes",
    icon: "mdi:probe",
    exporter: "blackbox_exporter",
    documentationUrl: "https://github.com/prometheus/blackbox_exporter",
    ruleCount: 15,
  },
  groups: [
    { id: "probe", name: "Probe", description: "Probe alerts", rules: [] },
    {
      id: "ssl",
      name: "SSL/TLS",
      description: "SSL certificate alerts",
      rules: [],
    },
    { id: "http", name: "HTTP", description: "HTTP probe alerts", rules: [] },
  ],
};

export const BlackboxRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("probe-failed")
    .name("Probe Failed")
    .description("Probe failed")
    .category(RuleCategory.BLACKBOX, "probe")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("probe_success")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "blackbox", type: "probe" })
    .annotations({
      summary: "Probe failed (instance {{ $labels.instance }})",
      description: "Probe failed for {{ $labels.instance }}",
    })
    .promql("probe_success == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("probe-slow")
    .name("Probe Slow")
    .description("Probe is slow (> 1 second)")
    .category(RuleCategory.BLACKBOX, "probe")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("probe_duration_seconds")
        .avg()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "blackbox", type: "latency" })
    .annotations({
      summary: "Probe slow (instance {{ $labels.instance }})",
      description: "Probe is slow: {{ $value }}s",
    })
    .promql("avg_over_time(probe_duration_seconds[1m]) > 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("http-status-code-error")
    .name("HTTP Status Code Error")
    .description("HTTP probe returned non-2xx/3xx status code")
    .category(RuleCategory.BLACKBOX, "http")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("probe_http_status_code")
        .last()
        .lte(199)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "blackbox", type: "http" })
    .annotations({
      summary: "HTTP status code error (instance {{ $labels.instance }})",
      description: "HTTP status code is {{ $value }}",
    })
    .promql("probe_http_status_code <= 199 OR probe_http_status_code >= 400")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("http-version-mismatch")
    .name("HTTP Version Mismatch")
    .description("HTTP probe returned unexpected version")
    .category(RuleCategory.BLACKBOX, "http")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("probe_http_version")
        .last()
        .lt(2)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "blackbox", type: "http" })
    .annotations({
      summary: "HTTP version mismatch (instance {{ $labels.instance }})",
      description: "HTTP version is not HTTP/2",
    })
    .promql("probe_http_version < 2")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== SSL/TLS ======================
export const SSLTLSCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.SSL_TLS,
    name: "SSL/TLS",
    description: "Monitor SSL/TLS certificate expiration and validity",
    icon: "mdi:certificate",
    exporter: "blackbox_exporter / ssl_exporter",
    documentationUrl: "https://github.com/prometheus/blackbox_exporter",
    ruleCount: 8,
  },
  groups: [
    {
      id: "expiry",
      name: "Expiry",
      description: "Certificate expiry alerts",
      rules: [],
    },
    {
      id: "validity",
      name: "Validity",
      description: "Certificate validity alerts",
      rules: [],
    },
  ],
};

export const SSLTLSRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("ssl-certificate-expiry-30days")
    .name("SSL Certificate Expiring in 30 Days")
    .description("SSL certificate expires in 30 days")
    .category(RuleCategory.SSL_TLS, "expiry")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("probe_ssl_earliest_cert_expiry")
        .last()
        .lt(DefaultThresholds.SSL_EXPIRY_WARNING_DAYS * 86400)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "ssl", type: "expiry" })
    .annotations({
      summary:
        "SSL certificate expiring soon (instance {{ $labels.instance }})",
      description: "SSL certificate expires in {{ $value | humanizeDuration }}",
    })
    .promql("probe_ssl_earliest_cert_expiry - time() < 86400 * 30")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ssl-certificate-expiry-7days")
    .name("SSL Certificate Expiring in 7 Days")
    .description("SSL certificate expires in 7 days")
    .category(RuleCategory.SSL_TLS, "expiry")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("probe_ssl_earliest_cert_expiry")
        .last()
        .lt(DefaultThresholds.SSL_EXPIRY_CRITICAL_DAYS * 86400)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "ssl", type: "expiry" })
    .annotations({
      summary:
        "SSL certificate expiring very soon (instance {{ $labels.instance }})",
      description: "SSL certificate expires in {{ $value | humanizeDuration }}",
    })
    .promql("probe_ssl_earliest_cert_expiry - time() < 86400 * 7")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ssl-certificate-expired")
    .name("SSL Certificate Expired")
    .description("SSL certificate has expired")
    .category(RuleCategory.SSL_TLS, "expiry")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("probe_ssl_earliest_cert_expiry")
        .last()
        .lte(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "ssl", type: "expiry" })
    .annotations({
      summary: "SSL certificate expired (instance {{ $labels.instance }})",
      description: "SSL certificate has expired",
    })
    .promql("probe_ssl_earliest_cert_expiry - time() <= 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("ssl-certificate-chain-issue")
    .name("SSL Certificate Chain Issue")
    .description("SSL certificate chain has issues")
    .category(RuleCategory.SSL_TLS, "validity")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("probe_ssl_last_chain_expiry_timestamp_seconds")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "ssl", type: "chain" })
    .annotations({
      summary: "SSL certificate chain issue (instance {{ $labels.instance }})",
      description: "SSL certificate chain has issues",
    })
    .promql("probe_ssl_last_chain_expiry_timestamp_seconds == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// ====================== DNS ======================
export const DNSCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.DNS,
    name: "DNS",
    description: "Monitor DNS resolution and health",
    icon: "mdi:dns",
    exporter: "blackbox_exporter / coredns",
    documentationUrl: "https://github.com/prometheus/blackbox_exporter",
    ruleCount: 6,
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

export const DNSRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("dns-probe-failed")
    .name("DNS Probe Failed")
    .description("DNS probe failed")
    .category(RuleCategory.DNS, "resolution")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("probe_dns_lookup_time_seconds")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "dns", type: "probe" })
    .annotations({
      summary: "DNS probe failed (instance {{ $labels.instance }})",
      description: "DNS probe failed for {{ $labels.instance }}",
    })
    .promql("probe_dns_lookup_time_seconds == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("dns-lookup-slow")
    .name("DNS Lookup Slow")
    .description("DNS lookup is slow (> 1 second)")
    .category(RuleCategory.DNS, "performance")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("probe_dns_lookup_time_seconds")
        .avg()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "dns", type: "latency" })
    .annotations({
      summary: "DNS lookup slow (instance {{ $labels.instance }})",
      description: "DNS lookup is slow: {{ $value }}s",
    })
    .promql("probe_dns_lookup_time_seconds > 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("coredns-down")
    .name("CoreDNS Down")
    .description("CoreDNS is down")
    .category(RuleCategory.DNS, "resolution")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("up")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .label("job", "coredns")
        .build(),
    )
    .labels({ component: "coredns", type: "availability" })
    .annotations({
      summary: "CoreDNS down (instance {{ $labels.instance }})",
      description: "CoreDNS is down",
    })
    .promql('up{job="coredns"} == 0')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("coredns-panic")
    .name("CoreDNS Panic")
    .description("CoreDNS has panicked")
    .category(RuleCategory.DNS, "resolution")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("coredns_panics_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "coredns", type: "panic" })
    .annotations({
      summary: "CoreDNS panic (instance {{ $labels.instance }})",
      description: "CoreDNS has panicked",
    })
    .promql("increase(coredns_panics_total[10m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// Update categories with rules
BlackboxCategory.groups.forEach((group) => {
  group.rules = BlackboxRules.filter((rule) => rule.subcategory === group.id);
});

SSLTLSCategory.groups.forEach((group) => {
  group.rules = SSLTLSRules.filter((rule) => rule.subcategory === group.id);
});

DNSCategory.groups.forEach((group) => {
  group.rules = DNSRules.filter((rule) => rule.subcategory === group.id);
});

// Combined export
export const NetworkSecurityRules: AlertRuleTemplate[] = [
  ...BlackboxRules,
  ...SSLTLSRules,
  ...DNSRules,
];

export const NetworkSecurityCategories: AlertRuleCategory[] = [
  BlackboxCategory,
  SSLTLSCategory,
  DNSCategory,
];
