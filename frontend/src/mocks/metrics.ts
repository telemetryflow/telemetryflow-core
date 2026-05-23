/**
 * Metrics Mock Data Generator
 * Generates realistic metric data for development and demo purposes
 * Compatible with OTEL v1 and TelemetryFlow v2 APIs
 */

import type {
  MetricSeries,
  MetricMetadata,
  MetricDataPoint,
  MetricType,
} from "@/types";
import { SERVICES, getServiceMetadata, randomBetween } from "./shared";

// Metric definitions with realistic properties based on OpenTelemetry semantic conventions
export const METRIC_DEFINITIONS: Array<{
  name: string;
  type: MetricType;
  help: string;
  unit: string;
  baseValue: number;
  variance: number;
  category:
    | "http"
    | "rpc"
    | "db"
    | "system"
    | "runtime"
    | "custom"
    | "collector";
}> = [
  // HTTP metrics (OpenTelemetry semantic conventions)
  {
    name: "http_server_request_duration_seconds",
    type: "histogram",
    help: "Duration of HTTP server requests",
    unit: "s",
    baseValue: 0.05,
    variance: 0.2,
    category: "http",
  },
  {
    name: "http_server_requests_total",
    type: "counter",
    help: "Total HTTP server requests",
    unit: "1",
    baseValue: 50000,
    variance: 20000,
    category: "http",
  },
  {
    name: "http_server_active_requests",
    type: "gauge",
    help: "Number of active HTTP server requests",
    unit: "1",
    baseValue: 25,
    variance: 20,
    category: "http",
  },
  {
    name: "http_server_request_body_size_bytes",
    type: "histogram",
    help: "Size of HTTP request bodies",
    unit: "By",
    baseValue: 1024,
    variance: 4096,
    category: "http",
  },
  {
    name: "http_server_response_body_size_bytes",
    type: "histogram",
    help: "Size of HTTP response bodies",
    unit: "By",
    baseValue: 8192,
    variance: 32768,
    category: "http",
  },
  {
    name: "http_client_request_duration_seconds",
    type: "histogram",
    help: "Duration of HTTP client requests",
    unit: "s",
    baseValue: 0.08,
    variance: 0.3,
    category: "http",
  },
  {
    name: "http_client_requests_total",
    type: "counter",
    help: "Total HTTP client requests",
    unit: "1",
    baseValue: 30000,
    variance: 15000,
    category: "http",
  },

  // gRPC metrics
  {
    name: "rpc_server_duration_seconds",
    type: "histogram",
    help: "Duration of RPC server requests",
    unit: "s",
    baseValue: 0.02,
    variance: 0.1,
    category: "rpc",
  },
  {
    name: "rpc_server_requests_total",
    type: "counter",
    help: "Total RPC server requests",
    unit: "1",
    baseValue: 80000,
    variance: 30000,
    category: "rpc",
  },
  {
    name: "rpc_client_duration_seconds",
    type: "histogram",
    help: "Duration of RPC client requests",
    unit: "s",
    baseValue: 0.03,
    variance: 0.15,
    category: "rpc",
  },

  // Database metrics
  {
    name: "db_client_connections_usage",
    type: "gauge",
    help: "Database connection pool usage",
    unit: "1",
    baseValue: 15,
    variance: 10,
    category: "db",
  },
  {
    name: "db_client_connections_max",
    type: "gauge",
    help: "Maximum database connections",
    unit: "1",
    baseValue: 50,
    variance: 0,
    category: "db",
  },
  {
    name: "db_client_operation_duration_seconds",
    type: "histogram",
    help: "Duration of database operations",
    unit: "s",
    baseValue: 0.01,
    variance: 0.05,
    category: "db",
  },
  {
    name: "db_client_operations_total",
    type: "counter",
    help: "Total database operations",
    unit: "1",
    baseValue: 100000,
    variance: 50000,
    category: "db",
  },

  // System/Process metrics
  {
    name: "process_cpu_seconds_total",
    type: "counter",
    help: "Total user and system CPU time spent in seconds",
    unit: "s",
    baseValue: 3600,
    variance: 1800,
    category: "system",
  },
  {
    name: "process_resident_memory_bytes",
    type: "gauge",
    help: "Resident memory size in bytes",
    unit: "By",
    baseValue: 512000000,
    variance: 256000000,
    category: "system",
  },
  {
    name: "process_virtual_memory_bytes",
    type: "gauge",
    help: "Virtual memory size in bytes",
    unit: "By",
    baseValue: 1024000000,
    variance: 512000000,
    category: "system",
  },
  {
    name: "process_open_fds",
    type: "gauge",
    help: "Number of open file descriptors",
    unit: "1",
    baseValue: 100,
    variance: 50,
    category: "system",
  },
  {
    name: "process_threads",
    type: "gauge",
    help: "Number of process threads",
    unit: "1",
    baseValue: 50,
    variance: 30,
    category: "system",
  },

  // Runtime metrics (language-specific)
  {
    name: "runtime_go_goroutines",
    type: "gauge",
    help: "Number of goroutines",
    unit: "1",
    baseValue: 150,
    variance: 80,
    category: "runtime",
  },
  {
    name: "runtime_go_gc_pause_total_seconds",
    type: "counter",
    help: "Total GC pause time",
    unit: "s",
    baseValue: 0.5,
    variance: 0.3,
    category: "runtime",
  },
  {
    name: "runtime_jvm_memory_used_bytes",
    type: "gauge",
    help: "JVM memory used",
    unit: "By",
    baseValue: 256000000,
    variance: 128000000,
    category: "runtime",
  },
  {
    name: "runtime_jvm_gc_collection_seconds_total",
    type: "counter",
    help: "JVM GC collection time",
    unit: "s",
    baseValue: 10,
    variance: 5,
    category: "runtime",
  },
  {
    name: "runtime_python_gc_collections_total",
    type: "counter",
    help: "Python GC collections",
    unit: "1",
    baseValue: 1000,
    variance: 500,
    category: "runtime",
  },

  // Application/Business metrics
  {
    name: "orders_created_total",
    type: "counter",
    help: "Total orders created",
    unit: "1",
    baseValue: 5000,
    variance: 2000,
    category: "custom",
  },
  {
    name: "orders_value_total",
    type: "counter",
    help: "Total order value in cents",
    unit: "1",
    baseValue: 50000000,
    variance: 20000000,
    category: "custom",
  },
  {
    name: "cart_items_total",
    type: "gauge",
    help: "Total items in active carts",
    unit: "1",
    baseValue: 15000,
    variance: 8000,
    category: "custom",
  },
  {
    name: "payment_processing_duration_seconds",
    type: "histogram",
    help: "Payment processing duration",
    unit: "s",
    baseValue: 1.5,
    variance: 1.0,
    category: "custom",
  },
  {
    name: "inventory_stock_level",
    type: "gauge",
    help: "Current inventory stock level",
    unit: "1",
    baseValue: 10000,
    variance: 5000,
    category: "custom",
  },
  {
    name: "search_queries_total",
    type: "counter",
    help: "Total search queries",
    unit: "1",
    baseValue: 100000,
    variance: 40000,
    category: "custom",
  },
  {
    name: "recommendations_served_total",
    type: "counter",
    help: "Total recommendations served",
    unit: "1",
    baseValue: 80000,
    variance: 30000,
    category: "custom",
  },
  {
    name: "notifications_sent_total",
    type: "counter",
    help: "Total notifications sent",
    unit: "1",
    baseValue: 20000,
    variance: 10000,
    category: "custom",
  },

  // Cache metrics
  {
    name: "cache_hits_total",
    type: "counter",
    help: "Total cache hits",
    unit: "1",
    baseValue: 500000,
    variance: 200000,
    category: "custom",
  },
  {
    name: "cache_misses_total",
    type: "counter",
    help: "Total cache misses",
    unit: "1",
    baseValue: 50000,
    variance: 20000,
    category: "custom",
  },
  {
    name: "cache_evictions_total",
    type: "counter",
    help: "Total cache evictions",
    unit: "1",
    baseValue: 10000,
    variance: 5000,
    category: "custom",
  },

  // Message queue metrics
  {
    name: "messaging_publish_duration_seconds",
    type: "histogram",
    help: "Message publish duration",
    unit: "s",
    baseValue: 0.005,
    variance: 0.01,
    category: "custom",
  },
  {
    name: "messaging_receive_duration_seconds",
    type: "histogram",
    help: "Message receive duration",
    unit: "s",
    baseValue: 0.002,
    variance: 0.005,
    category: "custom",
  },
  {
    name: "messaging_messages_total",
    type: "counter",
    help: "Total messages processed",
    unit: "1",
    baseValue: 200000,
    variance: 80000,
    category: "custom",
  },

  // TelemetryFlow Collector internal metrics
  {
    name: "otelcol_receiver_accepted_spans",
    type: "counter",
    help: "Number of spans accepted by the receiver",
    unit: "1",
    baseValue: 1000000,
    variance: 400000,
    category: "collector",
  },
  {
    name: "otelcol_receiver_refused_spans",
    type: "counter",
    help: "Number of spans refused by the receiver",
    unit: "1",
    baseValue: 100,
    variance: 50,
    category: "collector",
  },
  {
    name: "otelcol_exporter_sent_spans",
    type: "counter",
    help: "Number of spans sent by the exporter",
    unit: "1",
    baseValue: 1000000,
    variance: 400000,
    category: "collector",
  },
  {
    name: "otelcol_processor_batch_batch_size_trigger_send",
    type: "counter",
    help: "Batch processor send triggers by size",
    unit: "1",
    baseValue: 50000,
    variance: 20000,
    category: "collector",
  },
  {
    name: "otelcol_receiver_accepted_metric_points",
    type: "counter",
    help: "Metric points accepted",
    unit: "1",
    baseValue: 5000000,
    variance: 2000000,
    category: "collector",
  },
  {
    name: "otelcol_exporter_queue_size",
    type: "gauge",
    help: "Current exporter queue size",
    unit: "1",
    baseValue: 500,
    variance: 400,
    category: "collector",
  },
  {
    name: "otelcol_process_runtime_heap_alloc_bytes",
    type: "gauge",
    help: "Collector heap allocation",
    unit: "By",
    baseValue: 100000000,
    variance: 50000000,
    category: "collector",
  },
];

/**
 * Generate all metric names (metric + service combinations)
 */
export function generateMetricNames(): string[] {
  const names: string[] = [];
  METRIC_DEFINITIONS.forEach((def) => {
    // Add base metric name
    names.push(def.name);
    // Add service-specific metrics (except collector metrics)
    if (def.category !== "collector") {
      SERVICES.forEach((service) => {
        names.push(`${def.name}{service="${service}"}`);
      });
    }
  });
  return names;
}

/**
 * Generate metric metadata with category information
 */
export function generateMetricMetadata(): MetricMetadata[] {
  return METRIC_DEFINITIONS.map((def) => ({
    name: def.name,
    type: def.type,
    help: def.help,
    unit: def.unit,
  }));
}

/**
 * Get metrics by category
 */
export function getMetricsByCategory(
  category: string,
): typeof METRIC_DEFINITIONS {
  return METRIC_DEFINITIONS.filter((def) => def.category === category);
}

/**
 * Generate metric time series data with realistic patterns
 */
export function generateMetricSeries(
  query: string,
  start: number,
  end: number,
  step: number = 15000,
): MetricSeries[] {
  const def =
    METRIC_DEFINITIONS.find((d) => query.includes(d.name)) ||
    METRIC_DEFINITIONS[0];
  const series: MetricSeries[] = [];

  // Determine which services to include based on query
  let targetServices: readonly string[] | string[];
  if (def.category === "collector") {
    targetServices = ["telemetryflow-collector"];
  } else if (query.includes("service=")) {
    const match = query.match(/service="([^"]+)"/);
    targetServices = match ? [match[1]] : [SERVICES[0]];
  } else {
    // Select relevant services based on metric category
    targetServices = getRelevantServices(def.category);
  }

  targetServices.forEach((service) => {
    const values: MetricDataPoint[] = [];
    const metadata =
      def.category !== "collector" ? getServiceMetadata(service) : null;

    // Service-specific adjustments
    let serviceMultiplier = 1;
    if (metadata) {
      // Higher traffic services get higher values
      if (service === "api-gateway" || service === "frontend")
        serviceMultiplier = 2;
      if (service === "payment-service") serviceMultiplier = 0.5;
      // Language-specific runtime characteristics
      if (metadata.language === "java" && def.category === "runtime")
        serviceMultiplier = 1.5;
      if (metadata.language === "go" && def.name.includes("goroutines"))
        serviceMultiplier = 1;
    }

    let cumulativeValue = 0; // For counters

    for (let t = start; t <= end; t += step) {
      // Time-based patterns (busier during business hours)
      const hour = new Date(t).getHours();
      const businessHourMultiplier =
        hour >= 9 && hour <= 17 ? 1.5 : hour >= 0 && hour <= 6 ? 0.3 : 1;

      // Add realistic variance and trends
      const dailyTrend =
        Math.sin((t / 86400000) * 2 * Math.PI) * (def.variance * 0.2);
      const hourlyTrend =
        Math.sin((t / 3600000) * 2 * Math.PI) * (def.variance * 0.1);
      const noise = (Math.random() - 0.5) * def.variance * 0.3;

      // Occasional spikes (simulating traffic bursts or issues)
      const spike =
        Math.random() < 0.02 ? def.variance * randomBetween(1, 3) : 0;

      const instantValue = Math.max(
        0,
        def.baseValue * serviceMultiplier * businessHourMultiplier +
          dailyTrend +
          hourlyTrend +
          noise +
          spike,
      );

      if (def.type === "counter") {
        cumulativeValue += instantValue * (step / 1000); // Accumulate based on time
        values.push({
          timestamp: t,
          value: Math.floor(cumulativeValue),
        });
      } else {
        values.push({
          timestamp: t,
          value:
            def.type === "histogram" ? instantValue : Math.floor(instantValue),
        });
      }
    }

    // Build labels based on metric type
    const labels: Record<string, string> = { service };
    if (def.category !== "collector") {
      labels.instance = `${service}-pod-${Math.random().toString(36).substr(2, 5)}:8080`;
    }
    if (def.category === "http") {
      labels.method = ["GET", "POST", "PUT", "DELETE"][
        Math.floor(Math.random() * 4)
      ];
      labels.status_code = ["200", "201", "204", "400", "500"][
        Math.floor(Math.random() * 5)
      ];
    }
    if (def.category === "db") {
      labels.db_system = ["postgresql", "redis", "elasticsearch"][
        Math.floor(Math.random() * 3)
      ];
    }

    series.push({
      metric: def.name,
      labels,
      values,
    });
  });

  return series;
}

/**
 * Get relevant services based on metric category
 */
function getRelevantServices(category: string): string[] {
  switch (category) {
    case "http":
      return ["frontend", "api-gateway", "product-catalog", "user-service"];
    case "rpc":
      return [
        "cart-service",
        "user-service",
        "order-service",
        "payment-service",
      ];
    case "db":
      return [
        "user-service",
        "product-catalog",
        "order-service",
        "payment-service",
        "inventory-service",
      ];
    case "system":
    case "runtime":
      return [...SERVICES].slice(0, 6);
    case "custom":
      return [
        "order-service",
        "payment-service",
        "inventory-service",
        "notification-service",
        "search-service",
        "recommendation-engine",
      ];
    default:
      return [...SERVICES].slice(0, 4);
  }
}

/**
 * Generate metric label names and values (OpenTelemetry semantic conventions)
 */
export function generateMetricLabels(): {
  labels: string[];
  values: Record<string, string[]>;
} {
  return {
    labels: [
      "service",
      "service_name",
      "instance",
      "job",
      "http_method",
      "http_status_code",
      "http_route",
      "rpc_method",
      "rpc_service",
      "rpc_grpc_status_code",
      "db_system",
      "db_name",
      "db_operation",
      "messaging_system",
      "messaging_destination",
      "k8s_namespace_name",
      "k8s_pod_name",
      "k8s_deployment_name",
    ],
    values: {
      service: [...SERVICES],
      service_name: [...SERVICES],
      instance: SERVICES.map((s) => `${s}:8080`),
      job: [...SERVICES],
      http_method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      http_status_code: [
        "200",
        "201",
        "204",
        "301",
        "400",
        "401",
        "403",
        "404",
        "500",
        "502",
        "503",
      ],
      http_route: [
        "/api/v1/products",
        "/api/v1/orders",
        "/api/v1/users",
        "/api/v1/cart",
        "/api/v1/auth",
      ],
      rpc_method: [
        "GetUser",
        "CreateOrder",
        "ProcessPayment",
        "GetCart",
        "Search",
      ],
      rpc_service: [
        "UserService",
        "OrderService",
        "PaymentService",
        "CartService",
        "SearchService",
      ],
      rpc_grpc_status_code: ["0", "1", "2", "3", "4", "5", "13", "14"],
      db_system: ["postgresql", "redis", "elasticsearch", "kafka"],
      db_name: [
        "users_db",
        "orders_db",
        "catalog_db",
        "payments_db",
        "inventory_db",
      ],
      db_operation: ["SELECT", "INSERT", "UPDATE", "DELETE", "FIND", "INDEX"],
      messaging_system: ["kafka", "rabbitmq"],
      messaging_destination: [
        "orders",
        "payments",
        "notifications",
        "inventory",
      ],
      k8s_namespace_name: ["ecommerce", "monitoring"],
      k8s_pod_name: SERVICES.map(
        (s) => `${s}-${Math.random().toString(36).substr(2, 10)}`,
      ),
      k8s_deployment_name: [...SERVICES],
    },
  };
}

/**
 * Generate instant metric query result
 */
export function generateMetricInstant(query: string): MetricSeries[] {
  const now = Date.now();
  return generateMetricSeries(query, now, now, 1);
}

/**
 * Generate range metric query result
 */
export function generateMetricRange(
  query: string,
  start: number,
  end: number,
  step?: number,
): MetricSeries[] {
  return generateMetricSeries(query, start, end, step);
}

// Export metrics mock data service
export const metricsMock = {
  getMetricNames: generateMetricNames,
  getMetricMetadata: generateMetricMetadata,
  getMetricSeries: generateMetricSeries,
  getMetricLabels: generateMetricLabels,
  getMetricInstant: generateMetricInstant,
  getMetricRange: generateMetricRange,
};
