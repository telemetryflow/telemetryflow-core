import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request } from "express";
import {
  AuditService,
  AuditEventType,
  AuditEventResult,
} from "./audit.service";

/**
 * Route prefix → AuditEventType mapping.
 * Longest match wins. Evaluated after stripping the global /api/v2/ prefix.
 */
const ROUTE_EVENT_MAP: Array<{
  prefix: string;
  eventType: AuditEventType;
}> = [
  // AUTH events — login, logout, register, MFA, OAuth, SSO, password
  { prefix: "auth/login", eventType: AuditEventType.AUTH },
  { prefix: "auth/logout", eventType: AuditEventType.AUTH },
  { prefix: "auth/register", eventType: AuditEventType.AUTH },
  { prefix: "auth/refresh", eventType: AuditEventType.AUTH },
  { prefix: "auth/mfa", eventType: AuditEventType.AUTH },
  { prefix: "auth/oauth", eventType: AuditEventType.AUTH },
  { prefix: "auth/sso", eventType: AuditEventType.AUTH },
  { prefix: "auth/password", eventType: AuditEventType.AUTH },
  { prefix: "auth/email", eventType: AuditEventType.AUTH },
  { prefix: "auth/me", eventType: AuditEventType.AUTH },
  { prefix: "auth/change-password", eventType: AuditEventType.AUTH },

  // AUTHZ events — IAM, roles, permissions, API keys
  { prefix: "iam", eventType: AuditEventType.AUTHZ },
  { prefix: "api-keys", eventType: AuditEventType.AUTHZ },
  { prefix: "sso", eventType: AuditEventType.AUTHZ },
  { prefix: "tenancy", eventType: AuditEventType.AUTHZ },

  // SYSTEM events — configuration, retention, subscription, alerts, notifications
  { prefix: "retention", eventType: AuditEventType.SYSTEM },
  { prefix: "subscription", eventType: AuditEventType.SYSTEM },
  { prefix: "alerting", eventType: AuditEventType.SYSTEM },
  { prefix: "notification", eventType: AuditEventType.SYSTEM },
  { prefix: "dashboard", eventType: AuditEventType.SYSTEM },

  // DATA events (default) — telemetry, monitoring, reporting, audit writes
  { prefix: "metrics", eventType: AuditEventType.DATA },
  { prefix: "logs", eventType: AuditEventType.DATA },
  { prefix: "traces", eventType: AuditEventType.DATA },
  { prefix: "exemplars", eventType: AuditEventType.DATA },
  { prefix: "correlations", eventType: AuditEventType.DATA },
  { prefix: "uptime", eventType: AuditEventType.DATA },
  { prefix: "status-page", eventType: AuditEventType.DATA },
  { prefix: "service-map", eventType: AuditEventType.DATA },
  { prefix: "network-map", eventType: AuditEventType.DATA },
  { prefix: "kubernetes", eventType: AuditEventType.DATA },
  { prefix: "vm", eventType: AuditEventType.DATA },
  { prefix: "agent", eventType: AuditEventType.DATA },
  { prefix: "reports", eventType: AuditEventType.DATA },
  { prefix: "audit", eventType: AuditEventType.DATA },
  { prefix: "query", eventType: AuditEventType.DATA },
  { prefix: "llm", eventType: AuditEventType.DATA },
];

/** HTTP method → human-readable action verb */
const METHOD_ACTION_MAP: Record<string, string> = {
  GET: "view",
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
  OPTIONS: "preflight",
  HEAD: "check",
};

/** Routes to skip entirely (health checks, OTLP ingest). */
const SKIP_PREFIXES = [
  "health",
  "v1/logs",
  "v1/metrics",
  "v1/traces",
];

/**
 * GET-only routes to skip — reading audit logs/stats must NOT create new
 * audit entries (anti-self-logging). These are safe read operations.
 */
const SKIP_GET_PREFIXES = [
  "audit/logs",
  "audit/count",
  "audit/statistics",
  "audit/export",
  "telemetry/status",
];

/**
 * Telemetry ingestion route prefixes written by TFO-Agent / TFO-Collector.
 * When no authenticated user is present these are SYSTEM-level writes,
 * not user DATA operations — tag them SYSTEM so they can be filtered in the UI.
 */
const ANONYMOUS_SYSTEM_PREFIXES = [
  "metrics",
  "logs",
  "traces",
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const user = (request as any).user;

    // Strip query string for route matching
    const pathOnly = url.split("?")[0];

    // Normalize: remove /api/v2/ prefix for matching
    const normalized = pathOnly
      .replace(/^\/api\/v2\//, "")
      .replace(/^\//, "");

    // Skip non-auditable routes
    if (this.shouldSkip(normalized, method)) {
      return next.handle();
    }

    const userId = user?.id || user?.userId || "";
    const userEmail = user?.email || "";

    // Resolve event type — anonymous writes to telemetry ingestion paths are SYSTEM
    let eventType = this.resolveEventType(normalized);
    if (
      !userId &&
      method === "POST" &&
      ANONYMOUS_SYSTEM_PREFIXES.some((p) => normalized.startsWith(p))
    ) {
      eventType = AuditEventType.SYSTEM;
    }

    const actionVerb = METHOD_ACTION_MAP[method] || method.toLowerCase();
    const resource = this.extractResource(normalized);
    const resourceId = this.extractResourceId(normalized);
    const action = `${actionVerb} ${resource}`;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.auditService.log({
          eventType,
          action,
          result: AuditEventResult.SUCCESS,
          userId,
          userEmail,
          resource,
          ipAddress: ip || "",
          userAgent: headers["user-agent"] || "",
          tenantId: user?.tenantId || "",
          organizationId: user?.organizationId || "",
          metadata: {
            requestMethod: method,
            requestPath: pathOnly,
            resourceId,
            duration,
            statusCode: 200,
            sessionId: user?.sessionId || "",
          },
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const result =
          error.status === 403
            ? AuditEventResult.DENIED
            : AuditEventResult.FAILURE;

        this.auditService.log({
          eventType,
          action,
          result,
          userId,
          userEmail,
          resource,
          ipAddress: ip || "",
          userAgent: headers["user-agent"] || "",
          errorMessage: error.message || "Unknown error",
          tenantId: user?.tenantId || "",
          organizationId: user?.organizationId || "",
          metadata: {
            requestMethod: method,
            requestPath: pathOnly,
            resourceId,
            duration,
            statusCode: error.status || 500,
            sessionId: user?.sessionId || "",
          },
        });
        throw error;
      }),
    );
  }

  /**
   * Determine whether this request should be skipped from audit logging.
   * - OPTIONS preflight and root path are always skipped
   * - SKIP_PREFIXES: health checks, OTLP ingest
   * - SKIP_GET_PREFIXES: audit read endpoints (anti-self-logging)
   */
  private shouldSkip(normalized: string, method: string): boolean {
    if (method === "OPTIONS") return true;
    if (normalized === "" || normalized === "/") return true;
    if (SKIP_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
      return true;
    }
    if (
      method === "GET" &&
      SKIP_GET_PREFIXES.some((prefix) => normalized.startsWith(prefix))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Resolve the AuditEventType based on the route prefix.
   * Longest-prefix match wins; defaults to DATA.
   */
  private resolveEventType(normalized: string): AuditEventType {
    let best: AuditEventType = AuditEventType.DATA;
    let bestLen = 0;

    for (const entry of ROUTE_EVENT_MAP) {
      if (
        normalized.startsWith(entry.prefix) &&
        entry.prefix.length > bestLen
      ) {
        best = entry.eventType;
        bestLen = entry.prefix.length;
      }
    }
    return best;
  }

  /**
   * Extract the resource name from the normalized path.
   * e.g. "iam/users/123" → "iam/users", "auth/login" → "auth"
   */
  private extractResource(normalized: string): string {
    const segments = normalized.split("/").filter(Boolean);
    return segments.slice(0, 2).join("/") || normalized;
  }

  /**
   * Extract a resource ID if the path contains a UUID or numeric ID.
   */
  private extractResourceId(normalized: string): string {
    const segments = normalized.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (
      last &&
      (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last) ||
        /^\d+$/.test(last))
    ) {
      return last;
    }
    return "";
  }
}
