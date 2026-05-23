# Auth Module

**Version**: 1.0.0
**Type**: Core Security Module
**Status**: Production Ready

---

## Module Overview

The Auth module handles authentication, session management, and security features for the TelemetryFlow Platform.

### Features

- **JWT Authentication**: Access and refresh token management
- **Email Verification**: New user registration verification
- **Password Reset**: Secure password recovery flow
- **MFA/TOTP**: Two-factor authentication with authenticator apps
- **Session Management**: Track and manage user sessions
- **Known Devices**: Trusted device recognition
- **Security Events**: Login alerts, new device detection

---

## Architecture

```
auth/
├── controllers/
│   ├── mfa.controller.ts
│   ├── email-verification.controller.ts
│   └── password-reset.controller.ts
├── services/
│   ├── mfa.service.ts
│   ├── email-verification.service.ts
│   └── password-reset.service.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── permissions.guard.ts
├── strategies/
│   └── jwt.strategy.ts
├── decorators/
│   └── permissions.decorator.ts
├── dto/
│   ├── login.dto.ts
│   ├── mfa.dto.ts
│   ├── password-reset.dto.ts
│   └── email-verification.dto.ts
├── infrastructure/
│   └── persistence/
│       └── migrations/
├── auth.controller.ts
├── auth.service.ts
└── auth.module.ts
```

---

## Database Tables

### PostgreSQL Tables

| Table | Description |
|-------|-------------|
| `auth_tokens` | Authentication tokens (refresh, verification, reset) |
| `user_sessions` | Active user session tracking |
| `known_devices` | Trusted device management |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/auth/login` | User login |
| POST | `/api/v2/auth/logout` | User logout |
| POST | `/api/v2/auth/refresh` | Refresh access token |
| GET | `/api/v2/auth/me` | Get current user |

### Email Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/auth/verify-email` | Verify email with token |
| POST | `/api/v2/auth/resend-verification` | Resend verification email |

### Password Reset

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/auth/forgot-password` | Request password reset |
| POST | `/api/v2/auth/reset-password` | Reset password with token |

### MFA

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/auth/mfa/setup` | Setup MFA (get QR code) |
| POST | `/api/v2/auth/mfa/verify` | Verify MFA code |
| POST | `/api/v2/auth/mfa/disable` | Disable MFA |

### Sessions & Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/auth/sessions` | List active sessions |
| DELETE | `/api/v2/auth/sessions/:id` | Terminate session |
| GET | `/api/v2/auth/devices` | List known devices |
| DELETE | `/api/v2/auth/devices/:id` | Remove trusted device |

---

## Token Types

| Type | Purpose | Expiration |
|------|---------|------------|
| `refresh` | Session refresh | 7-30 days |
| `email_verification` | Email verification | 24 hours |
| `password_reset` | Password recovery | 1 hour |
| `mfa_session` | MFA session | 10 minutes |

---

## Security Features

1. **Token Hashing**: All tokens are hashed with bcrypt
2. **Rate Limiting**: Login attempts are rate-limited
3. **Device Tracking**: New devices trigger alerts
4. **Session Limits**: Maximum concurrent sessions
5. **IP Tracking**: Login location monitoring

---

## Related Documentation

- [ERD.md](./ERD.md) - Entity Relationship Diagram
- [DFD.md](./DFD.md) - Data Flow Diagram
- [api/openapi.yaml](./api/openapi.yaml) - OpenAPI Specification
