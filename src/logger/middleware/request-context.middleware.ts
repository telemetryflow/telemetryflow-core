/**
 * P25: Winston Logging Standardization
 * Request Context Middleware
 *
 * Automatically creates and manages request context for all HTTP requests
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  RequestContext,
  RequestContextManager,
} from '../context/request-context';
import { LoggerService } from '../logger.service';

/**
 * Middleware to create and manage request context
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Create request context from request
    const context: RequestContext = RequestContextManager.createFromRequest(req);

    // Run the rest of the request within this context
    RequestContextManager.run(context, () => {
      // Log incoming request
      this.logger.logStructured(
        'info',
        `→ ${req.method} ${req.path}`,
        {
          requestId: context.requestId,
          method: req.method,
          path: req.path,
          query: req.query,
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          tenantId: context.tenantId,
          userId: context.userId,
        },
        'HTTP',
      );

      // Capture response time
      const startTime = Date.now();

      // Add request ID to response headers
      res.setHeader('X-Request-ID', context.requestId);

      // Log response when finished
      res.on('finish', () => {
        const duration = Date.now() - startTime;

        this.logger.logStructured(
          res.statusCode >= 400 ? 'warn' : 'info',
          `← ${req.method} ${req.path} ${res.statusCode}`,
          {
            requestId: context.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            durationMs: duration,
            tenantId: context.tenantId,
            userId: context.userId,
          },
          'HTTP',
        );
      });

      next();
    });
  }
}
