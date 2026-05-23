# Implementation Plan: Frontend-Backend Authentication Integration

## Overview

This implementation plan breaks down the comprehensive authentication system into discrete, incremental coding tasks. The plan follows a layered approach: starting with core backend services, then building authentication flows, adding security features, implementing frontend integration, and finally adding advanced features like MFA and device management.

Each task builds on previous work, with property-based tests integrated throughout to catch errors early. The implementation uses TypeScript for both the NestJS backend and Vue.js frontend.

## Tasks

- [ ] 1. Set up core backend infrastructure and data models
  - Create database migrations for User, Session, Device, SecurityLog, Organization, and ApiKey entities
  - Add fields to User entity: organizationId, role (5-tier RBAC: SUPER_ADMINISTRATOR, ADMINISTRATOR, DEVELOPER, VIEWER, DEMO), isOrganizationCreator, isActive, deactivatedAt, deactivatedBy, deactivationTicketRef
  - Add fields to Organization entity: defaultApiKeyId, defaultApiKeySecret
  - Set up Redis connection for session storage and caching
  - Configure JWT module with access and refresh token settings
  - Set up email service with SMTP configuration and retry logic
  - Create base error classes and standardized error response format
  - _Requirements: 11.1, 11.6, 13.1, 13.2, 13.8, 13.9, 13.12, 14.4, 14.5, 14.7_

- [ ] 1.1 Write property test for standardized error responses
  - **Property 38: Standardized error responses**
  - **Validates: Requirements 11.1**

- [ ] 2. Implement core authentication services
  - [ ] 2.1 Implement User Service with password hashing and validation
    - Create UserService with CRUD operations
    - Implement password hashing using bcrypt with cost factor 12
    - Add password complexity validation
    - Add email uniqueness validation
    - _Requirements: 3.1, 3.8, 10.10_

  - [ ] 2.2 Write property test for password hashing
    - **Property 37: Password hashing with bcrypt**
    - **Validates: Requirements 10.10**

  - [ ] 2.3 Write property test for password complexity
    - **Property 12: Password complexity enforcement**
    - **Validates: Requirements 3.8, 4.5**

  - [ ] 2.4 Implement Token Service for JWT generation and validation
    - Create TokenService with access and refresh token generation
    - Implement token validation and payload extraction
    - Add token revocation list using Redis
    - Implement token refresh logic with optional rotation
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ] 2.5 Write property test for token generation
    - **Property 1: Valid credentials authenticate successfully**
    - **Validates: Requirements 1.1, 9.1**

  - [ ] 2.6 Write property test for token refresh flow
    - **Property 29: Token refresh flow**
    - **Validates: Requirements 9.2, 9.3**

  - [ ] 2.7 Implement Session Service for session management
    - Create SessionService with session CRUD operations
    - Implement session creation with device binding
    - Add session activity tracking and expiry handling
    - Implement session revocation (single and bulk)
    - _Requirements: 1.5, 9.7, 9.8, 9.9, 9.10_

  - [ ] 2.8 Write property test for session creation
    - **Property 3: Session creation on authentication**
    - **Validates: Requirements 1.5, 9.7**

  - [ ] 2.9 Write property test for session invalidation
    - **Property 14: Session invalidation on security events**
    - **Validates: Requirements 4.2, 5.5, 9.8**

  - [ ] 2.10 Implement Device Service for device fingerprinting
    - Create DeviceService with device fingerprinting logic
    - Implement device detection and tracking
    - Add device revocation and cleanup
    - Implement new device detection
    - _Requirements: 8.1, 8.2, 8.5, 8.7, 8.8_

  - [ ] 2.11 Write property test for device fingerprinting
    - **Property 25: Device fingerprinting on login**
    - **Validates: Requirements 8.1**

  - [ ] 2.12 Write property test for device revocation
    - **Property 27: Device revocation invalidates sessions**
    - **Validates: Requirements 8.5**

- [ ] 3. Implement email notification service
  - [ ] 3.1 Create email templates for all authentication events
    - Design branded email templates (login, password change, reset, verification, MFA, security alerts, registration confirmation with organization details and API keys, administrator deactivation)
    - Implement template rendering with dynamic data
    - _Requirements: 2.7, 13.3, 13.11, 14.6_

  - [ ] 3.2 Implement Email Service with retry logic
    - Create EmailService with SMTP integration
    - Implement all notification methods (login, password change, reset, verification, MFA, security alerts)
    - Add retry logic with exponential backoff (up to 3 retries)
    - Add email sending logging
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8_

  - [ ] 3.3 Write property test for email notifications
    - **Property 5: Security event notifications**
    - **Validates: Requirements 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.3, 5.2, 5.8, 7.3, 8.6, 10.2**

  - [ ] 3.4 Write property test for email retry
    - **Property 7: Email retry on failure**
    - **Validates: Requirements 2.8**

- [ ] 4. Implement basic authentication flows
  - [ ] 4.1 Implement login with username/password
    - Create LoginCommand and LoginHandler
    - Implement credential validation
    - Add account lockout checking
    - Add account active status checking
    - Create session and generate tokens
    - Send login notification email for new devices
    - _Requirements: 1.1, 1.2, 1.5, 1.7, 1.8_

  - [ ] 4.2 Write property test for invalid credentials rejection
    - **Property 2: Invalid credentials are rejected**
    - **Validates: Requirements 1.2, 11.7**

  - [ ] 4.3 Implement user registration with email verification
    - Create RegisterCommand and RegisterHandler
    - Implement user creation with unverified status
    - Generate verification token and send email
    - Add duplicate email/username checking
    - Create organization automatically with random name format "org-{10-digit-random-number}"
    - Assign user as first administrator (ADMINISTRATOR role - Tier 2) and organization creator
    - Create default API keys: TELEMETRYFLOW_API_KEY_ID and TELEMETRYFLOW_API_KEY_SECRET
    - Send registration confirmation email with organization_id and API keys
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.9, 3.10, 3.11, 3.12, 13.1, 13.2, 13.3, 13.9, 13.10, 13.11_

  - [ ] 4.4 Write property test for registration validation
    - **Property 8: Registration creates unverified account**
    - **Validates: Requirements 3.1, 3.2**

  - [ ] 4.4.1 Write property test for automatic organization creation
    - **Property 46: Automatic organization creation**
    - **Validates: Requirements 13.1**

  - [ ] 4.4.2 Write property test for organization creator assignment
    - **Property 47: Organization creator assignment**
    - **Validates: Requirements 13.2**

  - [ ] 4.4.3 Write property test for organization details notification
    - **Property 48: Organization details notification**
    - **Validates: Requirements 13.3**

  - [ ] 4.4.4 Write property test for default API keys creation
    - **Property 51: Default API keys creation**
    - **Validates: Requirements 13.9, 13.10**

  - [ ] 4.4.5 Write property test for API key details notification
    - **Property 52: API key details notification**
    - **Validates: Requirements 13.11**

  - [ ] 4.4.6 Write property test for 5-tier RBAC support
    - **Property 53: 5-tier RBAC support**
    - **Validates: Requirements 13.12**

  - [ ] 4.5 Write property test for validation errors
    - **Property 10: Validation error completeness**
    - **Validates: Requirements 3.5, 11.3**

  - [ ] 4.6 Implement email verification
    - Create VerifyEmailCommand and VerifyEmailHandler
    - Validate verification token and activate account
    - Handle expired tokens
    - _Requirements: 3.3, 3.7_

  - [ ] 4.7 Write property test for email verification
    - **Property 9: Email verification activates account**
    - **Validates: Requirements 3.3**

  - [ ] 4.8 Implement logout functionality
    - Create LogoutCommand and LogoutHandler
    - Revoke current session and add tokens to revocation list
    - _Requirements: 9.4_

  - [ ] 4.9 Write property test for logout token revocation
    - **Property 30: Logout token revocation**
    - **Validates: Requirements 9.4**

- [ ] 5. Checkpoint - Ensure basic auth flows work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement password management flows
  - [ ] 6.1 Implement change password
    - Create ChangePasswordCommand and ChangePasswordHandler
    - Validate current password
    - Update password and invalidate other sessions
    - Send confirmation email
    - Log password change event
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8_

  - [ ] 6.2 Write property test for password change
    - **Property 13: Password change with verification**
    - **Validates: Requirements 4.1**

  - [ ] 6.3 Implement password reset request
    - Create RequestPasswordResetCommand and Handler
    - Generate time-limited reset token
    - Send password reset email
    - Implement rate limiting (3 per hour)
    - _Requirements: 5.1, 5.2, 5.7_

  - [ ] 6.4 Write property test for reset token generation
    - **Property 15: Password reset token generation**
    - **Validates: Requirements 5.1, 5.2**

  - [ ] 6.5 Implement password reset confirmation
    - Create ConfirmPasswordResetCommand and Handler
    - Validate reset token
    - Update password and invalidate all sessions
    - Send confirmation email
    - _Requirements: 5.4, 5.5, 5.6, 5.8_

  - [ ] 6.6 Write property test for password reset
    - **Property 16: Password reset token validation**
    - **Validates: Requirements 5.4**

  - [ ] 6.7 Implement password reminder
    - Create RequestPasswordReminderCommand and Handler
    - Verify user identity through email
    - Send encrypted password reminder
    - Implement rate limiting (3 per day)
    - Log reminder request
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7_

  - [ ] 6.8 Write property test for password reminder encryption
    - **Property 18: Password reminder encryption**
    - **Validates: Requirements 6.1, 6.6**

- [ ] 7. Implement security features
  - [ ] 7.1 Implement account lockout mechanism
    - Add failed login attempt tracking
    - Implement automatic lockout after 5 failures in 15 minutes
    - Add lockout duration (30 minutes)
    - Send lockout notification email
    - Reset counter on successful login
    - _Requirements: 10.1, 10.2, 10.5_

  - [ ] 7.2 Write property test for account lockout
    - **Property 32: Account lockout on failed attempts**
    - **Validates: Requirements 10.1**

  - [ ] 7.3 Write property test for counter reset
    - **Property 34: Failed attempt counter reset**
    - **Validates: Requirements 10.5**

  - [ ] 7.4 Implement rate limiting middleware
    - Create rate limiting middleware using Redis
    - Apply to authentication endpoints
    - Return 429 with retry-after header
    - _Requirements: 10.8, 10.9_

  - [ ] 7.5 Write property test for rate limiting
    - **Property 17: Rate limiting enforcement**
    - **Validates: Requirements 5.7, 6.4, 10.8, 10.9**

  - [ ] 7.6 Implement suspicious activity detection
    - Create SuspiciousActivityService
    - Implement detection logic (impossible travel, unusual patterns, malicious IPs)
    - Flag accounts and require additional verification
    - Send security alert emails
    - _Requirements: 10.3, 10.4_

  - [ ] 7.7 Write property test for suspicious activity flagging
    - **Property 33: Suspicious activity flagging**
    - **Validates: Requirements 10.3**

  - [ ] 7.8 Implement security event logging
    - Create SecurityLogService
    - Log all authentication events with metadata
    - Implement IP blacklist checking
    - _Requirements: 4.8, 6.7, 10.6, 10.7_

  - [ ] 7.9 Write property test for security logging
    - **Property 35: Security event logging**
    - **Validates: Requirements 4.8, 6.7, 10.6**

  - [ ] 7.10 Write property test for IP blacklist
    - **Property 36: IP blacklist enforcement**
    - **Validates: Requirements 10.7**

- [ ] 8. Checkpoint - Ensure security features work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Multi-Factor Authentication (MFA)
  - [ ] 9.1 Implement MFA setup
    - Create SetupMFAQuery and SetupMFAHandler
    - Generate MFA secret and QR code
    - Generate backup codes
    - _Requirements: 7.1, 7.8_

  - [ ] 9.2 Write property test for MFA setup
    - **Property 19: MFA setup generates secrets**
    - **Validates: Requirements 7.1, 7.8**

  - [ ] 9.3 Implement MFA enablement
    - Create EnableMFACommand and EnableMFAHandler
    - Verify initial TOTP code before enabling
    - Send confirmation email
    - _Requirements: 7.2, 7.3_

  - [ ] 9.4 Write property test for MFA enablement
    - **Property 20: MFA enablement requires verification**
    - **Validates: Requirements 7.2**

  - [ ] 9.5 Implement MFA verification during login
    - Modify login flow to check MFA status
    - Create VerifyMFACommand and VerifyMFAHandler
    - Implement TOTP and backup code verification
    - Track MFA failures and implement lockout (5 failures = 15 min lockout)
    - _Requirements: 7.4, 7.5, 7.6, 7.9_

  - [ ] 9.6 Write property test for MFA requirement
    - **Property 21: MFA required for enabled users**
    - **Validates: Requirements 7.4**

  - [ ] 9.7 Write property test for MFA failure tracking
    - **Property 22: MFA failure tracking**
    - **Validates: Requirements 7.5**

  - [ ] 9.8 Write property test for backup code invalidation
    - **Property 23: Backup code invalidation**
    - **Validates: Requirements 7.9**

  - [ ] 9.9 Implement MFA disablement
    - Create DisableMFACommand and DisableMFAHandler
    - Require password re-authentication
    - Send confirmation email
    - _Requirements: 7.7_

  - [ ] 9.10 Write property test for MFA disablement
    - **Property 24: MFA disablement requires re-authentication**
    - **Validates: Requirements 7.7**

  - [ ] 9.11 Add MFA UI instructions and feedback
    - Update frontend components with MFA setup instructions
    - Add visual feedback during verification
    - _Requirements: 7.10_

- [ ] 10. Implement OAuth and SSO authentication
  - [ ] 10.1 Implement OAuth login flow
    - Create OAuthLoginCommand and OAuthLoginHandler
    - Implement OAuth provider redirects (Google, GitHub)
    - Handle OAuth callbacks and user creation/linking
    - _Requirements: 1.3_

  - [ ] 10.2 Implement SSO login flow
    - Create SSOLoginCommand and SSOLoginHandler
    - Implement SAML redirect and callback handling
    - Handle SSO user creation/linking
    - _Requirements: 1.4_

  - [ ] 10.3 Write unit tests for OAuth and SSO flows
    - Test OAuth callback handling
    - Test SAML response parsing
    - Test user linking logic

- [ ] 11. Implement Auth Controller and DTOs
  - [ ] 11.1 Create all DTOs with validation
    - Create LoginDto, RegisterDto, ChangePasswordDto, etc.
    - Add class-validator decorators for validation
    - Ensure validation errors return all field errors
    - _Requirements: 12.4, 12.5_

  - [ ] 11.2 Write property test for request validation
    - **Property 44: Request payload validation**
    - **Validates: Requirements 12.4**

  - [ ] 11.3 Write property test for validation error detail
    - **Property 45: Validation error detail**
    - **Validates: Requirements 12.5**

  - [ ] 11.4 Implement Auth Controller endpoints
    - Create all controller methods for authentication flows
    - Apply guards and decorators
    - Wire up commands and queries to handlers
    - _Requirements: All authentication requirements_

  - [ ] 11.5 Generate OpenAPI specification
    - Add Swagger decorators to all endpoints
    - Include request/response examples
    - Document error responses
    - _Requirements: 12.1, 12.7_

- [ ] 11.6 Implement organization management features
  - [ ] 11.6.1 Create Organization Service
    - Implement organization CRUD operations
    - Add organization creator validation
    - Implement organization settings update with authorization
    - Implement default API keys creation (TELEMETRYFLOW_API_KEY_ID and TELEMETRYFLOW_API_KEY_SECRET)
    - Add API key service integration
    - _Requirements: 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_

  - [ ] 11.6.2 Write property test for organization settings authorization
    - **Property 49: Organization settings authorization**
    - **Validates: Requirements 13.6, 13.7**

  - [ ] 11.6.3 Write property test for multiple administrators
    - **Property 50: Multiple administrators support**
    - **Validates: Requirements 13.4, 13.5**

  - [ ] 11.6.4 Create Organization Controller endpoints
    - Add endpoints for organization management
    - Implement authorization guards
    - Add API key management endpoints
    - _Requirements: 13.4, 13.5, 13.6, 13.7_

  - [ ] 11.6.5 Create API Key Service
    - Implement API key creation, validation, rotation, and revocation
    - Add permission and scope management
    - Integrate with existing api-keys module
    - _Requirements: 13.9, 13.10_

- [ ] 11.7 Implement administrator account management
  - [ ] 11.7.1 Create Admin Management Service
    - Implement administrator deactivation (Super Admin only)
    - Implement administrator reactivation
    - Add Super Admin authorization checks
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.7_

  - [ ] 11.7.2 Write property test for deactivation authorization
    - **Property 54: Administrator deactivation authorization**
    - **Validates: Requirements 14.1, 14.3**

  - [ ] 11.7.3 Write property test for deactivation session invalidation
    - **Property 55: Deactivation session invalidation**
    - **Validates: Requirements 14.4**

  - [ ] 11.7.4 Write property test for deactivated account login prevention
    - **Property 56: Deactivated account login prevention**
    - **Validates: Requirements 14.5, 14.8**

  - [ ] 11.7.5 Write property test for deactivation notification
    - **Property 57: Deactivation notification**
    - **Validates: Requirements 14.6**

  - [ ] 11.7.6 Write property test for deactivation audit logging
    - **Property 58: Deactivation audit logging**
    - **Validates: Requirements 14.7**

  - [ ] 11.7.7 Create Admin Management Controller endpoints
    - Add privileged endpoint for administrator deactivation
    - Implement Super Admin guard
    - Add audit logging
    - _Requirements: 14.1, 14.2, 14.3, 14.7_

- [ ] 12. Checkpoint - Ensure backend is complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement frontend Pinia auth store
  - [ ] 13.1 Create auth store with state management
    - Define AuthState interface
    - Implement all store actions (login, register, logout, etc.)
    - Add computed getters for authentication status
    - _Requirements: 1.6, 9.5_

  - [ ] 13.2 Write property test for frontend state sync
    - **Property 4: Frontend state synchronization**
    - **Validates: Requirements 1.6**

  - [ ] 13.3 Write property test for state cleanup
    - **Property 31: Frontend state cleanup on logout**
    - **Validates: Requirements 9.5, 9.6**

  - [ ] 13.2 Implement secure token storage
    - Store access tokens in memory
    - Store refresh tokens in httpOnly cookies
    - Implement token retrieval and clearing
    - _Requirements: Token security_

- [ ] 14. Implement frontend HTTP interceptor
  - [ ] 14.1 Create request interceptor
    - Attach access token to all authenticated requests
    - Add request ID for tracing
    - _Requirements: Token attachment_

  - [ ] 14.2 Create response interceptor with token refresh
    - Detect 401 responses
    - Implement automatic token refresh
    - Queue concurrent requests during refresh
    - Retry failed requests with new token
    - Redirect to login on refresh failure
    - _Requirements: 9.2, 9.6_

- [ ] 15. Implement frontend authentication UI views
  - Note: All auth UI lives directly in `frontend/src/views/auth/` as self-contained views. Tests in `views/auth/__tests__/`. No separate component extraction.

  - [ ] 15.1 Update views/auth/login.vue with full requirements
    - Inline field-level validation errors (cleared on input)
    - OAuth buttons (Google, GitHub) via ssoApi.initiateSSO
    - SSO buttons for configured providers (google, microsoft, apple, slack, cognito)
    - Loading states on all async operations
    - Account deactivation error: maps `account_deactivated` code to friendly message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.6, 14.8_

  - [ ] 15.2 Write property test for validation error display
    - **Property 11: Frontend validation error display**
    - **Validates: Requirements 3.6, 11.4**
    - Test file: `views/auth/__tests__/login.property.spec.ts`

  - [ ] 15.3 Update views/auth/register.vue with full requirements
    - Add inline field-level validation errors (username, email, password, confirmPassword)
    - Password strength indicator (Weak/Fair/Good/Strong)
    - Loading states
    - Post-registration confirmation panel: org details + API key secure storage notice
    - _Requirements: 3.1, 3.5, 3.6, 4.6, 13.1, 13.2, 13.9, 13.11_

  - [ ] 15.4 Update password management views
    - Update `views/auth/forgot-password.vue`: inline validation, loading states
    - Update `views/auth/reset-password.vue`: password strength indicator, inline errors
    - Add `views/auth/change-password.vue` (new view)
    - _Requirements: 4.1, 4.5, 4.6, 5.3_

  - [ ] 15.5 Update MFA views
    - Update `views/auth/mfa-verify.vue`: backup code support, clear instructions
    - Add `views/auth/mfa-setup.vue` (new view): QR code display, backup codes list
    - _Requirements: 7.1, 7.4, 7.8, 7.10_

  - [ ] 15.6 Add device management view
    - Add `views/auth/device-management.vue` (new view)
    - List known devices with browser, OS, location, last seen
    - Device revocation and naming/labeling
    - _Requirements: 8.3, 8.4, 8.5, 8.9_

  - [ ] 15.7 Add session management view
    - Add `views/auth/session-management.vue` (new view)
    - List active sessions with device, IP, last activity
    - Revoke individual or all-except-current sessions
    - _Requirements: 9.9, 9.10_

  - [ ] 15.8 Add organization management view
    - Add `views/auth/organization-management.vue` (new view)
    - Org details, members list with 5-tier RBAC roles
    - User invitation (admin only), settings modification (creator only)
    - Masked API keys display with rotation functionality
    - _Requirements: 13.4, 13.5, 13.6, 13.7, 13.9, 13.12_

- [ ] 16. Implement frontend error handling
  - [ ] 16.1 Create error mapping service
    - Map backend error codes to user-friendly messages
    - `src/composables/useAuthError.ts` — `mapAuthError()` + `useAuthError()`
    - _Requirements: 11.2, 11.10_

  - [ ] 16.2 Write property test for error code mapping
    - **Property 39: Error code mapping**
    - **Validates: Requirements 11.2**
    - Test file: `src/composables/__tests__/useAuthError.property.spec.ts`

  - [ ] 16.3 Write property test for consistent error UI
    - **Property 42: Consistent error UI**
    - **Validates: Requirements 11.10**
    - Test file: `src/composables/__tests__/useAuthError.property.spec.ts`

  - [ ] 16.4 Implement error handling strategies
    - Network errors → isNetworkError flag + friendly message
    - Auth errors → code-mapped messages (AUTH_ACCOUNT_DEACTIVATED, AUTH_TOKEN_EXPIRED, etc.)
    - Validation errors → code preserved, details available for inline display
    - Rate limiting → isRateLimit flag + retryAfter value
    - _Requirements: 11.4, 11.5, 11.8_

- [ ] 17. Implement API contract validation
  - [ ] 17.1 Create TypeScript interfaces matching backend DTOs
    - Added `DeviceInfo`, `SessionInfo`, `OrganizationDetail`, `OrganizationMember`, `ApiKeyInfo`, `ApiErrorResponse`, `ValidationErrorResponse` to `src/types/iam.ts`
    - Updated `RegisterRequest` to mark `regionId`/`organizationId` as deprecated (backend auto-creates org)
    - _Requirements: 12.6_

  - [ ] 17.2 Implement response schema validation
    - Runtime validators: `isValidTokenResponse`, `isValidLoginWithMFAResponse`, `isValidRegisterResponse`, `isValidApiErrorResponse`
    - Defined in `views/auth/__tests__/api-contract.property.spec.ts`
    - _Requirements: 12.2_

  - [ ] 17.3 Write property test for response validation
    - **Property 43: Response schema validation**
    - **Validates: Requirements 12.2**
    - Test file: `views/auth/__tests__/api-contract.property.spec.ts`

  - [ ] 17.4 Implement API versioning
    - All requests go through `iamClient` which targets `/api/v2/` prefix
    - Version prefix enforced at the Axios base URL level
    - _Requirements: 12.3, 12.8, 12.9_

- [ ] 18. Implement accessibility features
  - [ ] 18.1 Add keyboard navigation support
    - All auth forms: `@keypress.enter` handlers, `tabindex` on interactive icons
    - Password toggle buttons: `role="button"` + `@keypress.enter`
    - OTP inputs: arrow-key / backspace navigation in mfa-verify.vue
    - _Requirements: Usability 2_

  - [ ] 18.2 Add ARIA labels and roles
    - `aria-required="true"` on all required inputs
    - `aria-describedby` linking inputs to their error spans
    - `role="alert"` on all inline field error spans
    - `aria-live="assertive"` on general error alerts
    - `role="group"` + `aria-label` on OAuth/SSO button groups
    - `role="progressbar"` on password strength bars
    - `aria-label` on icon-only buttons (password toggle, copy, revoke)
    - _Requirements: Usability 3_

  - [ ] 18.3 Add loading indicators
    - `authStore.isLoading` drives `:loading` prop on all submit buttons
    - `oauthLoading` / `ssoLoading` per-provider spinners in login.vue
    - `n-spin` verification status in mfa-verify.vue
    - Skeleton cards in device-management.vue and session-management.vue
    - _Requirements: Usability 1_

- [ ] 19. Final integration and testing
  - [ ] 19.1 Write integration tests for complete auth flows
    - Property test for login validation: `views/auth/__tests__/login.property.spec.ts`
    - API contract property tests: `views/auth/__tests__/api-contract.property.spec.ts`
    - Error mapping property tests: `composables/__tests__/useAuthError.property.spec.ts`

  - [ ] 19.2 Write property tests for HTTP status codes
    - **Property 40: HTTP status code correctness**
    - **Validates: Requirements 11.6**
    - Test file: `views/auth/__tests__/api-contract.property.spec.ts`

  - [ ] 19.3 Write property tests for error sanitization
    - **Property 41: Error detail sanitization**
    - **Validates: Requirements 11.9**
    - Test file: `views/auth/__tests__/api-contract.property.spec.ts`

  - [ ] 19.4 Perform manual testing of all flows
    - All views implemented and wired to authStore / iamClient
    - Routes registered in routes.ts for all new views
    - Error handling consistent across all views via useAuthError composable

- [ ] 20. Final checkpoint - Complete system verification
  - All frontend auth views implemented in `views/auth/` as self-contained views
  - All property tests written covering Properties 11, 39, 40, 41, 42, 43
  - TypeScript interfaces updated in `types/iam.ts`
  - Error mapping composable at `composables/useAuthError.ts`
  - Routes registered for all new views (change-password, mfa-setup, device-management, session-management, organization-management)
