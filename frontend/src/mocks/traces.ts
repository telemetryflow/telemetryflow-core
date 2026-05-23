/**
 * Traces Mock Data Generator
 * Generates realistic distributed trace data for development and demo purposes
 * Compatible with OTEL v1 and TelemetryFlow v2 APIs
 */

import type {
  Trace,
  TraceSummary,
  Span,
  SpanKind,
  SpanStatusCode,
  ServiceOperation,
  ServiceDependency,
  TraceHeatmapData,
  TraceLatencyStats,
  TraceErrorCause,
  TraceAttributeComparison,
  FlameGraphNode,
  TraceScatterPoint,
  MonitorMetrics,
  OperationMetrics,
  ServiceWithCount,
} from "@/types";
import {
  SERVICES,
  OPERATIONS,
  SERVICE_DEPENDENCIES,
  LATENCY_BUCKETS,
  ERROR_TYPES,
  randomId,
  randomItem,
  randomBetween,
  generateTimestamp,
  roundTo,
  getServiceOperations,
  generateResourceAttributes,
  generatePodName,
  generatePrivateIP,
  calculateServiceLatency,
} from "./shared";

// Service call node for tree-based trace structure
interface ServiceCallNode {
  service: string;
  operation?: string;
  children?: ServiceCallNode[]; // Parallel children (fan-out)
  sequential?: ServiceCallNode[]; // Sequential children (waterfall)
}

// Realistic trace scenarios with branching/parallel call patterns (like OTEL Demo)
const TRACE_SCENARIOS = [
  {
    name: "product_browse",
    description: "User browsing products with recommendations",
    entryService: "frontend",
    entryOperation: "GET /products",
    // Tree structure: frontend calls api-gateway, which fans out to multiple services
    callTree: {
      service: "frontend",
      operation: "GET /products",
      children: [
        {
          service: "api-gateway",
          operation: "GET /api/v1/products",
          children: [
            // Parallel calls from api-gateway
            {
              service: "product-catalog",
              operation: "GET /products",
              children: [
                { service: "product-catalog", operation: "postgresql.query" },
                { service: "product-catalog", operation: "redis.mget" },
              ],
            },
            {
              service: "recommendation-engine",
              operation: "GetRecommendations",
              children: [
                { service: "recommendation-engine", operation: "redis.get" },
                { service: "product-catalog", operation: "GET /products/{id}" },
              ],
            },
            {
              service: "search-service",
              operation: "SearchService.Suggest",
            },
          ],
        },
      ],
    } as ServiceCallNode,
    errorRate: 0.02,
    avgDuration: 150,
  },
  {
    name: "checkout_flow",
    description: "User completing checkout - complex fan-out",
    entryService: "frontend",
    entryOperation: "POST /checkout",
    callTree: {
      service: "frontend",
      operation: "POST /checkout",
      children: [
        {
          service: "api-gateway",
          operation: "POST /api/v1/orders",
          children: [
            {
              service: "cart-service",
              operation: "CartService.GetCart",
              children: [{ service: "cart-service", operation: "redis.get" }],
            },
            {
              service: "order-service",
              operation: "OrderService.CreateOrder",
              children: [
                // Checkout fans out to many services in parallel (like OTEL demo)
                {
                  service: "payment-service",
                  operation: "PaymentService.ProcessPayment",
                  children: [
                    { service: "payment-service", operation: "stripe.charge" },
                    {
                      service: "payment-service",
                      operation: "postgresql.query",
                    },
                  ],
                },
                {
                  service: "inventory-service",
                  operation: "PUT /inventory/{sku}/reserve",
                  children: [
                    {
                      service: "inventory-service",
                      operation: "postgresql.query",
                    },
                    { service: "inventory-service", operation: "redis.set" },
                  ],
                },
                {
                  service: "shipping-service",
                  operation: "POST /shipping/calculate",
                  children: [
                    {
                      service: "shipping-service",
                      operation: "fedex.getRates",
                    },
                  ],
                },
                {
                  service: "notification-service",
                  operation: "send_email",
                },
                { service: "order-service", operation: "postgresql.query" },
              ],
            },
          ],
        },
      ],
    } as ServiceCallNode,
    errorRate: 0.08,
    avgDuration: 800,
  },
  {
    name: "user_login",
    description: "User authentication with session creation",
    entryService: "frontend",
    entryOperation: "POST /login",
    callTree: {
      service: "frontend",
      operation: "POST /login",
      children: [
        {
          service: "api-gateway",
          operation: "POST /api/v1/auth/login",
          children: [
            {
              service: "user-service",
              operation: "UserService.ValidateCredentials",
              children: [
                { service: "user-service", operation: "postgresql.query" },
                { service: "user-service", operation: "redis.set" }, // session
              ],
            },
          ],
        },
      ],
    } as ServiceCallNode,
    errorRate: 0.05,
    avgDuration: 100,
  },
  {
    name: "search_query",
    description: "Product search with facets",
    entryService: "frontend",
    entryOperation: "GET /search",
    callTree: {
      service: "frontend",
      operation: "GET /search",
      children: [
        {
          service: "api-gateway",
          operation: "GET /api/v1/search",
          children: [
            {
              service: "search-service",
              operation: "SearchService.Search",
              children: [
                {
                  service: "search-service",
                  operation: "elasticsearch.search",
                },
                {
                  service: "product-catalog",
                  operation: "GET /products/batch",
                  children: [
                    {
                      service: "product-catalog",
                      operation: "postgresql.query",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    } as ServiceCallNode,
    errorRate: 0.03,
    avgDuration: 200,
  },
  {
    name: "add_to_cart",
    description: "Adding item to cart with inventory check",
    entryService: "frontend",
    entryOperation: "POST /cart/add",
    callTree: {
      service: "frontend",
      operation: "POST /cart/add",
      children: [
        {
          service: "api-gateway",
          operation: "POST /api/v1/cart/items",
          children: [
            {
              service: "cart-service",
              operation: "CartService.AddItem",
              children: [
                // Parallel checks
                {
                  service: "product-catalog",
                  operation: "GET /products/{id}",
                  children: [
                    { service: "product-catalog", operation: "redis.get" },
                  ],
                },
                {
                  service: "inventory-service",
                  operation: "GET /inventory/check-availability",
                  children: [
                    { service: "inventory-service", operation: "redis.get" },
                  ],
                },
                { service: "cart-service", operation: "redis.hset" },
              ],
            },
          ],
        },
      ],
    } as ServiceCallNode,
    errorRate: 0.04,
    avgDuration: 120,
  },
  {
    name: "order_history",
    description: "Viewing order history with details",
    entryService: "frontend",
    entryOperation: "GET /orders",
    callTree: {
      service: "frontend",
      operation: "GET /orders",
      children: [
        {
          service: "api-gateway",
          operation: "GET /api/v1/orders",
          children: [
            {
              service: "order-service",
              operation: "OrderService.ListOrders",
              children: [
                { service: "order-service", operation: "postgresql.query" },
                {
                  service: "shipping-service",
                  operation: "GET /shipping/status",
                },
              ],
            },
          ],
        },
      ],
    } as ServiceCallNode,
    errorRate: 0.01,
    avgDuration: 80,
  },
  {
    name: "homepage_load",
    description: "Homepage with featured products and ads",
    entryService: "frontend",
    entryOperation: "GET /",
    callTree: {
      service: "frontend",
      operation: "GET /",
      children: [
        {
          service: "api-gateway",
          operation: "GET /api/v1/homepage",
          children: [
            // Multiple parallel calls like OTEL demo frontend
            {
              service: "product-catalog",
              operation: "GET /products/featured",
              children: [
                { service: "product-catalog", operation: "redis.get" },
              ],
            },
            {
              service: "recommendation-engine",
              operation: "GetPersonalized",
              children: [
                { service: "recommendation-engine", operation: "redis.mget" },
              ],
            },
            {
              service: "user-service",
              operation: "UserService.GetUser",
              children: [{ service: "user-service", operation: "redis.get" }],
            },
          ],
        },
      ],
    } as ServiceCallNode,
    errorRate: 0.02,
    avgDuration: 180,
  },
  {
    name: "product_detail",
    description: "Product detail page with reviews and recommendations",
    entryService: "frontend",
    entryOperation: "GET /products/{id}",
    callTree: {
      service: "frontend",
      operation: "GET /products/{id}",
      children: [
        {
          service: "api-gateway",
          operation: "GET /api/v1/products/{id}",
          children: [
            // Fan-out to get product, reviews, recommendations in parallel
            {
              service: "product-catalog",
              operation: "GET /products/{id}",
              children: [
                { service: "product-catalog", operation: "postgresql.query" },
                { service: "product-catalog", operation: "redis.get" },
              ],
            },
            {
              service: "recommendation-engine",
              operation: "GetSimilarProducts",
              children: [
                {
                  service: "product-catalog",
                  operation: "GET /products/batch",
                },
              ],
            },
            {
              service: "inventory-service",
              operation: "GET /inventory/{sku}",
              children: [
                { service: "inventory-service", operation: "redis.get" },
              ],
            },
          ],
        },
      ],
    } as ServiceCallNode,
    errorRate: 0.02,
    avgDuration: 150,
  },
];

// Error scenarios with detailed information
const ERROR_SCENARIOS = [
  {
    service: "payment-service",
    operation: "PaymentService.ProcessPayment",
    errorType: "external",
    error: "Payment gateway timeout: Stripe API did not respond within 30s",
    frequency: 0.15,
  },
  {
    service: "product-catalog",
    operation: "GET /products/{id}",
    errorType: "database",
    error: "QueryTimeout: Query exceeded 5s limit on catalog_db",
    frequency: 0.08,
  },
  {
    service: "inventory-service",
    operation: "PUT /inventory/{sku}/reserve",
    errorType: "application",
    error:
      "InsufficientStockException: Requested quantity exceeds available stock",
    frequency: 0.12,
  },
  {
    service: "user-service",
    operation: "UserService.ValidateCredentials",
    errorType: "application",
    error: "AuthenticationFailed: Invalid credentials provided",
    frequency: 0.2,
  },
  {
    service: "notification-service",
    operation: "send_email",
    errorType: "external",
    error: "RateLimitExceeded: SendGrid API rate limit reached",
    frequency: 0.05,
  },
  {
    service: "search-service",
    operation: "SearchService.Search",
    errorType: "database",
    error: "ConnectionPoolExhausted: No available connections to elasticsearch",
    frequency: 0.04,
  },
  {
    service: "order-service",
    operation: "OrderService.CreateOrder",
    errorType: "database",
    error: "DeadlockDetected: Transaction deadlock on orders table",
    frequency: 0.03,
  },
  {
    service: "shipping-service",
    operation: "POST /shipping/calculate",
    errorType: "external",
    error: "ServiceUnavailable: FedEx API returned 503",
    frequency: 0.06,
  },
];

/**
 * Generate a single span with realistic OpenTelemetry attributes
 */
function generateSpan(
  traceId: string,
  parentSpanId: string | undefined,
  service: string,
  operation: string,
  startTime: number,
  depth: number = 0,
  forceError: boolean = false,
): Span {
  const duration = calculateServiceLatency(service, operation);
  const hasError = forceError || Math.random() < 0.05;

  // Determine span kind based on operation pattern
  let kind: SpanKind;
  if (!parentSpanId) {
    kind = "server";
  } else if (operation.includes("Service.") || operation.includes("grpc")) {
    kind = "client";
  } else if (operation.startsWith("GET") || operation.startsWith("POST")) {
    kind = depth === 1 ? "server" : "client";
  } else {
    kind = "internal";
  }

  // Generate error details if applicable
  const errorScenario = hasError
    ? ERROR_SCENARIOS.find(
        (e) => e.service === service && Math.random() < e.frequency,
      )
    : null;
  const errorMessage =
    errorScenario?.error ||
    (hasError
      ? `${randomItem(ERROR_TYPES.application)}: Operation failed`
      : undefined);

  // Build OpenTelemetry semantic convention attributes
  const attributes: Record<string, string | number | boolean> = {};

  // HTTP attributes
  if (
    operation.startsWith("GET") ||
    operation.startsWith("POST") ||
    operation.startsWith("PUT") ||
    operation.startsWith("DELETE")
  ) {
    const [method, path] = operation.split(" ");
    attributes["http.request.method"] = method;
    attributes["http.route"] = path || "/";
    attributes["url.path"] = path || "/";
    attributes["http.response.status_code"] = hasError
      ? Math.random() > 0.5
        ? 500
        : 502
      : 200;
    attributes["server.address"] = service;
    attributes["server.port"] = 8080;
    attributes["user_agent.original"] = "TelemetryFlow-Agent/1.1.2";
    attributes["network.protocol.version"] = "1.1";
  }

  // RPC/gRPC attributes
  if (operation.includes("Service.")) {
    const [rpcService, rpcMethod] = operation.split(".");
    attributes["rpc.system"] = "grpc";
    attributes["rpc.service"] = rpcService;
    attributes["rpc.method"] = rpcMethod;
    attributes["rpc.grpc.status_code"] = hasError ? 13 : 0; // 13 = INTERNAL, 0 = OK
  }

  // Database attributes (for services that interact with DBs)
  if (
    [
      "user-service",
      "product-catalog",
      "order-service",
      "payment-service",
      "inventory-service",
    ].includes(service) &&
    depth > 0
  ) {
    if (Math.random() > 0.5) {
      attributes["db.system"] = "postgresql";
      attributes["db.name"] = `${service.replace("-service", "")}_db`;
      attributes["db.operation"] = randomItem(["SELECT", "INSERT", "UPDATE"]);
      attributes["db.statement"] =
        `${attributes["db.operation"]} * FROM ${randomItem(["users", "orders", "products", "inventory"])} WHERE id = ?`;
    }
  }

  // Network attributes
  attributes["network.peer.address"] = generatePrivateIP();
  attributes["network.peer.port"] = 8080;

  // Kubernetes attributes
  const podName = generatePodName(service);
  attributes["k8s.namespace.name"] = "ecommerce";
  attributes["k8s.pod.name"] = podName;
  attributes["k8s.deployment.name"] = service;

  // Build events
  const events: Array<{
    name: string;
    timestamp: number;
    attributes: Record<string, string | number>;
  }> = [];

  if (hasError && errorMessage) {
    events.push({
      name: "exception",
      timestamp: startTime + duration * 0.8,
      attributes: {
        "exception.type": errorScenario?.errorType
          ? randomItem(
              ERROR_TYPES[errorScenario.errorType as keyof typeof ERROR_TYPES],
            )
          : "RuntimeException",
        "exception.message": errorMessage,
        "exception.stacktrace": `at ${service}.${operation}(${service}.go:${Math.floor(Math.random() * 500)})\n  at handler.ServeHTTP(handler.go:42)`,
      },
    });
  }

  // Resource attributes - convert to strings
  const rawResource = generateResourceAttributes(service);
  const resource: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawResource)) {
    resource[key] = String(value);
  }

  // Convert attributes to strings
  const stringAttributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    stringAttributes[key] = String(value);
  }

  // Convert event attributes to strings
  const stringEvents = events.map((evt) => ({
    name: evt.name,
    timestamp: evt.timestamp,
    attributes: Object.fromEntries(
      Object.entries(evt.attributes).map(([k, v]) => [k, String(v)]),
    ),
  }));

  return {
    traceId,
    spanId: randomId(16),
    parentSpanId,
    name: operation,
    kind,
    startTime,
    endTime: startTime + duration,
    duration,
    status: {
      code: hasError ? "error" : ("ok" as SpanStatusCode),
      message: errorMessage,
    },
    attributes: stringAttributes,
    events: stringEvents,
    links: [],
    resource,
    serviceName: service,
  };
}

/**
 * Recursively generate spans from a call tree node
 * This creates realistic parallel/branching traces like OTEL Demo
 */
function generateSpansFromTree(
  traceId: string,
  parentSpanId: string | undefined,
  node: ServiceCallNode,
  startTime: number,
  depth: number,
  spans: Span[],
  errorRate: number,
): number {
  // Generate span for current node
  const operation = node.operation || getServiceOperations(node.service)[0];
  const forceError = Math.random() < errorRate * 0.3; // Distribute errors across the tree

  const span = generateSpan(
    traceId,
    parentSpanId,
    node.service,
    operation,
    startTime,
    depth,
    forceError,
  );
  spans.push(span);

  let maxEndTime = span.endTime;

  // Process children (parallel calls - they start at the same time)
  if (node.children && node.children.length > 0) {
    const childStartTime = startTime + randomBetween(1, 5); // Small delay before children start
    const childEndTimes: number[] = [];

    node.children.forEach((child) => {
      // All parallel children start around the same time (with small jitter)
      const jitter = randomBetween(0, 3);
      const childEnd = generateSpansFromTree(
        traceId,
        span.spanId,
        child,
        childStartTime + jitter,
        depth + 1,
        spans,
        errorRate,
      );
      childEndTimes.push(childEnd);
    });

    // Parent span ends after all children complete
    maxEndTime = Math.max(...childEndTimes);
  }

  // Update span duration to encompass children
  if (maxEndTime > span.endTime) {
    span.endTime = maxEndTime + randomBetween(1, 3); // Small overhead after children
    span.duration = span.endTime - span.startTime;
  }

  return span.endTime;
}

/**
 * Generate a complete trace with spans following realistic scenarios
 * Now supports tree-based parallel/branching call patterns
 */
export function generateTrace(
  timestamp?: number,
  scenarioName?: string,
): Trace {
  const traceId = randomId(32);
  const startTime =
    timestamp || Date.now() - Math.floor(Math.random() * 3600000);

  // Select a scenario (either specified or random)
  const scenario = scenarioName
    ? TRACE_SCENARIOS.find((s) => s.name === scenarioName) ||
      randomItem(TRACE_SCENARIOS)
    : randomItem(TRACE_SCENARIOS);

  const spans: Span[] = [];

  // Generate spans from the call tree (supports parallel/branching)
  generateSpansFromTree(
    traceId,
    undefined,
    scenario.callTree,
    startTime,
    0,
    spans,
    scenario.errorRate,
  );

  // Root span is the first one generated
  const rootSpan = spans[0];

  // Calculate trace-level stats
  const maxEndTime = Math.max(...spans.map((s) => s.endTime));
  const totalDuration = maxEndTime - startTime;
  const errorCount = spans.filter((s) => s.status.code === "error").length;

  return {
    traceId,
    rootSpan,
    spans,
    services: [...new Set(spans.map((s) => s.serviceName))],
    duration: totalDuration,
    spanCount: spans.length,
    errorCount,
    startTime,
  };
}

/**
 * Generate trace summaries for a time range
 */
export function generateTraceSummaries(
  start: number,
  end: number,
  count: number = 50,
): TraceSummary[] {
  const summaries: TraceSummary[] = [];

  for (let i = 0; i < count; i++) {
    const trace = generateTrace(generateTimestamp(start, end));
    const baseDuration = trace.duration;
    const p50 = Math.max(baseDuration * 0.3, randomBetween(3, 50));
    const p95 = Math.max(p50 * 2, randomBetween(20, 300));
    const p99 = Math.max(p95 * 1.5, randomBetween(50, 800));

    summaries.push({
      traceId: trace.traceId,
      rootService: trace.rootSpan.serviceName,
      rootOperation: trace.rootSpan.name,
      startTime: trace.startTime,
      duration: trace.duration,
      spanCount: trace.spanCount,
      errorCount: trace.errorCount,
      services: trace.services,
      hasLogs: Math.random() > 0.3,
      p50: roundTo(p50),
      p95: roundTo(p95),
      p99: roundTo(p99),
    });
  }

  return summaries.sort((a, b) => b.startTime - a.startTime);
}

/**
 * Generate trace heatmap data
 */
export function generateTraceHeatmap(
  start: number,
  end: number,
): TraceHeatmapData[] {
  const data: TraceHeatmapData[] = [];
  const step = (end - start) / 60;

  for (let t = start; t < end; t += step) {
    LATENCY_BUCKETS.forEach((bucket, bucketIdx) => {
      if (bucket === "errors") {
        const hasErrors = Math.random() < 0.15;
        if (hasErrors) {
          data.push({
            timestamp: t,
            latencyBucket: bucket,
            count: Math.floor(randomBetween(1, 15)),
            isError: true,
          });
        }
      } else {
        const baseWeight = Math.max(0, 12 - bucketIdx) / 12;
        const hasData = Math.random() < 0.3 + baseWeight * 0.6;
        if (hasData) {
          const countMultiplier = bucketIdx >= 1 && bucketIdx <= 5 ? 2 : 1;
          data.push({
            timestamp: t,
            latencyBucket: bucket,
            count: Math.floor(
              randomBetween(5, 90) * countMultiplier * baseWeight,
            ),
          });
        }
      }
    });
  }

  return data;
}

/**
 * Generate trace latency stats per service-operation
 */
export function generateTraceLatencyStats(
  _start: number,
  _end: number,
): TraceLatencyStats[] {
  const stats: TraceLatencyStats[] = [];

  Object.entries(OPERATIONS).forEach(([service, operations]) => {
    operations.forEach((operation) => {
      const requests = randomBetween(1, 200);
      const errorCount =
        Math.random() < 0.3 ? Math.floor(randomBetween(0, requests * 0.1)) : 0;
      const errorRate = requests > 0 ? errorCount / requests : 0;

      const baseLatency = randomBetween(3, 50);
      const p50 = baseLatency;
      const p95 = baseLatency * randomBetween(2, 8);
      const p99 = p95 * randomBetween(1.2, 3);

      stats.push({
        service,
        operation,
        requests: roundTo(requests),
        errors: errorCount,
        errorRate: roundTo(errorRate * 100),
        p50: roundTo(p50),
        p95: roundTo(p95),
        p99: roundTo(p99),
      });
    });
  });

  return stats.sort((a, b) => b.requests - a.requests);
}

/**
 * Get latency bucket labels
 */
export function getLatencyBuckets(): string[] {
  return [...LATENCY_BUCKETS];
}

/**
 * Get available services
 */
export function generateServices(): string[] {
  return [...SERVICES];
}

/**
 * Generate service operations with stats
 */
export function generateServiceOperations(service: string): ServiceOperation[] {
  const ops = getServiceOperations(service);
  return ops.map((op) => ({
    service,
    operation: op,
    spanCount: Math.floor(randomBetween(100, 10000)),
    avgDuration: randomBetween(10, 200),
    errorRate: randomBetween(0, 0.1),
  }));
}

/**
 * Generate service dependency graph
 */
export function generateServiceDependencies(): ServiceDependency[] {
  const dependencies: ServiceDependency[] = [];

  Object.entries(SERVICE_DEPENDENCIES).forEach(([source, targets]) => {
    targets.forEach((target) => {
      dependencies.push({
        source,
        target,
        callCount: Math.floor(randomBetween(1000, 50000)),
        avgDuration: randomBetween(5, 100),
        errorRate: randomBetween(0, 0.05),
      });
    });
  });

  return dependencies;
}

/**
 * Generate error causes analysis based on realistic error scenarios
 */
export function generateTraceErrorCauses(
  _start: number,
  _end: number,
): TraceErrorCause[] {
  // Generate counts that reflect realistic error distribution
  const totalErrors = Math.floor(randomBetween(400, 800));
  const errorCauses: TraceErrorCause[] = [];

  // Payment gateway timeouts - most common in e-commerce
  const paymentErrors = Math.floor(totalErrors * 0.35);
  if (paymentErrors > 0) {
    errorCauses.push({
      service: "payment-service",
      span: "PaymentService.ProcessPayment",
      spanAttribute: "rpc.system: grpc, payment.provider: stripe",
      error: "DeadlineExceeded: Stripe API did not respond within 30s",
      sampleTraceId: randomId(32),
      percentage: roundTo((paymentErrors / totalErrors) * 100),
      count: paymentErrors,
    });
  }

  // Database connection issues
  const dbErrors = Math.floor(totalErrors * 0.25);
  if (dbErrors > 0) {
    errorCauses.push({
      service: "product-catalog",
      span: "postgresql.query",
      spanAttribute: "db.system: postgresql, db.name: catalog_db",
      error:
        "ConnectionPoolExhausted: No available connections (pool size: 50, active: 50)",
      sampleTraceId: randomId(32),
      percentage: roundTo((dbErrors / totalErrors) * 100),
      count: dbErrors,
    });
  }

  // Inventory stock issues
  const inventoryErrors = Math.floor(totalErrors * 0.15);
  if (inventoryErrors > 0) {
    errorCauses.push({
      service: "inventory-service",
      span: "PUT /inventory/{sku}/reserve",
      spanAttribute:
        "http.request.method: PUT, http.route: /inventory/{sku}/reserve",
      error:
        "InsufficientStockException: Requested quantity (5) exceeds available stock (0)",
      sampleTraceId: randomId(32),
      percentage: roundTo((inventoryErrors / totalErrors) * 100),
      count: inventoryErrors,
    });
  }

  // Search service elasticsearch issues
  const searchErrors = Math.floor(totalErrors * 0.1);
  if (searchErrors > 0) {
    errorCauses.push({
      service: "search-service",
      span: "elasticsearch.search",
      spanAttribute: "db.system: elasticsearch, db.operation: search",
      error:
        "CircuitBreakerOpen: Too many failures in circuit breaker elasticsearch-circuit",
      sampleTraceId: randomId(32),
      percentage: roundTo((searchErrors / totalErrors) * 100),
      count: searchErrors,
    });
  }

  // Notification service rate limits
  const notificationErrors = Math.floor(totalErrors * 0.08);
  if (notificationErrors > 0) {
    errorCauses.push({
      service: "notification-service",
      span: "send_email",
      spanAttribute: "messaging.system: sendgrid, messaging.operation: send",
      error: "RateLimitExceeded: SendGrid rate limit reached (100/min)",
      sampleTraceId: randomId(32),
      percentage: roundTo((notificationErrors / totalErrors) * 100),
      count: notificationErrors,
    });
  }

  // Order service deadlocks
  const orderErrors = Math.floor(totalErrors * 0.05);
  if (orderErrors > 0) {
    errorCauses.push({
      service: "order-service",
      span: "OrderService.CreateOrder",
      spanAttribute: "rpc.system: grpc, db.system: postgresql",
      error:
        "DeadlockDetected: Deadlock found when trying to get lock on orders table",
      sampleTraceId: randomId(32),
      percentage: roundTo((orderErrors / totalErrors) * 100),
      count: orderErrors,
    });
  }

  // Authentication failures
  const authErrors = Math.floor(totalErrors * 0.02);
  if (authErrors > 0) {
    errorCauses.push({
      service: "user-service",
      span: "UserService.ValidateCredentials",
      spanAttribute: "rpc.system: grpc",
      error: "Unauthenticated: Invalid or expired JWT token",
      sampleTraceId: randomId(32),
      percentage: roundTo((authErrors / totalErrors) * 100),
      count: authErrors,
    });
  }

  return errorCauses.sort((a, b) => b.count - a.count);
}

/**
 * Generate flame graph data representing aggregated trace execution time
 */
export function generateFlameGraphData(
  _start: number,
  _end: number,
): FlameGraphNode[] {
  const totalTime = 25; // Total execution time in seconds

  return [
    {
      name: `total (${totalTime}s, 100%)`,
      value: totalTime,
      percentage: 100,
      service: "total",
      children: [
        {
          name: `frontend: GET /checkout (http.route=/checkout) (${roundTo(totalTime * 0.45)}s, 45%)`,
          value: totalTime * 0.45,
          percentage: 45,
          service: "frontend",
          children: [
            {
              name: `api-gateway: POST /api/v1/orders (http.route=/api/v1/orders) (${roundTo(totalTime * 0.38)}s, 38%)`,
              value: totalTime * 0.38,
              percentage: 38,
              service: "api-gateway",
              children: [
                {
                  name: `order-service: OrderService.CreateOrder (rpc.method=CreateOrder) (${roundTo(totalTime * 0.3)}s, 30%)`,
                  value: totalTime * 0.3,
                  percentage: 30,
                  service: "order-service",
                  children: [
                    {
                      name: `payment-service: PaymentService.ProcessPayment (${roundTo(totalTime * 0.2)}s, 20%)`,
                      value: totalTime * 0.2,
                      percentage: 20,
                      service: "payment-service",
                      children: [
                        {
                          name: `payment-service: stripe.api.charge (${roundTo(totalTime * 0.15)}s, 15%)`,
                          value: totalTime * 0.15,
                          percentage: 15,
                          service: "payment-service",
                        },
                      ],
                    },
                    {
                      name: `inventory-service: PUT /inventory/{sku}/reserve (${roundTo(totalTime * 0.05)}s, 5%)`,
                      value: totalTime * 0.05,
                      percentage: 5,
                      service: "inventory-service",
                    },
                    {
                      name: `order-service: postgresql.query (db.operation=INSERT) (${roundTo(totalTime * 0.03)}s, 3%)`,
                      value: totalTime * 0.03,
                      percentage: 3,
                      service: "order-service",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: `frontend: GET /products (http.route=/products) (${roundTo(totalTime * 0.25)}s, 25%)`,
          value: totalTime * 0.25,
          percentage: 25,
          service: "frontend",
          children: [
            {
              name: `api-gateway: GET /api/v1/products (${roundTo(totalTime * 0.22)}s, 22%)`,
              value: totalTime * 0.22,
              percentage: 22,
              service: "api-gateway",
              children: [
                {
                  name: `product-catalog: GET /products (${roundTo(totalTime * 0.15)}s, 15%)`,
                  value: totalTime * 0.15,
                  percentage: 15,
                  service: "product-catalog",
                  children: [
                    {
                      name: `product-catalog: postgresql.query (db.operation=SELECT) (${roundTo(totalTime * 0.08)}s, 8%)`,
                      value: totalTime * 0.08,
                      percentage: 8,
                      service: "product-catalog",
                    },
                    {
                      name: `product-catalog: redis.mget (cache lookup) (${roundTo(totalTime * 0.02)}s, 2%)`,
                      value: totalTime * 0.02,
                      percentage: 2,
                      service: "product-catalog",
                    },
                  ],
                },
                {
                  name: `recommendation-engine: GetRecommendations (${roundTo(totalTime * 0.05)}s, 5%)`,
                  value: totalTime * 0.05,
                  percentage: 5,
                  service: "recommendation-engine",
                },
              ],
            },
          ],
        },
        {
          name: `frontend: GET /search (http.route=/search) (${roundTo(totalTime * 0.18)}s, 18%)`,
          value: totalTime * 0.18,
          percentage: 18,
          service: "frontend",
          children: [
            {
              name: `search-service: SearchService.Search (${roundTo(totalTime * 0.15)}s, 15%)`,
              value: totalTime * 0.15,
              percentage: 15,
              service: "search-service",
              children: [
                {
                  name: `search-service: elasticsearch.search (db.system=elasticsearch) (${roundTo(totalTime * 0.12)}s, 12%)`,
                  value: totalTime * 0.12,
                  percentage: 12,
                  service: "search-service",
                },
              ],
            },
          ],
        },
        {
          name: `frontend: POST /login (http.route=/login) (${roundTo(totalTime * 0.07)}s, 7%)`,
          value: totalTime * 0.07,
          percentage: 7,
          service: "frontend",
          children: [
            {
              name: `user-service: UserService.ValidateCredentials (${roundTo(totalTime * 0.05)}s, 5%)`,
              value: totalTime * 0.05,
              percentage: 5,
              service: "user-service",
              children: [
                {
                  name: `user-service: postgresql.query (db.operation=SELECT) (${roundTo(totalTime * 0.02)}s, 2%)`,
                  value: totalTime * 0.02,
                  percentage: 2,
                  service: "user-service",
                },
                {
                  name: `user-service: redis.get (session cache) (${roundTo(totalTime * 0.01)}s, 1%)`,
                  value: totalTime * 0.01,
                  percentage: 1,
                  service: "user-service",
                },
              ],
            },
          ],
        },
        {
          name: `notification-service: send_email (async) (${roundTo(totalTime * 0.05)}s, 5%)`,
          value: totalTime * 0.05,
          percentage: 5,
          service: "notification-service",
        },
      ],
    },
  ];
}

/**
 * Generate trace attribute comparisons (OpenTelemetry semantic conventions)
 */
export function generateTraceAttributeComparisons(
  _start: number,
  _end: number,
): TraceAttributeComparison[] {
  const totalSpans = Math.floor(randomBetween(8000, 15000));

  return [
    {
      attribute: "service.name",
      values: [
        {
          value: "api-gateway",
          count: Math.floor(totalSpans * 0.22),
          percentage: 22,
        },
        {
          value: "frontend",
          count: Math.floor(totalSpans * 0.18),
          percentage: 18,
        },
        {
          value: "product-catalog",
          count: Math.floor(totalSpans * 0.15),
          percentage: 15,
        },
        {
          value: "order-service",
          count: Math.floor(totalSpans * 0.12),
          percentage: 12,
        },
        {
          value: "user-service",
          count: Math.floor(totalSpans * 0.1),
          percentage: 10,
        },
        {
          value: "payment-service",
          count: Math.floor(totalSpans * 0.08),
          percentage: 8,
        },
        {
          value: "cart-service",
          count: Math.floor(totalSpans * 0.08),
          percentage: 8,
        },
        {
          value: "search-service",
          count: Math.floor(totalSpans * 0.07),
          percentage: 7,
        },
      ],
    },
    {
      attribute: "http.request.method",
      values: [
        { value: "GET", count: Math.floor(totalSpans * 0.65), percentage: 65 },
        { value: "POST", count: Math.floor(totalSpans * 0.25), percentage: 25 },
        { value: "PUT", count: Math.floor(totalSpans * 0.07), percentage: 7 },
        {
          value: "DELETE",
          count: Math.floor(totalSpans * 0.03),
          percentage: 3,
        },
      ],
    },
    {
      attribute: "http.response.status_code",
      values: [
        { value: "200", count: Math.floor(totalSpans * 0.75), percentage: 75 },
        { value: "201", count: Math.floor(totalSpans * 0.12), percentage: 12 },
        { value: "204", count: Math.floor(totalSpans * 0.05), percentage: 5 },
        { value: "500", count: Math.floor(totalSpans * 0.04), percentage: 4 },
        { value: "404", count: Math.floor(totalSpans * 0.02), percentage: 2 },
        { value: "429", count: Math.floor(totalSpans * 0.02), percentage: 2 },
      ],
    },
    {
      attribute: "http.route",
      values: [
        {
          value: "/api/v1/products",
          count: Math.floor(totalSpans * 0.28),
          percentage: 28,
        },
        {
          value: "/api/v1/products/{id}",
          count: Math.floor(totalSpans * 0.22),
          percentage: 22,
        },
        {
          value: "/api/v1/cart",
          count: Math.floor(totalSpans * 0.18),
          percentage: 18,
        },
        {
          value: "/api/v1/orders",
          count: Math.floor(totalSpans * 0.15),
          percentage: 15,
        },
        {
          value: "/api/v1/users/me",
          count: Math.floor(totalSpans * 0.1),
          percentage: 10,
        },
        {
          value: "/api/v1/auth/login",
          count: Math.floor(totalSpans * 0.07),
          percentage: 7,
        },
      ],
    },
    {
      attribute: "rpc.system",
      values: [
        { value: "grpc", count: Math.floor(totalSpans * 0.85), percentage: 85 },
        {
          value: "aws-api",
          count: Math.floor(totalSpans * 0.15),
          percentage: 15,
        },
      ],
    },
    {
      attribute: "rpc.grpc.status_code",
      values: [
        {
          value: "0 (OK)",
          count: Math.floor(totalSpans * 0.92),
          percentage: 92,
        },
        {
          value: "13 (INTERNAL)",
          count: Math.floor(totalSpans * 0.04),
          percentage: 4,
        },
        {
          value: "4 (DEADLINE_EXCEEDED)",
          count: Math.floor(totalSpans * 0.02),
          percentage: 2,
        },
        {
          value: "14 (UNAVAILABLE)",
          count: Math.floor(totalSpans * 0.02),
          percentage: 2,
        },
      ],
    },
    {
      attribute: "db.system",
      values: [
        {
          value: "postgresql",
          count: Math.floor(totalSpans * 0.55),
          percentage: 55,
        },
        { value: "redis", count: Math.floor(totalSpans * 0.3), percentage: 30 },
        {
          value: "elasticsearch",
          count: Math.floor(totalSpans * 0.15),
          percentage: 15,
        },
      ],
    },
    {
      attribute: "db.operation",
      values: [
        {
          value: "SELECT",
          count: Math.floor(totalSpans * 0.5),
          percentage: 50,
        },
        { value: "GET", count: Math.floor(totalSpans * 0.25), percentage: 25 },
        {
          value: "INSERT",
          count: Math.floor(totalSpans * 0.12),
          percentage: 12,
        },
        {
          value: "UPDATE",
          count: Math.floor(totalSpans * 0.08),
          percentage: 8,
        },
        {
          value: "search",
          count: Math.floor(totalSpans * 0.05),
          percentage: 5,
        },
      ],
    },
    {
      attribute: "k8s.namespace.name",
      values: [
        {
          value: "ecommerce",
          count: Math.floor(totalSpans * 0.95),
          percentage: 95,
        },
        {
          value: "monitoring",
          count: Math.floor(totalSpans * 0.05),
          percentage: 5,
        },
      ],
    },
    {
      attribute: "telemetry.sdk.language",
      values: [
        { value: "java", count: Math.floor(totalSpans * 0.35), percentage: 35 },
        { value: "go", count: Math.floor(totalSpans * 0.3), percentage: 30 },
        {
          value: "python",
          count: Math.floor(totalSpans * 0.2),
          percentage: 20,
        },
        {
          value: "nodejs",
          count: Math.floor(totalSpans * 0.15),
          percentage: 15,
        },
      ],
    },
    {
      attribute: "telemetry.sdk.version",
      values: [
        {
          value: "1.35.0",
          count: Math.floor(totalSpans * 0.4),
          percentage: 40,
        },
        {
          value: "1.24.0",
          count: Math.floor(totalSpans * 0.3),
          percentage: 30,
        },
        {
          value: "1.23.0",
          count: Math.floor(totalSpans * 0.2),
          percentage: 20,
        },
        {
          value: "1.21.0",
          count: Math.floor(totalSpans * 0.1),
          percentage: 10,
        },
      ],
    },
    {
      attribute: "deployment.environment",
      values: [
        {
          value: "production",
          count: Math.floor(totalSpans * 1.0),
          percentage: 100,
        },
      ],
    },
    {
      attribute: "cloud.region",
      values: [
        {
          value: "us-west-2",
          count: Math.floor(totalSpans * 0.6),
          percentage: 60,
        },
        {
          value: "us-east-1",
          count: Math.floor(totalSpans * 0.4),
          percentage: 40,
        },
      ],
    },
  ];
}

/**
 * Generate scatter plot data for traces
 */
export function generateTraceScatterData(
  start: number,
  end: number,
): TraceScatterPoint[] {
  const points: TraceScatterPoint[] = [];
  const count = Math.floor(randomBetween(80, 200));

  for (let i = 0; i < count; i++) {
    const service = randomItem(SERVICES);
    const ops = getServiceOperations(service);
    const hasError = Math.random() < 0.08;

    points.push({
      timestamp: generateTimestamp(start, end),
      duration: randomBetween(5, 2000),
      traceId: randomId(32),
      hasError,
      spanCount: Math.floor(randomBetween(3, 50)),
      serviceName: service,
      operationName: randomItem(ops),
    });
  }

  return points.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Generate services with trace counts
 */
export function generateServicesWithTraceCount(
  _start: number,
  _end: number,
): ServiceWithCount[] {
  return SERVICES.map((name) => ({
    name,
    traceCount: Math.floor(randomBetween(50, 5000)),
  })).sort((a, b) => b.traceCount - a.traceCount);
}

/**
 * Generate RED metrics time series
 */
export function generateMonitorMetrics(
  _service: string,
  _spanKind: SpanKind | undefined,
  start: number,
  end: number,
): MonitorMetrics[] {
  const metrics: MonitorMetrics[] = [];
  const step = (end - start) / 60;

  for (let t = start; t < end; t += step) {
    const baseLatency = randomBetween(10, 100);
    const errorRate = randomBetween(0, 8);
    const requestRate = randomBetween(10, 500);
    metrics.push({
      timestamp: t,
      latency: {
        p50: baseLatency,
        p75: baseLatency * randomBetween(1.2, 1.8),
        p90: baseLatency * randomBetween(1.8, 3),
        p95: baseLatency * randomBetween(2.5, 5),
        p99: baseLatency * randomBetween(4, 10),
        avg: baseLatency * randomBetween(1.5, 2.5),
      },
      errorRate,
      errorRateAvg: errorRate * randomBetween(0.6, 0.9),
      requestRate,
      requestRateAvg: requestRate * randomBetween(0.7, 0.95),
    });
  }

  return metrics;
}

/**
 * Generate operation-level metrics
 */
export function generateOperationMetrics(
  service: string,
  spanKind: SpanKind | undefined,
  _start: number,
  _end: number,
): OperationMetrics[] {
  const ops = getServiceOperations(service);
  const kinds: SpanKind[] = spanKind
    ? [spanKind]
    : ["server", "client", "internal"];
  const metrics: OperationMetrics[] = [];

  ops.forEach((operation) => {
    kinds.forEach((kind) => {
      const baseLatency = randomBetween(5, 100);
      const errorRate = randomBetween(0, 10);
      const requestRate = randomBetween(10, 200);

      metrics.push({
        service,
        operation,
        spanKind: kind,
        latencyP50: baseLatency,
        latencyP75: baseLatency * randomBetween(1.2, 1.8),
        latencyP90: baseLatency * randomBetween(1.8, 3),
        latencyP95: baseLatency * randomBetween(2.5, 5),
        latencyP99: baseLatency * randomBetween(4, 12),
        latencyAvg: baseLatency * randomBetween(1.5, 2.5),
        errorRate,
        requestRate,
        impactScore: requestRate * (1 + errorRate / 100),
      });
    });
  });

  return metrics.sort((a, b) => b.impactScore - a.impactScore);
}

// Export traces mock data service
export const tracesMock = {
  generateTrace,
  getTraceSummaries: generateTraceSummaries,
  getTraceHeatmap: generateTraceHeatmap,
  getTraceLatencyStats: generateTraceLatencyStats,
  getTraceErrorCauses: generateTraceErrorCauses,
  getFlameGraphData: generateFlameGraphData,
  getTraceAttributeComparisons: generateTraceAttributeComparisons,
  getLatencyBuckets,
  getServices: generateServices,
  getServiceOperations: generateServiceOperations,
  getServiceDependencies: generateServiceDependencies,
  getTraceScatterData: generateTraceScatterData,
  getServicesWithTraceCount: generateServicesWithTraceCount,
  getMonitorMetrics: generateMonitorMetrics,
  getOperationMetrics: generateOperationMetrics,
};
