/**
 * CQRS Command: Verify Email
 *
 * Handles email verification by:
 * - Validating verification token
 * - Activating user account
 * - Handling expired tokens
 *
 * Requirements: 3.3, 3.7
 */
export class VerifyEmailCommand {
  constructor(public readonly token: string) {}
}
