# Auth Module - Data Flow Diagram

## Overview

This DFD illustrates the data flow for authentication, session management, and security features in the TelemetryFlow Platform.

## Level 0 - Context Diagram

```mermaid
flowchart TB
    User[User/Client]

    subgraph AuthModule[Auth Module]
        AM[Authentication System]
    end

    subgraph DataStores[Data Stores]
        PG[(PostgreSQL)]
    end

    subgraph ExternalServices[External Services]
        Email[Email Service]
        IAM[IAM Module]
    end

    User -->|Credentials| AM
    AM -->|JWT Tokens| User

    AM <-->|User Data| IAM
    AM -->|Verification Emails| Email
    AM <-->|Sessions/Tokens| PG
```

## Level 1 - Main Processes

```mermaid
flowchart TB
    subgraph Inputs
        Client[Client Application]
    end

    subgraph "1.0 Authentication"
        A1[1.1 Login]
        A2[1.2 Logout]
        A3[1.3 Refresh Token]
    end

    subgraph "2.0 Email Verification"
        E1[2.1 Send Verification]
        E2[2.2 Verify Email]
    end

    subgraph "3.0 Password Reset"
        P1[3.1 Forgot Password]
        P2[3.2 Reset Password]
    end

    subgraph "4.0 MFA"
        M1[4.1 Setup MFA]
        M2[4.2 Verify MFA]
        M3[4.3 Disable MFA]
    end

    subgraph "5.0 Session Management"
        S1[5.1 List Sessions]
        S2[5.2 Terminate Session]
        S3[5.3 Track Device]
    end

    subgraph Storage
        PG[(PostgreSQL)]
    end

    subgraph External
        Email[Email Service]
        IAM[IAM Module]
    end

    Client --> A1 & A2 & A3
    Client --> E1 & E2
    Client --> P1 & P2
    Client --> M1 & M2 & M3
    Client --> S1 & S2

    A1 --> IAM
    A1 --> PG
    A1 --> S3

    E1 --> Email
    E1 --> PG
    E2 --> PG
    E2 --> IAM

    P1 --> Email
    P1 --> PG
    P2 --> PG
    P2 --> IAM

    M1 & M2 & M3 --> PG
    M1 & M2 & M3 --> IAM

    S1 & S2 & S3 --> PG
```

## Level 2 - Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant IAMModule
    participant TokenService
    participant SessionService
    participant Database

    Client->>AuthController: POST /auth/login
    AuthController->>AuthService: login(credentials)

    AuthService->>IAMModule: validateUser(email, password)
    IAMModule->>Database: SELECT user
    Database-->>IAMModule: user data
    IAMModule->>IAMModule: Verify password hash
    IAMModule-->>AuthService: user (or null)

    alt User not found or invalid password
        AuthService-->>AuthController: UnauthorizedException
        AuthController-->>Client: 401 Unauthorized
    else User valid
        AuthService->>AuthService: Check if MFA enabled

        alt MFA enabled
            AuthService->>TokenService: createMfaSessionToken()
            TokenService->>Database: INSERT auth_token
            AuthService-->>AuthController: { requireMfa: true, mfaToken }
            AuthController-->>Client: 200 { requireMfa: true }
        else MFA not enabled
            AuthService->>TokenService: createAccessToken()
            AuthService->>TokenService: createRefreshToken()
            TokenService->>Database: INSERT auth_token (refresh)

            AuthService->>SessionService: createSession()
            SessionService->>Database: INSERT user_session

            AuthService->>SessionService: trackDevice()
            SessionService->>Database: UPSERT known_device

            AuthService-->>AuthController: { accessToken, refreshToken }
            AuthController-->>Client: 200 { tokens }
        end
    end
```

## Level 2 - Token Refresh Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant TokenService
    participant Database

    Client->>AuthController: POST /auth/refresh
    AuthController->>AuthService: refreshToken(token)

    AuthService->>TokenService: validateRefreshToken(token)
    TokenService->>Database: SELECT auth_token WHERE hash
    Database-->>TokenService: token record

    alt Token not found or expired
        TokenService-->>AuthService: InvalidTokenException
        AuthService-->>AuthController: UnauthorizedException
        AuthController-->>Client: 401 Unauthorized
    else Token valid
        TokenService->>TokenService: Check if revoked

        alt Token revoked
            TokenService-->>AuthService: TokenRevokedException
            AuthService-->>AuthController: UnauthorizedException
            AuthController-->>Client: 401 Unauthorized
        else Token not revoked
            AuthService->>TokenService: createAccessToken()
            AuthService->>TokenService: createRefreshToken()
            TokenService->>Database: UPDATE old token (revoked)
            TokenService->>Database: INSERT new token

            AuthService-->>AuthController: { accessToken, refreshToken }
            AuthController-->>Client: 200 { tokens }
        end
    end
```

## Level 2 - MFA Setup Flow

```mermaid
sequenceDiagram
    participant Client
    participant MFAController
    participant MFAService
    participant IAMModule
    participant Database

    Client->>MFAController: POST /auth/mfa/setup
    MFAController->>MFAService: setupMfa(userId)

    MFAService->>MFAService: Generate TOTP secret
    MFAService->>MFAService: Generate QR code data

    MFAService-->>MFAController: { secret, qrCode, backupCodes }
    MFAController-->>Client: 200 { qrCode, backupCodes }

    Note over Client: User scans QR code

    Client->>MFAController: POST /auth/mfa/verify
    MFAController->>MFAService: verifyMfa(userId, code)

    MFAService->>MFAService: Validate TOTP code

    alt Code invalid
        MFAService-->>MFAController: InvalidCodeException
        MFAController-->>Client: 400 Bad Request
    else Code valid
        MFAService->>IAMModule: updateUser(mfa_enabled: true)
        IAMModule->>Database: UPDATE users

        MFAService-->>MFAController: { success: true }
        MFAController-->>Client: 200 OK
    end
```

## Level 2 - Password Reset Flow

```mermaid
sequenceDiagram
    participant Client
    participant PasswordController
    participant PasswordService
    participant TokenService
    participant EmailService
    participant IAMModule
    participant Database

    Client->>PasswordController: POST /auth/forgot-password
    PasswordController->>PasswordService: requestReset(email)

    PasswordService->>IAMModule: findUserByEmail(email)
    IAMModule->>Database: SELECT user
    Database-->>IAMModule: user (or null)

    alt User not found
        PasswordService-->>PasswordController: OK (no email leak)
        PasswordController-->>Client: 200 OK
    else User found
        PasswordService->>TokenService: createResetToken()
        TokenService->>Database: INSERT auth_token

        PasswordService->>EmailService: sendPasswordResetEmail()

        PasswordService-->>PasswordController: OK
        PasswordController-->>Client: 200 OK
    end

    Note over Client: User clicks email link

    Client->>PasswordController: POST /auth/reset-password
    PasswordController->>PasswordService: resetPassword(token, newPassword)

    PasswordService->>TokenService: validateResetToken(token)
    TokenService->>Database: SELECT auth_token

    alt Token invalid or expired
        PasswordService-->>PasswordController: InvalidTokenException
        PasswordController-->>Client: 400 Bad Request
    else Token valid
        PasswordService->>IAMModule: updatePassword(userId, hash)
        IAMModule->>Database: UPDATE users

        PasswordService->>TokenService: revokeToken(token)
        TokenService->>Database: UPDATE auth_token

        PasswordService->>TokenService: revokeAllRefreshTokens(userId)
        TokenService->>Database: UPDATE auth_tokens

        PasswordService->>EmailService: sendPasswordChangedEmail()

        PasswordService-->>PasswordController: OK
        PasswordController-->>Client: 200 OK
    end
```

## Session State Diagram

```mermaid
stateDiagram-v2
    [*] --> Authenticating: Login Request

    Authenticating --> MFARequired: MFA Enabled
    Authenticating --> Active: MFA Not Required

    MFARequired --> Active: MFA Verified
    MFARequired --> [*]: MFA Failed/Timeout

    Active --> Active: Token Refresh
    Active --> Active: Activity Update

    Active --> Terminated: Logout
    Active --> Terminated: Session Revoked
    Active --> Expired: Inactivity Timeout
    Active --> Expired: Token Expired

    Terminated --> [*]
    Expired --> [*]
```

## Data Stores

| Store | Tables | Purpose |
|-------|--------|---------|
| PostgreSQL | auth_tokens | Token storage and validation |
| PostgreSQL | user_sessions | Session tracking |
| PostgreSQL | known_devices | Device recognition |
| PostgreSQL | users | User data (via IAM module) |
