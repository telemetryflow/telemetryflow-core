import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { Request } from "express";
import { LoggerService } from "./logger.service";
import { AuditService } from "../modules/audit/audit.service";

/**
 * HTTP Logging Interceptor
 * Logs HTTP request errors only — success logging is handled by RequestContextMiddleware
 * to avoid duplicate log entries per request. Health/metrics paths are skipped entirely.
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly context = HttpLoggingInterceptor.name;
  private readonly skipPaths: Set<string>;

  constructor(
    private readonly logger: LoggerService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {
    const raw = this.configService.get<string>(
      "LOG_SKIP_PATHS",
      "/health,/metrics,/healthz,/ready",
    );
    this.skipPaths = new Set(
      raw.split(",").map((p) => p.trim()).filter(Boolean),
    );
  }

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const ctx = executionContext.switchToHttp();
    const request = ctx.getRequest<Request>();

    if (this.skipPaths.has(request.path)) {
      return next.handle();
    }

    const startTime = Date.now();
    const { method, url } = request;
    const requestId = (request as any).id || "unknown";

    return next.handle().pipe(
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          `✗ Request failed: ${method} ${url} - ${statusCode} (${duration}ms) - ${error.message} [${requestId}]`,
          error.stack,
          this.context,
        );

        return throwError(() => error);
      }),
    );
  }
}
