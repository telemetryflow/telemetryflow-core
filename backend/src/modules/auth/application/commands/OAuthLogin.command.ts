/**
 * CQRS Command: OAuthLogin (Auth Module)
 *
 * Initiates OAuth login flow by:
 * - Validating OAuth provider (Google, GitHub)
 * - Delegating to SSO module for OAuth redirect
 * - Returning authorization URL for frontend redirect
 *
 * Requirements: 1.3
 */
export class OAuthLoginCommand {
  constructor(
    public readonly provider: string, // 'google' or 'github'
    public readonly organizationId: string,
    public readonly redirectUrl?: string,
  ) {}
}
