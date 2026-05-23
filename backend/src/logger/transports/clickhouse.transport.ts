/**
 * ClickHouse Transport for Winston
 *
 * Writes logs directly to ClickHouse with trace context correlation.
 * Self-contained: creates its own ClickHouse HTTP client, no NestJS DI needed.
 *
 * Field mapping from Winston otelContextFormat:
 *   info.traceId  → trace_id   (camelCase → snake_case)
 *   info.spanId   → span_id
 *   info.traceFlags → trace_flags
 */

import Transport from "winston-transport";
import { createClient, ClickHouseClient } from "@clickhouse/client";

export interface ClickHouseTransportOptions
  extends Transport.TransportStreamOptions {
  /** ClickHouse host URL (default: http://localhost:8123) */
  host?: string;
  /** ClickHouse database (default: telemetryflow_db) */
  database?: string;
  /** ClickHouse username (default: default) */
  username?: string;
  /** ClickHouse password */
  password?: string;
  /** Service name for logs (default: telemetryflow-platform) */
  serviceName?: string;
  /** Flush when buffer reaches this size (default: 50) */
  batchSize?: number;
  /** Flush interval in ms (default: 5000) */
  flushInterval?: number;
}

interface LogRow {
  timestamp: string;
  observed_timestamp: string;
  trace_id: string;
  span_id: string;
  trace_flags: number;
  severity_text: string;
  severity_number: number;
  service_name: string;
  organization_id: string;
  workspace_id: string;
  tenant_id: string;
  body: string;
  resource_attributes: Record<string, string>;
  scope_name: string;
  scope_version: string;
  log_attributes: Record<string, string>;
}

export class ClickHouseTransport extends Transport {
  private client: ClickHouseClient;
  private database: string;
  private serviceName: string;
  private batchSize: number;
  private flushIntervalMs: number;
  private logBuffer: LogRow[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(opts: ClickHouseTransportOptions) {
    super(opts);

    this.database =
      opts.database || process.env.CLICKHOUSE_DB || "telemetryflow_db";
    this.serviceName =
      opts.serviceName ||
      process.env.OTEL_SERVICE_NAME ||
      "telemetryflow-platform";
    this.batchSize = opts.batchSize || 50;
    this.flushIntervalMs = opts.flushInterval || 5000;

    this.client = createClient({
      url:
        opts.host ||
        `http://${process.env.CLICKHOUSE_HOST || "localhost"}:${process.env.CLICKHOUSE_PORT || "8123"}`,
      database: this.database,
      username:
        opts.username || process.env.CLICKHOUSE_USER || "default",
      password:
        opts.password || process.env.CLICKHOUSE_PASSWORD || "",
    });

    this.startFlushTimer();
  }

  /**
   * Winston log handler — maps camelCase OTEL fields to snake_case ClickHouse columns
   */
  log(info: any, callback: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    const row: LogRow = {
      timestamp: now,
      observed_timestamp: now,
      // Map camelCase from otelContextFormat → snake_case for ClickHouse
      trace_id: info.traceId || info.trace_id || "",
      span_id: info.spanId || info.span_id || "",
      trace_flags: info.traceFlags || info.trace_flags || 0,
      severity_text: (info.level || "info").toUpperCase(),
      severity_number: this.getSeverityNumber(info.level),
      service_name: this.serviceName,
      organization_id: info.organization_id || info.organizationId || "",
      workspace_id: info.workspace_id || info.workspaceId || "",
      tenant_id: info.tenant_id || info.tenantId || "",
      body: typeof info.message === "string" ? info.message : JSON.stringify(info.message),
      resource_attributes: {},
      scope_name: info.context || "",
      scope_version: "",
      log_attributes: this.extractAttributes(info),
    };

    this.logBuffer.push(row);

    if (this.logBuffer.length >= this.batchSize) {
      this.flush();
    }

    callback();
  }

  private extractAttributes(info: any): Record<string, string> {
    const attrs: Record<string, string> = {};
    if (info.context) attrs.context = String(info.context);
    if (info.stack) attrs.stack = String(info.stack);
    if (info.metadata && typeof info.metadata === "object") {
      for (const [k, v] of Object.entries(info.metadata)) {
        if (v !== undefined && v !== null) {
          attrs[k] = String(v);
        }
      }
    }
    return attrs;
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const batch = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.client.insert({
        table: `${this.database}.logs`,
        values: batch,
        format: "JSONEachRow",
      });
    } catch (error: any) {
      console.error(
        `[ClickHouseTransport] Failed to flush ${batch.length} logs: ${error.message}`,
      );
      // Re-queue on failure (capped to prevent memory leak)
      if (this.logBuffer.length < this.batchSize * 10) {
        this.logBuffer.unshift(...batch);
      }
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private getSeverityNumber(level: string): number {
    const map: Record<string, number> = {
      error: 17,
      warn: 13,
      info: 9,
      http: 9,
      verbose: 5,
      debug: 5,
      silly: 1,
    };
    return map[level] || 9;
  }

  close(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
    this.client.close().catch(() => {});
  }
}
