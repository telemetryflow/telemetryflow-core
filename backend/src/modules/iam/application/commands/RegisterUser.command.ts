/**
 * CQRS Command: Register User (Self-Registration)
 *
 * Distinct from CreateUserCommand which is admin-only.
 * This command handles public self-registration with:
 * - Default Viewer role assignment
 * - Optional workspace/tenant assignment
 * - Configurable email verification (defaults to true)
 * - Organization validation (if provided)
 */
export class RegisterUserCommand {
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
    /** When false, user is created without triggering verification email. Default: true */
    public readonly sendEmailVerification: boolean = true,
  ) {}
}
