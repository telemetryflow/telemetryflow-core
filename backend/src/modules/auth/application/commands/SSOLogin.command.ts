/**
 * CQRS Command: SSOLogin (Auth Module)
 *
 * Initiates SSO login flow by:
 * - Validating SSO provider ID
 * - Delegating to SSO module for SAML/OIDC redirect
 * - Returning authorization URL for frontend redirect
 *
 * Requirements: 1.4
 */
export class SSOLoginCommand {
  constructor(
    public readonly providerId: string, // SSO provider ID from SSO module
    public readonly organizationId: string,
    public readonly redirectUrl?: string,
  ) {}
}
