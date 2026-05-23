/**
 * Validation Error
 *
 * Thrown when request validation fails
 */

import { BaseError } from "./BaseError";

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

export class ValidationError extends BaseError {
  public readonly validationErrors: ValidationErrorDetail[];

  constructor(
    message: string,
    validationErrors: ValidationErrorDetail[],
    errorCode = "VALIDATION_FAILED",
  ) {
    super(message, 400, errorCode, true, { validationErrors });
    this.name = "ValidationError";
    this.validationErrors = validationErrors;
  }

  static fromFieldErrors(errors: ValidationErrorDetail[]): ValidationError {
    return new ValidationError(
      "Request validation failed",
      errors,
      "VALIDATION_FAILED",
    );
  }

  static passwordTooWeak(requirements?: string[]): ValidationError {
    return new ValidationError(
      "Password does not meet complexity requirements",
      [
        {
          field: "password",
          message: "Password is too weak",
          value: requirements,
        },
      ],
      "PASSWORD_TOO_WEAK",
    );
  }

  static emailAlreadyExists(email: string): ValidationError {
    return new ValidationError(
      "Email address is already registered",
      [
        {
          field: "email",
          message: "Email already exists",
          value: email,
        },
      ],
      "EMAIL_ALREADY_EXISTS",
    );
  }

  static usernameAlreadyExists(username: string): ValidationError {
    return new ValidationError(
      "Username is already taken",
      [
        {
          field: "username",
          message: "Username already exists",
          value: username,
        },
      ],
      "USERNAME_ALREADY_EXISTS",
    );
  }
}
