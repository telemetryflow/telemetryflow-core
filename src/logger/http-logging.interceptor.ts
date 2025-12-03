import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from './logger.service';
import { AuditService, AuditEventType, AuditEventResult } from '../modules/audit/audit.service';

/**
 * HTTP Logging Interceptor
 * Logs HTTP requests and records to audit
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly context = HttpLoggingInterceptor.name;

  constructor(
    private readonly logger: LoggerService,
    private readonly auditService: AuditService,
  ) {}

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = executionContext.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const startTime = Date.now();
    const { method, url, ip } = request;
    const requestId = (request as any).id || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const user = (request as any).user;

    this.logger.log(
      `Incoming request: ${method} ${url} from ${ip} [${requestId}]`,
      this.context,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const { statusCode } = response;

        this.logger.log(
          `✓ Request completed: ${method} ${url} - ${statusCode} (${duration}ms) [${requestId}]`,
          this.context,
        );

        // Log to audit
        this.auditService.log({
          userId: user?.id,
          userEmail: user?.email,
          eventType: AuditEventType.DATA,
          action: method,
          resource: url,
          result: statusCode < 400 ? AuditEventResult.SUCCESS : AuditEventResult.FAILURE,
          ipAddress: ip,
          userAgent,
          metadata: { statusCode, duration, requestId, method, url },
          tenantId: user?.tenantId,
          organizationId: user?.organizationId,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          `✗ Request failed: ${method} ${url} - ${statusCode} (${duration}ms) - ${error.message} [${requestId}]`,
          error.stack,
          this.context,
        );

        // Log failed request to audit
        this.auditService.log({
          userId: user?.id,
          userEmail: user?.email,
          eventType: AuditEventType.DATA,
          action: method,
          resource: url,
          result: AuditEventResult.FAILURE,
          ipAddress: ip,
          userAgent,
          errorMessage: error.message,
          metadata: { statusCode, duration, requestId },
          tenantId: user?.tenantId,
          organizationId: user?.organizationId,
        });

        return throwError(() => error);
      }),
    );
  }
}
