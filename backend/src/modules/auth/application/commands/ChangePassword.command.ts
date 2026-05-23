/**
 * CQRS Command: ChangePassword (Auth Module)
 *
 * Handles password change for authenticated users by:
 * - Validating current password
 * - Updating password with new hash
 * - Invalidating other sessions (except current)
 * - Sending confirmation email
 * - Logging password change event
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8
 */
export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string,
    public readonly sessionId: string, // Current session to preserve
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
