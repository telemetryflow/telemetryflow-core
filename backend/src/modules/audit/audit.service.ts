import { Injectable, Optional } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { randomUUID } from "crypto";
import { LoggerService } from "../../logger/logger.service";
import { ClickHouseService } from "@/shared/clickhouse/clickhouse.service";
import { resolveRollupTable } from "@/shared/clickhouse/resolve-rollup-table";
import { TELEMETRYFLOW_HARD_LIMIT } from "@/shared/constants/telemetry-limits";

export enum AuditEventType {
  AUTH = "AUTH",
  AUTHZ = "AUTHZ",
  DATA = "DATA",
  SYSTEM = "SYSTEM",
}

export enum AuditEventResult {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  DENIED = "DENIED",
}

export interface AuditQueryFilterOptions {
  userId?: string;
  userEmail?: string;
  eventType?: string;
  result?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateAuditLogOptions {
  userId?: string;
  userEmail?: string;
  eventType: AuditEventType;
  action: string;
  resource?: string;
  result: AuditEventResult;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  tenantId?: string;
  organizationId?: string;
}

/** Shape of a stored audit log row (matches ClickHouse schema). */
interface AuditLogRow {
  id: string;
  timestamp: string;
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  event_type: string;
  action: string;
  resource: string;
  resource_id: string;
  result: string;
  error_message: string;
  error_code: string;
  ip_address: string;
  user_agent: string;
  request_method: string;
  request_path: string;
  metadata: string;
  tenant_id: string;
  workspace_id: string;
  organization_id: string;
  region_id: string;
  session_id: string;
  correlation_id: string;
  duration_ms: number;
}

/** Maximum events kept in-memory when ClickHouse is unavailable. */
const MEMORY_BUFFER_MAX = 5000;

@Injectable()
export class AuditService {
  private readonly context = AuditService.name;

  /** In-memory ring buffer — used when ClickHouse is unavailable. */
  private memoryBuffer: AuditLogRow[] = [];
  private clickhouseAvailable = true;

  constructor(
    private readonly logger: LoggerService,
    private readonly clickhouseService: ClickHouseService,
    @Optional()
    @InjectDataSource()
    private readonly dataSource?: DataSource,
  ) {}

  /** Qualify a table name with the configured database prefix */
  private q(table: string): string {
    return this.clickhouseService.qualifyTable(table);
  }

  // ─── WRITE ──────────────────────────────────────────────────────────

  async log(options: CreateAuditLogOptions): Promise<void> {
    const logLevel =
      options.result === AuditEventResult.SUCCESS ? "log" : "warn";
    const resource = options.resource ? ` ${options.resource}` : "";
    const message = `[${options.eventType}] ${options.action}${resource} - ${options.result}`;

    if (logLevel === "log") {
      this.logger.log(`✓ ${message}`, this.context);
    } else {
      this.logger.warn(`⚠ ${message}`, this.context);
    }

    const meta = options.metadata || {};
    const row = this.buildRow(options, meta);

    try {
      await this.clickhouseService.getClient().insert({
        table: "audit_logs",
        values: [row],
        format: "JSONEachRow",
      });
      this.clickhouseAvailable = true;

      // Dual-write: forward audit event to unified logs table (fire-and-forget, non-fatal)
      this.clickhouseService
        .insertAuditLogsToMainLogs({
          timestamp: row.timestamp,
          event_type: row.event_type,
          action: row.action,
          resource: row.resource,
          resource_id: row.resource_id,
          result: row.result,
          user_id: row.user_id,
          user_email: row.user_email,
          ip_address: row.ip_address,
          organization_id: row.organization_id,
          workspace_id: row.workspace_id,
          tenant_id: row.tenant_id,
          duration_ms: row.duration_ms,
          error_message: row.error_message,
        })
        .catch(() => {
          // Non-fatal — primary audit_logs write already succeeded
        });
    } catch {
      // ClickHouse unavailable — store in memory so the audit page still works
      if (this.clickhouseAvailable) {
        this.logger.warn(
          "ClickHouse unavailable — audit events stored in memory buffer",
          this.context,
        );
        this.clickhouseAvailable = false;
      }
      this.pushToBuffer(row);
    }
  }

  async logAuth(
    action: string,
    result: AuditEventResult,
    options: Partial<CreateAuditLogOptions> = {},
  ): Promise<void> {
    return this.log({
      eventType: AuditEventType.AUTH,
      action,
      result,
      ...options,
    });
  }

  async logAuthz(
    action: string,
    result: AuditEventResult,
    options: Partial<CreateAuditLogOptions> = {},
  ): Promise<void> {
    return this.log({
      eventType: AuditEventType.AUTHZ,
      action,
      result,
      ...options,
    });
  }

  async logData(
    action: string,
    result: AuditEventResult,
    options: Partial<CreateAuditLogOptions> = {},
  ): Promise<void> {
    return this.log({
      eventType: AuditEventType.DATA,
      action,
      result,
      ...options,
    });
  }

  async logSystem(
    action: string,
    result: AuditEventResult,
    options: Partial<CreateAuditLogOptions> = {},
  ): Promise<void> {
    return this.log({
      eventType: AuditEventType.SYSTEM,
      action,
      result,
      ...options,
    });
  }

  // ─── READ ───────────────────────────────────────────────────────────

  async query(
    options: AuditQueryFilterOptions & { limit?: number; offset?: number },
  ): Promise<any[]> {
    try {
      const { limit = 50, offset = 0 } = options;
      const { where, queryParams } = this.buildFilterClause(options);
      queryParams.qLimit = limit;
      queryParams.qOffset = offset;

      const auditTable = this.q("audit_logs");
      const query = `
        SELECT
          id, timestamp, user_id, user_email, user_first_name, user_last_name,
          event_type, action, resource, resource_id, result,
          error_message, error_code, ip_address, user_agent,
          request_method, request_path, metadata,
          tenant_id, workspace_id, organization_id, region_id,
          session_id, correlation_id, duration_ms
        FROM ${auditTable}
        WHERE ${where}
        ORDER BY timestamp DESC
        LIMIT {qLimit:UInt32} OFFSET {qOffset:UInt32}`;

      const result = await this.clickhouseService
        .getClient()
        .query({ query, query_params: queryParams, format: "JSONEachRow" });
      const rows = await result.json() as any[];
      return this.enrichWithOrganizationInfo(rows);
    } catch {
      // Fallback to in-memory buffer
      return this.queryMemory(options);
    }
  }

  async countFiltered(
    options: AuditQueryFilterOptions = {},
  ): Promise<{ count: number }> {
    const hasFilters = Object.values(options).some(
      (v) => v !== undefined && v !== "",
    );

    if (!hasFilters) {
      return this.count();
    }

    try {
      const { where, queryParams } = this.buildFilterClause(options);
      const query = `SELECT COUNT(*) as count FROM ${this.q("audit_logs")} WHERE ${where}`;

      const result = await this.clickhouseService
        .getClient()
        .query({ query, query_params: queryParams, format: "JSONEachRow" });
      const rows: any = await result.json();
      return { count: Number(rows[0]?.count) || 0 };
    } catch {
      // Fallback to in-memory
      return { count: this.filterMemory(options).length };
    }
  }

  async getById(id: string): Promise<any> {
    try {
      const query = `
        SELECT
          id, timestamp, user_id, user_email, user_first_name, user_last_name,
          event_type, action, resource, resource_id, result,
          error_message, error_code, ip_address, user_agent,
          request_method, request_path, metadata,
          tenant_id, workspace_id, organization_id, region_id,
          session_id, correlation_id, duration_ms
        FROM ${this.q("audit_logs")}
        WHERE id = {id:String}
        LIMIT 1`;
      const result = await this.clickhouseService.getClient().query({
        query,
        query_params: { id },
        format: "JSONEachRow",
      });
      const rows = await result.json() as any[];
      if (!rows[0]) return null;
      const enriched = await this.enrichWithOrganizationInfo([rows[0]]);
      return enriched[0];
    } catch {
      return this.memoryBuffer.find((r) => r.id === id) || null;
    }
  }

  // ─── GRAPH DATA ─────────────────────────────────────────────────────

  /**
   * Returns chart series for IAM overview graphs, scoped by organization.
   * Types: "registrations" | "active_users" | "login_activity" | "registrations_by_region"
   */
  async getGraphData(
    type: string,
    from: number,
    to: number,
    organizationId?: string,
  ): Promise<{ series: { name: string; data: [number, number][] }[] }> {
    const table = this.q("audit_logs");
    // Include entries with empty org_id (events logged without org context, e.g. auth interceptor)
    const orgFilter = organizationId
      ? "AND (organization_id = {orgId:String} OR organization_id = '')"
      : "";
    // Use unix milliseconds for reliable DateTime64 comparison
    const qp: Record<string, any> = {
      fromMs: from,
      toMs: to,
    };
    if (organizationId) qp.orgId = organizationId;

    // Helper: convert ms epoch column to timestamp comparison
    const tsFilter = `AND toUnixTimestamp64Milli(timestamp) >= {fromMs:Int64} AND toUnixTimestamp64Milli(timestamp) <= {toMs:Int64}`;

    try {
      switch (type) {
        case "registrations": {
          // Query PostgreSQL users table by createdAt — covers all users including seeded ones
          if (this.dataSource) {
            const params: any[] = [new Date(from), new Date(to)];
            const orgWhere = organizationId
              ? `AND organization_id = $3`
              : "";
            if (organizationId) params.push(organizationId);
            const pgRows = await this.dataSource.query<
              { t: string; v: string }[]
            >(
              `SELECT date_trunc('hour', "createdAt") AS t, count(*)::int AS v
               FROM users
               WHERE "deletedAt" IS NULL
                 AND "createdAt" >= $1 AND "createdAt" <= $2
                 ${orgWhere}
               GROUP BY t ORDER BY t`,
              params,
            );
            const sparse = pgRows.map(
              (r) => [new Date(r.t).getTime(), Number(r.v)] as [number, number],
            );
            return { series: [{ name: "Registrations", data: this.fillBuckets(sparse, from, to, 3_600_000) }] };
          }
          // ClickHouse fallback (for environments without PG)
          const q = `
            SELECT toStartOfHour(timestamp) AS t, count() AS v
            FROM ${table}
            WHERE event_type = 'AUTH'
              AND action IN ('register', 'create')
              AND result = 'SUCCESS'
              ${tsFilter}
              ${orgFilter}
            GROUP BY t ORDER BY t`;
          const rows = await this.rawQuery<{ t: string; v: string }>(q, qp);
          const sparse = rows.map(
            (r) => [new Date(r.t).getTime(), Number(r.v)] as [number, number],
          );
          return { series: [{ name: "Registrations", data: this.fillBuckets(sparse, from, to, 3_600_000) }] };
        }

        case "active_users": {
          // Count distinct users with any successful AUTH event (login, token_refresh, etc.)
          const q = `
            SELECT toStartOfDay(timestamp) AS t, uniq(user_id) AS v
            FROM ${table}
            WHERE event_type = 'AUTH' AND result = 'SUCCESS' AND user_id != ''
              ${tsFilter}
              ${orgFilter}
            GROUP BY t ORDER BY t`;
          const rows = await this.rawQuery<{ t: string; v: string }>(q, qp);
          const sparse = rows.map(
            (r) => [new Date(r.t).getTime(), Number(r.v)] as [number, number],
          );
          return {
            series: [{ name: "Active Users", data: this.fillBuckets(sparse, from, to, 86_400_000) }],
          };
        }

        case "login_activity": {
          // Split all AUTH events by result — covers login, logout, refresh, MFA, etc.
          const qSuccess = `
            SELECT toStartOfHour(timestamp) AS t, count() AS v
            FROM ${table}
            WHERE event_type = 'AUTH' AND result = 'SUCCESS'
              ${tsFilter}
              ${orgFilter}
            GROUP BY t ORDER BY t`;
          const qFailed = `
            SELECT toStartOfHour(timestamp) AS t, count() AS v
            FROM ${table}
            WHERE event_type = 'AUTH' AND result IN ('FAILURE', 'DENIED')
              ${tsFilter}
              ${orgFilter}
            GROUP BY t ORDER BY t`;
          const [rowsOk, rowsFail] = await Promise.all([
            this.rawQuery<{ t: string; v: string }>(qSuccess, qp),
            this.rawQuery<{ t: string; v: string }>(qFailed, qp),
          ]);
          const sparseOk = rowsOk.map(
            (r) => [new Date(r.t).getTime(), Number(r.v)] as [number, number],
          );
          const sparseFail = rowsFail.map(
            (r) => [new Date(r.t).getTime(), Number(r.v)] as [number, number],
          );
          return {
            series: [
              { name: "Successful Logins", data: this.fillBuckets(sparseOk, from, to, 3_600_000) },
              { name: "Failed Logins", data: this.fillBuckets(sparseFail, from, to, 3_600_000) },
            ],
          };
        }

        case "registrations_by_region": {
          // Query PostgreSQL users grouped by organization name (no region_id on users entity)
          if (this.dataSource) {
            const params: any[] = [new Date(from), new Date(to)];
            const orgWhere = organizationId
              ? `AND u.organization_id = $3`
              : "";
            if (organizationId) params.push(organizationId);
            const pgRows = await this.dataSource.query<
              { region: string; v: string }[]
            >(
              `SELECT COALESCE(r.name, o.name, u.organization_id::text, 'Unknown') AS region,
                      count(*)::int AS v
               FROM users u
               LEFT JOIN organizations o ON o.organization_id = u.organization_id
               LEFT JOIN regions r ON r.id = o.region_id
               WHERE u."deletedAt" IS NULL
                 AND u."createdAt" >= $1 AND u."createdAt" <= $2
                 ${orgWhere}
               GROUP BY region ORDER BY v DESC LIMIT 10`,
              params,
            );
            const now = Date.now();
            return {
              series: pgRows.map((r) => ({
                name: r.region,
                data: [[now, Number(r.v)]] as [number, number][],
              })),
            };
          }
          // ClickHouse fallback — uses region_id from audit_logs
          const q = `
            SELECT region_id AS region, count() AS v
            FROM ${table}
            WHERE event_type = 'AUTH'
              AND action IN ('register', 'create')
              AND result = 'SUCCESS'
              AND region_id != ''
              ${tsFilter}
              ${orgFilter}
            GROUP BY region ORDER BY v DESC LIMIT 10`;
          const rows = await this.rawQuery<{ region: string; v: string }>(
            q,
            qp,
          );
          const now = Date.now();
          return {
            series: rows.map((r) => ({
              name: r.region,
              data: [[now, Number(r.v)]] as [number, number][],
            })),
          };
        }

        case "audit_events_by_type": {
          const q = `
            SELECT event_type AS name, count() AS v
            FROM ${table}
            WHERE 1=1 ${tsFilter} ${orgFilter}
            GROUP BY event_type ORDER BY v DESC`;
          const rows = await this.rawQuery<{ name: string; v: string }>(q, qp);
          const now = Date.now();
          return {
            series: rows.map((r) => ({
              name: r.name,
              data: [[now, Number(r.v)]] as [number, number][],
            })),
          };
        }

        case "audit_result_distribution": {
          const q = `
            SELECT result AS name, count() AS v
            FROM ${table}
            WHERE 1=1 ${tsFilter} ${orgFilter}
            GROUP BY result ORDER BY v DESC`;
          const rows = await this.rawQuery<{ name: string; v: string }>(q, qp);
          const now = Date.now();
          return {
            series: rows.map((r) => ({
              name: r.name,
              data: [[now, Number(r.v)]] as [number, number][],
            })),
          };
        }

        case "audit_duration_trend": {
          const q = `
            SELECT toStartOfHour(timestamp) AS t, avg(duration_ms) AS v
            FROM ${table}
            WHERE duration_ms > 0 ${tsFilter} ${orgFilter}
            GROUP BY t ORDER BY t`;
          const rows = await this.rawQuery<{ t: string; v: string }>(q, qp);
          return {
            series: [
              {
                name: "Avg Duration (ms)",
                data: rows.map(
                  (r) =>
                    [new Date(r.t).getTime(), Math.round(Number(r.v))] as [number, number],
                ),
              },
            ],
          };
        }

        case "total_events": {
          const q = `
            SELECT toStartOfHour(timestamp) AS t, count() AS v
            FROM ${table}
            WHERE 1=1 ${tsFilter} ${orgFilter}
            GROUP BY t ORDER BY t`;
          const rows = await this.rawQuery<{ t: string; v: string }>(q, qp);
          const sparse = rows.map(
            (r) => [new Date(r.t).getTime(), Number(r.v)] as [number, number],
          );
          return {
            series: [{ name: "Events", data: this.fillBuckets(sparse, from, to, 3_600_000) }],
          };
        }

        default:
          return { series: [] };
      }
    } catch (err) {
      this.logger.warn(
        `[AuditService] getGraphData failed for type=${type}: ${err instanceof Error ? err.message : err}`,
        this.context,
      );
      return { series: [] };
    }
  }

  /**
   * Fill every bucket boundary in [from, to] with 0 for time buckets missing from sparse results.
   * Used for count/event-based time series so charts show 0 instead of gaps.
   * NOT used for gauge metrics (avg CPU/memory) where 0 would be misleading.
   */
  private fillBuckets(
    sparse: [number, number][],
    from: number,
    to: number,
    stepMs: number,
  ): [number, number][] {
    const dataMap = new Map(sparse);
    const result: [number, number][] = [];
    const start = Math.floor(from / stepMs) * stepMs;
    for (let t = start; t <= to; t += stepMs) {
      result.push([t, dataMap.get(t) ?? 0]);
    }
    return result;
  }

  private async rawQuery<T>(
    query: string,
    queryParams: Record<string, any>,
  ): Promise<T[]> {
    const result = await this.clickhouseService
      .getClient()
      .query({ query, query_params: queryParams, format: "JSONEachRow" });
    return result.json<T>();
  }

  async count(): Promise<{ count: number }> {
    try {
      const rollup = resolveRollupTable("audit_logs", 21600);

      const query = rollup.isMaterializedView
        ? `SELECT sum(count) as count FROM ${this.q(rollup.table)}`
        : `SELECT COUNT(*) as count FROM ${this.q("audit_logs")}`;

      const result = await this.clickhouseService
        .getClient()
        .query({ query, format: "JSONEachRow" });
      const rows: any = await result.json();
      return { count: rows[0]?.count || 0 };
    } catch {
      return { count: this.memoryBuffer.length };
    }
  }

  async getStatistics(options?: AuditQueryFilterOptions): Promise<any> {
    const opts: AuditQueryFilterOptions = options ?? {};
    try {
      const hasFilters = Object.values(opts).some(
        (v) => v !== undefined && v !== "",
      );

      if (hasFilters) {
        // With active filters — query raw table for precise results
        const { where, queryParams } = this.buildFilterClause(opts);
        const query = `
          SELECT
            event_type,
            result,
            COUNT(*) as count
          FROM ${this.q("audit_logs")}
          WHERE ${where}
          GROUP BY event_type, result
        `;
        const result = await this.clickhouseService
          .getClient()
          .query({ query, query_params: queryParams, format: "JSONEachRow" });
        return await result.json();
      }

      // No filters — try rollup MV for efficiency, fall back to raw table if empty
      const rollup = resolveRollupTable("audit_logs", 21600);
      if (rollup.isMaterializedView) {
        const mvResult = await this.clickhouseService
          .getClient()
          .query({
            query: `
              SELECT event_type, result, sum(count) as count
              FROM ${this.q(rollup.table)}
              GROUP BY event_type, result
            `,
            format: "JSONEachRow",
          });
        const mvRows: any[] = await mvResult.json();
        if (mvRows.length > 0) return mvRows;
        // MV is empty (e.g. data pre-dates view creation), fall through to raw table
      }

      // Raw table fallback — always correct, slightly heavier
      const rawResult = await this.clickhouseService
        .getClient()
        .query({
          query: `
            SELECT event_type, result, COUNT(*) as count
            FROM ${this.q("audit_logs")}
            GROUP BY event_type, result
          `,
          format: "JSONEachRow",
        });
      return await rawResult.json();
    } catch {
      return this.statisticsFromMemory();
    }
  }

  async export(_format: string): Promise<any[]> {
    return this.query({ limit: TELEMETRYFLOW_HARD_LIMIT, offset: 0 });
  }

  // ─── PRIVATE: ROW BUILDER ──────────────────────────────────────────

  private buildRow(
    options: CreateAuditLogOptions,
    meta: Record<string, any>,
  ): AuditLogRow {
    const now = new Date();
    const p = (n: number, len = 2) => String(n).padStart(len, "0");
    const ts =
      `${now.getUTCFullYear()}-${p(now.getUTCMonth() + 1)}-${p(now.getUTCDate())} ` +
      `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())}.` +
      `${p(now.getUTCMilliseconds(), 3)}000000`;

    return {
      id: randomUUID(),
      timestamp: ts,
      user_id: options.userId || "",
      user_email: options.userEmail || "",
      user_first_name: "",
      user_last_name: "",
      event_type: options.eventType,
      action: options.action,
      resource: options.resource || "",
      resource_id: meta.resourceId || "",
      result: options.result,
      error_message: options.errorMessage || "",
      error_code: meta.statusCode ? String(meta.statusCode) : "",
      ip_address: options.ipAddress || "",
      user_agent: options.userAgent || "",
      request_method: meta.requestMethod || "",
      request_path: meta.requestPath || "",
      metadata: JSON.stringify(meta),
      tenant_id: options.tenantId || "",
      workspace_id: "",
      organization_id: options.organizationId || "",
      region_id: "",
      session_id: meta.sessionId || "",
      correlation_id: meta.correlationId || "",
      duration_ms: meta.duration || 0,
    };
  }

  // ─── PRIVATE: ENRICHMENT ────────────────────────────────────────────

  private async enrichWithOrganizationInfo(rows: any[]): Promise<any[]> {
    if (!this.dataSource || rows.length === 0) return rows;
    try {
      const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
      if (userIds.length === 0) return rows;

      const userOrgs: { user_id: string; organization_id: string; organization_name: string }[] =
        await this.dataSource.query(
          `SELECT u.id AS user_id, u.organization_id::text AS organization_id, o.name AS organization_name
           FROM users u
           LEFT JOIN organizations o ON o.organization_id = u.organization_id
           WHERE u.id = ANY($1)`,
          [userIds],
        );

      const orgMap = new Map<string, { organization_id: string; organization_name: string }>();
      for (const row of userOrgs) {
        orgMap.set(row.user_id, {
          organization_id: row.organization_id || "",
          organization_name: row.organization_name || "",
        });
      }

      return rows.map((row) => {
        const info = orgMap.get(row.user_id);
        return {
          ...row,
          organization_id: row.organization_id || info?.organization_id || "",
          organization_name: info?.organization_name || "",
        };
      });
    } catch {
      return rows.map((r) => ({ ...r, organization_name: "" }));
    }
  }

  // ─── PRIVATE: MEMORY BUFFER ────────────────────────────────────────

  private pushToBuffer(row: AuditLogRow): void {
    this.memoryBuffer.push(row);
    if (this.memoryBuffer.length > MEMORY_BUFFER_MAX) {
      // Drop oldest entries
      this.memoryBuffer = this.memoryBuffer.slice(-MEMORY_BUFFER_MAX);
    }
  }

  private filterMemory(options: AuditQueryFilterOptions): AuditLogRow[] {
    return this.memoryBuffer.filter((row) => {
      if (options.userId && row.user_id !== options.userId) return false;
      if (
        options.userEmail &&
        !row.user_email.toLowerCase().includes(options.userEmail.toLowerCase())
      )
        return false;
      if (options.eventType && row.event_type !== options.eventType)
        return false;
      if (options.result && row.result !== options.result) return false;
      if (options.action && row.action !== options.action) return false;
      if (options.resource && row.resource !== options.resource) return false;
      if (options.startDate && row.timestamp < options.startDate) return false;
      if (options.endDate && row.timestamp > options.endDate) return false;
      if (options.search) {
        const s = options.search.toLowerCase();
        if (
          !row.action.toLowerCase().includes(s) &&
          !row.resource.toLowerCase().includes(s) &&
          !row.user_email.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }

  private queryMemory(
    options: AuditQueryFilterOptions & { limit?: number; offset?: number },
  ): AuditLogRow[] {
    const { limit = 50, offset = 0 } = options;
    const filtered = this.filterMemory(options);
    // Sort newest first (same as ClickHouse ORDER BY timestamp DESC)
    filtered.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    return filtered.slice(offset, offset + limit);
  }

  private statisticsFromMemory(): Array<{
    event_type: string;
    result: string;
    count: number;
  }> {
    const map = new Map<string, number>();
    for (const row of this.memoryBuffer) {
      const key = `${row.event_type}|${row.result}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([key, count]) => {
      const [event_type, result] = key.split("|");
      return { event_type, result, count };
    });
  }

  // ─── PRIVATE: FILTER CLAUSE (ClickHouse) ───────────────────────────

  private buildFilterClause(options: AuditQueryFilterOptions): {
    where: string;
    queryParams: Record<string, string | number>;
  } {
    const conditions: string[] = [];
    const queryParams: Record<string, string | number> = {};

    if (options.userId) {
      conditions.push("user_id = {userId:String}");
      queryParams.userId = options.userId;
    }
    if (options.userEmail) {
      conditions.push("user_email LIKE {userEmail:String}");
      queryParams.userEmail = `%${options.userEmail}%`;
    }
    if (options.eventType) {
      conditions.push("event_type = {eventType:String}");
      queryParams.eventType = options.eventType;
    }
    if (options.result) {
      conditions.push("result = {qResult:String}");
      queryParams.qResult = options.result;
    }
    if (options.action) {
      conditions.push("action = {action:String}");
      queryParams.action = options.action;
    }
    if (options.resource) {
      conditions.push("resource = {resource:String}");
      queryParams.resource = options.resource;
    }
    if (options.startDate) {
      conditions.push(
        "timestamp >= parseDateTimeBestEffort({startDate:String})",
      );
      queryParams.startDate = options.startDate;
    }
    if (options.endDate) {
      conditions.push(
        "timestamp <= parseDateTimeBestEffort({endDate:String})",
      );
      queryParams.endDate = options.endDate;
    }
    if (options.search) {
      conditions.push(
        "(action LIKE {search:String} OR resource LIKE {search:String} OR user_email LIKE {search:String})",
      );
      queryParams.search = `%${options.search}%`;
    }

    return {
      where: conditions.length > 0 ? conditions.join(" AND ") : "1=1",
      queryParams,
    };
  }
}
