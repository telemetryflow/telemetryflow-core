/**
 * CQRS Command: ConfirmPasswordReset (Auth Module)
 *
 * Handles password reset confirmation by:
 * - Validating reset token
 * - Updating password with new hash
 * - Invalidating all sessions
 * - Sending confirmation email
 *
 * Requirements: 5.4, 5.5, 5.6, 5.8
 */
export class ConfirmPasswordResetCommand {
  constructor(
    public readonly token: string,
    public readonly newPassword: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
