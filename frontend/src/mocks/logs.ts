/**
 * Logs Mock Data Generator
 * Generates realistic log data for development and demo purposes
 * Compatible with OTEL v1 and TelemetryFlow v2 APIs
 */

import type {
  LogRecord,
  LogLevel,
  LogSeverityNumber,
  LogAggregation,
} from "@/types";
import {
  SERVICES,
  K8S_CLUSTER,
  randomId,
  randomItem,
  randomBetween,
  generateTimestamp,
  getServiceMetadata,
  generatePrivateIP,
} from "./shared";
import { getRandomPod } from "./data/correlated-registry";

/**
 * Generate OpenTelemetry resource attributes using correlated pod data
 * This ensures logs reference the same pod names as K8s
 */
function generateCorrelatedResourceAttributes(
  service: string,
): Record<string, string | number> {
  const metadata = getServiceMetadata(service);
  const pod = getRandomPod(service);

  // If we have a correlated pod, use its data
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

  // Fallback if no pod found (shouldn't happen normally)
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

// Service-specific log message templates with realistic application context
export const SERVICE_LOG_MESSAGES: Record<
  string,
  Record<LogLevel, string[]>
> = {
  frontend: {
    trace: [
      "SSR hydration started for route /products",
      "Client bundle chunk loaded: main.abc123.js",
      "React component mounted: ProductGrid",
    ],
    debug: [
      "API request initiated: GET /api/v1/products?page=1&limit=20",
      "Session token refreshed, expires in 3600s",
      "Image lazy loading triggered for viewport intersection",
    ],
    info: [
      "User session started: sessionId=sess_a1b2c3d4",
      "Page view recorded: /products",
      "Cart updated: added SKU-12345, quantity: 2",
      "Checkout initiated for cart value: $149.99",
    ],
    warn: [
      "Slow page load detected: 3.2s for /checkout",
      "Third-party script blocked by CSP: analytics.telemetryflow.id",
      "WebSocket reconnection attempt 2/5",
    ],
    error: [
      "Failed to load product images: CDN timeout",
      "Payment form validation failed: invalid card number",
      "Session expired during checkout flow",
    ],
    fatal: [
      "Critical: React hydration mismatch detected",
      "Unhandled promise rejection in checkout flow",
    ],
  },
  "api-gateway": {
    trace: [
      "Routing request to upstream: product-catalog",
      "JWT signature verification started",
      "Rate limiter bucket check: key=user:12345",
    ],
    debug: [
      "Request received: POST /api/v1/orders headers={content-type: application/json}",
      "Upstream response: 200 OK in 45ms from order-service",
      "CORS preflight handled for origin: https://shop.telemetryflow.id",
    ],
    info: [
      "Request completed: GET /api/v1/products 200 OK 32ms",
      "New route registered: POST /api/v2/checkout",
      "Rate limit applied: user 12345 (80/100 requests)",
      "Circuit breaker opened for payment-service",
    ],
    warn: [
      "Upstream timeout: payment-service exceeded 30s",
      "Rate limit exceeded for IP: 192.168.1.100",
      "Invalid JWT: token expired at 2025-01-15T10:00:00Z",
      "Request body size exceeded limit: 2.5MB > 1MB",
    ],
    error: [
      "Upstream connection refused: inventory-service:8080",
      "TLS handshake failed with upstream: certificate expired",
      "Request routing failed: no healthy upstreams for order-service",
    ],
    fatal: [
      "Gateway panic: out of file descriptors",
      "Critical: configuration reload failed, using stale config",
    ],
  },
  "user-service": {
    trace: [
      "Password hash verification started for user: user@telemetryflow.id",
      "Database query: SELECT * FROM users WHERE id = $1",
      "Redis session lookup: key=session:abc123",
    ],
    debug: [
      "User lookup by email: user@telemetryflow.id found in 2ms",
      "Session created with TTL: 86400s",
      "Password strength check passed: score 4/4",
    ],
    info: [
      "User authenticated successfully: userId=12345",
      "Password updated for user: userId=12345",
      "New user registered: email=newuser@telemetryflow.id",
      "User profile updated: userId=12345 fields=[name, phone]",
    ],
    warn: [
      "Failed login attempt 3/5 for user: user@telemetryflow.id",
      "Session near expiration: 5 minutes remaining",
      "Duplicate registration attempt: email already exists",
    ],
    error: [
      "Authentication failed: invalid password for user@telemetryflow.id",
      "Database connection lost during user query",
      "Session store unavailable: Redis connection refused",
    ],
    fatal: [
      "Critical: user data integrity check failed",
      "Security alert: multiple failed MFA attempts detected",
    ],
  },
  "product-catalog": {
    trace: [
      "Cache lookup: product:12345 TTL=3600s",
      'Elasticsearch query: index=products, query={"match": {"name": "laptop"}}',
      "Image CDN URL generated for SKU-12345",
    ],
    debug: [
      "Product search completed: 150 results in 45ms",
      "Cache hit ratio: 85% for product queries",
      "Inventory sync received: 500 product updates",
    ],
    info: [
      'Product indexed: SKU-12345 "Premium Laptop"',
      "Category updated: Electronics - 1250 products",
      "Price update batch completed: 200 products",
      'Product search: query="wireless headphones" results=45',
    ],
    warn: [
      "Slow search query: 2.5s for complex filter",
      "Elasticsearch cluster yellow: 1 replica missing",
      "Product image missing for SKU-67890",
    ],
    error: [
      "Failed to index product: Elasticsearch rejected document",
      "Database query timeout: 30s exceeded for product listing",
      "CDN upload failed for product images",
    ],
    fatal: [
      "Elasticsearch cluster red: primary shard unavailable",
      "Database connection pool exhausted",
    ],
  },
  "order-service": {
    trace: [
      "Order validation started: orderId=ORD-12345",
      "Inventory reservation request: items=[SKU-001, SKU-002]",
      "Kafka message published: topic=orders, partition=3",
    ],
    debug: [
      "Order total calculated: subtotal=$149.99, tax=$12.75, total=$162.74",
      "Payment authorization received: authCode=AUTH_ABC123",
      "Shipping options fetched: 3 available carriers",
    ],
    info: [
      "Order created successfully: orderId=ORD-12345, total=$162.74",
      "Order status updated: ORD-12345 -> PROCESSING",
      "Order shipped: ORD-12345, tracking=1Z999AA10123456784",
      "Refund processed: orderId=ORD-12345, amount=$50.00",
    ],
    warn: [
      "Partial inventory reservation: 2/3 items reserved",
      "Payment retry scheduled: orderId=ORD-12345, attempt 2",
      "Order stuck in PENDING for 30 minutes: ORD-99999",
    ],
    error: [
      "Order creation failed: insufficient inventory for SKU-12345",
      "Payment declined: card_declined for orderId=ORD-12345",
      "Failed to publish order event: Kafka broker unavailable",
    ],
    fatal: [
      "Order data corruption detected: orderId=ORD-12345",
      "Critical: order fulfillment pipeline blocked",
    ],
  },
  "payment-service": {
    trace: [
      "Stripe API request initiated: create_payment_intent",
      "PCI DSS audit log: card data accessed for payment processing",
      "Fraud check started: transactionId=TXN-ABC123",
    ],
    debug: [
      "Payment method validated: card ending in 4242",
      "Currency conversion: USD -> EUR at rate 0.92",
      "3D Secure challenge required for transaction",
    ],
    info: [
      "Payment successful: transactionId=TXN-ABC123, amount=$162.74",
      "Refund processed: transactionId=TXN-ABC123, amount=$50.00",
      "Payment method added: userId=12345, type=card",
      "Webhook received: payment.succeeded for TXN-ABC123",
    ],
    warn: [
      "Stripe API rate limit warning: 80% of quota used",
      "Payment retry due to network timeout: attempt 2/3",
      "Suspicious transaction flagged: amount=$9,999.99",
    ],
    error: [
      "Payment failed: card_declined - insufficient_funds",
      "Stripe API error: 503 Service Unavailable",
      "Refund failed: original transaction not found",
    ],
    fatal: [
      "Payment processor connection lost: all transactions affected",
      "Critical: PCI compliance violation detected",
    ],
  },
  "inventory-service": {
    trace: [
      "Stock check: SKU-12345 warehouse=US-WEST-1",
      "Reservation lock acquired: reservationId=RES-ABC123",
      "Inventory event published: topic=inventory-updates",
    ],
    debug: [
      "Stock level queried: SKU-12345 available=150, reserved=20",
      "Warehouse sync completed: 1000 items updated",
      "Reservation TTL set: 15 minutes for orderId=ORD-12345",
    ],
    info: [
      "Stock reserved: SKU-12345 quantity=2, orderId=ORD-12345",
      "Stock released: SKU-12345 quantity=1, reason=order_cancelled",
      "Low stock alert: SKU-67890 below threshold (5 remaining)",
      "Inventory recount completed: warehouse=US-WEST-1",
    ],
    warn: [
      "Near stockout: SKU-12345 only 3 units remaining",
      "Reservation expired: releasing stock for orderId=ORD-OLD123",
      "Warehouse sync delayed: 5 minute lag detected",
    ],
    error: [
      "Insufficient stock: requested 10, available 5 for SKU-12345",
      "Failed to acquire reservation lock: timeout after 5s",
      "Warehouse API unavailable: unable to verify stock",
    ],
    fatal: [
      "Inventory database corrupted: manual intervention required",
      "Critical: negative stock detected for SKU-12345",
    ],
  },
  "notification-service": {
    trace: [
      "Email template loaded: order_confirmation_v2",
      "SMTP connection established: smtp.sendgrid.net:587",
      "Push notification payload constructed: 256 bytes",
    ],
    debug: [
      "Email queued: to=user@telemetryflow.id, template=order_shipped",
      "SMS gateway selected: Twilio (US region)",
      "Notification preferences loaded for userId=12345",
    ],
    info: [
      "Email sent successfully: to=user@telemetryflow.id, messageId=MSG-ABC123",
      "Push notification delivered: deviceId=DEV-XYZ, orderId=ORD-12345",
      "SMS sent: to=+1234567890, campaign=order_reminder",
      "Notification batch processed: 500 emails sent",
    ],
    warn: [
      "Email delivery delayed: queue backlog 1000 messages",
      "Push notification failed: device token expired",
      "Rate limit approaching: SendGrid 90% of daily quota",
    ],
    error: [
      "Email delivery failed: invalid recipient address",
      "SMS gateway error: Twilio returned 503",
      "Push notification rejected: invalid APNs certificate",
    ],
    fatal: [
      "Notification queue overflow: messages being dropped",
      "All notification channels unavailable",
    ],
  },
  "search-service": {
    trace: [
      'Query parsing: "wireless bluetooth headphones" -> 3 terms',
      "Elasticsearch request: index=products, size=20",
      "Search result scoring completed in 12ms",
    ],
    debug: [
      "Search executed: 45 results in 35ms, cache=miss",
      "Autocomplete suggestions generated: 10 terms",
      "Search filters applied: category=electronics, price_range=50-200",
    ],
    info: [
      'Search completed: query="laptop", results=150, latency=45ms',
      "Index rebuilt: products index, 50,000 documents",
      "Popular searches updated: top 100 queries cached",
      "Search analytics recorded: 1000 queries processed",
    ],
    warn: [
      "Slow search: 2.5s for query with 5 filters",
      "Elasticsearch node unresponsive: switching to replica",
      "Search result cache eviction: memory pressure",
    ],
    error: [
      "Search failed: Elasticsearch connection timeout",
      "Index corruption detected: products index",
      "Query parsing error: invalid syntax in user query",
    ],
    fatal: [
      "Elasticsearch cluster unavailable",
      "Search service degraded: all caches invalid",
    ],
  },
  "shipping-service": {
    trace: [
      "Carrier API request: FedEx rate calculation",
      "Address validation: postal code 98101",
      "Tracking webhook registered: carrier=UPS",
    ],
    debug: [
      "Shipping rates fetched: 3 carriers, best=$8.99 (FedEx Ground)",
      "Label generated: trackingNumber=1Z999AA10123456784",
      "Estimated delivery: 2025-01-20 for orderId=ORD-12345",
    ],
    info: [
      "Shipment created: orderId=ORD-12345, carrier=FedEx",
      "Package picked up: trackingNumber=1Z999AA10123456784",
      "Delivery confirmed: orderId=ORD-12345",
      "Shipping label printed: warehouse=US-WEST-1",
    ],
    warn: [
      "Carrier API slow response: UPS 3.5s latency",
      "Address correction applied: invalid ZIP code",
      "Delivery delayed: weather conditions",
    ],
    error: [
      "Shipping label creation failed: invalid dimensions",
      "Carrier API unavailable: FedEx returned 503",
      "Address validation failed: undeliverable address",
    ],
    fatal: [
      "All carrier integrations unavailable",
      "Shipping queue blocked: label printer offline",
    ],
  },
};

// Fallback generic log messages
export const LOG_MESSAGES: Record<LogLevel, string[]> = {
  trace: [
    "Entering function processRequest",
    "Database query executed in 2ms",
    "Cache lookup for key user:123",
    "gRPC call initiated to upstream service",
  ],
  debug: [
    "Request payload validated successfully",
    "Response headers set: content-type=application/json",
    "Connection pool stats: active=5, idle=10, max=50",
    "Context propagation: traceId extracted from headers",
  ],
  info: [
    "Request completed successfully: 200 OK",
    "Health check passed: all dependencies healthy",
    "Configuration reloaded from ConfigMap",
    "Graceful shutdown initiated",
  ],
  warn: [
    "Slow operation detected: 500ms threshold exceeded",
    "Rate limit approaching: 80% of quota used",
    "Retry attempt 2/3 for external service call",
    "Deprecated API version used: v1 will be removed",
  ],
  error: [
    "Operation failed: connection refused to downstream",
    "Request timeout: 30s exceeded",
    "Invalid request: validation failed",
    "Circuit breaker opened: too many failures",
  ],
  fatal: [
    "Out of memory: heap exhausted",
    "Unrecoverable state: data corruption detected",
    "Critical dependency unavailable: cannot proceed",
  ],
};

// Severity number mapping (OpenTelemetry Log Data Model)
const SEVERITY_MAP: Record<LogLevel, LogSeverityNumber> = {
  trace: 1, // TRACE
  debug: 5, // DEBUG
  info: 9, // INFO
  warn: 13, // WARN
  error: 17, // ERROR
  fatal: 21, // FATAL
};

// Logger names by language/framework
const LOGGER_NAMES: Record<string, string[]> = {
  java: [
    "org.springframework.web",
    "com.example.service",
    "org.hibernate.SQL",
    "io.grpc.internal",
  ],
  go: ["main", "handler", "service", "repository", "middleware"],
  python: [
    "uvicorn.access",
    "sqlalchemy.engine",
    "celery.worker",
    "root",
    "__main__",
  ],
  nodejs: ["express", "next", "prisma", "winston", "pino"],
  rust: ["actix_web", "diesel", "tokio", "tracing"],
};

// Log cache for synchronized data across queries
interface LogCache {
  key: string;
  logs: LogRecord[];
  volumeData: LogAggregation[];
  totalCount: number;
}

let logCache: LogCache | null = null;

// Clear stale cache on hot module reload (Vite HMR)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    logCache = null;
  });
}

/**
 * Generate cache key for time range
 */
function getCacheKey(start: number, end: number): string {
  // Round to nearest minute to allow some tolerance
  const roundedStart = Math.floor(start / 60000) * 60000;
  const roundedEnd = Math.floor(end / 60000) * 60000;
  return `${roundedStart}-${roundedEnd}`;
}

/**
 * Get log message for service and level
 */
function getLogMessage(service: string, level: LogLevel): string {
  const serviceMessages = SERVICE_LOG_MESSAGES[service];
  if (
    serviceMessages &&
    serviceMessages[level] &&
    serviceMessages[level].length > 0
  ) {
    return randomItem(serviceMessages[level]);
  }
  return randomItem(LOG_MESSAGES[level]);
}

/**
 * Generate realistic code location based on service language
 */
function generateCodeLocation(service: string): {
  file: string;
  line: number;
  function: string;
} {
  const metadata = getServiceMetadata(service);
  const extensions: Record<string, string> = {
    java: ".java",
    go: ".go",
    python: ".py",
    nodejs: ".ts",
    rust: ".rs",
  };

  const files: Record<string, string[]> = {
    java: [
      "UserController",
      "OrderService",
      "PaymentHandler",
      "ProductRepository",
    ],
    go: ["handler", "service", "repository", "middleware", "main"],
    python: ["views", "services", "tasks", "models", "api"],
    nodejs: ["routes", "controllers", "services", "middleware", "utils"],
    rust: ["handlers", "services", "models", "routes", "main"],
  };

  const ext = extensions[metadata.language] || ".go";
  const fileList = files[metadata.language] || files.go;
  const file = randomItem(fileList);

  return {
    file: `src/${file}${ext}`,
    line: Math.floor(randomBetween(10, 500)),
    function: `${file}.handle${randomItem(["Request", "Event", "Message", "Query"])}`,
  };
}

/**
 * Generate a single log record with a specific level and service-specific context
 */
function generateLogRecordWithLevel(
  timestamp: number,
  level: LogLevel,
  targetService?: string,
): LogRecord {
  const service = targetService || randomItem(SERVICES);
  const metadata = getServiceMetadata(service);
  const codeLocation = generateCodeLocation(service);

  // Determine if this log should be correlated with a trace (higher for errors)
  const traceCorrelation =
    level === "error" || level === "fatal" ? 0.9 : level === "warn" ? 0.7 : 0.4;
  const hasTraceContext = Math.random() < traceCorrelation;
  const traceId = hasTraceContext ? randomId(32) : undefined;
  const spanId = hasTraceContext ? randomId(16) : undefined;

  // Build structured log attributes
  const attributes: Record<string, string | number | boolean> = {
    "code.filepath": codeLocation.file,
    "code.lineno": codeLocation.line,
    "code.function": codeLocation.function,
    "thread.id": Math.floor(randomBetween(1, 100)),
    "thread.name": `worker-${Math.floor(randomBetween(1, 16))}`,
  };

  // Add request context for HTTP services
  if (
    ["frontend", "api-gateway", "product-catalog", "user-service"].includes(
      service,
    )
  ) {
    if (Math.random() > 0.3) {
      attributes["http.request_id"] = `req-${randomId(12)}`;
      attributes["http.method"] = randomItem(["GET", "POST", "PUT", "DELETE"]);
      attributes["http.url"] = randomItem([
        "/api/v1/products",
        "/api/v1/orders",
        "/api/v1/users",
        "/api/v1/cart",
      ]);
      attributes["http.status_code"] =
        level === "error" ? randomItem([500, 502, 503]) : 200;
      attributes["http.user_agent"] = "TelemetryFlow-Agent/1.1.2";
      attributes["client.address"] = generatePrivateIP();
    }
  }

  // Add database context for data services
  if (
    [
      "user-service",
      "product-catalog",
      "order-service",
      "payment-service",
      "inventory-service",
    ].includes(service)
  ) {
    if (Math.random() > 0.5) {
      attributes["db.system"] = "postgresql";
      attributes["db.name"] = `${service.replace("-service", "")}_db`;
      attributes["db.operation"] = randomItem([
        "SELECT",
        "INSERT",
        "UPDATE",
        "DELETE",
      ]);
    }
  }

  // Add error-specific attributes
  if (level === "error" || level === "fatal") {
    attributes["exception.type"] = randomItem([
      "RuntimeException",
      "TimeoutException",
      "ConnectionException",
      "ValidationError",
      "AuthenticationError",
      "DatabaseException",
    ]);
    attributes["exception.escaped"] = String(level === "fatal");
  }

  // Build resource attributes using correlated pod data (convert to string values)
  const rawResource = generateCorrelatedResourceAttributes(service);
  const resource: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawResource)) {
    resource[key] = String(value);
  }

  // Get language-specific logger name
  const loggerNames = LOGGER_NAMES[metadata.language] || LOGGER_NAMES.go;

  // Convert attributes to string values
  const stringAttributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    stringAttributes[key] = String(value);
  }
  stringAttributes["log.logger"] = randomItem(loggerNames);

  return {
    id: randomId(16),
    timestamp,
    observedTimestamp: timestamp + Math.floor(randomBetween(1, 50)),
    severityNumber: SEVERITY_MAP[level],
    severityText: level,
    body: getLogMessage(service, level),
    attributes: stringAttributes,
    resource,
    traceId,
    spanId,
    scopeName: "",
  };
}

// ─── Multi-Source Log Generators ──────────────────────────────────────

const AUDIT_ACTIONS = [
  "user.login",
  "user.logout",
  "user.register",
  "user.update_profile",
  "role.assign",
  "role.revoke",
  "api_key.create",
  "api_key.delete",
  "dashboard.create",
  "dashboard.update",
  "alert_rule.create",
  "workspace.create",
  "data.export",
  "settings.update",
];
const AUDIT_EVENT_TYPES = ["AUTH", "AUTHZ", "DATA", "SYSTEM"];
const AUDIT_RESULTS = ["SUCCESS", "SUCCESS", "SUCCESS", "FAILURE", "DENIED"];

const UPTIME_TARGETS = [
  "https://api.example.com/health",
  "https://app.example.com",
  "https://auth.example.com/status",
  "tcp://db.internal:5432",
  "https://cdn.example.com/ping",
  "https://payments.example.com/health",
];

const STATUS_PAGE_EVENTS = [
  "Component status changed: API → operational",
  "Component status changed: Database → degraded_performance",
  "Incident created: High latency on API endpoints",
  "Incident resolved: Database connectivity restored",
  "Maintenance scheduled: Infrastructure upgrade",
  "Component status changed: CDN → operational",
];

const K8S_EVENT_TYPES = [
  "Pod scheduled on node",
  "Container started",
  "Liveness probe failed",
  "Readiness probe succeeded",
  "Image pulled successfully",
  "Deployment scaled from 3 to 5 replicas",
  "HPA triggered scale-up",
  "Node NotReady condition detected",
  "PersistentVolumeClaim bound",
  "ConfigMap updated",
  "Secret rotated",
  "Ingress rule applied",
];

const AGENT_HOSTNAMES = [
  "web-server-01",
  "web-server-02",
  "api-node-01",
  "db-primary",
  "cache-redis-01",
  "worker-01",
  "worker-02",
  "monitoring-01",
];

function generateSourcedLog(timestamp: number): LogRecord {
  const roll = Math.random();

  if (roll < 0.12) {
    // K8S Pod Logs
    const pod = getRandomPod(randomItem(SERVICES));
    return {
      id: randomId(16),
      timestamp,
      observedTimestamp: timestamp + 5,
      severityNumber: 9,
      severityText: "info",
      body: `[${pod?.name || "unknown-pod"}] ${randomItem(["Starting container", "Health check passed", "Processing request", "Connection pool refreshed", "Cache miss for key user:session"])}`,
      attributes: {},
      resource: {
        "service.name": "k8s.pod",
        "k8s.namespace.name": pod?.namespace || "default",
        "k8s.pod.name": pod?.name || "unknown",
        "k8s.node.name": pod?.nodeName || "node-1",
      },
      scopeName: "k8s-pod-logs",
    };
  }

  if (roll < 0.2) {
    // K8S Events
    const event = randomItem(K8S_EVENT_TYPES);
    const isWarning = event.includes("failed") || event.includes("NotReady");
    return {
      id: randomId(16),
      timestamp,
      observedTimestamp: timestamp + 3,
      severityNumber: isWarning ? 13 : 9,
      severityText: isWarning ? "warn" : "info",
      body: event,
      attributes: { "k8s.event.reason": event.split(" ")[0] },
      resource: {
        "service.name": "k8s.events",
        "k8s.namespace.name": randomItem([
          "ecommerce",
          "monitoring",
          "kube-system",
        ]),
        "k8s.cluster.name": K8S_CLUSTER.name,
      },
      scopeName: "k8s-events",
    };
  }

  if (roll < 0.3) {
    // Audit Logs
    const action = randomItem(AUDIT_ACTIONS);
    const eventType = randomItem(AUDIT_EVENT_TYPES);
    const result = randomItem(AUDIT_RESULTS);
    const isFailure = result !== "SUCCESS";
    return {
      id: randomId(16),
      timestamp,
      observedTimestamp: timestamp + 2,
      severityNumber: isFailure ? (eventType === "AUTH" ? 13 : 17) : 9,
      severityText: isFailure
        ? eventType === "AUTH"
          ? "warn"
          : "error"
        : "info",
      body: `[${eventType}] ${action} → ${result}`,
      attributes: {},
      resource: {
        "service.name": "audit",
        "audit.event_type": eventType,
        "audit.action": action,
        "audit.result": result,
        "audit.user_email": `user${Math.floor(randomBetween(1, 20))}@example.com`,
        "audit.ip_address": generatePrivateIP(),
      },
      scopeName: "audit-logs",
    };
  }

  if (roll < 0.38) {
    // Agent Logs
    const hostname = randomItem(AGENT_HOSTNAMES);
    const status = Math.random() < 0.85 ? "HEALTHY" : "DEGRADED";
    return {
      id: randomId(16),
      timestamp,
      observedTimestamp: timestamp + 1,
      severityNumber: status === "HEALTHY" ? 9 : 13,
      severityText: status === "HEALTHY" ? "info" : "warn",
      body: `Agent heartbeat: status=${status}, host=${hostname}`,
      attributes: {},
      resource: {
        "service.name": "tfo.agent",
        "agent.hostname": hostname,
        "agent.status": status,
      },
      scopeName: "agent-logs",
    };
  }

  if (roll < 0.43) {
    // Infrastructure Logs
    const hostname = randomItem(AGENT_HOSTNAMES);
    const cpu = randomBetween(5, 95).toFixed(1);
    const mem = randomBetween(20, 90).toFixed(1);
    return {
      id: randomId(16),
      timestamp,
      observedTimestamp: timestamp + 1,
      severityNumber: 9,
      severityText: "info",
      body: `VM sync: ${hostname}, cpu=${cpu}%, memory=${mem}%`,
      attributes: {},
      resource: {
        "service.name": "tfo.infrastructure",
        "vm.hostname": hostname,
        "infra.event": "heartbeat",
      },
      scopeName: "infra-logs",
    };
  }

  if (roll < 0.48) {
    // Uptime Logs
    const target = randomItem(UPTIME_TARGETS);
    const responseTime = Math.floor(randomBetween(50, 2000));
    const isDown = Math.random() < 0.15;
    return {
      id: randomId(16),
      timestamp,
      observedTimestamp: timestamp + 2,
      severityNumber: isDown ? 17 : 9,
      severityText: isDown ? "error" : "info",
      body: isDown
        ? `Uptime check FAILED: ${target} (timeout after ${responseTime}ms)`
        : `Uptime check OK: ${target} (${responseTime}ms)`,
      attributes: { "uptime.response_time_ms": String(responseTime) },
      resource: {
        "service.name": "tfo.uptime",
        "uptime.target": target,
        "uptime.status": isDown ? "DOWN" : "UP",
      },
      scopeName: "uptime-logs",
    };
  }

  if (roll < 0.52) {
    // Status Page Logs
    const event = randomItem(STATUS_PAGE_EVENTS);
    const isIncident = event.includes("Incident") || event.includes("degraded");
    return {
      id: randomId(16),
      timestamp,
      observedTimestamp: timestamp + 2,
      severityNumber: isIncident ? 13 : 9,
      severityText: isIncident ? "warn" : "info",
      body: event,
      attributes: {},
      resource: {
        "service.name": "tfo.status-page",
        "status_page.event": event.split(":")[0],
      },
      scopeName: "status-page-logs",
    };
  }

  // Default: OTLP Application logs (remaining ~48%)
  return generateLogRecordWithLevel(
    timestamp,
    randomItem([
      "trace",
      "debug",
      "debug",
      "debug",
      "info",
      "info",
      "info",
      "info",
      "info",
      "info",
      "warn",
      "warn",
      "error",
    ] as LogLevel[]),
  );
}

/**
 * Generate a single log record with random level (weighted by realistic distribution)
 */
export function generateLogRecord(
  timestamp?: number,
  service?: string,
): LogRecord {
  const now = timestamp || Date.now();

  // If a specific service is requested, generate an OTLP log for that service
  if (service) {
    const levelDistribution: LogLevel[] = [
      "trace",
      "debug",
      "debug",
      "debug",
      "info",
      "info",
      "info",
      "info",
      "info",
      "info",
      "warn",
      "warn",
      "error",
    ];
    const level = randomItem(levelDistribution);
    return generateLogRecordWithLevel(now, level, service);
  }

  // Otherwise, generate a multi-source log
  return generateSourcedLog(now);
}

/**
 * Ensure log cache exists and is valid for the time range
 * Generates logs with realistic volume patterns (higher during business hours)
 */
function ensureLogCache(start: number, end: number): LogCache {
  const key = getCacheKey(start, end);

  if (logCache && logCache.key === key) {
    return logCache;
  }

  // Kibana-style "Auto" interval — target ~50-90 bars with human-readable intervals
  // Snap to nice interval steps: 10s, 30s, 1m, 5m, 10m, 30m, 1h, 3h, 12h, 1d, 7d
  const NICE_INTERVALS = [
    10_000, 30_000, 60_000, 300_000, 600_000, 1_800_000, 3_600_000, 10_800_000,
    43_200_000, 86_400_000, 604_800_000,
  ];
  const targetBars = 100;
  const rawInterval = (end - start) / targetBars;
  const volumeInterval =
    NICE_INTERVALS.find((n) => n >= rawInterval) ||
    NICE_INTERVALS[NICE_INTERVALS.length - 1];
  // Separate step for log record generation (keep at ~60 buckets to limit memory)
  const logStep = (end - start) / 60;

  const volumeData: LogAggregation[] = [];
  const allLogs: LogRecord[] = [];

  // Service weights for log distribution
  const serviceWeights: Record<string, number> = {
    frontend: 0.15,
    "api-gateway": 0.2,
    "user-service": 0.1,
    "product-catalog": 0.12,
    "cart-service": 0.08,
    "order-service": 0.12,
    "payment-service": 0.08,
    "inventory-service": 0.05,
    "notification-service": 0.04,
    "search-service": 0.04,
    "shipping-service": 0.02,
  };
  const levels: LogLevel[] = [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
  ];

  // --- Pass 1: Generate dense volume histogram data ---
  for (let t = start; t < end; t += volumeInterval) {
    const hour = new Date(t).getHours();
    let trafficMultiplier = 1;

    if (hour >= 9 && hour <= 17) {
      trafficMultiplier = 2;
    } else if (hour >= 0 && hour <= 6) {
      trafficMultiplier = 0.3;
    }
    trafficMultiplier *= randomBetween(0.8, 1.2);

    // Scale baseCount inversely with bucket count so total volume stays realistic
    const bucketScale = volumeInterval / logStep;
    const baseCount = Math.floor(
      randomBetween(100, 400) * trafficMultiplier * bucketScale,
    );

    const byLevel = {
      trace: Math.floor(baseCount * 0.02),
      debug: Math.floor(baseCount * 0.2),
      info: Math.floor(baseCount * 0.55),
      warn: Math.floor(baseCount * 0.15),
      error: Math.floor(baseCount * 0.07),
      fatal: Math.floor(baseCount * 0.01),
    };

    if (Math.random() < 0.03) {
      byLevel.error = Math.floor(byLevel.error * randomBetween(3, 8));
      byLevel.warn = Math.floor(byLevel.warn * randomBetween(2, 4));
    }

    volumeData.push({
      timestamp: t,
      count: Object.values(byLevel).reduce((a, b) => a + b, 0),
      byLevel,
    });
  }

  // --- Pass 2: Generate log records (fewer buckets to keep memory reasonable) ---
  for (let t = start; t < end; t += logStep) {
    const hour = new Date(t).getHours();
    let trafficMultiplier = 1;

    if (hour >= 9 && hour <= 17) {
      trafficMultiplier = 2;
    } else if (hour >= 0 && hour <= 6) {
      trafficMultiplier = 0.3;
    }
    trafficMultiplier *= randomBetween(0.8, 1.2);

    const baseCount = Math.floor(randomBetween(100, 400) * trafficMultiplier);
    const byLevel = {
      trace: Math.floor(baseCount * 0.02),
      debug: Math.floor(baseCount * 0.2),
      info: Math.floor(baseCount * 0.55),
      warn: Math.floor(baseCount * 0.15),
      error: Math.floor(baseCount * 0.07),
      fatal: Math.floor(baseCount * 0.01),
    };

    const bucketEnd = t + logStep;

    levels.forEach((level) => {
      const count = byLevel[level];
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let cumulative = 0;
        let selectedService: string = SERVICES[0];

        for (const [svc, weight] of Object.entries(serviceWeights)) {
          cumulative += weight;
          if (rand < cumulative) {
            selectedService = svc;
            break;
          }
        }

        allLogs.push(
          generateLogRecordWithLevel(
            generateTimestamp(t, bucketEnd),
            level,
            selectedService,
          ),
        );
      }
    });
  }

  // Sort logs by timestamp descending
  allLogs.sort((a, b) => b.timestamp - a.timestamp);

  logCache = {
    key,
    logs: allLogs,
    volumeData,
    totalCount: allLogs.length,
  };

  return logCache;
}

/**
 * Generate logs for a time range
 * @param start - Start timestamp
 * @param end - End timestamp
 * @param count - Number of logs to return (default 100)
 * @param offset - Offset for pagination (default 0)
 */
export function generateLogs(
  start: number,
  end: number,
  count: number = 100,
  offset: number = 0,
): LogRecord[] {
  const cache = ensureLogCache(start, end);
  return cache.logs.slice(offset, offset + count);
}

/**
 * Generate log volume aggregation data
 */
export function generateLogVolume(
  start: number,
  end: number,
): LogAggregation[] {
  const cache = ensureLogCache(start, end);
  return cache.volumeData;
}

/**
 * Get total log count for time range
 */
export function getLogTotalCount(start: number, end: number): number {
  const cache = ensureLogCache(start, end);
  return cache.totalCount;
}

/**
 * Get available log services
 */
export function generateLogServices(): string[] {
  return [...SERVICES];
}

/**
 * Clear log cache (useful for testing)
 */
export function clearLogCache(): void {
  logCache = null;
}

/**
 * Generate logs correlated to a specific traceId
 * Used for "Related Logs" feature in trace detail view
 */
export function generateLogsByTraceId(
  traceId: string,
  start: number,
  end: number,
): LogRecord[] {
  // Generate 5-15 correlated logs for the trace
  const logCount = Math.floor(randomBetween(5, 15));
  const logs: LogRecord[] = [];

  // Realistic log level distribution for a single request trace
  const levelDistribution: LogLevel[] = [
    "debug",
    "debug",
    "info",
    "info",
    "info",
    "info",
    "warn",
    "error", // Some traces will have errors
  ];

  // Use the trace duration to distribute logs
  const duration = end - start;
  const step = duration / logCount;

  for (let i = 0; i < logCount; i++) {
    const timestamp =
      start + Math.floor(step * i) + Math.floor(randomBetween(0, step * 0.5));
    const level =
      i === logCount - 1 && Math.random() < 0.3
        ? "error" // Last log has 30% chance of being error (request completion or failure)
        : randomItem(levelDistribution);

    const service = randomItem(SERVICES);
    const codeLocation = generateCodeLocation(service);

    // Build structured log attributes
    const attributes: Record<string, string | number | boolean> = {
      "code.filepath": codeLocation.file,
      "code.lineno": codeLocation.line,
      "code.function": codeLocation.function,
      "thread.id": Math.floor(randomBetween(1, 100)),
      "thread.name": `worker-${Math.floor(randomBetween(1, 16))}`,
    };

    // Add request context - use traceId for correlation
    attributes["http.request_id"] = `req-${traceId.substring(0, 12)}`;
    attributes["http.method"] = randomItem(["GET", "POST", "PUT", "DELETE"]);
    attributes["http.url"] = randomItem([
      "/api/v1/products",
      "/api/v1/orders",
      "/api/v1/users",
      "/api/v1/cart",
    ]);

    // Build resource attributes
    const rawResource = generateCorrelatedResourceAttributes(service);
    const resource: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawResource)) {
      resource[key] = String(value);
    }

    const metadata = getServiceMetadata(service);
    const loggerNames = LOGGER_NAMES[metadata.language] || LOGGER_NAMES.go;
    const stringAttributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(attributes)) {
      stringAttributes[key] = String(value);
    }
    stringAttributes["log.logger"] = randomItem(loggerNames);

    logs.push({
      id: randomId(16),
      timestamp,
      observedTimestamp: timestamp + Math.floor(randomBetween(1, 50)),
      severityNumber: SEVERITY_MAP[level],
      severityText: level,
      body: getLogMessage(service, level),
      attributes: stringAttributes,
      resource,
      traceId, // Use the provided traceId for correlation
      spanId: randomId(16),
    });
  }

  // Sort by timestamp ascending (oldest first)
  return logs.sort((a, b) => a.timestamp - b.timestamp);
}

// Export logs mock data service
export const logsMock = {
  generateLog: generateLogRecord,
  getLogs: generateLogs,
  getLogVolume: generateLogVolume,
  getLogTotalCount,
  getLogServices: generateLogServices,
  getLogsByTraceId: generateLogsByTraceId,
  clearCache: clearLogCache,
};
