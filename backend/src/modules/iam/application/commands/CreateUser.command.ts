export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly organizationId?: string,
    public readonly workspaceId?: string,
    public readonly tenantId?: string,
    public readonly roleId?: string,
    /** When true, send a verification email to the new user. Default: false for admin-created users. */
    public readonly sendEmailVerification: boolean = false,
    /** When true, user must change password on next login. */
    public readonly forcePasswordChange: boolean = false,
  ) {}
}
