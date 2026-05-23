/**
 * Home Dashboard Mock Data Generator
 * Generates mock data for the home dashboard overview
 * Synced with backend dashboard seeds (01-DashboardsSeed.ts)
 * and subscription seeds (SeedDefaultPlans)
 */

// Note: randomBetween is available from shared if needed for future extensions

// =============================================================================
// Dashboard Definitions (synced with backend 01-DashboardsSeed.ts)
// =============================================================================

export interface DashboardWidgetQuery {
  dataSource: string;
  query: string;
  refId: string;
  legend?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "gauge" | "timeseries" | "stat" | "logs";
  position: { x: number; y: number; w: number; h: number };
  queries: DashboardWidgetQuery[];
  options?: Record<string, string>;
}

export interface DashboardVariable {
  name: string;
  type: "QUERY" | "TEXTBOX";
  label: string;
  query?: string;
  defaultValue?: string;
}

export interface DashboardDefinition {
  name: string;
  description: string;
  layout: { type: string; columns: number };
  widgets: DashboardWidget[];
  variables: DashboardVariable[];
  timeRange: { from: string; to: string };
  refreshInterval: number;
  tags: string[];
  isFavorite: boolean;
  organization: string;
}

/**
 * Get dashboard definitions matching backend seed data
 * Organization: DevOpsCorner (org-devopscorner / devopscorner.id)
 */
export function getDashboardDefinitions(): DashboardDefinition[] {
  return [
    {
      name: "Infrastructure Overview",
      description: "High-level infrastructure monitoring dashboard",
      layout: { type: "grid", columns: 24 },
      widgets: [
        {
          id: "cpu-usage",
          title: "CPU Usage",
          type: "gauge",
          position: { x: 0, y: 0, w: 6, h: 4 },
          queries: [
            {
              dataSource: "prometheus",
              query:
                '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
              refId: "A",
            },
          ],
        },
        {
          id: "memory-usage",
          title: "Memory Usage",
          type: "gauge",
          position: { x: 6, y: 0, w: 6, h: 4 },
          queries: [
            {
              dataSource: "prometheus",
              query:
                "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
              refId: "A",
            },
          ],
        },
        {
          id: "disk-usage",
          title: "Disk Usage",
          type: "gauge",
          position: { x: 12, y: 0, w: 6, h: 4 },
          queries: [
            {
              dataSource: "prometheus",
              query:
                '100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)',
              refId: "A",
            },
          ],
        },
        {
          id: "network-io",
          title: "Network I/O",
          type: "timeseries",
          position: { x: 0, y: 4, w: 12, h: 6 },
          queries: [
            {
              dataSource: "prometheus",
              query: "rate(node_network_receive_bytes_total[5m])",
              refId: "A",
              legend: "Receive",
            },
            {
              dataSource: "prometheus",
              query: "rate(node_network_transmit_bytes_total[5m])",
              refId: "B",
              legend: "Transmit",
            },
          ],
        },
      ],
      variables: [
        {
          name: "instance",
          type: "QUERY",
          label: "Instance",
          query: "label_values(node_cpu_seconds_total, instance)",
        },
      ],
      timeRange: { from: "now-1h", to: "now" },
      refreshInterval: 30,
      tags: ["infrastructure", "overview", "system"],
      isFavorite: true,
      organization: "DevOpsCorner",
    },
    {
      name: "Application Performance",
      description: "Application performance metrics and latency monitoring",
      layout: { type: "grid", columns: 24 },
      widgets: [
        {
          id: "request-rate",
          title: "Request Rate",
          type: "stat",
          position: { x: 0, y: 0, w: 6, h: 3 },
          queries: [
            {
              dataSource: "prometheus",
              query: "sum(rate(http_requests_total[5m]))",
              refId: "A",
            },
          ],
          options: { unit: "reqps" },
        },
        {
          id: "error-rate",
          title: "Error Rate",
          type: "stat",
          position: { x: 6, y: 0, w: 6, h: 3 },
          queries: [
            {
              dataSource: "prometheus",
              query:
                'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100',
              refId: "A",
            },
          ],
          options: { unit: "percent" },
        },
        {
          id: "p99-latency",
          title: "P99 Latency",
          type: "stat",
          position: { x: 12, y: 0, w: 6, h: 3 },
          queries: [
            {
              dataSource: "prometheus",
              query:
                "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
              refId: "A",
            },
          ],
          options: { unit: "duration" },
        },
        {
          id: "latency-distribution",
          title: "Latency Distribution",
          type: "timeseries",
          position: { x: 0, y: 3, w: 24, h: 6 },
          queries: [
            {
              dataSource: "prometheus",
              query:
                "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
              refId: "A",
              legend: "P50",
            },
            {
              dataSource: "prometheus",
              query:
                "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
              refId: "B",
              legend: "P95",
            },
            {
              dataSource: "prometheus",
              query:
                "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
              refId: "C",
              legend: "P99",
            },
          ],
        },
      ],
      variables: [
        {
          name: "service",
          type: "QUERY",
          label: "Service",
          query: "label_values(http_requests_total, service)",
        },
      ],
      timeRange: { from: "now-1h", to: "now" },
      refreshInterval: 30,
      tags: ["application", "performance", "latency"],
      isFavorite: false,
      organization: "DevOpsCorner",
    },
    {
      name: "Logs Explorer",
      description: "Log exploration and analysis dashboard",
      layout: { type: "grid", columns: 24 },
      widgets: [
        {
          id: "log-volume",
          title: "Log Volume",
          type: "timeseries",
          position: { x: 0, y: 0, w: 24, h: 5 },
          queries: [
            {
              dataSource: "loki",
              query: 'sum by (level) (rate({service=~".+"} | json [5m]))',
              refId: "A",
            },
          ],
        },
        {
          id: "logs-stream",
          title: "Log Stream",
          type: "logs",
          position: { x: 0, y: 5, w: 24, h: 10 },
          queries: [
            {
              dataSource: "loki",
              query: '{service="$service"} |= "$search"',
              refId: "A",
            },
          ],
        },
      ],
      variables: [
        {
          name: "service",
          type: "QUERY",
          label: "Service",
          query: 'label_values({job=~".+"}, service)',
        },
        { name: "search", type: "TEXTBOX", label: "Search", defaultValue: "" },
      ],
      timeRange: { from: "now-1h", to: "now" },
      refreshInterval: 30,
      tags: ["logs", "explorer", "loki"],
      isFavorite: false,
      organization: "DevOpsCorner",
    },
  ];
}

// =============================================================================
// Subscription Plans (synced with backend SeedDefaultPlans)
// =============================================================================

export interface SubscriptionPricing {
  billingCycle: "monthly" | "yearly";
  amount: number;
  currency: string;
  discountPercent?: number;
}

export interface SubscriptionPlan {
  name: string;
  type: "free" | "starter" | "professional" | "enterprise";
  description: string;
  pricing: SubscriptionPricing[];
  isDefault: boolean;
  trialDays: number;
  sortOrder: number;
}

/**
 * Get subscription plans matching backend seed data
 */
export function getSubscriptionPlans(): SubscriptionPlan[] {
  return [
    {
      name: "Free",
      type: "free",
      description: "Perfect for getting started with basic observability",
      pricing: [
        { billingCycle: "monthly", amount: 0, currency: "USD" },
        { billingCycle: "yearly", amount: 0, currency: "USD" },
      ],
      isDefault: true,
      trialDays: 0,
      sortOrder: 1,
    },
    {
      name: "Starter",
      type: "starter",
      description: "For small teams getting serious about observability",
      pricing: [
        { billingCycle: "monthly", amount: 4900, currency: "USD" },
        {
          billingCycle: "yearly",
          amount: 49000,
          currency: "USD",
          discountPercent: 17,
        },
      ],
      isDefault: false,
      trialDays: 14,
      sortOrder: 2,
    },
    {
      name: "Professional",
      type: "professional",
      description: "For growing teams needing advanced features",
      pricing: [
        { billingCycle: "monthly", amount: 19900, currency: "USD" },
        {
          billingCycle: "yearly",
          amount: 199000,
          currency: "USD",
          discountPercent: 17,
        },
      ],
      isDefault: false,
      trialDays: 14,
      sortOrder: 3,
    },
    {
      name: "Enterprise",
      type: "enterprise",
      description: "For large organizations with custom requirements",
      pricing: [
        { billingCycle: "monthly", amount: 0, currency: "USD" },
        { billingCycle: "yearly", amount: 0, currency: "USD" },
      ],
      isDefault: false,
      trialDays: 30,
      sortOrder: 4,
    },
  ];
}

// =============================================================================
// Dashboard Overview Stats (derived from dashboard definitions)
// =============================================================================

export interface DashboardOverviewCard {
  name: string;
  widgetCount: number;
  tags: string[];
  isFavorite: boolean;
  refreshInterval: number;
  timeRange: string;
}

/**
 * Get dashboard overview cards for the home page
 */
export function getDashboardOverviewCards(): DashboardOverviewCard[] {
  return getDashboardDefinitions().map((d) => ({
    name: d.name,
    widgetCount: d.widgets.length,
    tags: d.tags,
    isFavorite: d.isFavorite,
    refreshInterval: d.refreshInterval,
    timeRange: `${d.timeRange.from} to ${d.timeRange.to}`,
  }));
}

// =============================================================================
// Original Types and Functions
// =============================================================================

// Types for home dashboard data
export interface SystemStat {
  title: string;
  value: number;
  icon: string;
  color: "primary" | "success" | "info" | "warning" | "error";
  trend: "up" | "down" | "stable";
  trendValue: string;
}

export interface QuickLink {
  title: string;
  icon: string;
  route: string;
  color: string;
}

export interface TimeSeriesData {
  name: string;
  data: Array<[number, number]>;
}

export interface LogLevelDistribution {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
}

/**
 * Generate system stats for dashboard
 */
export function generateSystemStats(
  metricsCount: number = 156,
  logsCount: number = 45234,
  tracesCount: number = 8432,
  activeAlerts: number = 3,
  criticalAlertCount: number = 0,
): SystemStat[] {
  return [
    {
      title: "Total Metrics",
      value: metricsCount,
      icon: "carbon:chart-line",
      color: "primary",
      trend: "up",
      trendValue: "+12%",
    },
    {
      title: "Log Events (24h)",
      value: logsCount,
      icon: "carbon:document",
      color: "success",
      trend: "up",
      trendValue: "+5%",
    },
    {
      title: "Traces (24h)",
      value: tracesCount,
      icon: "carbon:flow",
      color: "info",
      trend: "stable",
      trendValue: "0%",
    },
    {
      title: "Active Alerts",
      value: activeAlerts,
      icon: "carbon:warning-alt",
      color: criticalAlertCount > 0 ? "error" : "warning",
      trend: "down",
      trendValue: "-2",
    },
  ];
}

/**
 * Generate request rate time series
 */
export function generateRequestRateData(): TimeSeriesData[] {
  const now = Date.now();
  const data: Array<[number, number]> = [];

  for (let i = 60; i >= 0; i--) {
    data.push([now - i * 60000, Math.random() * 500 + 200]);
  }

  return [{ name: "Requests/min", data }];
}

/**
 * Generate error rate time series
 */
export function generateErrorRateData(): TimeSeriesData[] {
  const now = Date.now();
  const data: Array<[number, number]> = [];

  for (let i = 60; i >= 0; i--) {
    data.push([now - i * 60000, Math.random() * 5]);
  }

  return [{ name: "Error Rate %", data }];
}

/**
 * Generate latency percentile data
 */
export function generateLatencyData(): TimeSeriesData[] {
  const now = Date.now();
  const p50: Array<[number, number]> = [];
  const p75: Array<[number, number]> = [];
  const p90: Array<[number, number]> = [];
  const p95: Array<[number, number]> = [];
  const p99: Array<[number, number]> = [];

  for (let i = 60; i >= 0; i--) {
    const base = Math.random() * 30 + 15;
    const spike = Math.random() > 0.85 ? Math.random() * 80 : 0;

    p50.push([now - i * 60000, base + spike * 0.3]);
    p75.push([now - i * 60000, base * 1.4 + Math.random() * 15 + spike * 0.5]);
    p90.push([now - i * 60000, base * 1.8 + Math.random() * 25 + spike * 0.7]);
    p95.push([now - i * 60000, base * 2.2 + Math.random() * 35 + spike * 0.85]);
    p99.push([now - i * 60000, base * 3 + Math.random() * 50 + spike]);
  }

  return [
    { name: "P50", data: p50 },
    { name: "P75", data: p75 },
    { name: "P90", data: p90 },
    { name: "P95", data: p95 },
    { name: "P99", data: p99 },
  ];
}

/**
 * Generate log level distribution data
 */
export function generateLogLevelDistribution(): LogLevelDistribution {
  return {
    categories: ["Info", "Debug", "Warn", "Error", "Fatal"],
    series: [
      {
        name: "Count",
        data: [12453, 8234, 1234, 456, 23],
      },
    ],
  };
}

/**
 * Get quick links for dashboard navigation
 */
export function getQuickLinks(): QuickLink[] {
  return [
    {
      title: "Explore Metrics",
      icon: "carbon:chart-line",
      route: "/metrics",
      color: "#3b82f6",
    },
    {
      title: "View Logs",
      icon: "carbon:document",
      route: "/logs",
      color: "#22c55e",
    },
    {
      title: "Trace Analysis",
      icon: "carbon:flow",
      route: "/traces",
      color: "#8b5cf6",
    },
    {
      title: "Dashboards",
      icon: "carbon:dashboard",
      route: "/dashboards",
      color: "#f59e0b",
    },
  ];
}

/**
 * Generate all dashboard data at once
 */
export function generateDashboardData(
  metricsCount?: number,
  logsCount?: number,
  tracesCount?: number,
  activeAlerts?: number,
  criticalAlertCount?: number,
) {
  return {
    stats: generateSystemStats(
      metricsCount,
      logsCount,
      tracesCount,
      activeAlerts,
      criticalAlertCount,
    ),
    requestRateData: generateRequestRateData(),
    errorRateData: generateErrorRateData(),
    latencyData: generateLatencyData(),
    logLevelData: generateLogLevelDistribution(),
    quickLinks: getQuickLinks(),
  };
}

// Export home mock data service
export const homeMock = {
  getSystemStats: generateSystemStats,
  getRequestRateData: generateRequestRateData,
  getErrorRateData: generateErrorRateData,
  getLatencyData: generateLatencyData,
  getLogLevelDistribution: generateLogLevelDistribution,
  getQuickLinks,
  getDashboardData: generateDashboardData,
  getDashboardDefinitions,
  getDashboardOverviewCards,
  getSubscriptionPlans,
};
