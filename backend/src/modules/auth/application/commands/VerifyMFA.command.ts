/**
 * VerifyMFACommand
 * Requirements: 7.4, 7.5, 7.6, 7.9
 * - Verify TOTP or backup code during login
 * - Track MFA failures
 * - Implement lockout after 5 failures (15 min lockout)
 * - Invalidate backup codes after use
 */
export class VerifyMFACommand {
  constructor(
    public readonly mfaToken: string,
    public readonly code: string,
    public readonly isRecoveryCode: boolean,
    public readonly ipAddress: string,
    public readonly userAgent: string,
  ) {}
}
