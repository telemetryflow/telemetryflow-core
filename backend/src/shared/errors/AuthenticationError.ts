/**
 * Authentication Error
 *
 * Thrown when authentication fails (invalid credentials, expired tokens, etc.)
 */

import { BaseError } from "./BaseError";

export class AuthenticationError extends BaseError {
  constructor(
    message: string,
    errorCode: string,
    details?: Record<string, any>,
  ) {
    super(message, 401, errorCode, true, details);
    this.name = "AuthenticationError";
  }

  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError(
      "Invalid username or password",
      "AUTH_INVALID_CREDENTIALS",
    );
  }

  static accountLocked(lockedUntil?: Date): AuthenticationError {
    return new AuthenticationError(
      "Account is temporarily locked due to multiple failed login attempts",
      "AUTH_ACCOUNT_LOCKED",
      { lockedUntil },
    );
  }

  static accountDisabled(): AuthenticationError {
    return new AuthenticationError(
      "Account has been disabled",
      "AUTH_ACCOUNT_DISABLED",
    );
  }

  static emailNotVerified(): AuthenticationError {
    return new AuthenticationError(
      "Email verification required",
      "AUTH_EMAIL_NOT_VERIFIED",
    );
  }

  static mfaRequired(mfaSession: string): AuthenticationError {
    return new AuthenticationError(
      "Multi-factor authentication required",
      "AUTH_MFA_REQUIRED",
      { mfaSession },
    );
  }

  static mfaInvalid(): AuthenticationError {
    return new AuthenticationError("Invalid MFA code", "AUTH_MFA_INVALID");
  }

  static mfaLocked(lockedUntil?: Date): AuthenticationError {
    return new AuthenticationError(
      "MFA verification locked due to too many failed attempts",
      "AUTH_MFA_LOCKED",
      { lockedUntil },
    );
  }

  static tokenExpired(): AuthenticationError {
    return new AuthenticationError("Access token has expired", "TOKEN_EXPIRED");
  }

  static tokenInvalid(): AuthenticationError {
    return new AuthenticationError(
      "Token is malformed or invalid",
      "TOKEN_INVALID",
    );
  }

  static tokenRevoked(): AuthenticationError {
    return new AuthenticationError("Token has been revoked", "TOKEN_REVOKED");
  }

  static refreshTokenExpired(): AuthenticationError {
    return new AuthenticationError(
      "Refresh token has expired",
      "REFRESH_TOKEN_EXPIRED",
    );
  }

  static refreshTokenInvalid(): AuthenticationError {
    return new AuthenticationError(
      "Refresh token is invalid",
      "REFRESH_TOKEN_INVALID",
    );
  }
}
