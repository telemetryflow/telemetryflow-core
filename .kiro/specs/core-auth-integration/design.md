# Design Document: Frontend-Backend Authentication Integration

## Overview

This design specifies a comprehensive authentication system integrating a Vue.js frontend with a NestJS backend in the TelemetryFlow Platform monorepo. The system implements secure authentication flows including login (username/password, OAuth, SSO), registration with email verification, password management, multi-factor authentication (MFA), device tracking, session management, and security features.

The design follows TelemetryFlow backend standards:

- **DDD/CQRS Architecture**: Complete 4-layer architecture (Domain, Application, Infrastructure, Presentation)
- **Module Standardization**: 90%+ test coverage, comprehensive documentation, proper database patterns
- **Naming Conventions**: PascalCase for files, snake_case for database, consistent suffixes
- **End-to-end Security**: JWT tokens with refresh mechanism, bcrypt password hashing
- **Consistent Error Handling**: Standardized error responses across frontend and backend
- **Email Notifications**: Security event notifications for login, password changes, MFA
- **Device Fingerprinting**: Device tracking and management for security monitoring
- **Rate Limiting**: Account lockout protection and brute force prevention
- **API Contract Validation**: OpenAPI/TypeScript with proper DTOs and validation

## Architecture

### High-Level Architecture

The authentication system follows TelemetryFlow's DDD/CQRS 4-layer architecture:

```mermaid
graph TB
    subgraph Frontend["Vue.js Frontend"]
        UI[Auth Views - views/auth/]
        Store[Pinia Auth Store]
        API[API Clients - api/auth, api/iam, api/sso]
        Interceptor[HTTP Interceptor]
    end

    subgraph Backend["NestJS Backend - DDD Layers"]
        subgraph Presentation["Presentation Layer"]
            AuthController[Auth Controller]
            DTOs[Request/Response DTOs]
            Guards[Permission Guards]
        end

        subgraph Application["Application Layer - CQRS"]
            Commands[Commands]
            Queries[Queries]
            Handlers[Command/Query Handlers]
        end

        subgraph Domain["Domain Layer"]
            Aggregates[User, Session, Device Aggregates]
            ValueObjects[Email, UserId, Token VOs]
            Events[Domain Events]
            RepoInterfaces[Repository Interfaces]
        end

        subgraph Infrastructure["Infrastructure Layer"]
            Repositories[Repository Implementations]
            Entities[TypeORM Entities]
            Mappers[Domain-Entity Mappers]
            Migrations[Database Migrations]
        end
    end

    subgraph External["External Services"]
        OAuth[OAuth Providers]
        SSO[SSO Provider]
        SMTP[SMTP Server]
        Redis[Redis Cache]
    end

    subgraph Storage["Data Storage"]
        DB[(PostgreSQL)]
    end

    UI --> Store
    Store --> API
    API --> Interceptor
    Interceptor --> AuthController

    AuthController --> Commands
    AuthController --> Queries
    Commands --> Handlers
    Queries --> Handlers
    Handlers --> Aggregates
    Handlers --> RepoInterfaces
    RepoInterfaces --> Repositories
    Repositories --> Entities
    Repositories --> Mappers
    Entities --> DB
    Migrations --> DB

    Handlers --> OAuth
    Handlers --> SSO
    Handlers --> SMTP
    Handlers --> Redis
```

### Component Responsibilities

**Frontend Components:**

- **Auth Views** (`src/views/auth/`): Self-contained page-level views for each auth flow — `login.vue`, `register.vue`, `forgot-password.vue`, `reset-password.vue`, `mfa-verify.vue`, `mfa-setup.vue`, `change-password.vue`, `device-management.vue`, `session-management.vue`, `organization-management.vue`. Each view owns its own form state, validation, and API calls directly. Tests live in `views/auth/__tests__/`.
- **Pinia Auth Store** (`src/store/auth.ts`): Centralized authentication state management
- **API Client** (`src/api/auth.ts`, `src/api/iam.ts`, `src/api/sso.ts`): HTTP clients for backend communication
- **HTTP Interceptor**: Automatic token attachment and refresh handling

**Backend - Presentation Layer:**

- **Auth Controller**: REST API endpoints for authentication operations
- **DTOs**: Request/Response data transfer objects with validation
- **Guards**: Permission guards for route protection
- **Decorators**: Custom decorators for authentication requirements

**Backend - Application Layer (CQRS):**

- **Commands**: Write operations (CreateUser, UpdatePassword, EnableMFA, etc.)
- **Queries**: Read operations (GetUser, ListSessions, GetDevices, etc.)
- **Command Handlers**: Execute write operations with business logic
- **Query Handlers**: Execute read operations and return DTOs

**Backend - Domain Layer:**

- **User Aggregate**: Core user entity with authentication logic
- **Session Aggregate**: Session lifecycle and token management
- **Device Aggregate**: Device fingerprinting and tracking
- **Value Objects**: Email, UserId, Token, DeviceFingerprint
- **Domain Events**: UserCreated, PasswordChanged, MFAEnabled, SessionCreated
- **Repository Interfaces**: IUserRepository, ISessionRepository, IDeviceRepository

**Backend - Infrastructure Layer:**

- **Repository Implementations**: UserRepository, SessionRepository, DeviceRepository
- **TypeORM Entities**: User.entity.ts, Session.entity.ts, Device.entity.ts
- **Mappers**: Domain ↔ Entity conversion (UserMapper, SessionMapper, DeviceMapper)
- **Migrations**: Database schema migrations following timestamp-Description pattern
- **Seeds**: Test data seeds for development and testing
- **External Services**: Email service, OAuth providers, Redis cache

### Data Flow

**Login Flow:**

1. User submits credentials via Frontend UI
2. Frontend sends POST request to `/auth/login`
3. Backend validates credentials and checks account status
4. Backend captures device fingerprint and checks if device is known
5. If MFA enabled, Backend returns `mfa_required` response
6. User provides TOTP code, Frontend sends to `/auth/mfa/verify`
7. Backend validates TOTP and creates session
8. Backend generates access token (15min) and refresh token (7 days)
9. Backend sends email notification if new device
10. Frontend stores tokens and updates Pinia store
11. Frontend redirects to dashboard

**Token Refresh Flow:**

1. Frontend makes API request with expired access token
2. HTTP Interceptor catches 401 response
3. Interceptor sends refresh token to `/auth/refresh`
4. Backend validates refresh token and checks session
5. Backend issues new access token (and optionally rotates refresh token)
6. Interceptor retries original request with new token
7. If refresh fails, Frontend redirects to login

## Components and Interfaces

### Frontend Components

#### Pinia Auth Store

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaSession: string | null;
}

interface AuthStore {
  // State
  state: AuthState;

  // Getters
  isAuthenticated: ComputedRef<boolean>;
  currentUser: ComputedRef<User | null>;

  // Actions
  login(credentials: LoginCredentials): Promise<LoginResponse>;
  loginWithOAuth(provider: OAuthProvider): Promise<void>;
  loginWithSSO(): Promise<void>;
  verifyMFA(code: string): Promise<void>;
  register(data: RegistrationData): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  changePassword(data: ChangePasswordData): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  requestPasswordReminder(email: string): Promise<void>;
  setupMFA(): Promise<MFASetupData>;
  enableMFA(code: string): Promise<void>;
  disableMFA(password: string): Promise<void>;
  getDevices(): Promise<Device[]>;
  revokeDevice(deviceId: string): Promise<void>;
  getSessions(): Promise<Session[]>;
  revokeSession(sessionId: string): Promise<void>;
  logout(): Promise<void>;
  refreshTokens(): Promise<void>;
}
```

#### HTTP Interceptor

```typescript
interface HTTPInterceptor {
  // Request interceptor - attach access token
  onRequest(config: RequestConfig): RequestConfig;

  // Response interceptor - handle token refresh
  onResponse(response: Response): Response;
  onResponseError(error: ResponseError): Promise<Response>;

  // Token refresh logic
  refreshAccessToken(): Promise<string>;

  // Queue management for concurrent requests during refresh
  addToQueue(request: PendingRequest): void;
  processQueue(token: string | null): void;
}
```

### Backend Components

#### Auth Controller

```typescript
@Controller('auth')
class AuthController {
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponse>;

  @Post('login/oauth/:provider')
  oauthLogin(@Param('provider') provider: string): Promise<OAuthRedirectResponse>;

  @Get('login/oauth/:provider/callback')
  oauthCallback(@Param('provider') provider: string, @Query() query: OAuthCallbackQuery): Promise<LoginResponse>;

  @Post('login/sso')
  ssoLogin(): Promise<SSORedirectResponse>;

  @Post('login/sso/callback')
  ssoCallback(@Body() dto: SSOCallbackDto): Promise<LoginResponse>;

  @Post('mfa/verify')
  verifyMFA(@Body() dto: MFAVerifyDto): Promise<LoginResponse>;

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<RegisterResponse>;

  @Get('verify-email/:token')
  verifyEmail(@Param('token') token: string): Promise<VerifyEmailResponse>;

  @Post('verify-email/resend')
  resendVerificationEmail(@Body() dto: ResendVerificationDto): Promise<void>;

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Body() dto: ChangePasswordDto, @User() user: UserEntity): Promise<void>;

  @Post('password-reset/request')
  requestPasswordReset(@Body() dto: PasswordResetRequestDto): Promise<void>;

  @Post('password-reset/confirm')
  confirmPasswordReset(@Body() dto: PasswordResetConfirmDto): Promise<void>;

  @Post('password-reminder/request')
  requestPasswordReminder(@Body() dto: PasswordReminderRequestDto): Promise<void>;

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  setupMFA(@User() user: UserEntity): Promise<MFASetupResponse>;

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  enableMFA(@Body() dto: EnableMFADto, @User() user: UserEntity): Promise<void>;

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  disableMFA(@Body() dto: DisableMFADto, @User() user: UserEntity): Promise<void>;

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  getDevices(@User() user: UserEntity): Promise<Device[]>;

  @Delete('devices/:deviceId')
  @UseGuards(JwtAuthGuard)
  revokeDevice(@Param('deviceId') deviceId: string, @User() user: UserEntity): Promise<void>;

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  getSessions(@User() user: UserEntity): Promise<Session[]>;

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  revokeSession(@Param('sessionId') sessionId: string, @User() user: UserEntity): Promise<void>;

  @Post('refresh')
  refreshToken(@Body() dto: RefreshTokenDto): Promise<RefreshTokenResponse>;

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@User() user: UserEntity, @Req() req: Request): Promise<void>;
}
```

#### Auth Service

```typescript
interface AuthService {
  // Login methods
  validateCredentials(username: string, password: string): Promise<UserEntity>;
  initiateOAuthLogin(provider: OAuthProvider): Promise<string>;
  handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
  ): Promise<UserEntity>;
  initiateSSOLogin(): Promise<string>;
  handleSSOCallback(samlResponse: string): Promise<UserEntity>;

  // MFA methods
  requiresMFA(user: UserEntity): boolean;
  createMFASession(user: UserEntity): Promise<string>;
  verifyMFACode(mfaSession: string, code: string): Promise<UserEntity>;

  // Session creation
  createSession(user: UserEntity, device: DeviceInfo): Promise<SessionTokens>;

  // Registration
  registerUser(data: RegistrationData): Promise<UserEntity>;
  sendVerificationEmail(user: UserEntity): Promise<void>;
  verifyEmailToken(token: string): Promise<UserEntity>;

  // Password management
  changePassword(
    user: UserEntity,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  validateResetToken(token: string): Promise<UserEntity>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  requestPasswordReminder(email: string): Promise<void>;

  // Security checks
  checkAccountLockout(user: UserEntity): Promise<boolean>;
  incrementFailedAttempts(user: UserEntity): Promise<void>;
  resetFailedAttempts(user: UserEntity): Promise<void>;
  detectSuspiciousActivity(
    user: UserEntity,
    device: DeviceInfo,
  ): Promise<boolean>;
  checkAccountActive(user: UserEntity): Promise<boolean>;
}

interface OrganizationService {
  // Organization management
  createOrganization(creatorUserId: string): Promise<OrganizationEntity>;
  getOrganization(organizationId: string): Promise<OrganizationEntity | null>;
  updateOrganizationSettings(
    organizationId: string,
    userId: string,
    settings: OrganizationSettings,
  ): Promise<void>;
  isOrganizationCreator(
    organizationId: string,
    userId: string,
  ): Promise<boolean>;

  // User management within organization
  addUserToOrganization(
    organizationId: string,
    userId: string,
    role: UserRole,
  ): Promise<void>;
  getOrganizationUsers(organizationId: string): Promise<UserEntity[]>;
  getOrganizationAdministrators(organizationId: string): Promise<UserEntity[]>;

  // API Key management
  createDefaultApiKeys(
    organizationId: string,
    createdBy: string,
  ): Promise<{ apiKeyId: string; apiKeySecret: string }>;
  getOrganizationApiKeys(organizationId: string): Promise<ApiKeyEntity[]>;
}

interface ApiKeyService {
  // API Key creation
  createApiKey(props: {
    name: string;
    description?: string;
    keyType: 'test' | 'secret' | 'standard' | 'service';
    permissions: string[];
    scopes?: string[];
    rateLimit?: number;
    expiresAt?: Date;
    organizationId: string;
    workspaceId?: string;
    createdBy: string;
  }): Promise<{ apiKey: ApiKeyEntity; rawKey: string }>;

  // API Key validation
  validateApiKey(rawKey: string): Promise<ApiKeyEntity | null>;

  // API Key management
  rotateApiKey(apiKeyId: string, rotatedBy: string): Promise<string>;
  revokeApiKey(apiKeyId: string, revokedBy: string, reason?: string): Promise<void>;
  getApiKey(apiKeyId: string): Promise<ApiKeyEntity | null>;
  listApiKeys(organizationId: string): Promise<ApiKeyEntity[]>;
}

interface AdminManagementService {
  // Administrator deactivation (Super Admin only)
  deactivateAdministrator(
    adminUserId: string,
    superAdminId: string,
    ticketRef: string,
  ): Promise<void>;
  reactivateAdministrator(
    adminUserId: string,
    superAdminId: string,
  ): Promise<void>;

  // Authorization checks
  isSuperAdmin(userId: string): Promise<boolean>;
  canModifyOrganizationSettings(
    userId: string,
    organizationId: string,
  ): Promise<boolean>;
}
```

#### Token Service

```typescript
interface TokenService {
  // Token generation
  generateAccessToken(user: UserEntity, sessionId: string): string;
  generateRefreshToken(user: UserEntity, sessionId: string): string;

  // Token validation
  validateAccessToken(token: string): Promise<TokenPayload>;
  validateRefreshToken(token: string): Promise<TokenPayload>;

  // Token revocation
  revokeToken(token: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  isTokenRevoked(token: string): Promise<boolean>;

  // Token refresh
  refreshAccessToken(refreshToken: string): Promise<SessionTokens>;
}

interface TokenPayload {
  userId: string;
  sessionId: string;
  deviceId: string;
  iat: number;
  exp: number;
}

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

#### Session Service

```typescript
interface SessionService {
  // Session management
  createSession(
    userId: string,
    deviceId: string,
    metadata: SessionMetadata,
  ): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  getUserSessions(userId: string): Promise<Session[]>;
  updateSessionActivity(sessionId: string): Promise<void>;
  revokeSession(sessionId: string): Promise<void>;
  revokeUserSessions(userId: string, exceptSessionId?: string): Promise<void>;
  revokeDeviceSessions(deviceId: string): Promise<void>;

  // Session cleanup
  cleanupExpiredSessions(): Promise<void>;
}

interface Session {
  id: string;
  userId: string;
  deviceId: string;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}
```

#### Device Service

```typescript
interface DeviceService {
  // Device fingerprinting
  generateFingerprint(request: Request): string;
  extractDeviceInfo(request: Request): DeviceInfo;

  // Device management
  getOrCreateDevice(
    userId: string,
    fingerprint: string,
    info: DeviceInfo,
  ): Promise<Device>;
  getUserDevices(userId: string): Promise<Device[]>;
  isKnownDevice(userId: string, fingerprint: string): Promise<boolean>;
  updateDeviceActivity(deviceId: string): Promise<void>;
  revokeDevice(deviceId: string): Promise<void>;

  // Device cleanup
  cleanupInactiveDevices(inactiveDays: number): Promise<void>;
}

interface DeviceInfo {
  fingerprint: string;
  browser: string;
  os: string;
  ipAddress: string;
  location?: GeoLocation;
  userAgent: string;
}

interface Device {
  id: string;
  userId: string;
  fingerprint: string;
  name: string | null;
  browser: string;
  os: string;
  lastIpAddress: string;
  lastLocation: GeoLocation | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  isVerified: boolean;
  isTrusted: boolean;
}
```

#### MFA Service

```typescript
interface MFAService {
  // MFA setup
  generateSecret(user: UserEntity): Promise<MFASecret>;
  generateQRCode(secret: string, user: UserEntity): Promise<string>;
  generateBackupCodes(user: UserEntity): Promise<string[]>;

  // MFA verification
  verifyTOTP(user: UserEntity, code: string): Promise<boolean>;
  verifyBackupCode(user: UserEntity, code: string): Promise<boolean>;

  // MFA management
  enableMFA(
    user: UserEntity,
    secret: string,
    verificationCode: string,
  ): Promise<void>;
  disableMFA(user: UserEntity): Promise<void>;

  // Failure tracking
  incrementMFAFailures(user: UserEntity): Promise<number>;
  resetMFAFailures(user: UserEntity): Promise<void>;
  isMFALocked(user: UserEntity): Promise<boolean>;
}

interface MFASecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}
```

#### Email Service

```typescript
interface EmailService {
  // Email sending
  sendLoginNotification(user: UserEntity, device: Device): Promise<void>;
  sendPasswordChangeConfirmation(user: UserEntity): Promise<void>;
  sendPasswordResetEmail(user: UserEntity, resetToken: string): Promise<void>;
  sendVerificationEmail(
    user: UserEntity,
    verificationToken: string,
  ): Promise<void>;
  sendSecurityAlert(
    user: UserEntity,
    alertType: SecurityAlertType,
  ): Promise<void>;
  sendMFAConfirmation(user: UserEntity, enabled: boolean): Promise<void>;
  sendAccountLockoutNotification(user: UserEntity): Promise<void>;
  sendPasswordReminder(user: UserEntity, reminder: string): Promise<void>;
  sendRegistrationConfirmation(
    user: UserEntity,
    organizationId: string,
    apiKeys: { apiKeyId: string; apiKeySecret: string },
  ): Promise<void>;
  sendAdministratorDeactivationNotification(user: UserEntity): Promise<void>;

  // Email templates
  renderTemplate(
    templateName: string,
    data: Record<string, any>,
  ): Promise<string>;

  // Retry logic
  sendWithRetry(email: EmailMessage, maxRetries: number): Promise<void>;
}

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}
```

## Data Models

### User Entity

```typescript
interface UserEntity {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  passwordReminder: string | null;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaBackupCodes: string[] | null;
  mfaFailureCount: number;
  mfaLockedUntil: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  organizationId: string;
  role: UserRole;
  isOrganizationCreator: boolean;
  isActive: boolean;
  deactivatedAt: Date | null;
  deactivatedBy: string | null;
  deactivationTicketRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

enum UserRole {
  SUPER_ADMINISTRATOR = "super_administrator",
  ADMINISTRATOR = "administrator",
  DEVELOPER = "developer",
  VIEWER = "viewer",
  DEMO = "demo",
}
```

### Organization Entity

```typescript
interface OrganizationEntity {
  id: string;
  name: string;
  creatorUserId: string;
  defaultApiKeyId?: string;
  defaultApiKeySecret?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Key Entity

```typescript
interface ApiKeyEntity {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  keyType: 'test' | 'secret' | 'standard' | 'service';
  keyPrefix: string;
  keyHash: string;
  keyHint: string;
  permissions: string[];
  scopes: string[];
  rateLimit?: number;
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  usageCount: number;
  createdBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  revocationReason?: string;
  rotatedAt?: Date;
  rotatedBy?: string;
  rotationCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session Entity

```typescript
interface SessionEntity {
  id: string;
  userId: string;
  deviceId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}
```

### Device Entity

```typescript
interface DeviceEntity {
  id: string;
  userId: string;
  fingerprint: string;
  name: string | null;
  browser: string;
  os: string;
  lastIpAddress: string;
  lastLocation: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  isVerified: boolean;
  isTrusted: boolean;
}
```

### Security Log Entity

```typescript
interface SecurityLogEntity {
  id: string;
  userId: string | null;
  eventType: SecurityEventType;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

enum SecurityEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  MFA_SUCCESS = "mfa_success",
  MFA_FAILURE = "mfa_failure",
  PASSWORD_CHANGE = "password_change",
  PASSWORD_RESET = "password_reset",
  ACCOUNT_LOCKOUT = "account_lockout",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  DEVICE_REVOKED = "device_revoked",
  SESSION_REVOKED = "session_revoked",
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Core Authentication Properties

**Property 1: Valid credentials authenticate successfully**
_For any_ valid username and password combination, authentication should succeed and return both access and refresh tokens with appropriate expiry times.
**Validates: Requirements 1.1, 9.1**

**Property 2: Invalid credentials are rejected**
_For any_ invalid credential combination (wrong username, wrong password, or both), authentication should fail with a descriptive error message without revealing which part was incorrect.
**Validates: Requirements 1.2, 11.7**

**Property 3: Session creation on authentication**
_For any_ successful authentication, a session record should be created containing the user ID, device fingerprint, and token metadata.
**Validates: Requirements 1.5, 9.7**

**Property 4: Frontend state synchronization**
_For any_ successful authentication, the frontend Pinia store should be updated with user data and tokens should be stored securely.
**Validates: Requirements 1.6**

### Email Notification Properties

**Property 5: Security event notifications**
_For any_ security-relevant event (new device login, password change, password reset, MFA state change, device revocation, account lockout), an appropriate notification email should be sent to the user.
**Validates: Requirements 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.3, 5.2, 5.8, 7.3, 8.6, 10.2**

**Property 6: Email template consistency**
_For any_ authentication notification email, the email should use the branded template format with consistent structure and styling.
**Validates: Requirements 2.7**

**Property 7: Email retry on failure**
_For any_ failed email send attempt, the system should retry up to 3 times and log all failures.
**Validates: Requirements 2.8**

### Registration and Verification Properties

**Property 8: Registration creates unverified account**
_For any_ valid registration data, an unverified user account should be created with a unique verification token.
**Validates: Requirements 3.1, 3.2**

**Property 9: Email verification activates account**
_For any_ valid verification token, the account should be activated and the token should be invalidated.
**Validates: Requirements 3.3**

**Property 10: Validation error completeness**
_For any_ invalid registration data, all validation errors should be returned in a single response with field-level details.
**Validates: Requirements 3.5, 11.3**

**Property 11: Frontend validation error display**
_For any_ validation error response, the frontend should display errors inline next to the corresponding form fields.
**Validates: Requirements 3.6, 11.4**

**Property 12: Password complexity enforcement**
_For any_ password (during registration or change), the system should enforce complexity requirements and reject passwords that don't meet the criteria.
**Validates: Requirements 3.8, 4.5**

### Password Management Properties

**Property 13: Password change with verification**
_For any_ authenticated user providing correct current password and valid new password, the password should be updated successfully.
**Validates: Requirements 4.1**

**Property 14: Session invalidation on security events**
_For any_ password change or password reset, all existing sessions should be invalidated except the current session (for password change only).
**Validates: Requirements 4.2, 5.5, 9.8**

**Property 15: Password reset token generation**
_For any_ password reset request, a time-limited reset token should be generated and sent via email.
**Validates: Requirements 5.1, 5.2**

**Property 16: Password reset token validation**
_For any_ password reset attempt with a valid token, the password should be updated and the token should be invalidated.
**Validates: Requirements 5.4**

**Property 17: Rate limiting enforcement**
_For any_ rate-limited endpoint (password reset, password reminder, authentication), requests exceeding the limit should be rejected with a 429 status code and retry-after header.
**Validates: Requirements 5.7, 6.4, 10.8, 10.9**

**Property 18: Password reminder encryption**
_For any_ stored password reminder, the reminder should be encrypted at rest.
**Validates: Requirements 6.1, 6.6**

### Multi-Factor Authentication Properties

**Property 19: MFA setup generates secrets**
_For any_ MFA setup request, the system should generate a secret key, QR code, and backup codes.
**Validates: Requirements 7.1, 7.8**

**Property 20: MFA enablement requires verification**
_For any_ MFA enablement attempt, the system should verify a valid TOTP code before enabling MFA.
**Validates: Requirements 7.2**

**Property 21: MFA required for enabled users**
_For any_ user with MFA enabled, login should require a valid TOTP code after password verification.
**Validates: Requirements 7.4**

**Property 22: MFA failure tracking**
_For any_ invalid TOTP code, the system should increment the failure counter and reject the login attempt.
**Validates: Requirements 7.5**

**Property 23: Backup code invalidation**
_For any_ backup code used for authentication, that specific code should be invalidated and not usable again.
**Validates: Requirements 7.9**

**Property 24: MFA disablement requires re-authentication**
_For any_ MFA disablement request, the system should require password re-authentication before disabling MFA.
**Validates: Requirements 7.7**

### Device Management Properties

**Property 25: Device fingerprinting on login**
_For any_ login attempt, the system should capture device fingerprint information including browser, OS, IP address, and user agent.
**Validates: Requirements 8.1**

**Property 26: New device detection and tracking**
_For any_ login from a previously unknown device fingerprint, the system should create a device record marked as new and requiring verification.
**Validates: Requirements 8.2, 8.8**

**Property 27: Device revocation invalidates sessions**
_For any_ device revocation, all sessions associated with that device should be invalidated.
**Validates: Requirements 8.5**

**Property 28: Inactive device cleanup**
_For any_ device not used for 90 days, the device record should be automatically removed.
**Validates: Requirements 8.7**

### Session Management Properties

**Property 29: Token refresh flow**
_For any_ expired access token with valid refresh token, the system should issue a new access token without requiring re-authentication.
**Validates: Requirements 9.2, 9.3**

**Property 30: Logout token revocation**
_For any_ explicit logout, the current session should be invalidated and tokens should be added to the revocation list.
**Validates: Requirements 9.4**

**Property 31: Frontend state cleanup on logout**
_For any_ logout or invalid refresh token, the frontend should clear all stored tokens and reset authentication state.
**Validates: Requirements 9.5, 9.6**

### Security Properties

**Property 32: Account lockout on failed attempts**
_For any_ user with 5 failed login attempts within 15 minutes, the account should be locked for 30 minutes.
**Validates: Requirements 10.1**

**Property 33: Suspicious activity flagging**
_For any_ detected suspicious activity, the account should be flagged and require additional verification.
**Validates: Requirements 10.3**

**Property 34: Failed attempt counter reset**
_For any_ successful login after failed attempts, the failure counter should be reset to zero.
**Validates: Requirements 10.5**

**Property 35: Security event logging**
_For any_ authentication event (login, password change, MFA verification, etc.), a security log entry should be created with timestamp, IP address, and outcome.
**Validates: Requirements 4.8, 6.7, 10.6**

**Property 36: IP blacklist enforcement**
_For any_ request from a blacklisted IP address, the system should reject the request immediately.
**Validates: Requirements 10.7**

**Property 37: Password hashing with bcrypt**
_For any_ stored password, the password should be hashed using bcrypt with a cost factor of at least 12.
**Validates: Requirements 10.10**

### Error Handling Properties

**Property 38: Standardized error responses**
_For any_ error condition, the backend should return a standardized error response with error code, message, and field-level details where applicable.
**Validates: Requirements 11.1**

**Property 39: Error code mapping**
_For any_ backend error code, the frontend should map it to a user-friendly message.
**Validates: Requirements 11.2**

**Property 40: HTTP status code correctness**
_For any_ error response, the HTTP status code should correctly distinguish between client errors (4xx) and server errors (5xx).
**Validates: Requirements 11.6**

**Property 41: Error detail sanitization**
_For any_ unexpected error, the backend should return a generic error message without exposing internal implementation details.
**Validates: Requirements 11.9**

**Property 42: Consistent error UI**
_For any_ error in authentication flows, the frontend should use the same error UI component for consistency.
**Validates: Requirements 11.10**

### API Contract Properties

**Property 43: Response schema validation**
_For any_ API response, the frontend should validate the response against the expected schema.
**Validates: Requirements 12.2**

**Property 44: Request payload validation**
_For any_ incoming request, the backend should validate the payload against the defined schema and reject invalid requests.
**Validates: Requirements 12.4**

**Property 45: Validation error detail**
_For any_ request validation failure, the backend should return detailed validation errors for all invalid fields.
**Validates: Requirements 12.5**

### Organization Management Properties

**Property 46: Automatic organization creation**
_For any_ successful user registration, an organization should be automatically created with a unique name in the format "org-{10-digit-random-number}".
**Validates: Requirements 13.1**

**Property 47: Organization creator assignment**
_For any_ newly created organization, the registering user should be assigned as the first administrator with the isOrganizationCreator flag set to true.
**Validates: Requirements 13.2**

**Property 48: Organization details notification**
_For any_ successful registration with organization creation, an email should be sent containing the organization_id and account details.
**Validates: Requirements 13.3**

**Property 49: Organization settings authorization**
_For any_ attempt to modify organization settings, the system should allow the operation only if the user is the organization creator.
**Validates: Requirements 13.6, 13.7**

**Property 50: Multiple administrators support**
_For any_ organization, the system should support multiple users with administrator role while maintaining the organization creator's exclusive settings modification rights.
**Validates: Requirements 13.4, 13.5**

**Property 51: Default API keys creation**
_For any_ newly created organization, two default API keys (TELEMETRYFLOW_API_KEY_ID and TELEMETRYFLOW_API_KEY_SECRET) should be automatically created with appropriate permissions.
**Validates: Requirements 13.9, 13.10**

**Property 52: API key details notification**
_For any_ successful registration with organization and API keys creation, an email should be sent containing the organization_id and both API key values.
**Validates: Requirements 13.11**

**Property 53: 5-tier RBAC support**
_For any_ user role assignment, the system should support and validate roles from the 5-tier RBAC system: SUPER_ADMINISTRATOR (Tier 1), ADMINISTRATOR (Tier 2), DEVELOPER (Tier 3), VIEWER (Tier 4), and DEMO (Tier 5).
**Validates: Requirements 13.12**

### Administrator Account Management Properties

**Property 54: Administrator deactivation authorization**
_For any_ administrator deactivation request, the system should require Super Administrator privileges and reject requests from non-Super Administrator users.
**Validates: Requirements 14.1, 14.3**

**Property 55: Deactivation session invalidation**
_For any_ administrator account deactivation, all active sessions for that administrator should be invalidated immediately.
**Validates: Requirements 14.4**

**Property 56: Deactivated account login prevention**
_For any_ login attempt by a deactivated administrator, the system should reject the attempt with an "account_deactivated" error.
**Validates: Requirements 14.5, 14.8**

**Property 57: Deactivation notification**
_For any_ administrator account deactivation, a notification email should be sent to the deactivated administrator.
**Validates: Requirements 14.6**

**Property 58: Deactivation audit logging**
_For any_ administrator deactivation, a security log entry should be created containing the Super Administrator's identity and ticket reference.
**Validates: Requirements 14.7**

## Error Handling

### Error Categories

**Authentication Errors:**

- `AUTH_INVALID_CREDENTIALS`: Invalid username or password
- `AUTH_ACCOUNT_LOCKED`: Account is temporarily locked
- `AUTH_ACCOUNT_DISABLED`: Account is permanently disabled
- `AUTH_ACCOUNT_DEACTIVATED`: Administrator account has been deactivated
- `AUTH_EMAIL_NOT_VERIFIED`: Email verification required
- `AUTH_MFA_REQUIRED`: MFA verification required
- `AUTH_MFA_INVALID`: Invalid MFA code
- `AUTH_MFA_LOCKED`: Too many MFA failures

**Token Errors:**

- `TOKEN_EXPIRED`: Access token has expired
- `TOKEN_INVALID`: Token is malformed or invalid
- `TOKEN_REVOKED`: Token has been revoked
- `REFRESH_TOKEN_EXPIRED`: Refresh token has expired
- `REFRESH_TOKEN_INVALID`: Refresh token is invalid

**Validation Errors:**

- `VALIDATION_FAILED`: Request validation failed
- `PASSWORD_TOO_WEAK`: Password doesn't meet complexity requirements
- `EMAIL_ALREADY_EXISTS`: Email is already registered
- `USERNAME_ALREADY_EXISTS`: Username is already taken

**Authorization Errors:**

- `UNAUTHORIZED_ORGANIZATION_SETTINGS`: User is not authorized to modify organization settings
- `UNAUTHORIZED_ADMIN_DEACTIVATION`: Only Super Administrators can deactivate administrator accounts

**Rate Limiting Errors:**

- `RATE_LIMIT_EXCEEDED`: Too many requests

**Security Errors:**

- `SUSPICIOUS_ACTIVITY`: Suspicious activity detected
- `IP_BLACKLISTED`: IP address is blacklisted
- `DEVICE_NOT_VERIFIED`: Device requires verification

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling Strategy

1. **Network Errors**: Display generic error with retry button
2. **Authentication Errors**: Clear tokens and redirect to login
3. **Validation Errors**: Display inline next to form fields
4. **Rate Limiting**: Display countdown timer with retry-after
5. **Server Errors**: Display generic error and log to monitoring service

### Backend Error Handling Strategy

1. **Validation Errors**: Return all errors in single response
2. **Authentication Errors**: Log attempt and return generic message
3. **Unexpected Errors**: Log full stack trace, return sanitized message
4. **Rate Limiting**: Return 429 with retry-after header
5. **Security Events**: Log event and send notification email

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests** focus on:

- Specific examples of authentication flows (OAuth callback, SSO SAML response)
- Edge cases (expired tokens, locked accounts, duplicate emails)
- Integration points (email service, Redis cache, database)
- UI component behavior (form validation, error display)

**Property-Based Tests** focus on:

- Universal properties across all inputs (token generation, session management)
- Security properties (password hashing, rate limiting, lockout)
- Data integrity (session invalidation, device tracking)
- Error handling consistency (validation errors, error codes)

### Property-Based Testing Configuration

**Testing Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Test Configuration**:

- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: frontend-backend-auth-integration, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from "fast-check";

describe("Feature: frontend-backend-auth-integration", () => {
  it("Property 1: Valid credentials authenticate successfully", () => {
    fc.assert(
      fc.property(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 50 }),
          password: fc.string({ minLength: 8, maxLength: 100 }),
        }),
        async (credentials) => {
          // Create user with credentials
          const user = await createTestUser(credentials);

          // Attempt authentication
          const result = await authService.validateCredentials(
            credentials.username,
            credentials.password,
          );

          // Verify tokens are returned
          expect(result.accessToken).toBeDefined();
          expect(result.refreshToken).toBeDefined();
          expect(result.expiresIn).toBe(900); // 15 minutes
        },
      ),
      { numRuns: 100 },
    );
  });
});
```

### Test Coverage Requirements

**Backend Coverage**:

- Unit tests for all service methods
- Property tests for all correctness properties
- Integration tests for OAuth and SSO flows
- E2E tests for complete authentication flows

**Frontend Coverage**:

- Unit tests for Pinia store actions
- Unit tests for HTTP interceptor
- Component tests for authentication forms
- Property tests for state management

### Testing Priorities

1. **Critical Path**: Login, token refresh, logout
2. **Security**: Password hashing, rate limiting, account lockout
3. **Data Integrity**: Session management, device tracking
4. **User Experience**: Error handling, validation feedback
5. **Integration**: OAuth, SSO, email service

## Security Considerations

### Token Security

- Access tokens: Short-lived (15 minutes), stored in memory
- Refresh tokens: Long-lived (7 days), stored in httpOnly cookies
- Token rotation: Optional refresh token rotation on each use
- Token revocation: Maintain revocation list in Redis

### Password Security

- Hashing: bcrypt with cost factor 12
- Complexity: Minimum 8 characters, mix of uppercase, lowercase, numbers, symbols
- Storage: Never store plaintext passwords
- Reset tokens: Time-limited (1 hour), single-use

### Session Security

- Device fingerprinting: Browser, OS, IP address
- Session binding: Tokens bound to device fingerprint
- Session timeout: Automatic cleanup of expired sessions
- Concurrent sessions: Allow multiple sessions per user

### Rate Limiting

- Login: 5 attempts per 15 minutes per IP
- Password reset: 3 requests per hour per email
- Password reminder: 3 requests per day per account
- MFA verification: 5 attempts before lockout

### Data Protection

- Encryption at rest: Password reminders, MFA secrets
- Encryption in transit: HTTPS for all endpoints
- CSRF protection: CSRF tokens for state-changing operations
- XSS protection: Input sanitization and output encoding

## Performance Considerations

### Caching Strategy

- Session data: Cache in Redis with TTL matching token expiry
- Device fingerprints: Cache device lookups for 5 minutes
- Rate limit counters: Store in Redis with sliding window
- Revoked tokens: Cache in Redis until expiry

### Database Optimization

- Indexes: email, username, session tokens, device fingerprints
- Connection pooling: Maintain connection pool for high concurrency
- Query optimization: Use prepared statements and batch operations

### API Performance

- Response time: Target <500ms for authentication endpoints
- Concurrent requests: Support 1000 concurrent authentications
- Token validation: Use in-memory cache for JWT validation

## Deployment Considerations

### Environment Variables

```
# JWT Configuration
JWT_SECRET=<secret-key>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379

# Email Service
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<username>
SMTP_PASS=<password>
EMAIL_FROM=noreply@example.com

# OAuth Providers
OAUTH_GOOGLE_CLIENT_ID=<client-id>
OAUTH_GOOGLE_CLIENT_SECRET=<client-secret>
OAUTH_GITHUB_CLIENT_ID=<client-id>
OAUTH_GITHUB_CLIENT_SECRET=<client-secret>

# SSO Configuration
SSO_ENTITY_ID=<entity-id>
SSO_ENTRY_POINT=<sso-url>
SSO_CERT=<certificate>

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=5
```

### Monitoring and Logging

- Log all authentication events to security log
- Monitor failed login attempts and lockouts
- Track token refresh rates and failures
- Alert on suspicious activity patterns
- Monitor email delivery success rates

### Scalability

- Horizontal scaling: Stateless backend services
- Session storage: Centralized Redis cluster
- Database: Read replicas for session queries
- Email service: Queue-based with retry logic
