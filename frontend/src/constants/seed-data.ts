/**
 * Shared Seed Data Constants
 * TASK-07: Synchronized data between backend seeds and frontend mocks
 *
 * These constants mirror the backend seed data to ensure:
 * 1. Mock data matches real data structure
 * 2. Seamless switching between mock and real modes
 * 3. Consistent test data across the platform
 */

// ==================== ORGANIZATIONS ====================

export const SEED_ORGANIZATIONS = {
  DEVOPSCORNER: {
    id: "org-devopscorner-001",
    name: "DevOpsCorner",
    slug: "devopscorner",
    code: "DEVOPSCORNER",
    domain: "devopscorner.id",
    description: "DevOps and Cloud Infrastructure Solutions",
    region: "ap-southeast-3",
    regionId: "reg-ap-southeast-3",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  TELEMETRYFLOW: {
    id: "org-telemetryflow-001",
    name: "TelemetryFlow",
    slug: "telemetryflow",
    code: "TELEMETRYFLOW",
    domain: "telemetryflow.id",
    description: "Observability Platform Provider",
    region: "ap-southeast-1",
    regionId: "reg-ap-southeast-1",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  CLOUDNATIVE_LABS: {
    id: "org-cloudnative-001",
    name: "CloudNative Labs",
    slug: "cloudnative-labs",
    code: "CLOUDNATIVE",
    domain: "cloudnativelabs.io",
    description: "Cloud Native Consulting & Training",
    region: "us-east-1",
    regionId: "reg-us-east-1",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  INFRAWATCH: {
    id: "org-infrawatch-001",
    name: "InfraWatch",
    slug: "infrawatch",
    code: "INFRAWATCH",
    domain: "infrawatch.dev",
    description: "Infrastructure Monitoring Solutions",
    region: "eu-west-1",
    regionId: "reg-eu-west-1",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
} as const;

// ==================== WORKSPACES ====================

export const SEED_WORKSPACES = {
  DEVOPSCORNER: {
    id: "ws-devopscorner-001",
    name: "DEVOPSCORNER-WORKSPACE",
    description: "Default workspace for DevOpsCorner organization",
    organizationId: SEED_ORGANIZATIONS.DEVOPSCORNER.id,
  },
  TELEMETRYFLOW: {
    id: "ws-telemetryflow-001",
    name: "TELEMETRYFLOW-WORKSPACE",
    description: "Default workspace for TelemetryFlow organization",
    organizationId: SEED_ORGANIZATIONS.TELEMETRYFLOW.id,
  },
} as const;

// ==================== REGIONS ====================

export const SEED_REGIONS = [
  {
    id: "reg-ap-southeast-3",
    code: "ap-southeast-3",
    name: "Asia Pacific (Jakarta)",
    provider: "aws",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "reg-ap-southeast-1",
    code: "ap-southeast-1",
    name: "Asia Pacific (Singapore)",
    provider: "aws",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
] as const;

// ==================== CLOUD PROVIDERS ====================

export const SEED_CLOUD_PROVIDERS = {
  AWS: {
    name: "Amazon Web Services",
    code: "aws",
    regions: ["ap-southeast-3", "ap-southeast-1"],
    instanceTypes: [
      "t3.micro",
      "t3.small",
      "t3.medium",
      "m5.large",
      "m5.xlarge",
      "m6i.2xlarge",
    ],
  },
  GCP: {
    name: "Google Cloud Platform",
    code: "gcp",
    regions: ["asia-southeast1", "asia-southeast2"],
    instanceTypes: [
      "e2-micro",
      "e2-small",
      "e2-medium",
      "n2-standard-2",
      "n2-standard-4",
    ],
  },
  AZURE: {
    name: "Microsoft Azure",
    code: "azure",
    regions: ["southeastasia", "eastasia"],
    instanceTypes: [
      "Standard_B1s",
      "Standard_B2s",
      "Standard_D2s_v3",
      "Standard_D4s_v3",
    ],
  },
  ONPREMISE: {
    name: "On-Premise",
    code: "on-premise",
    regions: ["datacenter-jakarta", "datacenter-singapore"],
    instanceTypes: ["bare-metal", "vmware", "proxmox"],
  },
} as const;

// ==================== SERVICES ====================

export const SEED_SERVICES = [
  {
    name: "telemetryflow-platform",
    version: "1.0.0",
    language: "typescript",
    framework: "nestjs",
  },
  {
    name: "api-gateway",
    version: "2.1.0",
    language: "go",
    framework: "gin",
  },
  {
    name: "user-service",
    version: "1.5.0",
    language: "java",
    framework: "spring-boot",
  },
  {
    name: "product-catalog",
    version: "1.3.0",
    language: "python",
    framework: "fastapi",
  },
  {
    name: "order-service",
    version: "2.0.0",
    language: "java",
    framework: "spring-boot",
  },
  {
    name: "payment-service",
    version: "1.8.0",
    language: "go",
    framework: "fiber",
  },
  {
    name: "notification-service",
    version: "1.2.0",
    language: "nodejs",
    framework: "express",
  },
  {
    name: "otel-collector",
    version: "0.92.0",
    language: "go",
    framework: "otel",
  },
] as const;

// ==================== AGENTS ====================

export const SEED_AGENTS = [
  {
    id: "agent-prod-01",
    name: "Production Server 1",
    type: "node_exporter",
    version: "1.7.0",
    host: "prod-server-01.telemetryflow.id",
    ip: "10.0.1.10",
    port: 9100,
    status: "healthy" as const,
    provider: "aws",
    region: "ap-southeast-1",
    labels: { environment: "production", datacenter: "dc1" },
  },
  {
    id: "agent-prod-02",
    name: "Production Server 2",
    type: "node_exporter",
    version: "1.7.0",
    host: "prod-server-02.telemetryflow.id",
    ip: "10.0.1.11",
    port: 9100,
    status: "healthy" as const,
    provider: "aws",
    region: "ap-southeast-1",
    labels: { environment: "production", datacenter: "dc1" },
  },
  {
    id: "agent-staging-01",
    name: "Staging Server",
    type: "node_exporter",
    version: "1.7.0",
    host: "staging-server-01.telemetryflow.id",
    ip: "10.0.2.10",
    port: 9100,
    status: "healthy" as const,
    provider: "aws",
    region: "ap-southeast-1",
    labels: { environment: "staging", datacenter: "dc1" },
  },
  {
    id: "agent-collector-01",
    name: "OTEL Collector",
    type: "otel_collector",
    version: "0.92.0",
    host: "otel-collector.telemetryflow.id",
    ip: "10.0.1.100",
    port: 4317,
    status: "healthy" as const,
    provider: "aws",
    region: "ap-southeast-1",
    labels: { environment: "production", role: "collector" },
  },
  {
    id: "agent-dev-01",
    name: "Development Server",
    type: "node_exporter",
    version: "1.6.0",
    host: "dev-server-01.local",
    ip: "192.168.1.10",
    port: 9100,
    status: "warning" as const,
    provider: "on-premise",
    region: "datacenter-1",
    labels: { environment: "development", datacenter: "local" },
  },
] as const;

// ==================== KUBERNETES CLUSTERS ====================

export const SEED_K8S_CLUSTERS = [
  {
    id: "cluster-prod-ap-southeast-1",
    name: "prod-ap-southeast-1",
    provider: "eks",
    region: "ap-southeast-1",
    version: "1.28",
    status: "healthy" as const,
    nodesTotal: 12,
    nodesReady: 12,
    podsTotal: 150,
    podsRunning: 145,
  },
  {
    id: "cluster-prod-us-west-2",
    name: "prod-us-west-2",
    provider: "eks",
    region: "us-west-2",
    version: "1.28",
    status: "healthy" as const,
    nodesTotal: 8,
    nodesReady: 8,
    podsTotal: 95,
    podsRunning: 92,
  },
  {
    id: "cluster-staging-eu-west-1",
    name: "staging-eu-west-1",
    provider: "gke",
    region: "europe-west1",
    version: "1.27",
    status: "healthy" as const,
    nodesTotal: 4,
    nodesReady: 4,
    podsTotal: 45,
    podsRunning: 43,
  },
  {
    id: "cluster-dev-local",
    name: "dev-local",
    provider: "kind",
    region: "local",
    version: "1.28",
    status: "warning" as const,
    nodesTotal: 3,
    nodesReady: 2,
    podsTotal: 25,
    podsRunning: 20,
  },
] as const;

// ==================== ALERT RULES ====================

export const SEED_ALERT_RULES = [
  {
    id: "rule-cpu-high",
    name: "High CPU Usage",
    query:
      'avg by (instance) (rate(node_cpu_seconds_total{mode!="idle"}[5m])) > 0.8',
    severity: "warning" as const,
    threshold: 80,
    duration: "5m",
    labels: { category: "infrastructure", resource: "cpu" },
  },
  {
    id: "rule-cpu-critical",
    name: "Critical CPU Usage",
    query:
      'avg by (instance) (rate(node_cpu_seconds_total{mode!="idle"}[5m])) > 0.95',
    severity: "critical" as const,
    threshold: 95,
    duration: "2m",
    labels: { category: "infrastructure", resource: "cpu" },
  },
  {
    id: "rule-memory-high",
    name: "High Memory Usage",
    query:
      "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.85",
    severity: "warning" as const,
    threshold: 85,
    duration: "5m",
    labels: { category: "infrastructure", resource: "memory" },
  },
  {
    id: "rule-disk-high",
    name: "High Disk Usage",
    query:
      "(node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes > 0.90",
    severity: "warning" as const,
    threshold: 90,
    duration: "10m",
    labels: { category: "infrastructure", resource: "disk" },
  },
  {
    id: "rule-service-down",
    name: "Service Down",
    query: "up == 0",
    severity: "critical" as const,
    threshold: 0,
    duration: "1m",
    labels: { category: "availability", resource: "service" },
  },
  {
    id: "rule-error-rate",
    name: "High Error Rate",
    query:
      'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05',
    severity: "warning" as const,
    threshold: 5,
    duration: "5m",
    labels: { category: "application", resource: "http" },
  },
  {
    id: "rule-latency-p99",
    name: "High P99 Latency",
    query:
      "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.5",
    severity: "warning" as const,
    threshold: 500,
    duration: "5m",
    labels: { category: "performance", resource: "latency" },
  },
] as const;

// ==================== UPTIME MONITORS ====================

export const SEED_UPTIME_MONITORS = [
  {
    id: "monitor-api-main",
    name: "Main API",
    url: "https://api.telemetryflow.id/health",
    type: "http" as const,
    interval: 60,
    status: "up" as const,
    uptime: 99.95,
    responseTime: 45,
  },
  {
    id: "monitor-graphql",
    name: "GraphQL Gateway",
    url: "https://graphql.telemetryflow.id/health",
    type: "http" as const,
    interval: 60,
    status: "up" as const,
    uptime: 99.9,
    responseTime: 120,
  },
  {
    id: "monitor-websocket",
    name: "WebSocket Server",
    url: "wss://ws.telemetryflow.id/health",
    type: "websocket" as const,
    interval: 30,
    status: "up" as const,
    uptime: 99.85,
    responseTime: 25,
  },
  {
    id: "monitor-docs",
    name: "Documentation Site",
    url: "https://docs.telemetryflow.id",
    type: "http" as const,
    interval: 300,
    status: "up" as const,
    uptime: 100,
    responseTime: 150,
  },
  {
    id: "monitor-admin",
    name: "Admin Dashboard",
    url: "https://admin.telemetryflow.id/health",
    type: "http" as const,
    interval: 60,
    status: "up" as const,
    uptime: 99.9,
    responseTime: 200,
  },
] as const;

// ==================== SUBSCRIPTION PLANS ====================

export const SEED_SUBSCRIPTION_PLANS = [
  {
    id: "plan-free",
    name: "Free",
    code: "FREE",
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      maxAgents: 3,
      maxMetrics: 10000,
      maxLogs: 100000,
      maxTraces: 10000,
      retentionDays: 7,
      alertRules: 5,
      dashboards: 3,
    },
  },
  {
    id: "plan-starter",
    name: "Starter",
    code: "STARTER",
    priceMonthly: 49,
    priceYearly: 490,
    trialDays: 14,
    features: {
      maxAgents: 10,
      maxMetrics: 100000,
      maxLogs: 1000000,
      maxTraces: 100000,
      retentionDays: 30,
      alertRules: 25,
      dashboards: 10,
    },
  },
  {
    id: "plan-professional",
    name: "Professional",
    code: "PROFESSIONAL",
    priceMonthly: 199,
    priceYearly: 1990,
    trialDays: 14,
    features: {
      maxAgents: 50,
      maxMetrics: 1000000,
      maxLogs: 10000000,
      maxTraces: 1000000,
      retentionDays: 90,
      alertRules: 100,
      dashboards: 50,
    },
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    code: "ENTERPRISE",
    priceMonthly: null, // Custom pricing
    priceYearly: null,
    trialDays: 30,
    features: {
      maxAgents: -1, // Unlimited
      maxMetrics: -1,
      maxLogs: -1,
      maxTraces: -1,
      retentionDays: 365,
      alertRules: -1,
      dashboards: -1,
    },
  },
] as const;

// ==================== USERS ====================

export const SEED_USERS = [
  {
    id: "user-superadmin",
    username: "superadmin",
    email: "superadmin@telemetryflow.id",
    name: "Super Administrator",
    role: "super_administrator",
    organizationId: null, // Platform-wide
  },
  {
    id: "user-admin",
    username: "admin.devopscorner",
    email: "admin@telemetryflow.id",
    name: "Admin DevOpsCorner",
    role: "administrator",
    organizationId: SEED_ORGANIZATIONS.DEVOPSCORNER.id,
  },
  {
    id: "user-developer",
    username: "dev.devopscorner",
    email: "developer@telemetryflow.id",
    name: "Developer DevOpsCorner",
    role: "developer",
    organizationId: SEED_ORGANIZATIONS.DEVOPSCORNER.id,
  },
  {
    id: "user-viewer",
    username: "viewer.devopscorner",
    email: "viewer@telemetryflow.id",
    name: "Viewer DevOpsCorner",
    role: "viewer",
    organizationId: SEED_ORGANIZATIONS.DEVOPSCORNER.id,
  },
] as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Get a random item from seed data array
 */
export function getRandomSeedItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Get seed data by ID
 */
export function getSeedAgentById(id: string) {
  return SEED_AGENTS.find((a) => a.id === id);
}

export function getSeedClusterById(id: string) {
  return SEED_K8S_CLUSTERS.find((c) => c.id === id);
}

export function getSeedAlertRuleById(id: string) {
  return SEED_ALERT_RULES.find((r) => r.id === id);
}

/**
 * Get all agents by status
 */
export function getSeedAgentsByStatus(
  status: "healthy" | "warning" | "offline",
) {
  return SEED_AGENTS.filter((a) => a.status === status);
}

/**
 * Get all clusters by provider
 */
export function getSeedClustersByProvider(provider: string) {
  return SEED_K8S_CLUSTERS.filter((c) => c.provider === provider);
}

// ==================== STATISTICS GENERATORS ====================

/**
 * Generate agent statistics from seed data
 * Matches backend AgentStatsResponseDto structure
 */
export function generateAgentStatsFromSeed() {
  const agents = SEED_AGENTS;
  const byStatus = {
    healthy: agents.filter((a) => a.status === "healthy").length,
    warning: agents.filter((a) => a.status === "warning").length,
    degraded: 0,
    offline: 0,
    unhealthy: 0,
    unknown: 0,
  };

  const byProvider: Record<string, number> = {};
  const byRegion: Record<string, number> = {};

  agents.forEach((agent) => {
    byProvider[agent.provider] = (byProvider[agent.provider] || 0) + 1;
    byRegion[agent.region] = (byRegion[agent.region] || 0) + 1;
  });

  return {
    total: agents.length,
    timestamp: Date.now(),
    byStatus,
    byProvider,
    byRegion,
    byType: {
      node_exporter: agents.filter((a) => a.type === "node_exporter").length,
      otel_collector: agents.filter((a) => a.type === "otel_collector").length,
    },
    resourceUsage: {
      avgCpuUsage: 42.5,
      avgMemoryUsage: 65.3,
      totalCpuCores: agents.length * 4,
      totalMemory: agents.length * 16 * 1024 * 1024 * 1024, // 16GB per agent
    },
    trends: {
      total: {
        current: agents.length,
        previous: agents.length - 1,
        changePercent:
          ((agents.length - (agents.length - 1)) / (agents.length - 1)) * 100,
        direction: "up" as const,
      },
    },
  };
}

/**
 * Generate Kubernetes statistics from seed data
 * Matches backend KubernetesStatsResponseDto structure
 */
export function generateKubernetesStatsFromSeed() {
  const clusters = SEED_K8S_CLUSTERS;
  const totalNodes = clusters.reduce((sum, c) => sum + c.nodesTotal, 0);
  const readyNodes = clusters.reduce((sum, c) => sum + c.nodesReady, 0);
  const totalPods = clusters.reduce((sum, c) => sum + c.podsTotal, 0);
  const runningPods = clusters.reduce((sum, c) => sum + c.podsRunning, 0);

  const byProvider: Record<string, number> = {};
  clusters.forEach((c) => {
    byProvider[c.provider] = (byProvider[c.provider] || 0) + 1;
  });

  return {
    total: clusters.length + totalNodes + totalPods,
    timestamp: Date.now(),
    clusters: {
      total: clusters.length,
      healthy: clusters.filter((c) => c.status === "healthy").length,
      unhealthy: clusters.filter((c) => c.status !== "healthy").length,
      byProvider,
      byStatus: {
        healthy: clusters.filter((c) => c.status === "healthy").length,
        warning: clusters.filter((c) => c.status === "warning").length,
      },
    },
    nodes: {
      total: totalNodes,
      ready: readyNodes,
      notReady: totalNodes - readyNodes,
      byCondition: { Ready: readyNodes, NotReady: totalNodes - readyNodes },
    },
    pods: {
      total: totalPods,
      running: runningPods,
      pending: Math.floor((totalPods - runningPods) * 0.6),
      failed: Math.floor((totalPods - runningPods) * 0.3),
      succeeded: Math.floor((totalPods - runningPods) * 0.1),
      byNamespace: {
        default: Math.floor(totalPods * 0.1),
        "kube-system": Math.floor(totalPods * 0.15),
        monitoring: Math.floor(totalPods * 0.2),
        production: Math.floor(totalPods * 0.55),
      },
    },
    deployments: {
      total: Math.floor(totalPods / 3),
      available: Math.floor((totalPods / 3) * 0.9),
      progressing: Math.floor((totalPods / 3) * 0.07),
      degraded: Math.floor((totalPods / 3) * 0.03),
    },
  };
}

/**
 * Generate alert statistics from seed data
 * Matches frontend AlertStatistics structure
 */
export function generateAlertStatsFromSeed() {
  // Simulate some active alerts
  const firingAlerts = Math.floor(Math.random() * 5) + 2;
  const acknowledgedAlerts = Math.floor(Math.random() * 3);
  const resolvedAlerts = Math.floor(Math.random() * 20) + 10;

  return {
    total: firingAlerts + acknowledgedAlerts + resolvedAlerts,
    timestamp: Date.now(),
    byStatus: {
      firing: firingAlerts,
      acknowledged: acknowledgedAlerts,
      resolved: resolvedAlerts,
      silenced: Math.floor(Math.random() * 2),
    },
    bySeverity: {
      critical: Math.floor(firingAlerts * 0.3),
      warning: Math.floor(firingAlerts * 0.5),
      info: Math.floor(firingAlerts * 0.2),
    },
    byRule: {
      "High CPU Usage": Math.floor(Math.random() * 3),
      "High Memory Usage": Math.floor(Math.random() * 2),
      "Service Down": Math.floor(Math.random() * 2),
    },
    mttr: 1800000, // 30 minutes
    mtta: 300000, // 5 minutes
    trends: {
      total: {
        current: firingAlerts + acknowledgedAlerts + resolvedAlerts,
        previous: firingAlerts + acknowledgedAlerts + resolvedAlerts - 5,
        changePercent: 10,
        direction: "up" as const,
      },
      firing: {
        current: firingAlerts,
        previous: firingAlerts + 2,
        changePercent: -20,
        direction: "down" as const,
      },
      critical: {
        current: Math.floor(firingAlerts * 0.3),
        previous: Math.floor(firingAlerts * 0.4),
        changePercent: -25,
        direction: "down" as const,
      },
    },
  };
}

export default {
  organizations: SEED_ORGANIZATIONS,
  workspaces: SEED_WORKSPACES,
  regions: SEED_REGIONS,
  cloudProviders: SEED_CLOUD_PROVIDERS,
  services: SEED_SERVICES,
  agents: SEED_AGENTS,
  k8sClusters: SEED_K8S_CLUSTERS,
  alertRules: SEED_ALERT_RULES,
  uptimeMonitors: SEED_UPTIME_MONITORS,
  subscriptionPlans: SEED_SUBSCRIPTION_PLANS,
  users: SEED_USERS,
  // Statistics generators
  generateAgentStats: generateAgentStatsFromSeed,
  generateKubernetesStats: generateKubernetesStatsFromSeed,
  generateAlertStats: generateAlertStatsFromSeed,
};
