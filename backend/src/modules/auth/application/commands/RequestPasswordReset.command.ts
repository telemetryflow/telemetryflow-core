/**
 * CQRS Command: RequestPasswordReset (Auth Module)
 *
 * Handles password reset request by:
 * - Generating time-limited reset token (1 hour)
 * - Sending password reset email
 * - Implementing rate limiting (3 per hour per email)
 * - Preventing email enumeration (always returns success)
 *
 * Requirements: 5.1, 5.2, 5.7
 */
export class RequestPasswordResetCommand {
  constructor(
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
