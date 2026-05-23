# Notification Module

**Version**: 1.0.0
**Type**: Core Communication Module
**Status**: Production Ready

---

## Module Overview

The Notification module handles all outbound communications for the TelemetryFlow Platform, including email notifications for authentication, security alerts, and system events.

### Features

- **Email Service**: Template-based email rendering and sending
- **Multiple Providers**: Support for SMTP and extensible to other providers
- **Template Engine**: Handlebars-based email templates
- **Security Notifications**: Login alerts, password changes, new device detection
- **OTP Support**: Email-based verification codes

---

## Architecture

```
notification/
├── docs/
│   ├── MODULE.md
│   ├── ERD.md
│   ├── DFD.md
│   └── api/
│       └── openapi.yaml
├── domain/
│   ├── services/
│   │   ├── EmailService.ts
│   │   └── index.ts
│   └── index.ts
├── infrastructure/
│   ├── providers/
│   │   ├── IEmailProvider.ts
│   │   ├── SMTPEmailProvider.ts
│   │   └── index.ts
│   ├── templates/
│   │   ├── registration-verification.hbs
│   │   ├── welcome.hbs
│   │   ├── password-reset.hbs
│   │   ├── password-changed.hbs
│   │   ├── new-login-location.hbs
│   │   ├── security-alert.hbs
│   │   └── email-otp.hbs
│   └── index.ts
├── presentation/
│   ├── dto/
│   │   ├── SendEmail.dto.ts
│   │   └── index.ts
│   └── index.ts
├── notification.module.ts
└── index.ts
```

---

## Email Templates

| Template                    | Description                      | Variables                                        |
| --------------------------- | -------------------------------- | ------------------------------------------------ |
| `registration-verification` | New user email verification      | firstName, verificationLink, expirationHours     |
| `welcome`                   | Welcome email after verification | firstName, loginLink                             |
| `password-reset`            | Password reset request           | firstName, resetLink, expirationMinutes          |
| `password-changed`          | Password change notification     | firstName, changedAt, ipAddress, browserInfo     |
| `new-login-location`        | New device/location alert        | firstName, deviceInfo, location, time, ipAddress |
| `security-alert`            | General security alert           | firstName, reason, actionRequired, supportLink   |
| `email-otp`                 | Email OTP verification           | firstName, otpCode, expirationMinutes            |

---

## Email Providers

### Current Providers

| Provider | Status | Description                  |
| -------- | ------ | ---------------------------- |
| SMTP     | Active | Standard SMTP email delivery |

### Provider Interface

```typescript
interface IEmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
  verify(): Promise<boolean>;
}
```

---

## Service Methods

### Email Service

| Method                        | Description                      |
| ----------------------------- | -------------------------------- |
| `sendTemplateEmail()`         | Send email using a template      |
| `sendVerificationEmail()`     | Send registration verification   |
| `sendWelcomeEmail()`          | Send welcome email               |
| `sendPasswordResetEmail()`    | Send password reset link         |
| `sendPasswordChangedEmail()`  | Notify of password change        |
| `sendNewLoginLocationEmail()` | Alert about new login location   |
| `sendSecurityAlertEmail()`    | Send security alert              |
| `sendEmailOTP()`              | Send OTP verification code       |
| `verifyConnection()`          | Verify email provider connection |

---

## Configuration

### Environment Variables

| Variable    | Description                 | Default               |
| ----------- | --------------------------- | --------------------- |
| `SMTP_HOST` | SMTP server host            | -                     |
| `SMTP_PORT` | SMTP server port            | 587                   |
| `SMTP_USER` | SMTP username               | -                     |
| `SMTP_PASS` | SMTP password               | -                     |
| `SMTP_FROM` | Default sender address      | -                     |
| `APP_NAME`  | Application name for emails | TelemetryFlow         |
| `APP_URL`   | Application URL for links   | http://localhost:5173 |

---

## Usage Example

```typescript
// Inject the service
constructor(private readonly emailService: EmailService) {}

// Send verification email
await this.emailService.sendVerificationEmail(
  'user@telemetryflow.id',
  'John',
  'verification-token-123'
);

// Send security alert
await this.emailService.sendSecurityAlertEmail(
  'user@telemetryflow.id',
  'John',
  'Multiple failed login attempts detected',
  'Please review your account security settings'
);
```

---

## Related Documentation

- [ERD.md](./ERD.md) - Entity Relationship Diagram
- [DFD.md](./DFD.md) - Data Flow Diagram
- [api/openapi.yaml](./api/openapi.yaml) - OpenAPI Specification
