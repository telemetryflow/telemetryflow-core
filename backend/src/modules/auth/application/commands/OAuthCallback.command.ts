/**
 * CQRS Command: OAuthCallback (Auth Module)
 *
 * Handles OAuth callback by:
 * - Processing OAuth authorization code
 * - Creating or linking user account
 * - Creating session with device tracking
 * - Generating JWT tokens
 * - Sending login notification for new devices
 *
 * Requirements: 1.3, 1.5, 1.7
 */
export class OAuthCallbackCommand {
  constructor(
    public readonly code: string,
    public readonly state: string,
    public readonly ipAddress: string,
    public readonly userAgent: string,
  ) {}
}
