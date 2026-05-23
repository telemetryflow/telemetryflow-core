/**
 * Telemetry Constants
 * OTEL standard constants, API endpoints, and metric names
 */

// ============================================
// OTEL Severity Levels (Log Severity)
// ============================================

export const OTEL_SEVERITY_LEVELS = {
  TRACE: 1,
  TRACE2: 2,
  TRACE3: 3,
  TRACE4: 4,
  DEBUG: 5,
  DEBUG2: 6,
  DEBUG3: 7,
  DEBUG4: 8,
  INFO: 9,
  INFO2: 10,
  INFO3: 11,
  INFO4: 12,
  WARN: 13,
  WARN2: 14,
  WARN3: 15,
  WARN4: 16,
  ERROR: 17,
  ERROR2: 18,
  ERROR3: 19,
  ERROR4: 20,
  FATAL: 21,
  FATAL2: 22,
  FATAL3: 23,
  FATAL4: 24,
} as const;

export const OTEL_SEVERITY_TEXT: Record<number, string> = {
  1: 'TRACE', 2: 'TRACE2', 3: 'TRACE3', 4: 'TRACE4',
  5: 'DEBUG', 6: 'DEBUG2', 7: 'DEBUG3', 8: 'DEBUG4',
  9: 'INFO', 10: 'INFO2', 11: 'INFO3', 12: 'INFO4',
  13: 'WARN', 14: 'WARN2', 15: 'WARN3', 16: 'WARN4',
  17: 'ERROR', 18: 'ERROR2', 19: 'ERROR3', 20: 'ERROR4',
  21: 'FATAL', 22: 'FATAL2', 23: 'FATAL3', 24: 'FATAL4',
};

// ============================================
// OTEL Metric Types
// ============================================

export const OTEL_METRIC_TYPES = ['gauge', 'counter', 'histogram', 'summary'] as const;

export type OTELMetricType = typeof OTEL_METRIC_TYPES[number];

// ============================================
// OTEL Span Kinds
// ============================================

export const OTEL_SPAN_KINDS = {
  UNSPECIFIED: 0,
  INTERNAL: 1,
  SERVER: 2,
  CLIENT: 3,
  PRODUCER: 4,
  CONSUMER: 5,
} as const;

export const OTEL_SPAN_KIND_TEXT: Record<number, string> = {
  0: 'unspecified',
  1: 'internal',
  2: 'server',
  3: 'client',
  4: 'producer',
  5: 'consumer',
};

// ============================================
// OTEL Span Status Codes
// ============================================

export const OTEL_SPAN_STATUS_CODES = {
  UNSET: 0,
  OK: 1,
  ERROR: 2,
} as const;

export const OTEL_SPAN_STATUS_TEXT: Record<number, string> = {
  0: 'unset',
  1: 'ok',
  2: 'error',
};

// ============================================
// API Endpoints
// ============================================

export const OTEL_V1_ENDPOINTS = {
  METRICS: '/v1/metrics',
  LOGS: '/v1/logs',
  TRACES: '/v1/traces',
} as const;

export const TFO_V2_ENDPOINTS = {
  // Metrics
  METRICS: '/v2/metrics',
  METRICS_QUERY: '/v2/metrics/query',
  METRICS_LABELS: '/v2/metrics/labels',
  METRICS_METADATA: '/v2/metrics/metadata',
  METRICS_SERIES: '/v2/metrics/series',
  // Logs
  LOGS: '/v2/logs',
  LOGS_QUERY: '/v2/logs/query',
  LOGS_PATTERNS: '/v2/logs/patterns',
  LOGS_FIELDS: '/v2/logs/fields',
  LOGS_STREAM: '/v2/logs/stream',
  // Traces
  TRACES: '/v2/traces',
  TRACES_QUERY: '/v2/traces/query',
  TRACES_SERVICES: '/v2/traces/services',
  TRACES_OPERATIONS: '/v2/traces/operations',
  TRACES_DEPENDENCIES: '/v2/traces/dependencies',
  TRACES_LATENCY: '/v2/traces/latency',
  // Exemplars
  EXEMPLARS: '/v2/exemplars',
  EXEMPLARS_QUERY: '/v2/exemplars/query',
  // Kubernetes
  KUBERNETES: '/v2/kubernetes',
  KUBERNETES_OVERVIEW: '/v2/kubernetes/overview',
  KUBERNETES_CLUSTERS: '/v2/kubernetes/clusters',
  KUBERNETES_NODES: '/v2/kubernetes/nodes',
  KUBERNETES_NAMESPACES: '/v2/kubernetes/namespaces',
  KUBERNETES_PODS: '/v2/kubernetes/pods',
  KUBERNETES_DEPLOYMENTS: '/v2/kubernetes/deployments',
  // Infrastructure
  INFRASTRUCTURE: '/v2/infrastructure',
  INFRASTRUCTURE_VMS: '/v2/infrastructure/vms',
  INFRASTRUCTURE_METRICS: '/v2/infrastructure/metrics',
  // Alerts
  ALERTS: '/v2/alerts',
  ALERTS_RULES: '/v2/alerts/rules',
  ALERTS_HISTORY: '/v2/alerts/history',
  ALERTS_INCIDENTS: '/v2/alerts/incidents',
  // Health
  HEALTH: '/v2/health',
  STATUS: '/v2/status',
} as const;

// ============================================
// VM Metric Names (OTEL Semantic Conventions)
// ============================================

export const VM_METRICS = {
  CPU: {
    UTILIZATION: 'system.cpu.utilization',
    TIME: 'system.cpu.time',
    LOAD_1M: 'system.cpu.load_average.1m',
    LOAD_5M: 'system.cpu.load_average.5m',
    LOAD_15M: 'system.cpu.load_average.15m',
  },
  MEMORY: {
    UTILIZATION: 'system.memory.utilization',
    USAGE: 'system.memory.usage',
    LIMIT: 'system.memory.limit',
    AVAILABLE: 'system.memory.available',
    CACHED: 'system.memory.cached',
    BUFFERED: 'system.memory.buffered',
  },
  DISK: {
    IO: 'system.disk.io',
    IO_READ: 'system.disk.io.read',
    IO_WRITE: 'system.disk.io.write',
    OPERATIONS: 'system.disk.operations',
    OPERATIONS_READ: 'system.disk.operations.read',
    OPERATIONS_WRITE: 'system.disk.operations.write',
    IO_TIME: 'system.disk.io_time',
    OPERATION_TIME: 'system.disk.operation_time',
    MERGED: 'system.disk.merged',
    PENDING_OPERATIONS: 'system.disk.pending_operations',
    WEIGHTED_IO_TIME: 'system.disk.weighted_io_time',
  },
  FILESYSTEM: {
    USAGE: 'system.filesystem.usage',
    UTILIZATION: 'system.filesystem.utilization',
    INODES_USAGE: 'system.filesystem.inodes.usage',
    INODES_FREE: 'system.filesystem.inodes.free',
  },
  NETWORK: {
    IO: 'system.network.io',
    IO_RECEIVE: 'system.network.io.receive',
    IO_TRANSMIT: 'system.network.io.transmit',
    PACKETS: 'system.network.packets',
    PACKETS_RECEIVE: 'system.network.packets.receive',
    PACKETS_TRANSMIT: 'system.network.packets.transmit',
    ERRORS: 'system.network.errors',
    ERRORS_RECEIVE: 'system.network.errors.receive',
    ERRORS_TRANSMIT: 'system.network.errors.transmit',
    DROPPED: 'system.network.dropped',
    DROPPED_RECEIVE: 'system.network.dropped.receive',
    DROPPED_TRANSMIT: 'system.network.dropped.transmit',
    CONNECTIONS: 'system.network.connections',
  },
  PROCESS: {
    COUNT: 'system.processes.count',
    CREATED: 'system.processes.created',
  },
  PAGING: {
    USAGE: 'system.paging.usage',
    UTILIZATION: 'system.paging.utilization',
    FAULTS: 'system.paging.faults',
    OPERATIONS: 'system.paging.operations',
  },
} as const;

// ============================================
// K8s Metric Names (OTEL Semantic Conventions)
// ============================================

export const K8S_METRICS = {
  CLUSTER: {
    NODE_COUNT: 'k8s.cluster.node.count',
    POD_COUNT: 'k8s.cluster.pod.count',
    NAMESPACE_COUNT: 'k8s.cluster.namespace.count',
    DEPLOYMENT_COUNT: 'k8s.cluster.deployment.count',
  },
  NODE: {
    CPU_UTILIZATION: 'k8s.node.cpu.utilization',
    CPU_TIME: 'k8s.node.cpu.time',
    CPU_USAGE: 'k8s.node.cpu.usage',
    MEMORY_AVAILABLE: 'k8s.node.memory.available',
    MEMORY_USAGE: 'k8s.node.memory.usage',
    MEMORY_RSS: 'k8s.node.memory.rss',
    MEMORY_WORKING_SET: 'k8s.node.memory.working_set',
    FILESYSTEM_AVAILABLE: 'k8s.node.filesystem.available',
    FILESYSTEM_CAPACITY: 'k8s.node.filesystem.capacity',
    FILESYSTEM_USAGE: 'k8s.node.filesystem.usage',
    NETWORK_IO: 'k8s.node.network.io',
    NETWORK_ERRORS: 'k8s.node.network.errors',
    CONDITION: 'k8s.node.condition',
    ALLOCATABLE_CPU: 'k8s.node.allocatable.cpu',
    ALLOCATABLE_MEMORY: 'k8s.node.allocatable.memory',
  },
  POD: {
    CPU_UTILIZATION: 'k8s.pod.cpu.utilization',
    CPU_TIME: 'k8s.pod.cpu.time',
    CPU_USAGE: 'k8s.pod.cpu.usage',
    MEMORY_USAGE: 'k8s.pod.memory.usage',
    MEMORY_RSS: 'k8s.pod.memory.rss',
    MEMORY_WORKING_SET: 'k8s.pod.memory.working_set',
    MEMORY_LIMIT_UTILIZATION: 'k8s.pod.memory.limit_utilization',
    NETWORK_IO: 'k8s.pod.network.io',
    NETWORK_ERRORS: 'k8s.pod.network.errors',
    PHASE: 'k8s.pod.phase',
    UPTIME: 'k8s.pod.uptime',
  },
  CONTAINER: {
    CPU_UTILIZATION: 'k8s.container.cpu.utilization',
    CPU_TIME: 'k8s.container.cpu.time',
    CPU_USAGE: 'k8s.container.cpu.usage',
    MEMORY_USAGE: 'k8s.container.memory.usage',
    MEMORY_RSS: 'k8s.container.memory.rss',
    MEMORY_WORKING_SET: 'k8s.container.memory.working_set',
    MEMORY_LIMIT_UTILIZATION: 'k8s.container.memory.limit_utilization',
    FILESYSTEM_AVAILABLE: 'k8s.container.filesystem.available',
    FILESYSTEM_CAPACITY: 'k8s.container.filesystem.capacity',
    FILESYSTEM_USAGE: 'k8s.container.filesystem.usage',
    RESTARTS: 'k8s.container.restarts',
    READY: 'k8s.container.ready',
    UPTIME: 'k8s.container.uptime',
  },
  DEPLOYMENT: {
    DESIRED: 'k8s.deployment.desired',
    AVAILABLE: 'k8s.deployment.available',
    READY: 'k8s.deployment.ready',
    UPDATED: 'k8s.deployment.updated',
    UNAVAILABLE: 'k8s.deployment.unavailable',
  },
  REPLICASET: {
    DESIRED: 'k8s.replicaset.desired',
    AVAILABLE: 'k8s.replicaset.available',
    READY: 'k8s.replicaset.ready',
  },
  DAEMONSET: {
    CURRENT_SCHEDULED: 'k8s.daemonset.current_scheduled',
    DESIRED_SCHEDULED: 'k8s.daemonset.desired_scheduled',
    MISSCHEDULED: 'k8s.daemonset.misscheduled',
    READY: 'k8s.daemonset.ready',
  },
  STATEFULSET: {
    DESIRED: 'k8s.statefulset.desired',
    READY: 'k8s.statefulset.ready',
    CURRENT: 'k8s.statefulset.current',
    UPDATED: 'k8s.statefulset.updated',
  },
  JOB: {
    ACTIVE: 'k8s.job.active',
    FAILED: 'k8s.job.failed',
    SUCCESSFUL: 'k8s.job.successful',
  },
  CRONJOB: {
    ACTIVE: 'k8s.cronjob.active',
  },
  NAMESPACE: {
    POD_COUNT: 'k8s.namespace.pod.count',
    CPU_USAGE: 'k8s.namespace.cpu.usage',
    CPU_LIMIT: 'k8s.namespace.cpu.limit',
    CPU_REQUEST: 'k8s.namespace.cpu.request',
    MEMORY_USAGE: 'k8s.namespace.memory.usage',
    MEMORY_LIMIT: 'k8s.namespace.memory.limit',
    MEMORY_REQUEST: 'k8s.namespace.memory.request',
  },
  HPA: {
    CURRENT_REPLICAS: 'k8s.hpa.current_replicas',
    DESIRED_REPLICAS: 'k8s.hpa.desired_replicas',
    MAX_REPLICAS: 'k8s.hpa.max_replicas',
    MIN_REPLICAS: 'k8s.hpa.min_replicas',
  },
  RESOURCE_QUOTA: {
    HARD_LIMIT: 'k8s.resource_quota.hard_limit',
    USED: 'k8s.resource_quota.used',
  },
} as const;

// ============================================
// Application Metrics (Common Patterns)
// ============================================

export const APP_METRICS = {
  HTTP: {
    REQUEST_TOTAL: 'http.server.request.total',
    REQUEST_DURATION: 'http.server.request.duration',
    REQUEST_SIZE: 'http.server.request.size',
    RESPONSE_SIZE: 'http.server.response.size',
    ACTIVE_REQUESTS: 'http.server.active_requests',
  },
  RPC: {
    REQUEST_TOTAL: 'rpc.server.request.total',
    REQUEST_DURATION: 'rpc.server.request.duration',
  },
  DB: {
    CLIENT_OPERATION_DURATION: 'db.client.operation.duration',
    CLIENT_CONNECTIONS_USAGE: 'db.client.connections.usage',
    CLIENT_CONNECTIONS_MAX: 'db.client.connections.max',
  },
  MESSAGING: {
    PUBLISH_DURATION: 'messaging.publish.duration',
    RECEIVE_DURATION: 'messaging.receive.duration',
    PROCESS_DURATION: 'messaging.process.duration',
    MESSAGE_COUNT: 'messaging.message.count',
  },
  RUNTIME: {
    GC_PAUSE_TIME: 'process.runtime.gc.pause_time',
    GC_COUNT: 'process.runtime.gc.count',
    MEMORY_USAGE: 'process.runtime.memory.usage',
    CPU_TIME: 'process.runtime.cpu.time',
    THREAD_COUNT: 'process.runtime.thread.count',
  },
} as const;

// ============================================
// Common Services for Mock Data
// ============================================

export const MOCK_SERVICES = [
  'api-gateway',
  'auth-service',
  'user-service',
  'order-service',
  'payment-service',
  'inventory-service',
  'notification-service',
  'search-service',
  'recommendation-service',
  'analytics-service',
  'logging-service',
  'config-service',
  'discovery-service',
  'gateway-service',
] as const;

export const MOCK_OPERATIONS = [
  'GET /api/v1/users',
  'POST /api/v1/users',
  'GET /api/v1/orders',
  'POST /api/v1/orders',
  'GET /api/v1/products',
  'POST /api/v1/products',
  'GET /api/v1/health',
  'POST /api/v1/auth/login',
  'POST /api/v1/auth/logout',
  'GET /api/v1/search',
  'POST /api/v1/payments',
  'GET /api/v1/notifications',
] as const;

export const MOCK_NAMESPACES = [
  'default',
  'kube-system',
  'kube-public',
  'kube-node-lease',
  'monitoring',
  'logging',
  'ingress-nginx',
  'cert-manager',
  'istio-system',
  'production',
  'staging',
  'development',
] as const;

export const MOCK_CLOUD_PROVIDERS = ['aws', 'gcp', 'azure', 'digitalocean', 'linode'] as const;

export const MOCK_CLOUD_REGIONS = {
  aws: ['ap-southeast-3', 'ap-southeast-1'],
  gcp: ['asia-southeast1', 'asia-southeast2'],
  azure: ['southeastasia', 'eastasia'],
  digitalocean: ['sgp1', 'blr1'],
  linode: ['ap-south', 'ap-southeast'],
} as const;

export const MOCK_CLUSTERS = [
  'production-east',
  'production-west',
  'staging',
  'development',
  'qa-cluster',
] as const;

export const MOCK_REGIONS = [
  'ap-southeast-3',
  'ap-southeast-1',
] as const;

// ============================================
// Default Thresholds
// ============================================

export const DEFAULT_THRESHOLDS = {
  CPU: { warning: 70, critical: 90 },
  MEMORY: { warning: 80, critical: 95 },
  DISK: { warning: 75, critical: 90 },
  ERROR_RATE: { warning: 1, critical: 5 },
  LATENCY_P95: { warning: 500, critical: 1000 },
  LATENCY_P99: { warning: 1000, critical: 2000 },
} as const;

// ============================================
// Service Metadata (E-commerce Microservices)
// ============================================

export const SERVICES = [
  'frontend',
  'api-gateway',
  'user-service',
  'product-catalog',
  'cart-service',
  'order-service',
  'payment-service',
  'inventory-service',
  'notification-service',
  'recommendation-engine',
  'search-service',
  'shipping-service',
] as const;

export type ServiceName = typeof SERVICES[number];

export const SERVICE_METADATA: Record<ServiceName, {
  version: string;
  language: string;
  framework: string;
  sdkVersion: string;
  replicas: number;
}> = {
  'frontend': { version: '2.4.1', language: 'nodejs', framework: 'nextjs', sdkVersion: '1.21.0', replicas: 3 },
  'api-gateway': { version: '1.8.0', language: 'go', framework: 'gin', sdkVersion: '1.24.0', replicas: 4 },
  'user-service': { version: '3.1.2', language: 'java', framework: 'spring-boot', sdkVersion: '1.35.0', replicas: 2 },
  'product-catalog': { version: '1.5.0', language: 'python', framework: 'fastapi', sdkVersion: '1.23.0', replicas: 3 },
  'cart-service': { version: '2.0.3', language: 'go', framework: 'grpc', sdkVersion: '1.24.0', replicas: 2 },
  'order-service': { version: '4.2.1', language: 'java', framework: 'spring-boot', sdkVersion: '1.35.0', replicas: 3 },
  'payment-service': { version: '2.8.0', language: 'java', framework: 'spring-boot', sdkVersion: '1.35.0', replicas: 2 },
  'inventory-service': { version: '1.9.4', language: 'rust', framework: 'actix-web', sdkVersion: '0.22.0', replicas: 2 },
  'notification-service': { version: '1.3.0', language: 'python', framework: 'celery', sdkVersion: '1.23.0', replicas: 2 },
  'recommendation-engine': { version: '0.9.2', language: 'python', framework: 'tensorflow-serving', sdkVersion: '1.23.0', replicas: 2 },
  'search-service': { version: '2.1.0', language: 'java', framework: 'elasticsearch-client', sdkVersion: '1.35.0', replicas: 2 },
  'shipping-service': { version: '1.4.5', language: 'go', framework: 'gin', sdkVersion: '1.24.0', replicas: 2 },
};

// ============================================
// Service Operations
// ============================================

export const SERVICE_OPERATIONS: Record<ServiceName, string[]> = {
  'frontend': [
    'GET /', 'GET /products', 'GET /products/{id}', 'GET /cart',
    'POST /cart/add', 'GET /checkout', 'POST /checkout', 'GET /orders',
    'GET /orders/{id}', 'GET /account', 'POST /login', 'POST /logout'
  ],
  'api-gateway': [
    'GET /api/v1/products', 'GET /api/v1/products/{id}', 'POST /api/v1/cart',
    'PUT /api/v1/cart/{id}', 'DELETE /api/v1/cart/{id}', 'POST /api/v1/orders',
    'GET /api/v1/orders/{id}', 'POST /api/v1/auth/login', 'POST /api/v1/auth/refresh',
    'GET /api/v1/users/me'
  ],
  'user-service': [
    'UserService.GetUser', 'UserService.CreateUser', 'UserService.UpdateUser',
    'UserService.DeleteUser', 'UserService.ListUsers', 'UserService.ValidateCredentials',
    'UserService.UpdatePassword', 'UserService.GetUserPreferences'
  ],
  'product-catalog': [
    'GET /products', 'GET /products/{id}', 'GET /products/search',
    'GET /categories', 'GET /categories/{id}/products', 'POST /products',
    'PUT /products/{id}'
  ],
  'cart-service': [
    'CartService.GetCart', 'CartService.AddItem', 'CartService.UpdateQuantity',
    'CartService.RemoveItem', 'CartService.ClearCart', 'CartService.ApplyCoupon'
  ],
  'order-service': [
    'OrderService.CreateOrder', 'OrderService.GetOrder', 'OrderService.ListOrders',
    'OrderService.UpdateOrderStatus', 'OrderService.CancelOrder', 'OrderService.ProcessRefund'
  ],
  'payment-service': [
    'PaymentService.ProcessPayment', 'PaymentService.ValidatePaymentMethod',
    'PaymentService.RefundPayment', 'PaymentService.GetPaymentStatus',
    'PaymentService.CreatePaymentIntent'
  ],
  'inventory-service': [
    'GET /inventory/{sku}', 'PUT /inventory/{sku}/reserve', 'PUT /inventory/{sku}/release',
    'GET /inventory/check-availability', 'POST /inventory/bulk-update'
  ],
  'notification-service': [
    'send_email', 'send_sms', 'send_push_notification',
    'process_notification_queue', 'schedule_notification'
  ],
  'recommendation-engine': [
    'GetRecommendations', 'GetSimilarProducts', 'GetPersonalizedFeed',
    'UpdateUserProfile', 'TrainModel'
  ],
  'search-service': [
    'SearchService.Search', 'SearchService.Suggest', 'SearchService.IndexProduct',
    'SearchService.DeleteIndex', 'SearchService.GetTrending'
  ],
  'shipping-service': [
    'GET /shipping/rates', 'POST /shipping/calculate', 'POST /shipping/create-label',
    'GET /shipping/track/{id}', 'PUT /shipping/update-status'
  ],
};

// ============================================
// Service Dependencies
// ============================================

export const SERVICE_DEPENDENCIES: Record<string, string[]> = {
  'frontend': ['api-gateway'],
  'api-gateway': ['user-service', 'product-catalog', 'cart-service', 'order-service', 'search-service', 'recommendation-engine'],
  'user-service': ['postgres:users_db', 'redis:session_cache'],
  'product-catalog': ['postgres:catalog_db', 'redis:product_cache', 'elasticsearch:products'],
  'cart-service': ['redis:cart_store', 'product-catalog'],
  'order-service': ['postgres:orders_db', 'payment-service', 'inventory-service', 'notification-service', 'shipping-service', 'kafka:orders'],
  'payment-service': ['postgres:payments_db', 'stripe:api', 'kafka:payments'],
  'inventory-service': ['postgres:inventory_db', 'redis:inventory_cache', 'kafka:inventory'],
  'notification-service': ['sendgrid:api', 'twilio:api', 'firebase:fcm', 'kafka:notifications'],
  'recommendation-engine': ['redis:ml_cache', 'postgres:ml_features', 'product-catalog'],
  'search-service': ['elasticsearch:products', 'product-catalog'],
  'shipping-service': ['fedex:api', 'ups:api', 'postgres:shipping_db'],
};

// ============================================
// TelemetryFlow Collector Configuration
// ============================================

export const COLLECTOR_CONFIG = {
  name: 'telemetryflow-collector',
  version: '1.1.2',
  endpoints: {
    otel: {
      v1: {
        grpc: '0.0.0.0:4317',
        http: '0.0.0.0:4318',
        traces: '/v1/traces',
        metrics: '/v1/metrics',
        logs: '/v1/logs',
      },
    },
    tfo: {
      v2: {
        http: '0.0.0.0:4318',
        basePath: '/v2',
        traces: '/v2/traces',
        metrics: '/v2/metrics',
        logs: '/v2/logs',
        exemplars: '/v2/exemplars',
        alerts: '/v2/alerts',
        correlations: '/v2/correlations',
        kubernetes: '/v2/kubernetes',
      },
    },
    prometheus: '0.0.0.0:8888',
    health: '0.0.0.0:13133',
    websocket: '0.0.0.0:4319',
  },
  pipelines: {
    traces: {
      receivers: ['otlp'],
      processors: ['batch', 'memory_limiter', 'tail_sampling'],
      exporters: ['otlp/jaeger', 'clickhouse', 'debug'],
    },
    metrics: {
      receivers: ['otlp', 'prometheus', 'hostmetrics'],
      processors: ['batch', 'cumulativetodelta'],
      exporters: ['prometheusremotewrite', 'clickhouse', 'debug'],
    },
    logs: {
      receivers: ['otlp', 'filelog', 'journald'],
      processors: ['batch', 'attributes', 'transform'],
      exporters: ['loki', 'clickhouse', 'debug'],
    },
  },
} as const;

// ============================================
// TelemetryFlow Agent Configuration
// ============================================

export const AGENT_CONFIG = {
  name: 'telemetryflow-agent',
  version: '1.1.2',
  sdk: {
    name: 'opentelemetry',
    version: '1.25.0',
  },
  exporters: {
    otel: { endpoint: 'http://collector:4317', protocol: 'grpc' },
    tfo: { endpoint: 'http://collector:4318/v2', protocol: 'http/protobuf' },
  },
  instrumentation: {
    autoInstrumented: true,
    libraries: [
      'requests', 'flask', 'fastapi', 'django',
      'sqlalchemy', 'psycopg2', 'pymysql',
      'redis', 'kafka-python', 'grpcio',
      'httpx', 'aiohttp', 'celery',
    ],
  },
  samplingRules: {
    default: { type: 'parentbased_traceidratio', ratio: 0.1 },
    errors: { type: 'always_on' },
    highValue: { type: 'parentbased_traceidratio', ratio: 1.0 },
  },
} as const;

// ============================================
// Error Types
// ============================================

export const ERROR_TYPES = {
  database: ['ConnectionTimeout', 'DeadlockDetected', 'QueryTimeout', 'ConnectionPoolExhausted'],
  network: ['ConnectionRefused', 'DNSResolutionFailed', 'TLSHandshakeError', 'SocketTimeout'],
  application: ['NullPointerException', 'IllegalArgumentException', 'ValidationError', 'AuthenticationFailed'],
  external: ['RateLimitExceeded', 'ServiceUnavailable', 'PaymentDeclined', 'InvalidAPIKey'],
} as const;
