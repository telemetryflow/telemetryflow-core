/**
 * CQRS Command: DisableMFA (Auth Module)
 *
 * Handles MFA disablement for authenticated users by:
 * - Requiring password re-authentication
 * - Disabling MFA for the user
 * - Sending confirmation email
 *
 * Requirements: 7.7
 */
export class DisableMFACommand {
  constructor(
    public readonly userId: string,
    public readonly password: string,
    public readonly code: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
