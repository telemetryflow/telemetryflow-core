/**
 * CQRS Command: RequestPasswordReminder (Auth Module)
 *
 * Handles password reminder request by:
 * - Verifying user identity through email
 * - Sending encrypted password reminder
 * - Implementing rate limiting (3 per day per account)
 * - Logging reminder request
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7
 */
export class RequestPasswordReminderCommand {
  constructor(
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
