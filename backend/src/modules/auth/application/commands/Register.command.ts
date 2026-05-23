/**
 * CQRS Command: Register (Auth Module)
 *
 * Handles user registration with email verification by:
 * - Creating unverified user account (delegates to IAM module)
 * - Generating verification token
 * - Sending verification email
 * - Checking for duplicate email/username
 *
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */
export class RegisterCommand {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly regionId: string,
    public readonly organizationId?: string,
    public readonly workspaceId?: string,
    public readonly tenantId?: string,
    public readonly sendEmailVerification: boolean = true,
  ) {}
}
