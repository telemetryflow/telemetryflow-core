/**
 * serviceIcons.ts
 * Global icon + color inventory for 50 service types and brand-specific services.
 *
 * Usage:
 *   import { getServiceIcon, getServiceColor, SERVICE_NAME_ICON_MAP, SERVICE_TYPE_ICON_MAP } from "@/utils/serviceIcons";
 *
 *   const icon  = getServiceIcon(service.name, service.type);
 *   const color = getServiceColor(service.name, service.type);
 */

export interface ServiceIconEntry {
  icon: string;
  color: string;
}

// ── Fallback: by service TYPE ──────────────────────────────────────────────
export const SERVICE_TYPE_ICON_MAP: Record<string, ServiceIconEntry> = {
  gateway:  { icon: "carbon:cloud-service-management", color: "#8b5cf6" },
  api:      { icon: "carbon:api",                      color: "#3b82f6" },
  worker:   { icon: "carbon:batch-job",                color: "#f59e0b" },
  database: { icon: "carbon:data-base",                color: "#10b981" },
  cache:    { icon: "mdi:cached",                      color: "#06b6d4" },
  queue:    { icon: "mdi:inbox-multiple",               color: "#f97316" },
  external: { icon: "carbon:cloud",                    color: "#94a3b8" },
  frontend: { icon: "carbon:application-web",          color: "#ec4899" },
  storage:  { icon: "carbon:object-storage",           color: "#84cc16" },
};

// ── Brand-specific: by service NAME (takes priority) ──────────────────────
export const SERVICE_NAME_ICON_MAP: Record<string, ServiceIconEntry> = {

  // ── Databases ────────────────────────────────────────────────────────────
  "postgresql":           { icon: "simple-icons:postgresql",      color: "#336791" },
  "postgresql-dev":       { icon: "simple-icons:postgresql",      color: "#336791" },
  "clickhouse":           { icon: "simple-icons:clickhouse",      color: "#f5ba13" },
  "clickhouse-dev":       { icon: "simple-icons:clickhouse",      color: "#f5ba13" },
  "elasticsearch":        { icon: "simple-icons:elasticsearch",   color: "#00bfb3" },
  "mongodb":              { icon: "simple-icons:mongodb",         color: "#4db33d" },
  "mysql":                { icon: "simple-icons:mysql",           color: "#4479a1" },
  "cassandra":            { icon: "simple-icons:apachecassandra", color: "#1287b1" },
  "prometheus":           { icon: "simple-icons:prometheus",      color: "#e6522c" },
  "influxdb":             { icon: "simple-icons:influxdb",        color: "#22adf6" },
  "metrics-store":        { icon: "simple-icons:prometheus",      color: "#e6522c" },
  "log-aggregator":       { icon: "simple-icons:elasticsearch",   color: "#00bfb3" },
  "etcd":                 { icon: "carbon:data-connected",        color: "#419eda" },
  "loki":                 { icon: "simple-icons:grafana",         color: "#f0a830" },
  "tempo":                { icon: "simple-icons:grafana",         color: "#dc6b19" },

  // ── Cache ─────────────────────────────────────────────────────────────────
  "redis":                { icon: "simple-icons:redis",           color: "#dc382d" },
  "redis-cache":          { icon: "simple-icons:redis",           color: "#dc382d" },
  "redis-dev":            { icon: "simple-icons:redis",           color: "#dc382d" },
  "redis-bullmq":         { icon: "simple-icons:redis",           color: "#dc382d" },
  "memcached":            { icon: "carbon:memory",                color: "#06b6d4" },

  // ── Queue / Messaging ─────────────────────────────────────────────────────
  "nats":                 { icon: "carbon:network-overlay",       color: "#27aae1" },
  "kafka":                { icon: "simple-icons:apachekafka",     color: "#231f20" },
  "kafka-connect":        { icon: "simple-icons:apachekafka",     color: "#231f20" },
  "rabbitmq":             { icon: "simple-icons:rabbitmq",        color: "#ff6600" },

  // ── Gateways ──────────────────────────────────────────────────────────────
  "api-gateway":          { icon: "carbon:cloud-service-management", color: "#8b5cf6" },
  "nginx-ingress":        { icon: "simple-icons:nginx",           color: "#009639" },
  "traefik":              { icon: "simple-icons:traefikproxy",    color: "#24a1c1" },
  "kong":                 { icon: "simple-icons:kong",            color: "#003459" },

  // ── Storage ───────────────────────────────────────────────────────────────
  "minio":                { icon: "simple-icons:minio",           color: "#c72c48" },
  "minio-s3":             { icon: "simple-icons:minio",           color: "#c72c48" },

  // ── Observability & Tracing ───────────────────────────────────────────────
  "telemetry-collector":  { icon: "simple-icons:opentelemetry",   color: "#425cc7" },
  "otel-collector":       { icon: "simple-icons:opentelemetry",   color: "#425cc7" },
  "jaeger":               { icon: "carbon:flow-connection",       color: "#60d0e4" },
  "grafana":              { icon: "simple-icons:grafana",         color: "#f46800" },

  // ── Kubernetes ────────────────────────────────────────────────────────────
  "kubernetes":           { icon: "simple-icons:kubernetes",      color: "#326ce5" },
  "kubernetes-api":       { icon: "simple-icons:kubernetes",      color: "#326ce5" },
  "k8s-collector":        { icon: "simple-icons:kubernetes",      color: "#326ce5" },
  "kubernetes-agent":     { icon: "simple-icons:kubernetes",      color: "#326ce5" },

  // ── Security & Platform ───────────────────────────────────────────────────
  "vault":                { icon: "simple-icons:vault",           color: "#ffd814" },
  "consul":               { icon: "simple-icons:consul",          color: "#f24c53" },
  "cert-manager":         { icon: "carbon:certificate",           color: "#326ce5" },

  // ── Frontend ──────────────────────────────────────────────────────────────
  "dashboard-frontend":   { icon: "simple-icons:vuedotjs",        color: "#42b883" },

  // ── Processing Workers ────────────────────────────────────────────────────
  "trace-processor":      { icon: "carbon:flow-modeler",          color: "#f59e0b" },
  "metric-processor":     { icon: "carbon:chart-line-data",       color: "#f59e0b" },
  "flink-job":            { icon: "simple-icons:apacheflink",     color: "#e6526f" },
  "spark-job":            { icon: "simple-icons:apachespark",     color: "#e25a1c" },

  // ── Platform APIs ─────────────────────────────────────────────────────────
  "auth-service":         { icon: "carbon:security",              color: "#3b82f6" },
  "sso-service":          { icon: "carbon:user-certification",    color: "#6366f1" },
  "user-service":         { icon: "carbon:user-profile",          color: "#3b82f6" },
  "tenant-service":       { icon: "carbon:enterprise",            color: "#3b82f6" },
  "billing-service":      { icon: "carbon:wallet",                color: "#10b981" },
  "dashboard-service":    { icon: "carbon:dashboard",             color: "#3b82f6" },
  "reporting-service":    { icon: "carbon:report",                color: "#3b82f6" },
  "llm-service":          { icon: "carbon:machine-learning-model",color: "#a855f7" },
  "data-masking-service": { icon: "carbon:data-vis--4",           color: "#f59e0b" },
  "audit-service":        { icon: "carbon:audit",                 color: "#64748b" },
  "webhook-service":      { icon: "carbon:webhook",               color: "#f97316" },
  "scheduler-service":    { icon: "carbon:calendar-heat-map",     color: "#f59e0b" },
  "network-mapper":       { icon: "carbon:network-4",             color: "#06b6d4" },
  "service-discovery":    { icon: "carbon:connect",               color: "#8b5cf6" },
  "status-page-service":  { icon: "carbon:status-change",         color: "#3b82f6" },
  "vm-agent":             { icon: "carbon:virtual-machine",       color: "#f59e0b" },
  "retention-manager":    { icon: "carbon:time",                  color: "#64748b" },
  "uptime-checker":       { icon: "carbon:ping",                  color: "#f59e0b" },
  "alert-engine":         { icon: "carbon:warning-alt",           color: "#ef4444" },
  "notification-service": { icon: "carbon:notification",          color: "#f97316" },
  "telemetryflow-platform": { icon: "carbon:cloud-satellite-config", color: "#3b82f6" },

  // ── External ──────────────────────────────────────────────────────────────
  "github":               { icon: "simple-icons:github",          color: "#94a3b8" },
  "telemetryflow-demo":   { icon: "carbon:cloud",                 color: "#94a3b8" },
  "telemetryflow-official": { icon: "carbon:cloud",               color: "#94a3b8" },
};

/**
 * Returns the best-match icon for a service (name-first, type fallback).
 */
export function getServiceIcon(name: string, type: string): string {
  return (
    SERVICE_NAME_ICON_MAP[name]?.icon ??
    SERVICE_TYPE_ICON_MAP[type]?.icon ??
    "carbon:application"
  );
}

/**
 * Returns the best-match color for a service (name-first, type fallback).
 */
export function getServiceColor(name: string, type: string): string {
  return (
    SERVICE_NAME_ICON_MAP[name]?.color ??
    SERVICE_TYPE_ICON_MAP[type]?.color ??
    "#94a3b8"
  );
}

/**
 * Returns the full ServiceIconEntry { icon, color } for a service.
 */
export function getServiceIconEntry(name: string, type: string): ServiceIconEntry {
  return (
    SERVICE_NAME_ICON_MAP[name] ??
    SERVICE_TYPE_ICON_MAP[type] ??
    { icon: "carbon:application", color: "#94a3b8" }
  );
}
