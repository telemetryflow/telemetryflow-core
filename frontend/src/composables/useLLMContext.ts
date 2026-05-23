/**
 * LLM Context Composable
 * TASK-11: Auto-detects context type from current route
 */

import { watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useLLMStore } from "@/store";
import type { ContextType } from "@/types/llm";

/**
 * Route path to context type mapping
 * More specific paths must come BEFORE general prefix paths
 */
const ROUTE_CONTEXT_MAP: Record<string, ContextType> = {
  // Telemetry pages
  "/metrics": "metrics",
  "/logs": "logs",
  "/traces": "traces",
  "/exemplars": "exemplars",
  "/correlations": "correlations",

  // Monitoring pages
  "/alerts/rules": "alert-rules",
  "/alerts": "alerts",
  "/monitoring/agent": "agents",
  "/monitoring/overview": "infra-overview",
  "/monitoring/infra/cpu": "infra-cpu",
  "/monitoring/infra/ram": "infra-memory",
  "/monitoring/infra/storage": "infra-storage",
  "/monitoring/infra/network": "infra-network",
  "/monitoring/infra": "infra-cpu",
  "/monitoring/service-map": "service-map",
  "/monitoring/network-map": "network-map",
  "/monitoring/uptime": "uptime",
  "/monitoring/status-page": "status-page",

  // Kubernetes pages
  "/kubernetes/overview": "kubernetes-overview",
  "/kubernetes/clusters": "kubernetes-clusters",
  "/kubernetes/namespace": "kubernetes-namespaces",
  "/kubernetes/nodes": "kubernetes-nodes",
  "/kubernetes/pods": "kubernetes-pods",
  "/kubernetes/deployment": "kubernetes-deployments",
  "/kubernetes/pv": "kubernetes-pv",
  "/kubernetes/api-server": "kubernetes-api-server",
  "/kubernetes/coredns": "kubernetes-coredns",
  "/kubernetes": "kubernetes-overview",

  // Dashboard / Home
  "/dashboards": "dashboard",
  "/home": "dashboard",

  // Reports pages
  "/reports": "reports",

  // IAM sub-feature pages (specific BEFORE general prefix)
  "/iam/users": "iam-users",
  "/iam/roles": "iam-roles",
  "/iam/permissions": "iam-permissions",
  "/iam/matrix": "iam-matrix",
  "/iam/assignments": "iam-assignments",
  "/iam/overview": "iam",
  "/iam": "iam",

  // Tenancy sub-feature pages (specific BEFORE general prefix)
  "/tenancy/regions": "tenancy-regions",
  "/tenancy/organizations": "tenancy-organizations",
  "/tenancy/workspaces": "tenancy-workspaces",
  "/tenancy/tenants": "tenancy-tenants",
  "/tenancy": "tenancy",

  // Audit Logs
  "/audit": "audit",

  // System pages (specific BEFORE general /settings prefix)
  "/settings/retention": "retention",
  "/settings/subscription": "subscription",
  "/settings/api-keys": "api-keys",
  "/settings/notifications": "notifications",
  "/settings/notification-channels": "system-channels",
  "/settings/ai-assistant": "ai-assistant",
  "/settings/data-masking": "data-masking",
  "/settings/iam/users": "iam-users",
  "/settings": "system-setup",

  // Account sub-feature pages (specific BEFORE general prefix)
  "/account/profile": "account-profile",
  "/account/security": "account-security",
  "/account/sessions": "account-sessions",
  "/account/active-sessions": "account-sessions",
  "/account/devices": "account-sessions",
  "/account/notifications": "account-notifications",
  "/account/preferences": "account-preferences",
  "/account/organization": "account-organization",
  "/account": "account-profile",

  // AI Intelligence pages
  "/ai-intelligence/corrective": "corrective-maintenance",
  "/ai-intelligence/anomaly-detection": "anomaly-detection",
  "/ai-intelligence/predictive": "predictive-maintenance",
  "/ai-intelligence/predictive/models": "predictive-maintenance",
  "/ai-intelligence/cost-optimization": "cost-optimization",
  "/ai-intelligence": "anomaly-detection",

  // DB Monitoring Inventory pages
  "/db-monitoring/inventory/add": "db-monitoring-inventory",
  "/db-monitoring/inventory/fleet": "db-monitoring-inventory",
  "/db-monitoring/inventory": "db-monitoring-inventory",
  "/db-monitoring/timescaledb": "db-monitoring-timescaledb",
  "/db-monitoring/timescaledb/instances": "db-monitoring-timescaledb",
  // DB Monitoring Aurora pages
  "/db-monitoring/aws-rds-aurora": "db-monitoring-aurora",
  "/db-monitoring/aws-rds-aurora/instances": "db-monitoring-aurora",

  // DB Monitoring MySQL pages
  "/db-monitoring/mysql/instances": "db-monitoring-mysql",
  "/db-monitoring/mysql": "db-monitoring-mysql",
};

/**
 * Extract context type from route path
 */
function getContextFromPath(path: string): ContextType {
  // Check exact matches first
  if (ROUTE_CONTEXT_MAP[path]) {
    return ROUTE_CONTEXT_MAP[path];
  }

  // Check prefix matches
  for (const [prefix, context] of Object.entries(ROUTE_CONTEXT_MAP)) {
    if (path.startsWith(prefix)) {
      return context;
    }
  }

  // Default to dashboard
  return "dashboard";
}

/**
 * Extract context ID from route params
 */
function getContextIdFromRoute(
  route: ReturnType<typeof useRoute>,
): string | undefined {
  // Try common param names
  const paramNames = ["id", "traceId", "name", "clusterId"];

  for (const name of paramNames) {
    const value = route.params[name];
    if (value) {
      return Array.isArray(value) ? value[0] : value;
    }
  }

  return undefined;
}

/**
 * Composable for LLM context auto-detection
 */
export function useLLMContext() {
  const route = useRoute();
  const llmStore = useLLMStore();

  /**
   * Update context based on current route
   */
  function updateContextFromRoute() {
    const contextType = getContextFromPath(route.path);
    const contextId = getContextIdFromRoute(route);

    llmStore.setContext(contextType, contextId);
  }

  // Watch for route changes
  const stopWatch = watch(
    () => route.fullPath,
    () => {
      updateContextFromRoute();
    },
    { immediate: false },
  );

  // Set initial context on mount
  onMounted(() => {
    updateContextFromRoute();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    stopWatch();
  });

  return {
    updateContextFromRoute,
  };
}

/**
 * Get context label for display
 */
export function getContextLabel(contextType: ContextType): string {
  const labels: Record<ContextType, string> = {
    metrics: "Metrics",
    logs: "Logs",
    traces: "Traces",
    exemplars: "Exemplars",
    correlations: "Correlations",
    agents: "Agents",
    "infra-overview": "Infra Overview",
    "infra-cpu": "Infra CPU",
    "infra-memory": "Infra Memory",
    "infra-storage": "Infra Storage",
    "infra-network": "Infra Network",
    "service-map": "Service Map",
    "network-map": "Network Map",
    alerts: "Alerts",
    "alert-rules": "Alert Rules",
    "kubernetes-overview": "K8s Overview",
    "kubernetes-clusters": "K8s Clusters",
    "kubernetes-namespaces": "K8s Namespaces",
    "kubernetes-nodes": "K8s Nodes",
    "kubernetes-pods": "K8s Pods",
    "kubernetes-deployments": "K8s Deployments",
    "kubernetes-pv": "K8s Persistent Volumes",
    "kubernetes-api-server": "K8s API Server",
    "kubernetes-coredns": "K8s CoreDNS",
    uptime: "Uptime",
    "status-page": "Status Page",
    dashboard: "Dashboard",
    reports: "Reports",
    iam: "IAM",
    tenancy: "Tenancy",
    audit: "Audit",
    retention: "Retention",
    subscription: "Subscription",
    "api-keys": "API Keys",
    notifications: "Notifications",
    "data-masking": "PII Data Masking",
    // IAM sub-features
    "iam-users": "IAM Users",
    "iam-roles": "IAM Roles",
    "iam-permissions": "IAM Permissions",
    "iam-matrix": "IAM Matrix",
    "iam-assignments": "IAM Assignments",
    // Tenancy sub-features
    "tenancy-regions": "Regions",
    "tenancy-organizations": "Organizations",
    "tenancy-workspaces": "Workspaces",
    "tenancy-tenants": "Tenants",
    // System sub-features
    "system-setup": "System Setup",
    "system-channels": "Notification Channels",
    "ai-assistant": "AI Assistant",
    // Account sub-features
    "account-profile": "My Profile",
    "account-security": "Account Security",
    "account-sessions": "Active Sessions",
    "account-notifications": "Account Notifications",
    "account-preferences": "Preferences",
    "account-organization": "My Organization",
    "anomaly-detection": "Anomaly Detection",
    "corrective-maintenance": "Corrective Maintenance",
    "predictive-maintenance": "Predictive Maintenance",
    "cost-optimization": "Cost Optimization",
    "db-monitoring-inventory": "DB Inventory",
    "db-monitoring-aurora": "Aurora Monitoring",
    "db-monitoring-mysql": "MySQL Monitoring",
    "db-monitoring-timescaledb": "TimescaleDB Monitoring",
  };
  return labels[contextType] || "Dashboard";
}

/**
 * Get context icon for display
 */
export function getContextIcon(contextType: ContextType): string {
  const icons: Record<ContextType, string> = {
    metrics: "i-mdi-chart-line",
    logs: "i-mdi-text-box-outline",
    traces: "i-mdi-source-branch",
    exemplars: "i-mdi-file-document-outline",
    correlations: "i-mdi-link-variant",
    agents: "i-mdi-server",
    "infra-overview": "i-mdi-monitor-multiple",
    "infra-cpu": "i-mdi-cpu-64-bit",
    "infra-memory": "i-mdi-memory",
    "infra-storage": "i-mdi-harddisk",
    "infra-network": "i-mdi-lan",
    "service-map": "i-mdi-sitemap",
    "network-map": "i-mdi-network",
    alerts: "i-mdi-bell-alert",
    "alert-rules": "i-mdi-bell-cog",
    "kubernetes-overview": "i-mdi-kubernetes",
    "kubernetes-clusters": "i-mdi-server-network",
    "kubernetes-namespaces": "i-mdi-folder-network",
    "kubernetes-nodes": "i-mdi-desktop-tower",
    "kubernetes-pods": "i-mdi-cube-outline",
    "kubernetes-deployments": "i-mdi-rocket-launch",
    "kubernetes-pv": "i-mdi-database",
    "kubernetes-api-server": "i-mdi-api",
    "kubernetes-coredns": "i-mdi-dns",
    uptime: "i-mdi-check-circle",
    "status-page": "i-mdi-clipboard-text",
    dashboard: "i-mdi-view-dashboard",
    reports: "i-mdi-file-chart",
    iam: "i-mdi-shield-account",
    tenancy: "i-mdi-domain",
    audit: "i-mdi-clipboard-check",
    retention: "i-mdi-archive-clock",
    subscription: "i-mdi-credit-card",
    "api-keys": "i-mdi-key-variant",
    notifications: "i-mdi-bell-ring",
    "data-masking": "i-mdi-shield-eye",
    // IAM sub-features
    "iam-users": "i-mdi-account-group",
    "iam-roles": "i-mdi-shield-key",
    "iam-permissions": "i-mdi-lock-open-check",
    "iam-matrix": "i-mdi-table-lock",
    "iam-assignments": "i-mdi-account-arrow-right",
    // Tenancy sub-features
    "tenancy-regions": "i-mdi-earth",
    "tenancy-organizations": "i-mdi-office-building",
    "tenancy-workspaces": "i-mdi-view-grid-plus",
    "tenancy-tenants": "i-mdi-account-tie",
    // System sub-features
    "system-setup": "i-mdi-cog-transfer",
    "system-channels": "i-mdi-bullhorn",
    "ai-assistant": "i-mdi-robot-excited",
    // Account sub-features
    "account-profile": "i-mdi-account-circle",
    "account-security": "i-mdi-shield-lock",
    "account-sessions": "i-mdi-devices",
    "account-notifications": "i-mdi-bell-cog",
    "account-preferences": "i-mdi-tune-variant",
    "account-organization": "i-mdi-office-building-cog",
    "anomaly-detection": "i-mdi-alert-circle-outline",
    "corrective-maintenance": "i-mdi-tools",
    "predictive-maintenance": "i-mdi-chart-timeline-variant",
    "cost-optimization": "i-mdi-currency-usd",
    "db-monitoring-inventory": "i-mdi-database",
    "db-monitoring-aurora": "i-mdi-database",
    "db-monitoring-mysql": "i-mdi-database",
    "db-monitoring-timescaledb": "i-mdi-database-clock",
  };
  return icons[contextType] || "i-mdi-view-dashboard";
}
