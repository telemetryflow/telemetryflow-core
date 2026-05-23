/**
 * Security Error
 *
 * Thrown when security-related issues are detected
 */

import { BaseError } from "./BaseError";

export class SecurityError extends BaseError {
  constructor(
    message: string,
    errorCode: string,
    details?: Record<string, any>,
  ) {
    super(message, 403, errorCode, true, details);
    this.name = "SecurityError";
  }

  static suspiciousActivity(): SecurityError {
    return new SecurityError(
      "Suspicious activity detected. Additional verification required.",
      "SUSPICIOUS_ACTIVITY",
    );
  }

  static ipBlacklisted(ipAddress: string): SecurityError {
    return new SecurityError(
      "Access denied from this IP address",
      "IP_BLACKLISTED",
      { ipAddress },
    );
  }
}
