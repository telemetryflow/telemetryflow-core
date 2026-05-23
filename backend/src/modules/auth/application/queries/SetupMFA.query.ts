/**
 * CQRS Query: SetupMFA (Auth Module)
 *
 * Initiates MFA setup by:
 * - Generating MFA secret key
 * - Creating QR code URL for authenticator app
 * - Generating backup/recovery codes
 *
 * Requirements: 7.1, 7.8
 */
export class SetupMFAQuery {
  constructor(public readonly userId: string) {}
}
