import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from './logger.service';

/**
 * HTTP Logging Interceptor
 * Logs HTTP requests and records metrics
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly context = HttpLoggingInterceptor.name;

  constructor(private readonly logger: LoggerService) {}

  intercept(executionContext: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = executionContext.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const startTime = Date.now();
    const { method, url, ip } = request;
    const requestId = (request as any).id || 'unknown';

    this.logger.log(
      `[HTTP] Incoming request: ${method} ${url} from ${ip} [${requestId}]`,
      this.context,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const { statusCode } = response;

        this.logger.log(
          `[HTTP] ✓ Request completed: ${method} ${url} - ${statusCode} (${duration}ms) [${requestId}]`,
          this.context,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode || 500;

        this.logger.error(
          `[HTTP] ✗ Request failed: ${method} ${url} - ${statusCode} (${duration}ms) - ${error.message} [${requestId}]`,
          error.stack,
          this.context,
        );

        throw error;
      }),
    );
  }
}
