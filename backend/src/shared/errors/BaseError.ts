/**
 * Base Error Class
 *
 * Foundation for all custom application errors with standardized structure
 */

export abstract class BaseError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true,
    details?: Record<string, any>,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this);
  }

  toJSON() {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}
