/**
 * Shared Mock Data Utilities and Constants
 * Common utilities, services, and operations used across all mock data generators
 * Simulates realistic data from TelemetryFlow Collector and Agent
 */

// Service names used across the telemetry platform
// Core services aligned with backend service-map seeds:
//   API Gateway, User Service, Order Service, Payment Service,
//   PostgreSQL Primary, Redis Cache, RabbitMQ, Notification Service
// Complementary TelemetryFlow Platform services retained for frontend completeness
export const SERVICES = [
  "api-gateway",
  "user-service",
  "order-service",
  "payment-service",
  "notification-service",
  "postgresql-primary",
  "redis-cache",
  "rabbitmq",
  "frontend",
  "product-catalog",
  "cart-service",
  "inventory-service",
  "search-service",
  "shipping-service",
] as const;

export type ServiceName = (typeof SERVICES)[number];

// Service metadata with realistic TelemetryFlow Agent instrumentation
// Versions for core services aligned with backend service-map seed versions
export const SERVICE_METADATA: Record<
  ServiceName,
  {
    version: string;
    language: string;
    framework: string;
    sdkVersion: string;
    replicas: number;
  }
> = {
  // --- Core services (synced with backend service-map seeds) ---
  "api-gateway": {
    version: "1.0.0",
    language: "go",
    framework: "gin",
    sdkVersion: "1.24.0",
    replicas: 4,
  },
  "user-service": {
    version: "2.1.0",
    language: "java",
    framework: "spring-boot",
    sdkVersion: "1.35.0",
    replicas: 2,
  },
  "order-service": {
    version: "1.5.2",
    language: "java",
    framework: "spring-boot",
    sdkVersion: "1.35.0",
    replicas: 3,
  },
  "payment-service": {
    version: "1.2.0",
    language: "java",
    framework: "spring-boot",
    sdkVersion: "1.35.0",
    replicas: 2,
  },
  "notification-service": {
    version: "1.0.5",
    language: "python",
    framework: "celery",
    sdkVersion: "1.23.0",
    replicas: 2,
  },
  "postgresql-primary": {
    version: "14.5",
    language: "c",
    framework: "postgresql",
    sdkVersion: "0.0.0",
    replicas: 1,
  },
  "redis-cache": {
    version: "7.0",
    language: "c",
    framework: "redis",
    sdkVersion: "0.0.0",
    replicas: 1,
  },
  rabbitmq: {
    version: "3.11",
    language: "erlang",
    framework: "rabbitmq",
    sdkVersion: "0.0.0",
    replicas: 1,
  },
  // --- Complementary TelemetryFlow services ---
  frontend: {
    version: "2.4.1",
    language: "nodejs",
    framework: "nextjs",
    sdkVersion: "1.21.0",
    replicas: 3,
  },
  "product-catalog": {
    version: "1.5.0",
    language: "python",
    framework: "fastapi",
    sdkVersion: "1.23.0",
    replicas: 3,
  },
  "cart-service": {
    version: "2.0.3",
    language: "go",
    framework: "grpc",
    sdkVersion: "1.24.0",
    replicas: 2,
  },
  "inventory-service": {
    version: "1.9.4",
    language: "rust",
    framework: "actix-web",
    sdkVersion: "0.22.0",
    replicas: 2,
  },
  "search-service": {
    version: "2.1.0",
    language: "java",
    framework: "elasticsearch-client",
    sdkVersion: "1.35.0",
    replicas: 2,
  },
  "shipping-service": {
    version: "1.4.5",
    language: "go",
    framework: "gin",
    sdkVersion: "1.24.0",
    replicas: 2,
  },
};

// Service-specific operations with realistic endpoint patterns
export const OPERATIONS: Record<ServiceName, string[]> = {
  // --- Core services (synced with backend service-map seeds) ---
  "api-gateway": [
    "GET /api/v1/products",
    "GET /api/v1/products/{id}",
    "POST /api/v1/cart",
    "PUT /api/v1/cart/{id}",
    "DELETE /api/v1/cart/{id}",
    "POST /api/v1/orders",
    "GET /api/v1/orders/{id}",
    "POST /api/v1/auth/login",
    "POST /api/v1/auth/refresh",
    "GET /api/v1/users/me",
  ],
  "user-service": [
    "UserService.GetUser",
    "UserService.CreateUser",
    "UserService.UpdateUser",
    "UserService.DeleteUser",
    "UserService.ListUsers",
    "UserService.ValidateCredentials",
    "UserService.UpdatePassword",
    "UserService.GetUserPreferences",
  ],
  "order-service": [
    "OrderService.CreateOrder",
    "OrderService.GetOrder",
    "OrderService.ListOrders",
    "OrderService.UpdateOrderStatus",
    "OrderService.CancelOrder",
    "OrderService.ProcessRefund",
  ],
  "payment-service": [
    "PaymentService.ProcessPayment",
    "PaymentService.ValidatePaymentMethod",
    "PaymentService.RefundPayment",
    "PaymentService.GetPaymentStatus",
    "PaymentService.CreatePaymentIntent",
  ],
  "notification-service": [
    "send_email",
    "send_sms",
    "send_push_notification",
    "process_notification_queue",
    "schedule_notification",
  ],
  "postgresql-primary": [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "VACUUM",
    "ANALYZE",
  ],
  "redis-cache": [
    "GET",
    "SET",
    "DEL",
    "HGET",
    "HSET",
    "EXPIRE",
    "PUBLISH",
    "SUBSCRIBE",
  ],
  rabbitmq: [
    "publish",
    "consume",
    "ack",
    "nack",
    "queue.declare",
    "exchange.declare",
  ],
  // --- Complementary TelemetryFlow services ---
  frontend: [
    "GET /",
    "GET /products",
    "GET /products/{id}",
    "GET /cart",
    "POST /cart/add",
    "GET /checkout",
    "POST /checkout",
    "GET /orders",
    "GET /orders/{id}",
    "GET /account",
    "POST /login",
    "POST /logout",
  ],
  "product-catalog": [
    "GET /products",
    "GET /products/{id}",
    "GET /products/search",
    "GET /categories",
    "GET /categories/{id}/products",
    "POST /products",
    "PUT /products/{id}",
  ],
  "cart-service": [
    "CartService.GetCart",
    "CartService.AddItem",
    "CartService.UpdateQuantity",
    "CartService.RemoveItem",
    "CartService.ClearCart",
    "CartService.ApplyCoupon",
  ],
  "inventory-service": [
    "GET /inventory/{sku}",
    "PUT /inventory/{sku}/reserve",
    "PUT /inventory/{sku}/release",
    "GET /inventory/check-availability",
    "POST /inventory/bulk-update",
  ],
  "search-service": [
    "SearchService.Search",
    "SearchService.Suggest",
    "SearchService.IndexProduct",
    "SearchService.DeleteIndex",
    "SearchService.GetTrending",
  ],
  "shipping-service": [
    "GET /shipping/rates",
    "POST /shipping/calculate",
    "POST /shipping/create-label",
    "GET /shipping/track/{id}",
    "PUT /shipping/update-status",
  ],
};

// Service dependencies for dependency graphs
// Core dependency graph aligned with backend service-map seed dependencies
export const SERVICE_DEPENDENCIES: Record<string, string[]> = {
  // --- Core dependencies (synced with backend service-map seeds) ---
  frontend: ["api-gateway"],
  "api-gateway": [
    "user-service",
    "order-service",
    "product-catalog",
    "cart-service",
    "search-service",
  ],
  "user-service": ["postgresql-primary", "redis-cache"],
  "order-service": ["postgresql-primary", "payment-service", "rabbitmq"],
  "payment-service": ["postgresql-primary"],
  "notification-service": ["rabbitmq"],
  // --- Complementary dependencies ---
  "product-catalog": [
    "postgresql-primary",
    "redis-cache",
    "elasticsearch:products",
  ],
  "cart-service": ["redis-cache", "product-catalog"],
  "inventory-service": ["postgresql-primary", "redis-cache", "rabbitmq"],
  "search-service": ["elasticsearch:products", "product-catalog"],
  "shipping-service": ["postgresql-primary"],
};

// Database and external service types for dependency visualization
// Core infrastructure services (postgresql-primary, redis-cache, rabbitmq) are now
// first-class entries in SERVICES; these are additional external dependencies
export const EXTERNAL_SERVICES = [
  "elasticsearch:products",
  "stripe:api",
  "sendgrid:api",
  "twilio:api",
  "firebase:fcm",
] as const;

// Latency buckets for heatmaps and distributions (OpenTelemetry histogram boundaries)
export const LATENCY_BUCKETS = [
  "0",
  "5ms",
  "10ms",
  "25ms",
  "50ms",
  "100ms",
  "0.25s",
  "0.5s",
  "1s",
  "2.5s",
  "5s",
  "10s",
  ">10s",
  "errors",
] as const;

// HTTP methods
export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

// HTTP status codes with realistic distribution weights
export const HTTP_STATUS_CODES = {
  success: ["200", "201", "204"],
  redirect: ["301", "302", "304"],
  clientError: ["400", "401", "403", "404", "422", "429"],
  serverError: ["500", "502", "503", "504"],
} as const;

export const ALL_STATUS_CODES = [
  "200",
  "201",
  "204",
  "301",
  "302",
  "304",
  "400",
  "401",
  "403",
  "404",
  "422",
  "429",
  "500",
  "502",
  "503",
  "504",
] as const;

// API paths for various services
export const API_PATHS = [
  "/api/v1/products",
  "/api/v1/products/{id}",
  "/api/v1/cart",
  "/api/v1/orders",
  "/api/v1/users",
  "/api/v1/users/me",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/search",
  "/api/v1/recommendations",
  "/api/v1/checkout",
  "/api/v1/shipping",
] as const;

// =============================================================================
// Multi-Region, Multi-Cluster Kubernetes Configuration
// Hierarchical structure: Region → Cluster → Namespace → Resources
// =============================================================================

// Available regions (synced with backend IAM RegionsSeed)
export const K8S_REGIONS = [
  { id: "us-east-1", name: "US East (N. Virginia)", provider: "aws" },
  { id: "us-west-2", name: "US West (Oregon)", provider: "aws" },
  { id: "eu-west-1", name: "EU West (Ireland)", provider: "aws" },
  { id: "ap-southeast-1", name: "Asia Pacific (Singapore)", provider: "aws" },
  { id: "ap-southeast-3", name: "Asia Pacific (Jakarta)", provider: "aws" },
] as const;

export type K8sRegionId = (typeof K8S_REGIONS)[number]["id"];

// Cluster configuration per region
export interface K8sClusterConfig {
  id: string;
  name: string;
  displayName: string;
  version: string;
  provider: "eks" | "gke" | "aks" | "kind";
  region: K8sRegionId | string;
  environment: "production" | "staging" | "development";
  namespaces: string[];
  nodeCount: number;
  status: "healthy" | "degraded" | "critical";
  /** API server endpoint (optional, used by backend-synced seed clusters) */
  apiServer?: string;
  /** Total pods count (optional, used by backend-synced seed clusters) */
  totalPods?: number;
}

// =============================================================================
// Backend-synced seed clusters (must appear first for correlation with backend)
// These 4 clusters match the backend Kubernetes seed data exactly.
// =============================================================================
export const K8S_SEED_CLUSTERS: K8sClusterConfig[] = [
  {
    id: "cluster-prod-us-east-1",
    name: "prod-us-east-1",
    displayName: "Production US East",
    version: "1.28.4",
    provider: "eks",
    region: "us-east-1",
    environment: "production",
    namespaces: [
      "default",
      "kube-system",
      "monitoring",
      "telemetryflow",
      "ingress-nginx",
      "cert-manager",
    ],
    nodeCount: 5,
    status: "healthy",
    apiServer: "https://k8s-prod-us-east.telemetryflow.id:6443",
    totalPods: 45,
  },
  {
    id: "cluster-prod-eu-west-1",
    name: "prod-eu-west-1",
    displayName: "Production EU West",
    version: "1.28.4",
    provider: "eks",
    region: "eu-west-1",
    environment: "production",
    namespaces: [
      "default",
      "kube-system",
      "monitoring",
      "telemetryflow",
      "ingress-nginx",
      "cert-manager",
    ],
    nodeCount: 3,
    status: "healthy",
    apiServer: "https://k8s-prod-eu-west.telemetryflow.id:6443",
    totalPods: 28,
  },
  {
    id: "cluster-staging-us-east-1",
    name: "staging-us-east-1",
    displayName: "Staging US East",
    version: "1.29.0",
    provider: "gke",
    region: "us-east-1",
    environment: "staging",
    namespaces: [
      "default",
      "kube-system",
      "monitoring",
      "telemetryflow",
      "ingress-nginx",
    ],
    nodeCount: 2,
    status: "healthy",
    apiServer: "https://k8s-staging.telemetryflow.id:6443",
    totalPods: 15,
  },
  {
    id: "cluster-dev-local",
    name: "dev-local",
    displayName: "Development Local",
    version: "1.29.1",
    provider: "kind",
    region: "us-east-1",
    environment: "development",
    namespaces: ["default", "kube-system", "monitoring", "telemetryflow"],
    nodeCount: 1,
    status: "healthy",
    apiServer: "https://localhost:6443",
    totalPods: 8,
  },
];

// All clusters organized by region
// Seed clusters are integrated inline first; complementary frontend clusters follow
export const K8S_CLUSTERS: Record<K8sRegionId, K8sClusterConfig[]> = {
  "us-west-2": [
    {
      id: "usw2-prod-01",
      name: "prod-cluster-01",
      displayName: "Production US-West",
      version: "1.34.2",
      provider: "eks",
      region: "us-west-2",
      environment: "production",
      namespaces: [
        "ecommerce",
        "monitoring",
        "istio-system",
        "kube-system",
        "cert-manager",
        "logging",
      ],
      nodeCount: 6,
      status: "healthy",
    },
    {
      id: "usw2-staging-01",
      name: "staging-cluster-01",
      displayName: "Staging US-West",
      version: "1.34.2",
      provider: "eks",
      region: "us-west-2",
      environment: "staging",
      namespaces: ["ecommerce-staging", "monitoring", "kube-system"],
      nodeCount: 3,
      status: "healthy",
    },
  ],
  "us-east-1": [
    // Seed clusters first
    K8S_SEED_CLUSTERS[0], // prod-us-east-1
    K8S_SEED_CLUSTERS[2], // staging-us-east-1
    K8S_SEED_CLUSTERS[3], // dev-local (grouped in us-east-1 for convenience)
    // Existing frontend clusters
    {
      id: "use1-prod-01",
      name: "prod-cluster-east",
      displayName: "Production US-East",
      version: "1.34.2",
      provider: "eks",
      region: "us-east-1",
      environment: "production",
      namespaces: [
        "ecommerce",
        "monitoring",
        "istio-system",
        "kube-system",
        "cert-manager",
      ],
      nodeCount: 5,
      status: "healthy",
    },
    {
      id: "use1-dr-01",
      name: "dr-cluster-01",
      displayName: "Disaster Recovery",
      version: "1.33.4",
      provider: "eks",
      region: "us-east-1",
      environment: "production",
      namespaces: ["ecommerce-dr", "monitoring", "kube-system"],
      nodeCount: 4,
      status: "degraded",
    },
    {
      id: "use1-aks-01",
      name: "aks-cluster-east",
      displayName: "AKS Production US-East",
      version: "1.34.0",
      provider: "aks",
      region: "us-east-1",
      environment: "production",
      namespaces: ["ecommerce", "monitoring", "kube-system", "ingress-nginx"],
      nodeCount: 4,
      status: "healthy",
    },
  ],
  "eu-west-1": [
    // Seed cluster first
    K8S_SEED_CLUSTERS[1], // prod-eu-west-1
    // Existing frontend clusters
    {
      id: "euw1-prod-01",
      name: "prod-cluster-eu",
      displayName: "Production EU-West",
      version: "1.34.2",
      provider: "eks",
      region: "eu-west-1",
      environment: "production",
      namespaces: [
        "ecommerce",
        "monitoring",
        "istio-system",
        "kube-system",
        "cert-manager",
        "gdpr-compliance",
      ],
      nodeCount: 5,
      status: "healthy",
    },
    {
      id: "euw1-gke-01",
      name: "gke-cluster-eu",
      displayName: "GKE Production EU",
      version: "1.34.1",
      provider: "gke",
      region: "eu-west-1",
      environment: "production",
      namespaces: ["ecommerce", "monitoring", "istio-system", "kube-system"],
      nodeCount: 4,
      status: "healthy",
    },
  ],
  "ap-southeast-1": [
    {
      id: "apse1-prod-01",
      name: "prod-cluster-apac",
      displayName: "Production APAC",
      version: "1.33.4",
      provider: "eks",
      region: "ap-southeast-1",
      environment: "production",
      namespaces: ["ecommerce", "monitoring", "kube-system"],
      nodeCount: 4,
      status: "healthy",
    },
    {
      id: "apse1-dev-01",
      name: "dev-cluster-apac",
      displayName: "Development APAC",
      version: "1.34.2",
      provider: "eks",
      region: "ap-southeast-1",
      environment: "development",
      namespaces: ["ecommerce-dev", "testing", "kube-system"],
      nodeCount: 2,
      status: "healthy",
    },
  ],
  "ap-southeast-3": [],
};

// Flat list of all clusters for easy iteration
export const K8S_ALL_CLUSTERS = Object.values(K8S_CLUSTERS).flat();

// Node configurations per cluster (keyed by cluster id)
export interface K8sNodeConfig {
  name: string;
  instanceType: string;
  cpu: number;
  memory: number;
  zone: string;
}

export const K8S_NODES_BY_CLUSTER: Record<string, K8sNodeConfig[]> = {
  // Backend-synced seed nodes for prod-us-east-1 cluster (matches backend KubernetesClustersSeed)
  "cluster-prod-us-east-1": [
    {
      name: "ip-10-0-1-10.ec2.internal",
      instanceType: "m5.xlarge",
      cpu: 4,
      memory: 16,
      zone: "us-east-1a",
    },
    {
      name: "ip-10-0-1-20.ec2.internal",
      instanceType: "m5.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-east-1b",
    },
    {
      name: "ip-10-0-1-21.ec2.internal",
      instanceType: "m5.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-east-1c",
    },
    {
      name: "ip-10-0-1-30.ec2.internal",
      instanceType: "m5.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-east-1a",
    },
  ],
  // Backend-synced seed nodes for prod-eu-west-1 cluster (3 nodes)
  "cluster-prod-eu-west-1": [
    {
      name: "ip-10-1-1-10.ec2.internal",
      instanceType: "m5.xlarge",
      cpu: 4,
      memory: 16,
      zone: "eu-west-1a",
    },
    {
      name: "ip-10-1-1-20.ec2.internal",
      instanceType: "m5.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "eu-west-1a",
    },
    {
      name: "ip-10-1-1-21.ec2.internal",
      instanceType: "m5.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "eu-west-1b",
    },
  ],
  // Backend-synced seed nodes for staging-us-east-1 cluster (2 nodes, GKE)
  "cluster-staging-us-east-1": [
    {
      name: "gke-staging-pool-1-a1b2c3d4",
      instanceType: "n2-standard-4",
      cpu: 4,
      memory: 16,
      zone: "us-east1-b",
    },
    {
      name: "gke-staging-pool-1-e5f6g7h8",
      instanceType: "n2-standard-4",
      cpu: 4,
      memory: 16,
      zone: "us-east1-c",
    },
  ],
  // Backend-synced seed nodes for dev-local cluster (1 node, kind)
  "cluster-dev-local": [
    {
      name: "dev-local-control-plane",
      instanceType: "kind-node",
      cpu: 4,
      memory: 8,
      zone: "local",
    },
  ],
  // Complementary frontend clusters
  "usw2-prod-01": [
    {
      name: "ip-10-0-1-101.us-west-2.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-west-2a",
    },
    {
      name: "ip-10-0-1-102.us-west-2.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-west-2a",
    },
    {
      name: "ip-10-0-2-103.us-west-2.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-west-2b",
    },
    {
      name: "ip-10-0-2-104.us-west-2.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-west-2b",
    },
    {
      name: "ip-10-0-3-105.us-west-2.compute.internal",
      instanceType: "c6i.4xlarge",
      cpu: 16,
      memory: 32,
      zone: "us-west-2c",
    },
    {
      name: "ip-10-0-3-106.us-west-2.compute.internal",
      instanceType: "c6i.4xlarge",
      cpu: 16,
      memory: 32,
      zone: "us-west-2c",
    },
  ],
  "usw2-staging-01": [
    {
      name: "ip-10-1-1-101.us-west-2.compute.internal",
      instanceType: "m6i.xlarge",
      cpu: 4,
      memory: 16,
      zone: "us-west-2a",
    },
    {
      name: "ip-10-1-1-102.us-west-2.compute.internal",
      instanceType: "m6i.xlarge",
      cpu: 4,
      memory: 16,
      zone: "us-west-2b",
    },
    {
      name: "ip-10-1-2-103.us-west-2.compute.internal",
      instanceType: "m6i.xlarge",
      cpu: 4,
      memory: 16,
      zone: "us-west-2c",
    },
  ],
  "use1-prod-01": [
    {
      name: "ip-10-0-1-201.us-east-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-east-1a",
    },
    {
      name: "ip-10-0-1-202.us-east-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-east-1a",
    },
    {
      name: "ip-10-0-2-203.us-east-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "us-east-1b",
    },
    {
      name: "ip-10-0-2-204.us-east-1.compute.internal",
      instanceType: "c6i.4xlarge",
      cpu: 16,
      memory: 32,
      zone: "us-east-1b",
    },
    {
      name: "ip-10-0-3-205.us-east-1.compute.internal",
      instanceType: "c6i.4xlarge",
      cpu: 16,
      memory: 32,
      zone: "us-east-1c",
    },
  ],
  "use1-dr-01": [
    {
      name: "ip-10-2-1-201.us-east-1.compute.internal",
      instanceType: "m6i.xlarge",
      cpu: 4,
      memory: 16,
      zone: "us-east-1a",
    },
    {
      name: "ip-10-2-1-202.us-east-1.compute.internal",
      instanceType: "m6i.xlarge",
      cpu: 4,
      memory: 16,
      zone: "us-east-1b",
    },
    {
      name: "ip-10-2-2-203.us-east-1.compute.internal",
      instanceType: "m6i.xlarge",
      cpu: 4,
      memory: 16,
      zone: "us-east-1c",
    },
    {
      name: "ip-10-2-2-204.us-east-1.compute.internal",
      instanceType: "m6i.xlarge",
      cpu: 4,
      memory: 16,
      zone: "us-east-1c",
    },
  ],
  "euw1-prod-01": [
    {
      name: "ip-10-0-1-301.eu-west-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "eu-west-1a",
    },
    {
      name: "ip-10-0-1-302.eu-west-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "eu-west-1a",
    },
    {
      name: "ip-10-0-2-303.eu-west-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "eu-west-1b",
    },
    {
      name: "ip-10-0-2-304.eu-west-1.compute.internal",
      instanceType: "c6i.4xlarge",
      cpu: 16,
      memory: 32,
      zone: "eu-west-1b",
    },
    {
      name: "ip-10-0-3-305.eu-west-1.compute.internal",
      instanceType: "c6i.4xlarge",
      cpu: 16,
      memory: 32,
      zone: "eu-west-1c",
    },
  ],
  "apse1-prod-01": [
    {
      name: "ip-10-0-1-401.ap-southeast-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "ap-southeast-1a",
    },
    {
      name: "ip-10-0-1-402.ap-southeast-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "ap-southeast-1a",
    },
    {
      name: "ip-10-0-2-403.ap-southeast-1.compute.internal",
      instanceType: "m6i.2xlarge",
      cpu: 8,
      memory: 32,
      zone: "ap-southeast-1b",
    },
    {
      name: "ip-10-0-2-404.ap-southeast-1.compute.internal",
      instanceType: "c6i.4xlarge",
      cpu: 16,
      memory: 32,
      zone: "ap-southeast-1c",
    },
  ],
  "apse1-dev-01": [
    {
      name: "ip-10-1-1-401.ap-southeast-1.compute.internal",
      instanceType: "m6i.large",
      cpu: 2,
      memory: 8,
      zone: "ap-southeast-1a",
    },
    {
      name: "ip-10-1-1-402.ap-southeast-1.compute.internal",
      instanceType: "m6i.large",
      cpu: 2,
      memory: 8,
      zone: "ap-southeast-1b",
    },
  ],
  // GKE Cluster - EU-West
  "euw1-gke-01": [
    {
      name: "gke-euw1-prod-pool-1-a1b2c3d4",
      instanceType: "n2-standard-8",
      cpu: 8,
      memory: 32,
      zone: "europe-west1-b",
    },
    {
      name: "gke-euw1-prod-pool-1-e5f6g7h8",
      instanceType: "n2-standard-8",
      cpu: 8,
      memory: 32,
      zone: "europe-west1-c",
    },
    {
      name: "gke-euw1-prod-pool-2-i9j0k1l2",
      instanceType: "n2-highmem-4",
      cpu: 4,
      memory: 32,
      zone: "europe-west1-d",
    },
    {
      name: "gke-euw1-prod-pool-2-m3n4o5p6",
      instanceType: "n2-highcpu-8",
      cpu: 8,
      memory: 8,
      zone: "europe-west1-b",
    },
  ],
  // AKS Cluster - US-East
  "use1-aks-01": [
    {
      name: "aks-use1-agentpool-12345678-vmss000000",
      instanceType: "Standard_D8s_v3",
      cpu: 8,
      memory: 32,
      zone: "eastus-1",
    },
    {
      name: "aks-use1-agentpool-12345678-vmss000001",
      instanceType: "Standard_D8s_v3",
      cpu: 8,
      memory: 32,
      zone: "eastus-2",
    },
    {
      name: "aks-use1-agentpool-12345678-vmss000002",
      instanceType: "Standard_F8s_v2",
      cpu: 8,
      memory: 16,
      zone: "eastus-3",
    },
    {
      name: "aks-use1-agentpool-12345678-vmss000003",
      instanceType: "Standard_D4s_v3",
      cpu: 4,
      memory: 16,
      zone: "eastus-1",
    },
  ],
};

// Legacy exports for backward compatibility (keeps original default cluster)
export const K8S_CLUSTER = K8S_CLUSTERS["us-west-2"][0]; // usw2-prod-01
export const K8S_NODES = K8S_NODES_BY_CLUSTER["usw2-prod-01"];

// Helper functions for filtering
export function getClustersByRegion(regionId: K8sRegionId): K8sClusterConfig[] {
  return K8S_CLUSTERS[regionId] || [];
}

export function getClusterById(
  clusterId: string,
): K8sClusterConfig | undefined {
  return K8S_ALL_CLUSTERS.find((c) => c.id === clusterId);
}

export function getNodesByCluster(clusterId: string): K8sNodeConfig[] {
  return K8S_NODES_BY_CLUSTER[clusterId] || [];
}

export function getNamespacesByCluster(clusterId: string): string[] {
  const cluster = getClusterById(clusterId);
  return cluster?.namespaces || [];
}

// TelemetryFlow Collector configuration with dual API support
// - Native OTEL v1 endpoints (community standard)
// - TelemetryFlow v2 endpoints (extended features)
export const COLLECTOR_CONFIG = {
  name: "telemetryflow-collector",
  version: "1.1.2",
  endpoints: {
    // Native OTEL v1 endpoints (community compatible)
    otel: {
      v1: {
        grpc: "0.0.0.0:4317",
        http: "0.0.0.0:4318",
        traces: "/v1/traces",
        metrics: "/v1/metrics",
        logs: "/v1/logs",
      },
    },
    // TelemetryFlow v2 extended API
    tfo: {
      v2: {
        http: "0.0.0.0:4318",
        basePath: "/v2",
        traces: "/v2/traces",
        metrics: "/v2/metrics",
        logs: "/v2/logs",
        exemplars: "/v2/exemplars",
        alerts: "/v2/alerts",
        correlations: "/v2/correlations",
        kubernetes: "/v2/kubernetes",
      },
    },
    prometheus: "0.0.0.0:8888",
    health: "0.0.0.0:13133",
    websocket: "0.0.0.0:4319",
  },
  pipelines: {
    traces: {
      receivers: ["otlp"],
      processors: ["batch", "memory_limiter", "tail_sampling"],
      exporters: ["otlp/jaeger", "clickhouse", "debug"],
    },
    metrics: {
      receivers: ["otlp", "prometheus", "hostmetrics"],
      processors: ["batch", "cumulativetodelta"],
      exporters: ["prometheusremotewrite", "clickhouse", "debug"],
    },
    logs: {
      receivers: ["otlp", "filelog", "journald"],
      processors: ["batch", "attributes", "transform"],
      exporters: ["loki", "clickhouse", "debug"],
    },
  },
} as const;

// TelemetryFlow Agent v2 configuration
export const AGENT_CONFIG = {
  name: "telemetryflow-agent",
  version: "1.1.2",
  sdk: {
    name: "opentelemetry",
    version: "1.25.0",
  },
  // Supports both OTEL v1 and TFO v2 export
  exporters: {
    otel: { endpoint: "http://collector:4317", protocol: "grpc" },
    tfo: { endpoint: "http://collector:4318/v2", protocol: "http/protobuf" },
  },
  instrumentation: {
    autoInstrumented: true,
    libraries: [
      "requests",
      "flask",
      "fastapi",
      "django",
      "sqlalchemy",
      "psycopg2",
      "pymysql",
      "redis",
      "kafka-python",
      "grpcio",
      "httpx",
      "aiohttp",
      "celery",
    ],
  },
  samplingRules: {
    default: { type: "parentbased_traceidratio", ratio: 0.1 },
    errors: { type: "always_on" },
    highValue: { type: "parentbased_traceidratio", ratio: 1.0 },
  },
} as const;

// Error types for realistic error simulation
export const ERROR_TYPES = {
  database: [
    "ConnectionTimeout",
    "DeadlockDetected",
    "QueryTimeout",
    "ConnectionPoolExhausted",
  ],
  network: [
    "ConnectionRefused",
    "DNSResolutionFailed",
    "TLSHandshakeError",
    "SocketTimeout",
  ],
  application: [
    "NullPointerException",
    "IllegalArgumentException",
    "ValidationError",
    "AuthenticationFailed",
  ],
  external: [
    "RateLimitExceeded",
    "ServiceUnavailable",
    "PaymentDeclined",
    "InvalidAPIKey",
  ],
} as const;

// Utility Functions

/**
 * Generate a random hexadecimal ID
 */
export function randomId(length: number = 32): string {
  const chars = "0123456789abcdef";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

/**
 * Pick a random item from an array
 */
export function randomItem<T>(array: readonly T[] | T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random number between min and max
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random timestamp between start and end
 */
export function generateTimestamp(start: number, end: number): number {
  return Math.floor(randomBetween(start, end));
}

/**
 * Generate time series data points
 */
export function generateTimeSeriesData(
  start: number,
  end: number,
  options: {
    baseValue?: number;
    variance?: number;
    trendAmplitude?: number;
    spikeChance?: number;
    spikeMultiplier?: number;
    dataPoints?: number;
  } = {},
): Array<[number, number]> {
  const {
    baseValue = 100,
    variance = 30,
    trendAmplitude = 20,
    spikeChance = 0.05,
    spikeMultiplier = 3,
    dataPoints = 60,
  } = options;

  const data: Array<[number, number]> = [];
  const step = (end - start) / dataPoints;

  for (let t = start; t <= end; t += step) {
    const trend = Math.sin(t / 3600000) * trendAmplitude;
    const noise = (Math.random() - 0.5) * variance;
    const spike =
      Math.random() < spikeChance
        ? Math.random() * variance * spikeMultiplier
        : 0;
    const value = Math.max(0, baseValue + trend + noise + spike);
    data.push([t, value]);
  }

  return data;
}

/**
 * Round a number to specified decimal places
 */
export function roundTo(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Get operations for a service (with fallback)
 */
export function getServiceOperations(service: string): string[] {
  return OPERATIONS[service as ServiceName] || ["process"];
}

/**
 * Get service metadata
 */
export function getServiceMetadata(service: string) {
  return (
    SERVICE_METADATA[service as ServiceName] || {
      version: "1.0.0",
      language: "unknown",
      framework: "unknown",
      sdkVersion: "1.0.0",
      replicas: 1,
    }
  );
}

/**
 * Generate realistic pod name for a service
 */
export function generatePodName(service: string): string {
  const suffix = randomId(5);
  const replicaSet = randomId(5);
  return `${service}-${replicaSet}-${suffix}`;
}

/**
 * Generate realistic container ID
 */
export function generateContainerId(): string {
  return `containerd://${randomId(64)}`;
}

/**
 * Generate realistic IP address (private subnet)
 */
export function generatePrivateIP(): string {
  return `10.${Math.floor(randomBetween(0, 255))}.${Math.floor(randomBetween(0, 255))}.${Math.floor(randomBetween(1, 254))}`;
}

/**
 * Generate weighted random status code based on realistic distribution
 */
export function generateStatusCode(errorRate: number = 0.05): string {
  const rand = Math.random();
  if (rand < errorRate * 0.7) {
    return randomItem(HTTP_STATUS_CODES.serverError);
  } else if (rand < errorRate) {
    return randomItem(HTTP_STATUS_CODES.clientError);
  } else {
    return randomItem(HTTP_STATUS_CODES.success);
  }
}

/**
 * Generate realistic user agent string
 */
export function generateUserAgent(): string {
  const agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
    "Go-http-client/2.0",
    "python-requests/2.31.0",
    "axios/1.6.2",
    "okhttp/4.12.0",
  ];
  return randomItem(agents);
}

/**
 * Generate OpenTelemetry resource attributes for a service
 */
export function generateResourceAttributes(
  service: string,
): Record<string, string | number> {
  const metadata = getServiceMetadata(service);
  const podName = generatePodName(service);
  const nodeIdx = Math.floor(Math.random() * K8S_NODES.length);
  const node = K8S_NODES[nodeIdx];

  return {
    "service.name": service,
    "service.version": metadata.version,
    "service.namespace": "telemetryflow",
    "telemetry.sdk.name": "opentelemetry",
    "telemetry.sdk.language": metadata.language,
    "telemetry.sdk.version": metadata.sdkVersion,
    "deployment.environment": "production",
    "cloud.provider": "aws",
    "cloud.region": K8S_CLUSTER.region,
    "k8s.cluster.name": K8S_CLUSTER.name,
    "k8s.namespace.name": "telemetryflow",
    "k8s.deployment.name": service,
    "k8s.pod.name": podName,
    "k8s.node.name": node.name,
    "container.runtime": "containerd",
    "host.arch": "amd64",
  };
}

/**
 * Generate realistic trace context
 */
export function generateTraceContext(): {
  traceId: string;
  spanId: string;
  traceFlags: string;
} {
  return {
    traceId: randomId(32),
    spanId: randomId(16),
    traceFlags: "01", // sampled
  };
}

/**
 * Generate W3C traceparent header
 */
export function generateTraceparent(traceId: string, spanId: string): string {
  return `00-${traceId}-${spanId}-01`;
}

/**
 * Calculate service latency based on service characteristics
 */
export function calculateServiceLatency(
  service: string,
  operation: string,
): number {
  const metadata = getServiceMetadata(service);
  let baseLatency: number;

  // Base latency varies by language/framework
  switch (metadata.language) {
    case "go":
    case "rust":
      baseLatency = randomBetween(2, 30);
      break;
    case "java":
      baseLatency = randomBetween(10, 80);
      break;
    case "python":
      baseLatency = randomBetween(15, 100);
      break;
    case "nodejs":
      baseLatency = randomBetween(5, 50);
      break;
    default:
      baseLatency = randomBetween(10, 50);
  }

  // Adjust for operation type
  if (operation.includes("search") || operation.includes("Search")) {
    baseLatency *= randomBetween(1.5, 3);
  } else if (operation.includes("Create") || operation.includes("POST")) {
    baseLatency *= randomBetween(1.2, 2);
  } else if (operation.includes("List") || operation.includes("GET /")) {
    baseLatency *= randomBetween(1, 1.5);
  }

  // Add realistic jitter
  const jitter = baseLatency * randomBetween(-0.2, 0.3);
  return Math.max(1, baseLatency + jitter);
}
