/**
 * CQRS Command: Send Verification Email
 *
 * Used by both self-registration and admin-created users.
 * Triggers the email verification flow for a given userId/email pair.
 */
export class SendVerificationEmailCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
