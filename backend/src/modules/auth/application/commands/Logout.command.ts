/**
 * CQRS Command: Logout
 *
 * Handles user logout by:
 * - Revoking the current session
 * - Adding tokens to revocation list
 * - Cleaning up authentication state
 *
 * Requirements: 9.4
 */
export class LogoutCommand {
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}
}
