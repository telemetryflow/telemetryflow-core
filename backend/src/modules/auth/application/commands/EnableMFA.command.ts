/**
 * CQRS Command: EnableMFA (Auth Module)
 *
 * Handles MFA enablement for authenticated users by:
 * - Verifying initial TOTP code before enabling
 * - Enabling MFA for the user
 * - Sending confirmation email
 *
 * Requirements: 7.2, 7.3
 */
export class EnableMFACommand {
  constructor(
    public readonly userId: string,
    public readonly code: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
