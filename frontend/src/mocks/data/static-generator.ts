/**
 * Static Mock Data Generator
 * Pre-generates 1000 realistic data entries for metrics, logs, traces, and exemplars
 * Compatible with OTEL v1 and TelemetryFlow v2 APIs
 */

import type {
  MetricSeries,
  LogRecord,
  Trace,
  TraceSummary,
  Exemplar,
  LogSeverityNumber,
  LogLevel,
} from "@/types";
import {
  SERVICES,
  SERVICE_METADATA,
  OPERATIONS,
  K8S_CLUSTER,
  randomId,
  randomItem,
  randomBetween,
  generatePrivateIP,
  getServiceMetadata,
  calculateServiceLatency,
  ERROR_TYPES,
} from "../shared";
import { getRandomPod } from "./correlated-registry";

// ============================================================================
// Configuration
// ============================================================================

const STATIC_DATA_CONFIG = {
  metrics: {
    count: 1000,
    timeRangeMs: 3600000, // 1 hour
  },
  logs: {
    count: 1000,
    timeRangeMs: 3600000,
  },
  traces: {
    count: 1000,
    timeRangeMs: 3600000,
  },
  exemplars: {
    count: 1000,
    timeRangeMs: 3600000,
  },
};

// ============================================================================
// Static Data Storage
// ============================================================================

interface StaticDataStore {
  metrics: MetricSeries[];
  logs: LogRecord[];
  traces: Trace[];
  traceSummaries: TraceSummary[];
  exemplars: Exemplar[];
  generatedAt: number;
  version: string;
}

let staticData: StaticDataStore | null = null;

// ============================================================================
// Console Logging Utilities
// ============================================================================

const LOG_COLORS = {
  metrics: "\x1b[36m", // Cyan
  logs: "\x1b[33m", // Yellow
  traces: "\x1b[35m", // Magenta
  exemplars: "\x1b[32m", // Green
  k8s: "\x1b[34m", // Blue
  reset: "\x1b[0m",
};

export function logFetch(
  feature: string,
  action: string,
  details?: string,
): void {
  const timestamp = new Date().toISOString();
  const color =
    LOG_COLORS[feature as keyof typeof LOG_COLORS] || LOG_COLORS.reset;
  const prefix = feature.toUpperCase().padEnd(10);
  const message = details ? `${action}: ${details}` : action;
  console.log(
    `${color}[${prefix}]${LOG_COLORS.reset} ${timestamp} - ${message}`,
  );
}

// ============================================================================
// Metric Generators
// ============================================================================

function generateStaticMetricDataPoint(
  metricName: string,
  service: string,
  timestamp: number,
  index: number,
): { timestamp: number; value: number } {
  const baseValues: Record<string, number> = {
    http_server_request_duration_seconds: 0.05,
    http_server_requests_total: 100,
    http_server_active_requests: 25,
    rpc_server_duration_seconds: 0.02,
    db_client_operation_duration_seconds: 0.01,
    process_cpu_seconds_total: 50,
    process_resident_memory_bytes: 512000000,
    cache_hits_total: 500,
    cache_misses_total: 50,
  };

  const base = baseValues[metricName] || 100;
  const serviceMultiplier =
    service === "api-gateway" ? 2 : service === "payment-service" ? 0.5 : 1;
  const timeVariance = Math.sin(index / 10) * 0.2;
  const noise = (Math.random() - 0.5) * 0.3;
  const spike = Math.random() < 0.02 ? randomBetween(1, 3) : 1;

  return {
    timestamp,
    value: Math.max(
      0,
      base * serviceMultiplier * (1 + timeVariance + noise) * spike,
    ),
  };
}

function generateStaticMetrics(): MetricSeries[] {
  logFetch(
    "metrics",
    "Generating static metrics",
    `count=${STATIC_DATA_CONFIG.metrics.count}`,
  );

  const metricNames = [
    "http_server_request_duration_seconds",
    "http_server_requests_total",
    "http_server_active_requests",
    "rpc_server_duration_seconds",
    "db_client_operation_duration_seconds",
    "process_cpu_seconds_total",
    "process_resident_memory_bytes",
    "cache_hits_total",
    "cache_misses_total",
    "orders_created_total",
  ];

  const series: MetricSeries[] = [];
  const now = Date.now();
  const step = STATIC_DATA_CONFIG.metrics.timeRangeMs / 60;

  for (let i = 0; i < STATIC_DATA_CONFIG.metrics.count; i++) {
    const service = randomItem(SERVICES);
    const metricName = randomItem(metricNames);
    const values = [];

    for (let j = 0; j < 60; j++) {
      const timestamp = now - STATIC_DATA_CONFIG.metrics.timeRangeMs + j * step;
      values.push(
        generateStaticMetricDataPoint(metricName, service, timestamp, j),
      );
    }

    series.push({
      metric: metricName,
      labels: {
        service,
        instance: `${service}-pod-${randomId(5)}:8080`,
        job: service,
        namespace: "ecommerce",
      },
      values,
    });

    if ((i + 1) % 100 === 0) {
      logFetch(
        "metrics",
        "Progress",
        `${i + 1}/${STATIC_DATA_CONFIG.metrics.count} series generated`,
      );
    }
  }

  logFetch(
    "metrics",
    "Static metrics generated",
    `total=${series.length} series`,
  );
  return series;
}

// ============================================================================
// Log Generators
// ============================================================================

const LOG_TEMPLATES: Record<string, Record<string, string[]>> = {
  "api-gateway": {
    info: [
      "Request completed: GET /api/v1/products 200 OK {duration}ms",
      "Request completed: POST /api/v1/orders 201 Created {duration}ms",
      "Rate limit check passed: user={userId} remaining=80/100",
      "JWT token validated successfully for user={userId}",
      "Upstream health check passed: {service}",
    ],
    warn: [
      "Slow upstream response: {service} took {duration}ms (threshold: 1000ms)",
      "Rate limit approaching: user={userId} at 90% capacity",
      "Retry attempt 2/3 for upstream: {service}",
      "Request body size warning: {size}KB exceeds soft limit",
    ],
    error: [
      "Upstream connection failed: {service} - connection refused",
      "Request timeout: {service} exceeded 30s limit",
      "Circuit breaker opened for {service}: 5 failures in 60s",
      "TLS handshake failed with {service}: certificate expired",
    ],
  },
  "order-service": {
    info: [
      "Order created: orderId={orderId} total=${total} items={items}",
      "Order status updated: {orderId} -> PROCESSING",
      "Payment authorized for order: {orderId} authCode={authCode}",
      "Inventory reserved for order: {orderId} items={items}",
    ],
    warn: [
      "Partial inventory: order={orderId} reserved {reserved}/{requested} items",
      "Payment retry scheduled: order={orderId} attempt 2/3",
      "Order pending for 15+ minutes: {orderId}",
    ],
    error: [
      "Order creation failed: insufficient inventory for SKU-{sku}",
      "Payment declined for order {orderId}: {reason}",
      "Failed to publish order event: Kafka broker unavailable",
    ],
  },
  "payment-service": {
    info: [
      "Payment processed: txn={txnId} amount=${amount} status=success",
      "Refund completed: txn={txnId} amount=${amount}",
      "Payment method validated: card ending {last4}",
      "Webhook received: payment.succeeded for {txnId}",
    ],
    warn: [
      "Stripe API latency warning: {duration}ms",
      "3D Secure challenge required: txn={txnId}",
      "Fraud score elevated: txn={txnId} score={score}",
    ],
    error: [
      "Payment failed: {reason} for txn={txnId}",
      "Stripe API error: 503 Service Unavailable",
      "Webhook verification failed: invalid signature",
    ],
  },
  "user-service": {
    info: [
      "User authenticated: userId={userId} method=password",
      "Session created: sessionId={sessionId} TTL=86400s",
      "User profile updated: userId={userId} fields=[{fields}]",
      "Password updated successfully for userId={userId}",
    ],
    warn: [
      "Failed login attempt {attempt}/5 for {email}",
      "Session expiring soon: sessionId={sessionId}",
      "Suspicious activity detected: userId={userId}",
    ],
    error: [
      "Authentication failed: invalid credentials for {email}",
      "Session store unavailable: Redis connection refused",
      "User not found: userId={userId}",
    ],
  },
  "product-catalog": {
    info: [
      'Product fetched: SKU-{sku} "{name}" price=${price}',
      'Search completed: query="{query}" results={count} latency={duration}ms',
      "Cache hit: product:{sku} TTL={ttl}s",
      "Category loaded: {category} products={count}",
    ],
    warn: [
      'Slow search query: {duration}ms for "{query}"',
      "Cache miss rate elevated: {rate}%",
      "Elasticsearch replica lag: {lag}ms",
    ],
    error: [
      "Product not found: SKU-{sku}",
      "Elasticsearch query failed: timeout after 30s",
      "Failed to index product: SKU-{sku}",
    ],
  },
  "inventory-service": {
    info: [
      "Stock checked: SKU-{sku} available={available} reserved={reserved}",
      "Reservation created: SKU-{sku} qty={qty} orderId={orderId}",
      "Stock released: SKU-{sku} qty={qty} reason={reason}",
      "Inventory sync completed: {count} items updated",
    ],
    warn: [
      "Low stock alert: SKU-{sku} only {count} remaining",
      "Reservation expiring: orderId={orderId}",
      "Warehouse sync delayed: {delay}s",
    ],
    error: [
      "Insufficient stock: SKU-{sku} requested={requested} available={available}",
      "Failed to acquire lock: SKU-{sku} timeout",
      "Warehouse API unavailable",
    ],
  },
};

const SEVERITY_MAP: Record<LogLevel, LogSeverityNumber> = {
  trace: 1,
  debug: 5,
  info: 9,
  warn: 13,
  error: 17,
  fatal: 21,
};

function fillTemplate(template: string): string {
  return template
    .replace("{duration}", String(Math.floor(randomBetween(10, 500))))
    .replace("{userId}", `user-${randomId(8)}`)
    .replace("{sessionId}", `sess-${randomId(12)}`)
    .replace("{orderId}", `ORD-${randomId(8).toUpperCase()}`)
    .replace("{txnId}", `TXN-${randomId(10).toUpperCase()}`)
    .replace("{authCode}", `AUTH-${randomId(6).toUpperCase()}`)
    .replace("{sku}", randomId(6).toUpperCase())
    .replace("{total}", String(randomBetween(20, 500).toFixed(2)))
    .replace("{amount}", String(randomBetween(10, 300).toFixed(2)))
    .replace("{items}", String(Math.floor(randomBetween(1, 10))))
    .replace("{reserved}", String(Math.floor(randomBetween(1, 5))))
    .replace("{requested}", String(Math.floor(randomBetween(5, 10))))
    .replace("{service}", randomItem(SERVICES))
    .replace("{size}", String(Math.floor(randomBetween(100, 2000))))
    .replace("{last4}", String(Math.floor(randomBetween(1000, 9999))))
    .replace("{score}", String(Math.floor(randomBetween(50, 95))))
    .replace(
      "{reason}",
      randomItem(["card_declined", "insufficient_funds", "expired_card"]),
    )
    .replace("{email}", `user${Math.floor(randomBetween(1, 1000))}@telemetryflow.id`)
    .replace("{attempt}", String(Math.floor(randomBetween(1, 5))))
    .replace("{fields}", randomItem(["name", "email", "phone", "address"]))
    .replace(
      "{name}",
      randomItem([
        "Premium Laptop",
        "Wireless Mouse",
        "USB-C Hub",
        "Monitor Stand",
      ]),
    )
    .replace("{price}", String(randomBetween(20, 1000).toFixed(2)))
    .replace(
      "{query}",
      randomItem(["laptop", "wireless", "usb", "monitor", "keyboard"]),
    )
    .replace("{count}", String(Math.floor(randomBetween(10, 500))))
    .replace("{ttl}", String(Math.floor(randomBetween(60, 3600))))
    .replace(
      "{category}",
      randomItem(["Electronics", "Accessories", "Office", "Gaming"]),
    )
    .replace("{rate}", String(Math.floor(randomBetween(5, 30))))
    .replace("{lag}", String(Math.floor(randomBetween(100, 5000))))
    .replace("{available}", String(Math.floor(randomBetween(0, 100))))
    .replace("{qty}", String(Math.floor(randomBetween(1, 10))))
    .replace("{delay}", String(Math.floor(randomBetween(30, 300))));
}

/**
 * Generate resource attributes using correlated pod data
 */
function generateCorrelatedResourceAttributes(
  service: string,
): Record<string, string | number> {
  const metadata = getServiceMetadata(service);
  const pod = getRandomPod(service);

  if (pod) {
    return {
      "service.name": service,
      "service.version": metadata.version,
      "service.namespace": "ecommerce",
      "telemetry.sdk.name": "opentelemetry",
      "telemetry.sdk.language": metadata.language,
      "telemetry.sdk.version": metadata.sdkVersion,
      "deployment.environment": "production",
      "cloud.provider": "aws",
      "cloud.region": K8S_CLUSTER.region,
      "k8s.cluster.name": K8S_CLUSTER.name,
      "k8s.namespace.name": pod.namespace,
      "k8s.deployment.name": service,
      "k8s.pod.name": pod.name,
      "k8s.node.name": pod.nodeName,
      "container.runtime": "containerd",
      "host.arch": "amd64",
    };
  }

  return {
    "service.name": service,
    "service.version": metadata.version,
    "service.namespace": "ecommerce",
    "telemetry.sdk.name": "opentelemetry",
    "telemetry.sdk.language": metadata.language,
    "telemetry.sdk.version": metadata.sdkVersion,
    "deployment.environment": "production",
    "cloud.provider": "aws",
    "cloud.region": K8S_CLUSTER.region,
    "k8s.cluster.name": K8S_CLUSTER.name,
    "k8s.namespace.name": "ecommerce",
    "k8s.deployment.name": service,
    "k8s.pod.name": `${service}-unknown-${randomId(5)}`,
    "k8s.node.name": "unknown",
    "container.runtime": "containerd",
    "host.arch": "amd64",
  };
}

function generateStaticLog(timestamp: number): LogRecord {
  const service = randomItem(SERVICES);
  const serviceTemplates =
    LOG_TEMPLATES[service] || LOG_TEMPLATES["api-gateway"];

  // Weighted level distribution
  const levelRoll = Math.random();
  let level: "info" | "warn" | "error";
  if (levelRoll < 0.7) {
    level = "info";
  } else if (levelRoll < 0.9) {
    level = "warn";
  } else {
    level = "error";
  }

  const templates = serviceTemplates[level] || serviceTemplates.info;
  const template = randomItem(templates);
  const body = fillTemplate(template);

  const metadata = SERVICE_METADATA[service as keyof typeof SERVICE_METADATA];
  const hasTraceContext =
    level === "error" ? Math.random() < 0.9 : Math.random() < 0.4;

  const rawResource = generateCorrelatedResourceAttributes(service);
  const resource: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawResource)) {
    resource[key] = String(value);
  }

  return {
    id: randomId(16),
    timestamp,
    observedTimestamp: timestamp + Math.floor(randomBetween(1, 50)),
    severityNumber: SEVERITY_MAP[level],
    severityText: level,
    body,
    attributes: {
      "code.filepath": `src/${service}.${metadata?.language === "go" ? "go" : metadata?.language === "java" ? "java" : "py"}`,
      "code.lineno": String(Math.floor(randomBetween(10, 500))),
      "thread.id": String(Math.floor(randomBetween(1, 100))),
      "log.logger": service,
    },
    resource,
    traceId: hasTraceContext ? randomId(32) : undefined,
    spanId: hasTraceContext ? randomId(16) : undefined,
  };
}

function generateStaticLogs(): LogRecord[] {
  logFetch(
    "logs",
    "Generating static logs",
    `count=${STATIC_DATA_CONFIG.logs.count}`,
  );

  const logs: LogRecord[] = [];
  const now = Date.now();

  for (let i = 0; i < STATIC_DATA_CONFIG.logs.count; i++) {
    const timestamp =
      now - Math.floor(Math.random() * STATIC_DATA_CONFIG.logs.timeRangeMs);
    logs.push(generateStaticLog(timestamp));

    if ((i + 1) % 100 === 0) {
      logFetch(
        "logs",
        "Progress",
        `${i + 1}/${STATIC_DATA_CONFIG.logs.count} logs generated`,
      );
    }
  }

  logs.sort((a, b) => b.timestamp - a.timestamp);
  logFetch("logs", "Static logs generated", `total=${logs.length}`);
  return logs;
}

// ============================================================================
// Trace Generators
// ============================================================================

const TRACE_FLOWS = [
  {
    name: "checkout",
    services: [
      "frontend",
      "api-gateway",
      "cart-service",
      "order-service",
      "payment-service",
      "inventory-service",
      "notification-service",
    ],
  },
  {
    name: "browse",
    services: [
      "frontend",
      "api-gateway",
      "product-catalog",
      "search-service",
      "recommendation-engine",
    ],
  },
  { name: "login", services: ["frontend", "api-gateway", "user-service"] },
  {
    name: "search",
    services: ["api-gateway", "search-service", "product-catalog"],
  },
  {
    name: "cart",
    services: ["frontend", "api-gateway", "cart-service", "product-catalog"],
  },
];

function generateStaticSpan(
  traceId: string,
  parentSpanId: string | undefined,
  service: string,
  startTime: number,
  depth: number,
) {
  const operations = OPERATIONS[service as keyof typeof OPERATIONS] || [
    "process",
  ];
  const operation = randomItem(operations);
  const duration = calculateServiceLatency(service, operation);
  const hasError = Math.random() < 0.05;

  const rawResource = generateCorrelatedResourceAttributes(service);
  const resource: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawResource)) {
    resource[key] = String(value);
  }

  // Get pod name from correlated registry
  const pod = getRandomPod(service);
  const podName = pod ? pod.name : `${service}-unknown-${randomId(5)}`;

  return {
    traceId,
    spanId: randomId(16),
    parentSpanId,
    name: operation,
    kind: depth === 0 ? "server" : "client",
    startTime,
    endTime: startTime + duration,
    duration,
    status: {
      code: hasError ? "error" : "ok",
      message: hasError
        ? `${randomItem(ERROR_TYPES.application)}: Operation failed`
        : undefined,
    },
    attributes: {
      "http.method": operation.split(" ")[0] || "GET",
      "http.route": operation.split(" ")[1] || "/",
      "http.status_code": hasError ? "500" : "200",
      "k8s.pod.name": podName,
      "network.peer.address": generatePrivateIP(),
    },
    events: [],
    links: [],
    resource,
    serviceName: service,
  };
}

function generateStaticTrace(timestamp: number): Trace {
  const traceId = randomId(32);
  const flow = randomItem(TRACE_FLOWS);

  const spans: any[] = [];
  let currentTime = timestamp;
  let parentSpanId: string | undefined;

  for (let i = 0; i < flow.services.length; i++) {
    const span = generateStaticSpan(
      traceId,
      parentSpanId,
      flow.services[i],
      currentTime,
      i,
    );
    spans.push(span);
    parentSpanId = span.spanId;
    currentTime = span.endTime + randomBetween(1, 10);
  }

  const rootSpan = spans[0];
  const maxEndTime = Math.max(...spans.map((s) => s.endTime));
  rootSpan.endTime = maxEndTime;
  rootSpan.duration = maxEndTime - rootSpan.startTime;

  return {
    traceId,
    rootSpan,
    spans,
    services: flow.services,
    duration: maxEndTime - timestamp,
    spanCount: spans.length,
    errorCount: spans.filter((s) => s.status.code === "error").length,
    startTime: timestamp,
  };
}

function generateStaticTraces(): {
  traces: Trace[];
  summaries: TraceSummary[];
} {
  logFetch(
    "traces",
    "Generating static traces",
    `count=${STATIC_DATA_CONFIG.traces.count}`,
  );

  const traces: Trace[] = [];
  const summaries: TraceSummary[] = [];
  const now = Date.now();

  for (let i = 0; i < STATIC_DATA_CONFIG.traces.count; i++) {
    const timestamp =
      now - Math.floor(Math.random() * STATIC_DATA_CONFIG.traces.timeRangeMs);
    const trace = generateStaticTrace(timestamp);
    traces.push(trace);

    summaries.push({
      traceId: trace.traceId,
      rootService: trace.rootSpan.serviceName,
      rootOperation: trace.rootSpan.name,
      startTime: trace.startTime,
      duration: trace.duration,
      spanCount: trace.spanCount,
      errorCount: trace.errorCount,
      services: trace.services,
      p50: trace.duration * 0.5,
      p95: trace.duration * 0.95,
      p99: trace.duration * 0.99,
    });

    if ((i + 1) % 100 === 0) {
      logFetch(
        "traces",
        "Progress",
        `${i + 1}/${STATIC_DATA_CONFIG.traces.count} traces generated`,
      );
    }
  }

  traces.sort((a, b) => b.startTime - a.startTime);
  summaries.sort((a, b) => b.startTime - a.startTime);
  logFetch("traces", "Static traces generated", `total=${traces.length}`);
  return { traces, summaries };
}

// ============================================================================
// Exemplar Generators
// ============================================================================

const EXEMPLAR_METRICS = [
  "http_server_request_duration_seconds",
  "http_client_request_duration_seconds",
  "db_client_operation_duration_seconds",
  "rpc_server_duration_seconds",
  "payment_processing_duration_seconds",
];

function generateStaticExemplar(timestamp: number): Exemplar {
  const service = randomItem(SERVICES);
  const metricName = randomItem(EXEMPLAR_METRICS);

  return {
    id: randomId(16),
    timestamp,
    metricName,
    value: randomBetween(0.01, 2.5),
    traceId: randomId(32),
    spanId: randomId(16),
    labels: {
      service,
      instance: `${service}:8080`,
      method: randomItem(["GET", "POST", "PUT"]),
      status: randomItem(["200", "201", "500"]),
      path: randomItem(["/api/v1/products", "/api/v1/orders", "/api/v1/users"]),
    },
  };
}

function generateStaticExemplars(): Exemplar[] {
  logFetch(
    "exemplars",
    "Generating static exemplars",
    `count=${STATIC_DATA_CONFIG.exemplars.count}`,
  );

  const exemplars: Exemplar[] = [];
  const now = Date.now();

  for (let i = 0; i < STATIC_DATA_CONFIG.exemplars.count; i++) {
    const timestamp =
      now -
      Math.floor(Math.random() * STATIC_DATA_CONFIG.exemplars.timeRangeMs);
    exemplars.push(generateStaticExemplar(timestamp));

    if ((i + 1) % 100 === 0) {
      logFetch(
        "exemplars",
        "Progress",
        `${i + 1}/${STATIC_DATA_CONFIG.exemplars.count} exemplars generated`,
      );
    }
  }

  exemplars.sort((a, b) => b.timestamp - a.timestamp);
  logFetch(
    "exemplars",
    "Static exemplars generated",
    `total=${exemplars.length}`,
  );
  return exemplars;
}

// ============================================================================
// Main Generator Functions
// ============================================================================

/**
 * Initialize or regenerate all static data
 */
export function initializeStaticData(force: boolean = false): StaticDataStore {
  if (staticData && !force) {
    logFetch(
      "metrics",
      "Using cached static data",
      `generatedAt=${new Date(staticData.generatedAt).toISOString()}`,
    );
    return staticData;
  }

  console.log("\n========================================");
  console.log("TelemetryFlow Static Data Generator v2.0");
  console.log("========================================\n");

  const startTime = Date.now();

  const metrics = generateStaticMetrics();
  const logs = generateStaticLogs();
  const { traces, summaries } = generateStaticTraces();
  const exemplars = generateStaticExemplars();

  staticData = {
    metrics,
    logs,
    traces,
    traceSummaries: summaries,
    exemplars,
    generatedAt: Date.now(),
    version: "2.0.0",
  };

  const elapsed = Date.now() - startTime;
  console.log("\n========================================");
  console.log(`Generation complete in ${elapsed}ms`);
  console.log(`  Metrics:   ${metrics.length} series`);
  console.log(`  Logs:      ${logs.length} records`);
  console.log(`  Traces:    ${traces.length} traces`);
  console.log(`  Exemplars: ${exemplars.length} exemplars`);
  console.log("========================================\n");

  return staticData;
}

/**
 * Get static data (initializes if needed)
 */
export function getStaticData(): StaticDataStore {
  if (!staticData) {
    return initializeStaticData();
  }
  return staticData;
}

// ============================================================================
// Feature-specific Fetch Functions with Console Logging
// ============================================================================

export function fetchStaticMetrics(
  query?: string,
  limit?: number,
): MetricSeries[] {
  const data = getStaticData();
  let result = data.metrics;

  if (query) {
    result = result.filter(
      (m) =>
        m.metric.includes(query) ||
        Object.values(m.labels).some((v) => v.includes(query)),
    );
  }
  if (limit) {
    result = result.slice(0, limit);
  }

  logFetch(
    "metrics",
    "Fetching metrics",
    `query="${query || "*"}" limit=${limit || "all"} returned=${result.length}`,
  );
  return result;
}

export function fetchStaticLogs(options?: {
  service?: string;
  level?: string;
  limit?: number;
}): LogRecord[] {
  const data = getStaticData();
  let result = data.logs;

  if (options?.service) {
    result = result.filter(
      (l) => l.resource["service.name"] === options.service,
    );
  }
  if (options?.level) {
    result = result.filter((l) => l.severityText === options.level);
  }
  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  logFetch(
    "logs",
    "Fetching logs",
    `service="${options?.service || "*"}" level="${options?.level || "*"}" returned=${result.length}`,
  );
  return result;
}

export function fetchStaticTraces(options?: {
  service?: string;
  hasError?: boolean;
  limit?: number;
}): TraceSummary[] {
  const data = getStaticData();
  let result = data.traceSummaries;

  if (options?.service) {
    result = result.filter((t) => t.services.includes(options.service!));
  }
  if (options?.hasError !== undefined) {
    result = result.filter((t) =>
      options.hasError ? t.errorCount > 0 : t.errorCount === 0,
    );
  }
  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  logFetch(
    "traces",
    "Fetching traces",
    `service="${options?.service || "*"}" hasError=${options?.hasError ?? "*"} returned=${result.length}`,
  );
  return result;
}

export function fetchStaticTraceById(traceId: string): Trace | undefined {
  const data = getStaticData();
  const trace = data.traces.find((t) => t.traceId === traceId);

  logFetch(
    "traces",
    "Fetching trace by ID",
    `traceId="${traceId}" found=${!!trace}`,
  );
  return trace;
}

export function fetchStaticExemplars(options?: {
  metric?: string;
  limit?: number;
}): Exemplar[] {
  const data = getStaticData();
  let result = data.exemplars;

  if (options?.metric) {
    result = result.filter((e) => e.metricName === options.metric);
  }
  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  logFetch(
    "exemplars",
    "Fetching exemplars",
    `metric="${options?.metric || "*"}" returned=${result.length}`,
  );
  return result;
}

// ============================================================================
// Export Static Data Generator
// ============================================================================

export const staticDataGenerator = {
  initialize: initializeStaticData,
  getData: getStaticData,
  fetchMetrics: fetchStaticMetrics,
  fetchLogs: fetchStaticLogs,
  fetchTraces: fetchStaticTraces,
  fetchTraceById: fetchStaticTraceById,
  fetchExemplars: fetchStaticExemplars,
  log: logFetch,
};

export default staticDataGenerator;
