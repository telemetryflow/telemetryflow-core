/**
 * Logs API client
 */

import { collectorClient } from "./collector";
import { COLLECTOR_ENDPOINTS } from "@/config/collector";
import { config } from "@/config";
import { parseTfqlResourceFilters } from "@/utils";
import { mockDataGenerator } from "@/services/mockDataGenerator";
import { mockLogStats } from "@/mocks/api-stats";
import type {
  LogQuery,
  LogQueryResult,
  LogRecord,
  LogAggregation,
  LogPattern,
  ErrorAggregation,
  ServiceBreakdown,
} from "@/types";

export interface LogStatsResponse {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  serviceCount: number;
  avgRatePerMin: number;
  byService: Record<string, number>;
  bySeverity: Record<string, number>;
}

export const logsApi = {
  /**
   * Query logs
   */
  async query(params: LogQuery, signal?: AbortSignal): Promise<LogQueryResult> {
    if (config.useMock) {
      const offset = params.offset || 0;
      const limit = params.limit || 100;

      // If traceId is provided, generate correlated logs for that trace
      if (params.traceId) {
        const correlatedLogs = mockDataGenerator.getLogsByTraceId(
          params.traceId,
          params.start,
          params.end,
        );
        return {
          status: "success",
          data: correlatedLogs,
          total: correlatedLogs.length,
          hasMore: false,
        };
      }

      const data = mockDataGenerator.getLogs(
        params.start,
        params.end,
        limit,
        offset,
      );
      const totalCount = mockDataGenerator.getLogTotalCount(
        params.start,
        params.end,
      );
      return {
        status: "success",
        data,
        total: totalCount,
        hasMore: offset + data.length < totalCount,
      };
    }

    // Extract resource.* TFQL terms into structured K8s filter fields
    let resolvedParams = { ...params };
    if (params.query) {
      const { cleanedQuery, structuredFilters } = parseTfqlResourceFilters(
        params.query,
      );
      resolvedParams = {
        ...resolvedParams,
        query: cleanedQuery || undefined,
        ...structuredFilters,
      };
    }

    // Ensure integer ms timestamps — ClickHouse {startMs:UInt64} rejects floats
    const safeParams = {
      ...resolvedParams,
      start: Math.floor(params.start),
      end: Math.ceil(params.end),
    };
    const response = await collectorClient.post<any>(
      COLLECTOR_ENDPOINTS.LOGS_QUERY,
      safeParams,
      signal ? { signal } : undefined,
    );
    // Backend returns { status, data, total, hasMore }
    const payload = response.data;
    return {
      status: payload?.status || response.status || "success",
      data: payload?.data || payload || [],
      total: payload?.total ?? (payload?.data || []).length,
      hasMore: payload?.hasMore || false,
      error: payload?.error || response.error,
    };
  },

  /**
   * Get recent logs
   */
  async getRecent(limit: number = 100): Promise<LogRecord[]> {
    const now = Date.now();
    const result = await this.query({
      start: now - 3600000, // Last hour
      end: now,
      limit,
    });
    return result.data;
  },

  /**
   * Search logs by text
   */
  async search(
    text: string,
    start: number,
    end: number,
    limit: number = 100,
  ): Promise<LogQueryResult> {
    return this.query({
      query: text,
      start,
      end,
      limit,
    });
  },

  /**
   * Get logs by trace ID
   */
  async getByTraceId(
    traceId: string,
    start?: number,
    end?: number,
  ): Promise<LogRecord[]> {
    const now = Date.now();
    const result = await this.query({
      traceId,
      // Ensure integer ms timestamps — ClickHouse {startMs:UInt64} rejects floats
      start: Math.floor(start || now - 86400000),
      end: Math.ceil(end || now),
    });
    return result.data;
  },

  /**
   * Get logs by service
   */
  async getByService(
    service: string,
    start: number,
    end: number,
    limit: number = 100,
  ): Promise<LogRecord[]> {
    const result = await this.query({
      services: [service],
      start,
      end,
      limit,
    });
    return result.data;
  },

  /**
   * Get log volume aggregation
   */
  async getVolume(
    start: number,
    end: number,
    interval?: number,
    signal?: AbortSignal,
    filters?: {
      query?: string;
      serviceName?: string[];
      severity?: string[];
      source?: string[];
    },
  ): Promise<LogAggregation[]> {
    if (config.useMock) {
      return mockDataGenerator.getLogVolume(start, end);
    }

    const body: Record<string, any> = {
      start,
      end,
      interval: interval || Math.max(Math.floor((end - start) / 100), 1000),
    };
    if (filters?.query) body.query = filters.query;
    if (filters?.serviceName?.length) body.serviceName = filters.serviceName;
    if (filters?.severity?.length) body.severity = filters.severity;
    if (filters?.source?.length) body.source = filters.source;

    const response = await collectorClient.post<any>(
      COLLECTOR_ENDPOINTS.LOGS_VOLUME,
      body,
      signal ? { signal } : undefined,
    );
    const payload = response.data;
    return payload?.data || payload || [];
  },

  /**
   * Get available services
   */
  async getServices(): Promise<string[]> {
    if (config.useMock) {
      return mockDataGenerator.getLogServices();
    }

    const response = await collectorClient.get<any>(
      COLLECTOR_ENDPOINTS.LOGS_SERVICES,
    );
    const payload = response.data;
    return payload?.data || payload || [];
  },

  /**
   * Get available log sources (scope_name values)
   */
  async getSources(): Promise<string[]> {
    if (config.useMock) {
      return [
        "",
        "k8s-pod-logs",
        "k8s-events",
        "audit-logs",
        "agent-logs",
        "infra-logs",
        "uptime-logs",
        "status-page-logs",
      ];
    }

    const response = await collectorClient.get<any>(
      COLLECTOR_ENDPOINTS.LOGS_SOURCES,
    );
    const payload = response.data;
    return payload?.data || payload || [];
  },

  /**
   * Get log statistics
   */
  async getStats(
    start?: number,
    end?: number,
    signal?: AbortSignal,
    filters?: {
      query?: string;
      serviceName?: string[];
      severity?: string[];
      source?: string[];
    },
  ): Promise<LogStatsResponse> {
    if (config.useMock) {
      return mockLogStats(start, end);
    }

    const defaults: LogStatsResponse = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      serviceCount: 0,
      avgRatePerMin: 0,
      byService: {},
      bySeverity: {},
    };

    try {
      const params = new URLSearchParams();
      if (start) params.append("from", String(start));
      if (end) params.append("to", String(end));
      if (filters?.query) params.append("query", filters.query);
      if (filters?.serviceName?.length)
        params.append("serviceName", filters.serviceName.join(","));
      if (filters?.severity?.length)
        params.append("severity", filters.severity.join(","));
      if (filters?.source?.length)
        params.append("source", filters.source.join(","));
      const qs = params.toString();

      const response = await collectorClient.get<any>(
        `${COLLECTOR_ENDPOINTS.LOGS_STATS}${qs ? `?${qs}` : ""}`,
        signal ? { signal } : undefined,
      );
      const payload = response.data;
      if (payload?.status === "error") {
        console.error("[LogsAPI] Stats query error:", payload.message);
      }
      const result = payload?.data || payload || defaults;

      return {
        totalLogs: Number(result.totalLogs) || 0,
        errorCount: Number(result.errorCount) || 0,
        warnCount: Number(result.warnCount) || 0,
        serviceCount: Number(result.serviceCount) || 0,
        avgRatePerMin: Number(result.avgRatePerMin) || 0,
        byService:
          result.byService && typeof result.byService === "object"
            ? result.byService
            : {},
        bySeverity:
          result.bySeverity && typeof result.bySeverity === "object"
            ? result.bySeverity
            : {},
      };
    } catch {
      return defaults;
    }
  },

  /**
   * Get log patterns (auto-detected by normalizing log bodies)
   * Returns patterns + total log count in the time range
   */
  async getPatterns(
    start: number,
    end: number,
    limit?: number,
    sources?: string[],
    services?: string[],
  ): Promise<{ patterns: LogPattern[]; total: number }> {
    if (config.useMock) {
      const range = end - start;
      const bucketCount = 24;
      const bucketSize = range / bucketCount;

      // Generate volume histogram for a pattern (24 buckets matching time range)
      function makeHistogram(total: number, bursty = false): number[] {
        return Array.from({ length: bucketCount }, (_, i) => {
          const base = total / bucketCount;
          const jitter = base * (0.4 + Math.random() * 1.2);
          // Business hours boost (9am-5pm)
          const hour = new Date(start + i * bucketSize).getHours();
          const bizBoost =
            hour >= 9 && hour <= 17 ? 1.6 : hour >= 0 && hour <= 6 ? 0.4 : 1;
          // Random spike for bursty patterns
          const spike =
            bursty && Math.random() < 0.15 ? Math.random() * 4 + 2 : 1;
          return Math.max(Math.floor(base * jitter * bizBoost * spike), 0);
        });
      }

      const patterns: LogPattern[] = [
        {
          id: "1",
          pattern: "Request completed: <*> <*> <*> <*>",
          count: 1842,
          percentage: 36.8,
          examples: [
            "Request completed: GET /api/v1/products 200 OK 32ms",
            "Request completed: POST /api/v1/orders 201 Created 145ms",
            "Request completed: GET /api/v1/users 200 OK 58ms",
          ],
          level: "info",
          service: "api-gateway",
          firstSeen: start,
          lastSeen: end - 1200,
          histogram: makeHistogram(1842),
        },
        {
          id: "2",
          pattern: "User <*> authenticated successfully: userId=<*>",
          count: 967,
          percentage: 19.3,
          examples: [
            "User user@telemetryflow.id authenticated successfully: userId=12345",
            "User admin@telemetryflow.id authenticated successfully: userId=10001",
          ],
          level: "info",
          service: "user-service",
          firstSeen: start,
          lastSeen: end - 45000,
          histogram: makeHistogram(967),
        },
        {
          id: "3",
          pattern: "Connection to <*> timed out after <*>ms",
          count: 412,
          percentage: 8.2,
          examples: [
            "Connection to db-primary:5432 timed out after 30000ms",
            "Connection to redis-cache:6379 timed out after 15000ms",
            "Connection to inventory-service:8080 timed out after 10000ms",
          ],
          level: "error",
          service: "api-gateway",
          firstSeen: start + 120000,
          lastSeen: end - 60000,
          histogram: makeHistogram(412, true),
        },
        {
          id: "4",
          pattern: "Order created successfully: orderId=<*>, total=<*>",
          count: 534,
          percentage: 10.7,
          examples: [
            "Order created successfully: orderId=ORD-12345, total=$162.74",
            "Order created successfully: orderId=ORD-67890, total=$89.99",
          ],
          level: "info",
          service: "order-service",
          firstSeen: start,
          lastSeen: end - 8000,
          histogram: makeHistogram(534),
        },
        {
          id: "5",
          pattern: "Payment <*>: transactionId=<*>, amount=<*>",
          count: 389,
          percentage: 7.8,
          examples: [
            "Payment successful: transactionId=TXN-ABC123, amount=$162.74",
            "Payment failed: transactionId=TXN-DEF456, amount=$49.99",
          ],
          level: "info",
          service: "payment-service",
          firstSeen: start + 30000,
          lastSeen: end - 15000,
          histogram: makeHistogram(389),
        },
        {
          id: "6",
          pattern: "Cache <*> for key <*>",
          count: 278,
          percentage: 5.6,
          examples: [
            "Cache hit for key product:12345",
            "Cache miss for key user:session:abc123",
            "Cache expired for key config:feature-flags",
          ],
          level: "debug",
          service: "product-catalog",
          firstSeen: start,
          lastSeen: end - 2000,
          histogram: makeHistogram(278),
        },
        {
          id: "7",
          pattern: "Database query executed in <*>ms",
          count: 201,
          percentage: 4.0,
          examples: [
            "Database query executed in 45ms",
            "Database query executed in 12ms",
            "Database query executed in 230ms",
          ],
          level: "debug",
          service: "order-service",
          firstSeen: start,
          lastSeen: end - 5000,
          histogram: makeHistogram(201),
        },
        {
          id: "8",
          pattern: "Failed to authenticate user <*>",
          count: 134,
          percentage: 2.7,
          examples: [
            "Failed to authenticate user admin@test.com",
            "Failed to authenticate user bot@external.io",
          ],
          level: "warn",
          service: "user-service",
          firstSeen: start + 300000,
          lastSeen: end - 180000,
          histogram: makeHistogram(134, true),
        },
        {
          id: "9",
          pattern: "Upstream <*>: <*> returned <*>",
          count: 89,
          percentage: 1.8,
          examples: [
            "Upstream payment-service: POST /charge returned 503",
            "Upstream inventory-service: GET /stock returned 500",
          ],
          level: "error",
          service: "api-gateway",
          firstSeen: start + 600000,
          lastSeen: end - 300000,
          histogram: makeHistogram(89, true),
        },
        {
          id: "10",
          pattern: "Circuit breaker <*> for <*>",
          count: 67,
          percentage: 1.3,
          examples: [
            "Circuit breaker opened for payment-service",
            "Circuit breaker half-open for inventory-service",
            "Circuit breaker closed for user-service",
          ],
          level: "warn",
          service: "api-gateway",
          firstSeen: start + 900000,
          lastSeen: end - 420000,
          histogram: makeHistogram(67, true),
        },
        {
          id: "11",
          pattern: "Stock reserved: <*> quantity=<*>, orderId=<*>",
          count: 56,
          percentage: 1.1,
          examples: [
            "Stock reserved: SKU-12345 quantity=2, orderId=ORD-12345",
            "Stock reserved: SKU-67890 quantity=1, orderId=ORD-67890",
          ],
          level: "info",
          service: "inventory-service",
          firstSeen: start + 60000,
          lastSeen: end - 20000,
          histogram: makeHistogram(56),
        },
        {
          id: "12",
          pattern: "Email sent successfully: to=<*>, template=<*>",
          count: 45,
          percentage: 0.9,
          examples: [
            "Email sent successfully: to=user@telemetryflow.id, template=order_shipped",
            "Email sent successfully: to=admin@telemetryflow.id, template=alert_notification",
          ],
          level: "info",
          service: "notification-service",
          firstSeen: start + 120000,
          lastSeen: end - 35000,
          histogram: makeHistogram(45),
        },
        {
          id: "13",
          pattern: "Rate limit <*> for <*>",
          count: 38,
          percentage: 0.8,
          examples: [
            "Rate limit exceeded for IP: 192.168.1.100",
            "Rate limit approaching for user: 12345",
          ],
          level: "warn",
          service: "api-gateway",
          firstSeen: start + 500000,
          lastSeen: end - 150000,
          histogram: makeHistogram(38, true),
        },
        {
          id: "14",
          pattern: "Pod <*> on node <*>",
          count: 12,
          percentage: 0.2,
          examples: [
            "Pod scheduled on node worker-01",
            "Pod evicted from node worker-03",
          ],
          level: "info",
          service: "k8s.events",
          firstSeen: start + 200000,
          lastSeen: end - 500000,
          histogram: makeHistogram(12),
        },
        {
          id: "15",
          pattern: "[<*>] <*> <*> → <*>",
          count: 31,
          percentage: 0.6,
          examples: [
            "[AUTH] user.login → SUCCESS",
            "[DATA] data.export → DENIED",
            "[SYSTEM] settings.update → SUCCESS",
          ],
          level: "info",
          service: "audit",
          firstSeen: start,
          lastSeen: end - 100000,
          histogram: makeHistogram(31),
        },
      ];
      const total = patterns.reduce((sum, p) => sum + p.count, 0);
      return { patterns, total };
    }

    try {
      const params = new URLSearchParams();
      params.append("from", String(start));
      params.append("to", String(end));
      if (limit) params.append("limit", String(limit));
      if (sources?.length) params.append("sources", sources.join(","));
      if (services?.length) params.append("services", services.join(","));

      // Per-request abort controller — patterns query can be heavy; abort after 90s
      // to avoid blocking the UI if ClickHouse is slow or table is large.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await collectorClient.get<any>(
        `${COLLECTOR_ENDPOINTS.LOGS_PATTERNS}?${params.toString()}`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);
      const payload = response.data;
      if (payload?.status === "error") {
        console.error("[LogsAPI] Patterns query error:", payload.message);
      }
      const rows = payload?.data || payload || [];
      const total = Number(payload?.total) || 0;

      const patterns = rows.map((r: any, idx: number) => ({
        id: String(idx + 1),
        pattern: r.pattern || "",
        count: Number(r.matches) || 0,
        percentage: Number(r.percentage) || 0,
        examples: r.examples || [],
        level: r.level || "info",
        service: r.service || "",
        firstSeen: Number(r.firstSeen) || 0,
        lastSeen: Number(r.lastSeen) || 0,
        histogram: Array.isArray(r.histogram) ? r.histogram.map(Number) : [],
      }));

      return { patterns, total };
    } catch (err) {
      console.error("[LogsAPI] getPatterns failed:", err);
      return { patterns: [], total: 0 };
    }
  },

  /**
   * Get top error messages ranked by occurrence
   */
  async getTopErrors(
    start: number,
    end: number,
    limit?: number,
    sources?: string[],
    services?: string[],
  ): Promise<ErrorAggregation[]> {
    if (config.useMock) {
      return [
        {
          message: "Connection timeout",
          count: 156,
          firstSeen: start,
          lastSeen: end - 60000,
          services: ["api-gateway", "user-service"],
        },
        {
          message: "Authentication failed",
          count: 89,
          firstSeen: start,
          lastSeen: end - 120000,
          services: ["auth-service"],
        },
        {
          message: "Database connection pool exhausted",
          count: 45,
          firstSeen: start + 300000,
          lastSeen: end - 300000,
          services: ["order-service"],
        },
      ];
    }

    try {
      const params = new URLSearchParams();
      params.append("from", String(start));
      params.append("to", String(end));
      if (limit) params.append("limit", String(limit));
      if (sources?.length) params.append("sources", sources.join(","));
      if (services?.length) params.append("services", services.join(","));

      const response = await collectorClient.get<any>(
        `${COLLECTOR_ENDPOINTS.LOGS_TOP_ERRORS}?${params.toString()}`,
      );
      const payload = response.data;
      const rows = payload?.data || payload || [];

      return rows.map((r: any) => ({
        message: r.message || "",
        count: Number(r.count) || 0,
        firstSeen: Number(r.firstSeen) || start,
        lastSeen: Number(r.lastSeen) || end,
        services: r.services || [],
      }));
    } catch (err) {
      console.error("[LogsAPI] getTopErrors failed:", err);
      return [];
    }
  },

  /**
   * Get per-service log breakdown
   */
  async getServiceBreakdown(
    start: number,
    end: number,
    limit?: number,
    sources?: string[],
    services?: string[],
  ): Promise<ServiceBreakdown[]> {
    if (config.useMock) {
      return [
        {
          service: "api-gateway",
          totalLogs: 15234,
          errorCount: 234,
          errorPercentage: 1.5,
          topError: "Connection timeout",
        },
        {
          service: "user-service",
          totalLogs: 8923,
          errorCount: 123,
          errorPercentage: 1.4,
          topError: "Authentication failed",
        },
        {
          service: "order-service",
          totalLogs: 6543,
          errorCount: 89,
          errorPercentage: 1.4,
          topError: "Database connection pool exhausted",
        },
      ];
    }

    try {
      const params = new URLSearchParams();
      params.append("from", String(start));
      params.append("to", String(end));
      if (limit) params.append("limit", String(limit));
      if (sources?.length) params.append("sources", sources.join(","));
      if (services?.length) params.append("services", services.join(","));

      const response = await collectorClient.get<any>(
        `${COLLECTOR_ENDPOINTS.LOGS_SERVICE_BREAKDOWN}?${params.toString()}`,
      );
      const payload = response.data;
      const rows = payload?.data || payload || [];

      return rows.map((r: any) => ({
        service: r.service || "",
        totalLogs: Number(r.totalLogs) || 0,
        errorCount: Number(r.errorCount) || 0,
        errorPercentage: Number(r.errorPercentage) || 0,
        topError: r.topError || "",
      }));
    } catch (err) {
      console.error("[LogsAPI] getServiceBreakdown failed:", err);
      return [];
    }
  },

  /**
   * Tail logs — poll for new logs since a timestamp (for streaming)
   */
  async tail(
    since: number,
    limit?: number,
    services?: string[],
    levels?: string[],
  ): Promise<LogRecord[]> {
    if (config.useMock) {
      return mockDataGenerator.getLogs(since, Date.now(), limit || 10, 0);
    }

    const params = new URLSearchParams();
    params.append("since", String(since));
    if (limit) params.append("limit", String(limit));
    if (services && services.length > 0)
      params.append("services", services.join(","));
    if (levels && levels.length > 0) params.append("levels", levels.join(","));

    const response = await collectorClient.get<any>(
      `${COLLECTOR_ENDPOINTS.LOGS_TAIL}?${params.toString()}`,
    );
    const payload = response.data;
    return payload?.data || payload || [];
  },
};

export default logsApi;
