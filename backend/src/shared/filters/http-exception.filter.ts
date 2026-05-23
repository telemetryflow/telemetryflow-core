/**
 * HTTP Exception Filter
 *
 * Provides standardized error response format across the application
 * Handles both custom errors and NestJS HttpExceptions
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { BaseError } from "../errors/BaseError";
import { RateLimitError } from "../errors/RateLimitError";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected error occurred";
    let details: Record<string, any> | undefined;

    // Handle custom BaseError instances
    if (exception instanceof BaseError) {
      statusCode = exception.statusCode;
      errorCode = exception.errorCode;
      message = exception.message;
      details = exception.details;

      // Log operational errors at warn level
      if (exception.isOperational) {
        this.logger.warn(
          `Operational error: ${errorCode} - ${message}`,
          exception.stack,
        );
      } else {
        // Log non-operational errors at error level
        this.logger.error(
          `Non-operational error: ${errorCode} - ${message}`,
          exception.stack,
        );
      }
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object") {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorCode =
          responseObj.error || this.getErrorCodeFromStatus(statusCode);
        details = responseObj.details;
      } else {
        message = exceptionResponse as string;
        errorCode = this.getErrorCodeFromStatus(statusCode);
      }

      this.logger.warn(`HTTP Exception: ${statusCode} - ${message}`);
    }
    // Handle unknown errors
    else {
      const error = exception as Error;
      message = error.message || message;
      errorCode = "INTERNAL_SERVER_ERROR";

      // Log unknown errors at error level with full stack trace
      this.logger.error(`Unexpected error: ${message}`, error.stack);

      // Don't expose internal error details outside of development
      if (process.env.NODE_ENV !== "development") {
        message = "An unexpected error occurred";
      }
    }

    const errorResponse: ErrorResponse = {
      error: {
        code: errorCode,
        message,
        statusCode,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    // Add Retry-After header for rate limit errors (Requirements: 10.9)
    if (exception instanceof RateLimitError && exception.retryAfter) {
      response.setHeader("Retry-After", exception.retryAfter.toString());
    }

    response.status(statusCode).json(errorResponse);
  }

  private getErrorCodeFromStatus(statusCode: number): string {
    const statusCodeMap: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
      429: "TOO_MANY_REQUESTS",
      500: "INTERNAL_SERVER_ERROR",
      502: "BAD_GATEWAY",
      503: "SERVICE_UNAVAILABLE",
    };

    return statusCodeMap[statusCode] || "UNKNOWN_ERROR";
  }
}
