# Shared Error Classes

Standardized error handling for the TelemetryFlow Platform.

## Overview

This module provides a consistent error handling system with:

- Standardized error response format
- HTTP status code mapping
- Error categorization
- Detailed error information for debugging

## Error Classes

### BaseError

Foundation for all custom application errors.

```typescript
import { BaseError } from "@/shared/errors";

throw new BaseError(
  "Error message",
  statusCode,
  "ERROR_CODE",
  isOperational,
  details,
);
```

### AuthenticationError

For authentication-related errors (401 status).

```typescript
import { AuthenticationError } from "@/shared/errors";

// Invalid credentials
throw AuthenticationError.invalidCredentials();

// Account locked
throw AuthenticationError.accountLocked(lockedUntil);

// MFA required
throw AuthenticationError.mfaRequired(mfaSession);

// Token expired
throw AuthenticationError.tokenExpired();
```

### ValidationError

For request validation errors (400 status).

```typescript
import { ValidationError } from "@/shared/errors";

// Field validation errors
throw ValidationError.fromFieldErrors([
  { field: "email", message: "Invalid email format" },
  { field: "password", message: "Password too short" },
]);

// Password complexity
throw ValidationError.passwordTooWeak(["min 8 chars", "uppercase required"]);

// Duplicate email
throw ValidationError.emailAlreadyExists("user@telemetryflow.id");
```

### RateLimitError

For rate limiting errors (429 status).

```typescript
import { RateLimitError } from "@/shared/errors";

throw RateLimitError.tooManyRequests(retryAfterSeconds);
```

### SecurityError

For security-related errors (403 status).

```typescript
import { SecurityError } from "@/shared/errors";

// Suspicious activity
throw SecurityError.suspiciousActivity();

// IP blacklisted
throw SecurityError.ipBlacklisted(ipAddress);
```

## Error Response Format

All errors are automatically formatted by the `HttpExceptionFilter`:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "statusCode": 401,
    "details": {},
    "timestamp": "2026-02-13T10:30:00.000Z",
    "path": "/api/auth/login"
  }
}
```

## Error Codes

### Authentication Errors (401)

- `AUTH_INVALID_CREDENTIALS` - Invalid username or password
- `AUTH_ACCOUNT_LOCKED` - Account temporarily locked
- `AUTH_ACCOUNT_DISABLED` - Account permanently disabled
- `AUTH_EMAIL_NOT_VERIFIED` - Email verification required
- `AUTH_MFA_REQUIRED` - MFA verification required
- `AUTH_MFA_INVALID` - Invalid MFA code
- `AUTH_MFA_LOCKED` - MFA locked due to failures
- `TOKEN_EXPIRED` - Access token expired
- `TOKEN_INVALID` - Token malformed or invalid
- `TOKEN_REVOKED` - Token has been revoked
- `REFRESH_TOKEN_EXPIRED` - Refresh token expired
- `REFRESH_TOKEN_INVALID` - Refresh token invalid

### Validation Errors (400)

- `VALIDATION_FAILED` - Request validation failed
- `PASSWORD_TOO_WEAK` - Password doesn't meet requirements
- `EMAIL_ALREADY_EXISTS` - Email already registered
- `USERNAME_ALREADY_EXISTS` - Username already taken

### Rate Limiting Errors (429)

- `RATE_LIMIT_EXCEEDED` - Too many requests

### Security Errors (403)

- `SUSPICIOUS_ACTIVITY` - Suspicious activity detected
- `IP_BLACKLISTED` - IP address blacklisted

## Usage in Controllers

```typescript
import { Controller, Post, Body } from "@nestjs/common";
import { AuthenticationError, ValidationError } from "@/shared/errors";

@Controller("auth")
export class AuthController {
  @Post("login")
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(
      dto.username,
      dto.password,
    );

    if (!user) {
      throw AuthenticationError.invalidCredentials();
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw AuthenticationError.accountLocked(user.lockedUntil);
    }

    return this.authService.login(user);
  }
}
```

## Global Exception Filter

The `HttpExceptionFilter` is registered globally in `app.module.ts` and automatically handles all errors:

```typescript
{
  provide: APP_FILTER,
  useClass: HttpExceptionFilter,
}
```

## Best Practices

1. **Use specific error classes** - Don't throw generic errors
2. **Provide context** - Include relevant details in error objects
3. **Don't expose internals** - Sanitize error messages in production
4. **Log appropriately** - Operational errors at WARN, unexpected at ERROR
5. **Be consistent** - Use the same error codes across the application
