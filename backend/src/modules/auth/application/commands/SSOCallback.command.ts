/**
 * CQRS Command: SSOCallback (Auth Module)
 *
 * Handles SSO callback after user authenticates with SSO provider:
 * - Validates state token
 * - Exchanges authorization code for user profile
 * - Creates or links user account
 * - Creates session with device tracking
 * - Generates JWT tokens
 *
 * Requirements: 1.4, 1.5, 1.7
 */
export class SSOCallbackCommand {
  constructor(
    public readonly code: string, // Authorization code from SSO provider
    public readonly state: string, // State token for CSRF protection
    public readonly ipAddress: string,
    public readonly userAgent: string,
  ) {}
}
