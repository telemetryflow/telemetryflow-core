/**
 * P25: Winston Logging Standardization
 * Request Context Middleware
 *
 * Automatically creates and manages request context for all HTTP requests
 */

import { Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";
import {
  RequestContext,
  RequestContextManager,
} from "../context/request-context";
import { LoggerService } from "../logger.service";

/**
 * Middleware to create and manage request context
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly skipPaths: Set<string>;

  constructor(
    private readonly logger: LoggerService,
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

  use(req: Request, res: Response, next: NextFunction) {
    const context: RequestContext =
      RequestContextManager.createFromRequest(req);

    RequestContextManager.run(context, () => {
      res.setHeader("X-Request-ID", context.requestId);

      if (this.skipPaths.has(req.path)) {
        return next();
      }

      this.logger.logStructured(
        "info",
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
        "HTTP",
      );

      const startTime = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - startTime;

        this.logger.logStructured(
          res.statusCode >= 400 ? "warn" : "info",
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
          "HTTP",
        );
      });

      next();
    });
  }
}
