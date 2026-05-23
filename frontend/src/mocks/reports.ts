/**
 * Reports Mock Data Generator
 * Generates realistic mock report execution data for development and testing
 */

import { randomId } from "./shared";
import type { ReportExecution } from "@/types/report";

/**
 * Generate time series data with realistic variations
 */
function generateTimeSeriesData(
  points: number,
  min: number,
  max: number,
  startTime: number,
  endTime: number,
): [number, number][] {
  const data: [number, number][] = [];
  const interval = (endTime - startTime) / points;

  let currentValue = min + (max - min) / 2;

  for (let i = 0; i < points; i++) {
    const timestamp = startTime + i * interval;

    // Add realistic variation
    const change = (Math.random() - 0.5) * (max - min) * 0.1;
    currentValue = Math.max(min, Math.min(max, currentValue + change));

    data.push([timestamp, Number(currentValue.toFixed(2))]);
  }

  return data;
}

/**
 * Format timestamp to readable string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generate a realistic mock report execution
 */
export function generateMockReportExecution(): ReportExecution {
  const now = Date.now();
  const startTime = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
  const endTime = now;

  return {
    id: `exec-${randomId(16)}`,
    reportDefinitionId: `def-${randomId(16)}`,
    reportName: "Weekly Infrastructure Report",
    organizationId: "org-demo-001",
    status: "completed",
    periodStart: new Date(startTime).toISOString(),
    periodEnd: new Date(endTime).toISOString(),
    triggeredBy: "scheduler",
    triggeredByUser: null,
    executionTimeMs: 4523,
    error: null,
    createdAt: now - 3600000,
    summary: null,
    result: {
      generatedAt: new Date(now).toISOString(),
      periodStart: new Date(startTime).toISOString(),
      periodEnd: new Date(endTime).toISOString(),
      sections: [
        // Section 1: System Overview
        {
          type: "utilization",
          title: "System Utilization Overview",
          metrics: [
            {
              label: "Average CPU Usage",
              value: 67.8,
              unit: "%",
              status: "warning",
              trend: 5.2,
            },
            {
              label: "Average Memory Usage",
              value: 72.4,
              unit: "%",
              status: "warning",
              trend: -2.1,
            },
            {
              label: "Average Disk Usage",
              value: 45.6,
              unit: "%",
              status: "good",
              trend: 1.8,
            },
            {
              label: "Network Throughput",
              value: 1.24,
              unit: "GB/s",
              status: "good",
              trend: 12.5,
            },
          ],
          charts: [
            {
              title: "CPU Usage Over Time",
              type: "timeseries",
              unit: "%",
              description: "Average CPU usage (%) across all hosts over the report period",
              signal: "infrastructure",
              query: "FETCH metrics WHERE metric_name = 'cpu.usage' AGGREGATE avg(value) GROUP BY host_id INTERVAL {{interval}}",
              series: [
                {
                  name: "CPU Usage",
                  data: generateTimeSeriesData(168, 50, 85, startTime, endTime),
                },
              ],
            },
            {
              title: "Memory Usage Over Time",
              type: "timeseries",
              unit: "%",
              description: "Average memory utilization (%) across all hosts",
              signal: "infrastructure",
              query: "FETCH metrics WHERE metric_name = 'memory.usedPercent' AGGREGATE avg(value) GROUP BY host_id INTERVAL {{interval}}",
              series: [
                {
                  name: "Memory Usage",
                  data: generateTimeSeriesData(168, 60, 90, startTime, endTime),
                },
              ],
            },
            {
              title: "Disk I/O Throughput",
              type: "timeseries",
              unit: "MB/s",
              description: "Disk read/write throughput (MB/s) aggregated across all hosts",
              signal: "infrastructure",
              query: "FETCH metrics WHERE metric_name IN ('disk.readBytes', 'disk.writeBytes') AGGREGATE avg(value) GROUP BY host_id INTERVAL {{interval}}",
              series: [
                {
                  name: "Read MB/s",
                  data: generateTimeSeriesData(168, 20, 180, startTime, endTime),
                },
                {
                  name: "Write MB/s",
                  data: generateTimeSeriesData(168, 15, 120, startTime, endTime),
                },
              ],
            },
            {
              title: "Network Throughput",
              type: "timeseries",
              unit: "GB/s",
              description: "Inbound/outbound network throughput (GB/s)",
              signal: "infrastructure",
              query: "FETCH metrics WHERE metric_name IN ('network.bytesRecv', 'network.bytesSent') AGGREGATE avg(value) GROUP BY host_id INTERVAL {{interval}}",
              series: [
                {
                  name: "Inbound GB/s",
                  data: generateTimeSeriesData(168, 0.5, 2.5, startTime, endTime),
                },
                {
                  name: "Outbound GB/s",
                  data: generateTimeSeriesData(168, 0.3, 1.8, startTime, endTime),
                },
              ],
            },
          ],
          tables: [
            {
              title: "Top Resource Consumers",
              columns: [
                { key: "service", title: "Service Name" },
                { key: "cpu", title: "CPU (%)" },
                { key: "memory", title: "Memory (%)" },
                { key: "disk", title: "Disk I/O (MB/s)" },
                { key: "network", title: "Network (MB/s)" },
                { key: "status", title: "Status" },
              ],
              rows: [
                {
                  service: "telemetry-collector",
                  cpu: 45.2,
                  memory: 68.5,
                  disk: 125.4,
                  network: 89.2,
                  status: "Running",
                },
                {
                  service: "metrics-processor",
                  cpu: 38.7,
                  memory: 72.1,
                  disk: 98.3,
                  network: 156.8,
                  status: "Running",
                },
                {
                  service: "alert-manager",
                  cpu: 22.4,
                  memory: 45.6,
                  disk: 34.2,
                  network: 67.4,
                  status: "Running",
                },
                {
                  service: "dashboard-api",
                  cpu: 18.9,
                  memory: 38.2,
                  disk: 12.5,
                  network: 234.6,
                  status: "Running",
                },
                {
                  service: "log-aggregator",
                  cpu: 56.3,
                  memory: 81.4,
                  disk: 456.7,
                  network: 123.4,
                  status: "Running",
                },
                {
                  service: "database-primary",
                  cpu: 67.8,
                  memory: 89.2,
                  disk: 678.9,
                  network: 345.6,
                  status: "Running",
                },
                {
                  service: "cache-redis",
                  cpu: 12.4,
                  memory: 56.7,
                  disk: 23.4,
                  network: 89.1,
                  status: "Running",
                },
                {
                  service: "queue-manager",
                  cpu: 28.5,
                  memory: 42.3,
                  disk: 67.8,
                  network: 112.3,
                  status: "Running",
                },
                {
                  service: "auth-service",
                  cpu: 15.6,
                  memory: 34.2,
                  disk: 8.9,
                  network: 45.6,
                  status: "Running",
                },
                {
                  service: "notification-service",
                  cpu: 9.8,
                  memory: 23.4,
                  disk: 5.6,
                  network: 34.5,
                  status: "Running",
                },
              ],
            },
          ],
        },
        // Section 2: Alerting
        {
          type: "alerting",
          title: "Alert Management Summary",
          metrics: [
            {
              label: "Total Alerts",
              value: 1247,
              unit: "",
              status: "good",
              trend: -8.5,
            },
            {
              label: "Critical Alerts",
              value: 23,
              unit: "",
              status: "critical",
              trend: 15.2,
            },
            {
              label: "Resolution Rate",
              value: 94.2,
              unit: "%",
              status: "good",
              trend: 2.3,
            },
            {
              label: "Avg Resolution Time",
              value: 12.5,
              unit: "min",
              status: "good",
              trend: -18.4,
            },
          ],
          charts: [
            {
              title: "Alerts by Severity",
              type: "bar",
              series: [
                {
                  name: "Critical",
                  data: [[0, 23]],
                  color: "#ef4444",
                },
                {
                  name: "Warning",
                  data: [[0, 156]],
                  color: "#f59e0b",
                },
                {
                  name: "Info",
                  data: [[0, 1068]],
                  color: "#3b82f6",
                },
              ],
            },
            {
              title: "Alert Volume by Source",
              type: "bar",
              series: [
                {
                  name: "CPU Monitor",
                  data: [[0, 342]],
                  color: "#3b82f6",
                },
                {
                  name: "Memory Monitor",
                  data: [[0, 278]],
                  color: "#8b5cf6",
                },
                {
                  name: "Network Monitor",
                  data: [[0, 189]],
                  color: "#22c55e",
                },
                {
                  name: "Disk Monitor",
                  data: [[0, 156]],
                  color: "#f59e0b",
                },
                {
                  name: "Health Check",
                  data: [[0, 98]],
                  color: "#06b6d4",
                },
              ],
            },
            {
              title: "MTTR by Severity",
              type: "bar",
              series: [
                {
                  name: "Critical",
                  data: [[0, 28]],
                  color: "#ef4444",
                },
                {
                  name: "Warning",
                  data: [[0, 15]],
                  color: "#f59e0b",
                },
                {
                  name: "Info",
                  data: [[0, 5]],
                  color: "#3b82f6",
                },
              ],
            },
            {
              title: "Resolved vs Unresolved",
              type: "bar",
              series: [
                {
                  name: "Resolved",
                  data: [[0, 1175]],
                  color: "#22c55e",
                },
                {
                  name: "Unresolved",
                  data: [[0, 72]],
                  color: "#ef4444",
                },
              ],
            },
          ],
          tables: [
            {
              title: "Top Alert Sources",
              columns: [
                { key: "source", title: "Alert Source" },
                { key: "total", title: "Total Alerts" },
                { key: "critical", title: "Critical" },
                { key: "warning", title: "Warning" },
                { key: "info", title: "Info" },
                { key: "resolved", title: "Resolved (%)" },
              ],
              rows: [
                {
                  source: "CPU Threshold Monitor",
                  total: 342,
                  critical: 8,
                  warning: 45,
                  info: 289,
                  resolved: 96.5,
                },
                {
                  source: "Memory Threshold Monitor",
                  total: 278,
                  critical: 5,
                  warning: 38,
                  info: 235,
                  resolved: 94.2,
                },
                {
                  source: "Disk Space Monitor",
                  total: 156,
                  critical: 2,
                  warning: 23,
                  info: 131,
                  resolved: 98.1,
                },
                {
                  source: "Network Latency Monitor",
                  total: 189,
                  critical: 4,
                  warning: 28,
                  info: 157,
                  resolved: 92.6,
                },
                {
                  source: "Service Health Check",
                  total: 98,
                  critical: 3,
                  warning: 12,
                  info: 83,
                  resolved: 89.8,
                },
                {
                  source: "Database Connection Pool",
                  total: 67,
                  critical: 1,
                  warning: 8,
                  info: 58,
                  resolved: 97.0,
                },
                {
                  source: "API Response Time",
                  total: 117,
                  critical: 0,
                  warning: 19,
                  info: 98,
                  resolved: 95.7,
                },
              ],
            },
            {
              title: "Recent Critical Alerts",
              columns: [
                { key: "timestamp", title: "Timestamp" },
                { key: "alert", title: "Alert Name" },
                { key: "severity", title: "Severity" },
                { key: "source", title: "Source" },
                { key: "status", title: "Status" },
                { key: "duration", title: "Duration (min)" },
              ],
              rows: [
                {
                  timestamp: formatTimestamp(now - 3600000),
                  alert: "High CPU Usage",
                  severity: "Critical",
                  source: "telemetry-collector",
                  status: "Resolved",
                  duration: 15,
                },
                {
                  timestamp: formatTimestamp(now - 7200000),
                  alert: "Memory Leak Detected",
                  severity: "Critical",
                  source: "metrics-processor",
                  status: "Resolved",
                  duration: 28,
                },
                {
                  timestamp: formatTimestamp(now - 10800000),
                  alert: "Database Connection Failed",
                  severity: "Critical",
                  source: "database-primary",
                  status: "Resolved",
                  duration: 8,
                },
                {
                  timestamp: formatTimestamp(now - 14400000),
                  alert: "Disk Space Critical",
                  severity: "Critical",
                  source: "log-aggregator",
                  status: "Resolved",
                  duration: 45,
                },
                {
                  timestamp: formatTimestamp(now - 18000000),
                  alert: "Service Unavailable",
                  severity: "Critical",
                  source: "dashboard-api",
                  status: "Resolved",
                  duration: 12,
                },
              ],
            },
          ],
        },
        // Section 3: Reliability
        {
          type: "reliability",
          title: "System Reliability Metrics",
          metrics: [
            {
              label: "System Uptime",
              value: 99.97,
              unit: "%",
              status: "good",
              trend: 0.02,
            },
            {
              label: "Service Availability",
              value: 99.95,
              unit: "%",
              status: "good",
              trend: 0.01,
            },
            {
              label: "Error Rate",
              value: 0.08,
              unit: "%",
              status: "good",
              trend: -0.03,
            },
            {
              label: "Mean Time to Recovery",
              value: 8.5,
              unit: "min",
              status: "good",
              trend: -12.5,
            },
          ],
          charts: [
            {
              title: "Service Uptime Percentage",
              type: "timeseries",
              series: [
                {
                  name: "Uptime",
                  data: generateTimeSeriesData(
                    168,
                    99.5,
                    100,
                    startTime,
                    endTime,
                  ),
                },
              ],
            },
            {
              title: "Error Rate Over Time",
              type: "timeseries",
              series: [
                {
                  name: "Error Rate",
                  data: generateTimeSeriesData(168, 0, 0.5, startTime, endTime),
                },
              ],
            },
          ],
          tables: [
            {
              title: "Service Reliability Report",
              columns: [
                { key: "service", title: "Service Name" },
                { key: "uptime", title: "Uptime (%)" },
                { key: "incidents", title: "Incidents" },
                { key: "mttr", title: "MTTR (min)" },
                { key: "errorRate", title: "Error Rate (%)" },
                { key: "sla", title: "SLA Status" },
              ],
              rows: [
                {
                  service: "telemetry-collector",
                  uptime: 99.98,
                  incidents: 2,
                  mttr: 7.5,
                  errorRate: 0.05,
                  sla: "Met",
                },
                {
                  service: "metrics-processor",
                  uptime: 99.95,
                  incidents: 3,
                  mttr: 12.3,
                  errorRate: 0.08,
                  sla: "Met",
                },
                {
                  service: "alert-manager",
                  uptime: 99.99,
                  incidents: 1,
                  mttr: 5.2,
                  errorRate: 0.02,
                  sla: "Met",
                },
                {
                  service: "dashboard-api",
                  uptime: 99.97,
                  incidents: 2,
                  mttr: 8.7,
                  errorRate: 0.06,
                  sla: "Met",
                },
                {
                  service: "database-primary",
                  uptime: 99.96,
                  incidents: 3,
                  mttr: 15.4,
                  errorRate: 0.09,
                  sla: "Met",
                },
                {
                  service: "auth-service",
                  uptime: 99.99,
                  incidents: 1,
                  mttr: 4.8,
                  errorRate: 0.01,
                  sla: "Met",
                },
              ],
            },
          ],
        },
        // Section 4: Uptime Service Report
        {
          type: "uptime",
          title: "Uptime Service Report",
          metrics: [
            {
              label: "Overall Uptime",
              value: 99.94,
              unit: "%",
              status: "good",
              trend: 0.03,
            },
            {
              label: "Monitored Endpoints",
              value: 48,
              unit: "",
              status: "good",
              trend: 6,
            },
            {
              label: "Avg Response Time",
              value: 245,
              unit: "ms",
              status: "good",
              trend: -12.8,
            },
            {
              label: "Downtime Incidents",
              value: 7,
              unit: "",
              status: "warning",
              trend: -22.2,
            },
          ],
          charts: [
            {
              title: "Uptime by Service",
              type: "timeseries",
              series: [
                {
                  name: "API Gateway",
                  data: generateTimeSeriesData(168, 99.5, 100, startTime, endTime),
                },
                {
                  name: "Auth Service",
                  data: generateTimeSeriesData(168, 99.8, 100, startTime, endTime),
                },
                {
                  name: "Payment Service",
                  data: generateTimeSeriesData(168, 99.0, 100, startTime, endTime),
                },
                {
                  name: "Notification Service",
                  data: generateTimeSeriesData(168, 99.6, 100, startTime, endTime),
                },
              ],
            },
            {
              title: "Response Time by Endpoint",
              type: "timeseries",
              series: [
                {
                  name: "GET /api/health",
                  data: generateTimeSeriesData(168, 15, 80, startTime, endTime),
                },
                {
                  name: "GET /api/metrics",
                  data: generateTimeSeriesData(168, 120, 450, startTime, endTime),
                },
                {
                  name: "POST /api/ingest",
                  data: generateTimeSeriesData(168, 200, 800, startTime, endTime),
                },
                {
                  name: "GET /api/dashboards",
                  data: generateTimeSeriesData(168, 80, 350, startTime, endTime),
                },
              ],
            },
            {
              title: "Status Code Distribution",
              type: "bar",
              series: [
                {
                  name: "2xx Success",
                  data: [[0, 287456]],
                  color: "#22c55e",
                },
                {
                  name: "3xx Redirect",
                  data: [[0, 4523]],
                  color: "#3b82f6",
                },
                {
                  name: "4xx Client Error",
                  data: [[0, 1876]],
                  color: "#f59e0b",
                },
                {
                  name: "5xx Server Error",
                  data: [[0, 234]],
                  color: "#ef4444",
                },
              ],
            },
            {
              title: "Downtime by Service (min)",
              type: "bar",
              series: [
                {
                  name: "API Gateway",
                  data: [[0, 12]],
                  color: "#3b82f6",
                },
                {
                  name: "Auth Service",
                  data: [[0, 5]],
                  color: "#8b5cf6",
                },
                {
                  name: "Payment Service",
                  data: [[0, 28]],
                  color: "#ef4444",
                },
                {
                  name: "Notification Service",
                  data: [[0, 8]],
                  color: "#f59e0b",
                },
                {
                  name: "Database Primary",
                  data: [[0, 15]],
                  color: "#06b6d4",
                },
              ],
            },
          ],
          tables: [
            {
              title: "Endpoint Uptime Details",
              columns: [
                { key: "endpoint", title: "Endpoint" },
                { key: "uptime", title: "Uptime (%)" },
                { key: "avgResponse", title: "Avg Response (ms)" },
                { key: "p95Response", title: "P95 Response (ms)" },
                { key: "checks", title: "Total Checks" },
                { key: "failures", title: "Failures" },
                { key: "sla", title: "SLA Status" },
              ],
              rows: [
                {
                  endpoint: "GET /api/health",
                  uptime: 99.99,
                  avgResponse: 42,
                  p95Response: 78,
                  checks: 10080,
                  failures: 1,
                  sla: "Met",
                },
                {
                  endpoint: "GET /api/metrics",
                  uptime: 99.95,
                  avgResponse: 245,
                  p95Response: 420,
                  checks: 10080,
                  failures: 5,
                  sla: "Met",
                },
                {
                  endpoint: "POST /api/ingest",
                  uptime: 99.92,
                  avgResponse: 380,
                  p95Response: 720,
                  checks: 10080,
                  failures: 8,
                  sla: "Met",
                },
                {
                  endpoint: "GET /api/dashboards",
                  uptime: 99.97,
                  avgResponse: 185,
                  p95Response: 340,
                  checks: 10080,
                  failures: 3,
                  sla: "Met",
                },
                {
                  endpoint: "POST /api/alerts",
                  uptime: 99.98,
                  avgResponse: 156,
                  p95Response: 290,
                  checks: 10080,
                  failures: 2,
                  sla: "Met",
                },
                {
                  endpoint: "GET /api/logs/query",
                  uptime: 99.88,
                  avgResponse: 520,
                  p95Response: 980,
                  checks: 10080,
                  failures: 12,
                  sla: "At Risk",
                },
                {
                  endpoint: "GET /api/traces",
                  uptime: 99.91,
                  avgResponse: 410,
                  p95Response: 750,
                  checks: 10080,
                  failures: 9,
                  sla: "Met",
                },
                {
                  endpoint: "POST /api/auth/login",
                  uptime: 99.99,
                  avgResponse: 95,
                  p95Response: 180,
                  checks: 10080,
                  failures: 1,
                  sla: "Met",
                },
              ],
            },
            {
              title: "Recent Downtime Incidents",
              columns: [
                { key: "timestamp", title: "Start Time" },
                { key: "service", title: "Service" },
                { key: "endpoint", title: "Endpoint" },
                { key: "duration", title: "Duration (min)" },
                { key: "statusCode", title: "Status Code" },
                { key: "rootCause", title: "Root Cause" },
              ],
              rows: [
                {
                  timestamp: formatTimestamp(now - 2400000),
                  service: "Payment Service",
                  endpoint: "POST /api/payments",
                  duration: 8,
                  statusCode: 503,
                  rootCause: "Connection pool exhaustion",
                },
                {
                  timestamp: formatTimestamp(now - 7200000),
                  service: "API Gateway",
                  endpoint: "GET /api/metrics",
                  duration: 3,
                  statusCode: 502,
                  rootCause: "Upstream timeout",
                },
                {
                  timestamp: formatTimestamp(now - 14400000),
                  service: "Database Primary",
                  endpoint: "GET /api/logs/query",
                  duration: 5,
                  statusCode: 504,
                  rootCause: "Slow query timeout",
                },
                {
                  timestamp: formatTimestamp(now - 28800000),
                  service: "Auth Service",
                  endpoint: "POST /api/auth/login",
                  duration: 2,
                  statusCode: 500,
                  rootCause: "Token refresh failure",
                },
                {
                  timestamp: formatTimestamp(now - 43200000),
                  service: "Notification Service",
                  endpoint: "POST /api/notifications",
                  duration: 4,
                  statusCode: 503,
                  rootCause: "Queue backpressure",
                },
                {
                  timestamp: formatTimestamp(now - 86400000),
                  service: "Payment Service",
                  endpoint: "POST /api/payments",
                  duration: 12,
                  statusCode: 503,
                  rootCause: "Third-party API outage",
                },
                {
                  timestamp: formatTimestamp(now - 129600000),
                  service: "API Gateway",
                  endpoint: "GET /api/dashboards",
                  duration: 6,
                  statusCode: 502,
                  rootCause: "Certificate renewal",
                },
              ],
            },
          ],
        },
        // Section 5: User Management
        {
          type: "user_management",
          title: "User Activity Summary",
          metrics: [
            {
              label: "Active Users",
              value: 1847,
              unit: "",
              status: "good",
              trend: 12.5,
            },
            {
              label: "New Users",
              value: 234,
              unit: "",
              status: "good",
              trend: 8.3,
            },
            {
              label: "Login Success Rate",
              value: 98.7,
              unit: "%",
              status: "good",
              trend: 0.5,
            },
            {
              label: "Failed Login Attempts",
              value: 156,
              unit: "",
              status: "warning",
              trend: 23.4,
            },
          ],
          charts: [
            {
              title: "User Activity by Type",
              type: "bar",
              series: [
                {
                  name: "Dashboard Views",
                  data: [[0, 4523]],
                  color: "#3b82f6",
                },
                {
                  name: "API Calls",
                  data: [[0, 12456]],
                  color: "#22c55e",
                },
                {
                  name: "Report Generations",
                  data: [[0, 789]],
                  color: "#f59e0b",
                },
                {
                  name: "Alert Configurations",
                  data: [[0, 234]],
                  color: "#8b5cf6",
                },
              ],
            },
            {
              title: "Users by Role",
              type: "bar",
              series: [
                {
                  name: "Admin",
                  data: [[0, 12]],
                  color: "#ef4444",
                },
                {
                  name: "Operator",
                  data: [[0, 156]],
                  color: "#3b82f6",
                },
                {
                  name: "Viewer",
                  data: [[0, 845]],
                  color: "#22c55e",
                },
                {
                  name: "Auditor",
                  data: [[0, 67]],
                  color: "#f59e0b",
                },
                {
                  name: "Read-Only",
                  data: [[0, 767]],
                  color: "#94a3b8",
                },
              ],
            },
            {
              title: "Login Attempts by Status",
              type: "bar",
              series: [
                {
                  name: "Successful",
                  data: [[0, 12847]],
                  color: "#22c55e",
                },
                {
                  name: "Failed",
                  data: [[0, 156]],
                  color: "#ef4444",
                },
                {
                  name: "Locked Out",
                  data: [[0, 23]],
                  color: "#f59e0b",
                },
              ],
            },
            {
              title: "Active Sessions by Region",
              type: "bar",
              series: [
                {
                  name: "Asia Pacific",
                  data: [[0, 845]],
                  color: "#3b82f6",
                },
                {
                  name: "North America",
                  data: [[0, 523]],
                  color: "#22c55e",
                },
                {
                  name: "Europe",
                  data: [[0, 312]],
                  color: "#8b5cf6",
                },
                {
                  name: "Others",
                  data: [[0, 167]],
                  color: "#94a3b8",
                },
              ],
            },
          ],
          tables: [
            {
              title: "Top Active Users",
              columns: [
                { key: "username", title: "Username" },
                { key: "email", title: "Email" },
                { key: "role", title: "Role" },
                { key: "logins", title: "Logins" },
                { key: "actions", title: "Actions" },
                { key: "lastActive", title: "Last Active" },
              ],
              rows: [
                {
                  username: "john.doe",
                  email: "john.doe@company.com",
                  role: "Admin",
                  logins: 45,
                  actions: 1234,
                  lastActive: formatTimestamp(now - 300000),
                },
                {
                  username: "jane.smith",
                  email: "jane.smith@company.com",
                  role: "Operator",
                  logins: 38,
                  actions: 987,
                  lastActive: formatTimestamp(now - 600000),
                },
                {
                  username: "bob.wilson",
                  email: "bob.wilson@company.com",
                  role: "Viewer",
                  logins: 52,
                  actions: 456,
                  lastActive: formatTimestamp(now - 900000),
                },
                {
                  username: "alice.johnson",
                  email: "alice.johnson@company.com",
                  role: "Admin",
                  logins: 41,
                  actions: 1567,
                  lastActive: formatTimestamp(now - 1200000),
                },
                {
                  username: "charlie.brown",
                  email: "charlie.brown@company.com",
                  role: "Operator",
                  logins: 29,
                  actions: 678,
                  lastActive: formatTimestamp(now - 1800000),
                },
                {
                  username: "david.lee",
                  email: "david.lee@company.com",
                  role: "Viewer",
                  logins: 34,
                  actions: 234,
                  lastActive: formatTimestamp(now - 2400000),
                },
                {
                  username: "emma.davis",
                  email: "emma.davis@company.com",
                  role: "Operator",
                  logins: 47,
                  actions: 1123,
                  lastActive: formatTimestamp(now - 3000000),
                },
                {
                  username: "frank.miller",
                  email: "frank.miller@company.com",
                  role: "Admin",
                  logins: 56,
                  actions: 1890,
                  lastActive: formatTimestamp(now - 3600000),
                },
              ],
            },
            {
              title: "Failed Login Attempts",
              columns: [
                { key: "timestamp", title: "Timestamp" },
                { key: "username", title: "Username" },
                { key: "ipAddress", title: "IP Address" },
                { key: "reason", title: "Failure Reason" },
                { key: "attempts", title: "Attempts" },
              ],
              rows: [
                {
                  timestamp: formatTimestamp(now - 1800000),
                  username: "unknown.user",
                  ipAddress: "192.168.1.100",
                  reason: "Invalid credentials",
                  attempts: 5,
                },
                {
                  timestamp: formatTimestamp(now - 3600000),
                  username: "test.account",
                  ipAddress: "10.0.0.50",
                  reason: "Account locked",
                  attempts: 3,
                },
                {
                  timestamp: formatTimestamp(now - 5400000),
                  username: "admin",
                  ipAddress: "172.16.0.25",
                  reason: "Invalid credentials",
                  attempts: 8,
                },
                {
                  timestamp: formatTimestamp(now - 7200000),
                  username: "root",
                  ipAddress: "192.168.1.200",
                  reason: "Account disabled",
                  attempts: 2,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

/**
 * Mock service for reports
 */
export const reportsMock = {
  generateExecution: generateMockReportExecution,
};
