import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Param,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthService } from "./auth.service";
import { InviteTokenEntity } from "./infrastructure/persistence/entities/InviteToken.entity";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { SuperAdminGuard } from "./guards/super-admin.guard";
import * as crypto from "crypto";
import { RegistrationService } from "./services/registration.service";
import { DeviceService } from "./services/device.service";
import { SessionService } from "./services/session.service";
import { EmailVerificationService } from "./services/email-verification.service";
import { UserEntity } from "../iam/infrastructure/persistence/entities/User.entity";
import { AuditService, AuditEventResult } from "../audit/audit.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto, RegisterResponseDto } from "./dto/register.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { TokenResponseDto, UserProfileDto } from "./dto/token-response.dto";
import { RateLimitGuard, RateLimit } from "./guards/rate-limit.guard";
import { AuthenticatedUser } from "./interfaces/jwt-payload.interface";
import { RegisterCommand } from "./application/commands/Register.command";
import { LogoutCommand } from "./application/commands/Logout.command";
import { ChangePasswordCommand } from "./application/commands/ChangePassword.command";
import { VerifyMFACommand } from "./application/commands/VerifyMFA.command";
import { OAuthLoginCommand } from "./application/commands/OAuthLogin.command";
import { OAuthCallbackCommand } from "./application/commands/OAuthCallback.command";
import { SSOLoginCommand } from "./application/commands/SSOLogin.command";
import { SSOCallbackCommand } from "./application/commands/SSOCallback.command";
import { VerifyEmailCommand } from "./application/commands/VerifyEmail.command";
import { RequestPasswordResetCommand } from "./application/commands/RequestPasswordReset.command";
import { ConfirmPasswordResetCommand } from "./application/commands/ConfirmPasswordReset.command";
import { RequestPasswordReminderCommand } from "./application/commands/RequestPasswordReminder.command";
import { EnableMFACommand } from "./application/commands/EnableMFA.command";
import { DisableMFACommand } from "./application/commands/DisableMFA.command";
import { SetupMFAQuery } from "./application/queries/SetupMFA.query";
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from "./dto/change-password.dto";
import {
  VerifyMfaDto,
  SetupMfaResponseDto,
  VerifyMfaSetupDto,
  DisableMfaDto,
} from "./dto/mfa.dto";
import {
  OAuthLoginDto,
  OAuthLoginResponseDto,
  OAuthCallbackDto,
} from "./dto/oauth.dto";
import {
  SSOLoginDto,
  SSOLoginResponseDto,
  SSOCallbackDto,
} from "./dto/sso.dto";
import {
  SendVerificationEmailDto,
  VerifyEmailResponseDto,
} from "./dto/email-verification.dto";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from "./dto/password-reset.dto";
import {
  RequestPasswordReminderDto,
  PasswordReminderResponseDto,
} from "./dto/password-reminder.dto";
import {
  DeviceDto,
  UpdateDeviceDto,
  RevokeDeviceResponseDto,
} from "./dto/device.dto";
import {
  SessionDto,
  RevokeSessionResponseDto,
  RevokeAllSessionsResponseDto,
} from "./dto/session.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService,
    private readonly deviceService: DeviceService,
    private readonly sessionService: SessionService,
    private readonly emailVerificationService: EmailVerificationService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(InviteTokenEntity)
    private readonly inviteTokenRepository: Repository<InviteTokenEntity>,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly auditService: AuditService,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "User registration",
    description:
      "Self-register a new user account. Creates an unverified account, automatically creates a default organization with format 'org-{10-digit-random-number}', assigns the user as first administrator, generates default API keys (TELEMETRYFLOW_API_KEY_ID and TELEMETRYFLOW_API_KEY_SECRET), and sends a verification email with organization details and API keys.",
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      example1: {
        summary: "Basic registration",
        value: {
          username: "johndoe",
          email: "john.doe@example.com",
          password: "SecureP@ssw0rd!",
          firstName: "John",
          lastName: "Doe",
          regionId: "us-east-1",
          organizationId: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Registration successful. User account created with unverified status. Organization created automatically. Verification email sent with organization details and API keys.",
    type: RegisterResponseDto,
    example: {
      message: "Registration successful. Please check your email to verify your account.",
      userId: "550e8400-e29b-41d4-a716-446655440000",
      organizationId: "org-1234567890",
      email: "john.doe@example.com",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request payload. Password does not meet complexity requirements (minimum 8 characters, mix of uppercase, lowercase, numbers, symbols) or validation failed.",
    schema: {
      example: {
        error: {
          code: "VALIDATION_FAILED",
          message: "Request validation failed",
          details: {
            password: ["Password must be at least 8 characters long", "Password must contain at least one uppercase letter"],
            email: ["Invalid email format"],
          },
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Email or username already registered",
    schema: {
      example: {
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "An account with this email already exists",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: any,
  ): Promise<RegisterResponseDto> {
    const registrationMode = process.env.REGISTRATION_MODE || "open";
    if (registrationMode === "invite") {
      if (!registerDto.inviteToken) {
        throw new ForbiddenException("Registration requires a valid invite token");
      }
      const invite = await this.inviteTokenRepository.findOne({
        where: { token: registerDto.inviteToken },
      });
      if (!invite) {
        throw new ForbiddenException("Invalid invite token");
      }
      if (invite.expires_at < new Date()) {
        throw new ForbiddenException("Invite token has expired");
      }
      if (invite.used_count >= invite.max_uses) {
        throw new ForbiddenException("Invite token has been used the maximum number of times");
      }
      if (invite.email && invite.email !== registerDto.email) {
        throw new ForbiddenException("Invite token is not valid for this email address");
      }
      invite.used_count += 1;
      await this.inviteTokenRepository.save(invite);
    }

    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      // Use CQRS command for registration (Requirements: 3.1, 3.2, 3.4, 3.5)
      const result = await this.commandBus.execute(
        new RegisterCommand(
          registerDto.username,
          registerDto.email,
          registerDto.password,
          registerDto.firstName,
          registerDto.lastName,
          registerDto.regionId,
          registerDto.organizationId,
          registerDto.workspaceId,
          registerDto.tenantId,
          registerDto.sendEmailVerification ?? true,
        ),
      );
      this.auditService.logAuth("register", AuditEventResult.SUCCESS, {
        userEmail: registerDto.email,
        resource: "auth",
        ipAddress: ip,
        userAgent,
        metadata: {
          requestMethod: "POST",
          requestPath: "/api/v2/auth/register",
        },
      });
      return result;
    } catch (error) {
      this.auditService.logAuth("register", AuditEventResult.FAILURE, {
        userEmail: registerDto.email,
        resource: "auth",
        ipAddress: ip,
        userAgent,
        errorMessage: error.message,
        metadata: {
          requestMethod: "POST",
          requestPath: "/api/v2/auth/register",
        },
      });
      throw error;
    }
  }

  @Post("invites")
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create invite token",
    description: "Create an invite token for user registration. Super admin only.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Optional target email" },
        maxUses: { type: "number", description: "Max uses (default: 1)" },
        expiresHours: { type: "number", description: "Expiry in hours (default: 168 = 7 days)" },
      },
    },
  })
  async createInvite(
    @Request() req: any,
    @Body() body: { email?: string; maxUses?: number; expiresHours?: number },
  ) {
    const token = crypto.randomBytes(32).toString("hex");
    const invite = this.inviteTokenRepository.create({
      token,
      email: body.email || null,
      created_by: req.user.userId,
      organization_id: req.user.organizationId || null,
      expires_at: new Date(Date.now() + (body.expiresHours || 168) * 3600000),
      max_uses: body.maxUses || 1,
      used_count: 0,
    });
    await this.inviteTokenRepository.save(invite);
    return { token, expiresAt: invite.expires_at, maxUses: invite.max_uses };
  }

  @Post("login")
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
    keyGenerator: (req) => {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";
      return `login:${ip}`;
    },
    skipIf: () => process.env.NODE_ENV === "development",
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User login",
    description:
      "Authenticate user with email and password. Returns JWT access token (15-minute expiry) and refresh token (7-day expiry). Creates a session record with device information. Sends email notification if login is from a new device. Rate limited to 5 attempts per 15 minutes per IP address. Account is locked for 30 minutes after 5 failed attempts within 15 minutes.",
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        summary: "Standard login",
        value: {
          email: "john.doe@example.com",
          password: "SecureP@ssw0rd!",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Login successful. Returns access token, refresh token, and user profile. If MFA is enabled, returns mfaRequired flag with mfaToken instead of tokens.",
    type: TokenResponseDto,
    example: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: 900,
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "john.doe@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        isEmailVerified: true,
        mfaEnabled: false,
        role: "administrator",
        organizationId: "org-1234567890",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials, account locked, account deactivated, or email not verified",
    schema: {
      oneOf: [
        {
          example: {
            error: {
              code: "AUTH_INVALID_CREDENTIALS",
              message: "Invalid email or password",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
        {
          example: {
            error: {
              code: "AUTH_ACCOUNT_LOCKED",
              message: "Account is temporarily locked due to too many failed login attempts. Please try again in 30 minutes.",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
        {
          example: {
            error: {
              code: "AUTH_ACCOUNT_DEACTIVATED",
              message: "This account has been deactivated",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
        {
          example: {
            error: {
              code: "AUTH_EMAIL_NOT_VERIFIED",
              message: "Please verify your email address before logging in",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 429,
    description: "Too many login attempts. Rate limit exceeded.",
    schema: {
      example: {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many login attempts. Please try again later.",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
  ): Promise<TokenResponseDto> {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      const result = await this.authService.login(loginDto, req);
      this.auditService.logAuth("login", AuditEventResult.SUCCESS, {
        userEmail: loginDto.email,
        userId: result.user?.id,
        resource: "auth",
        ipAddress: ip,
        userAgent,
        metadata: { requestMethod: "POST", requestPath: "/api/v2/auth/login" },
      });
      return result;
    } catch (error) {
      this.auditService.logAuth("login", AuditEventResult.FAILURE, {
        userEmail: loginDto.email,
        resource: "auth",
        ipAddress: ip,
        userAgent,
        errorMessage: error.message,
        metadata: { requestMethod: "POST", requestPath: "/api/v2/auth/login" },
      });
      throw error;
    }
  }

  @Post("mfa/verify")
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
    keyGenerator: (req) => {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";
      return `mfa-verify:${ip}`;
    },
    skipIf: () => process.env.NODE_ENV === "development",
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify MFA code",
    description:
      "Verify TOTP (Time-based One-Time Password) or backup code to complete login for users with MFA enabled. Requires mfaToken from login response. Rate limited to 5 attempts per 15 minutes per IP address. Account is locked for 15 minutes after 5 failed MFA attempts.",
  })
  @ApiBody({
    type: VerifyMfaDto,
    examples: {
      totpCode: {
        summary: "TOTP code verification",
        value: {
          mfaToken: "mfa-temp-token-123456",
          code: "123456",
          isRecoveryCode: false,
        },
      },
      backupCode: {
        summary: "Backup code verification",
        value: {
          mfaToken: "mfa-temp-token-123456",
          code: "ABCD-EFGH-IJKL-MNOP",
          isRecoveryCode: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "MFA verification successful. Returns access token, refresh token, and user profile. Backup codes are invalidated after use.",
    type: TokenResponseDto,
    example: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: 900,
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "john.doe@example.com",
        username: "johndoe",
        mfaEnabled: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid MFA code, session expired, or MFA locked due to too many failures",
    schema: {
      oneOf: [
        {
          example: {
            error: {
              code: "AUTH_MFA_INVALID",
              message: "Invalid MFA code",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
        {
          example: {
            error: {
              code: "AUTH_MFA_LOCKED",
              message: "Too many MFA verification failures. Account locked for 15 minutes.",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 429,
    description: "Too many MFA verification attempts. Rate limit exceeded.",
    schema: {
      example: {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many MFA verification attempts. Please try again later.",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async verifyMfa(
    @Body() verifyMfaDto: VerifyMfaDto,
    @Request() req: any,
  ): Promise<TokenResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for MFA verification (Requirements: 7.4, 7.5, 7.6, 7.9)
    return this.commandBus.execute(
      new VerifyMFACommand(
        verifyMfaDto.mfaToken,
        verifyMfaDto.code,
        verifyMfaDto.isRecoveryCode || false,
        ipAddress,
        userAgent,
      ),
    );
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description:
      "Get a new access token using a valid refresh token. Optionally rotates the refresh token for enhanced security. Access tokens expire after 15 minutes, refresh tokens after 7 days.",
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: "Token refresh",
        value: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Token refresh successful. Returns new access token and optionally a new refresh token.",
    type: TokenResponseDto,
    example: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: 900,
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired refresh token, or token has been revoked",
    schema: {
      oneOf: [
        {
          example: {
            error: {
              code: "REFRESH_TOKEN_EXPIRED",
              message: "Refresh token has expired. Please log in again.",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
        {
          example: {
            error: {
              code: "TOKEN_REVOKED",
              message: "Token has been revoked",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
      ],
    },
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "User logout",
    description:
      "Invalidate refresh token and revoke current session. Adds tokens to revocation list. Requires valid access token in Authorization header.",
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: "Logout request",
        value: {
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
  })
  @ApiResponse({
    status: 204,
    description: "Logout successful. Session terminated and tokens revoked.",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: any,
  ): Promise<void> {
    // Extract user info and tokens from request
    const user: AuthenticatedUser = req.user;
    const accessToken = req.headers.authorization?.replace("Bearer ", "") || "";
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for logout (Requirement: 9.4)
    await this.commandBus.execute(
      new LogoutCommand(
        user.userId,
        user.sessionId || "",
        accessToken,
        refreshTokenDto.refreshToken,
      ),
    );

    this.auditService.logAuth("logout", AuditEventResult.SUCCESS, {
      userId: user.userId,
      userEmail: user.email,
      resource: "auth",
      ipAddress: ip,
      userAgent,
      metadata: {
        requestMethod: "POST",
        requestPath: "/api/v2/auth/logout",
        sessionId: user.sessionId,
      },
    });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user",
    description:
      "Get the profile of the currently authenticated user. Requires valid access token in Authorization header.",
  })
  @ApiResponse({
    status: 200,
    description: "Current user profile with organization and role information",
    type: UserProfileDto,
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "john.doe@example.com",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      isEmailVerified: true,
      mfaEnabled: false,
      role: "administrator",
      organizationId: "org-1234567890",
      isOrganizationCreator: true,
      isActive: true,
      lastLoginAt: "2026-02-27T10:30:00Z",
      createdAt: "2024-01-01T00:00:00Z",
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async getCurrentUser(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<UserProfileDto> {
    return this.authService.getCurrentUser(req.user.userId);
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Change password",
    description:
      "Change password for authenticated user. Requires current password verification. Invalidates all other sessions except the current one. Sends confirmation email. Password must meet complexity requirements (minimum 8 characters, mix of uppercase, lowercase, numbers, symbols).",
  })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      example1: {
        summary: "Password change",
        value: {
          currentPassword: "OldP@ssw0rd!",
          newPassword: "NewSecureP@ssw0rd!",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Password changed successfully. All other sessions terminated. Confirmation email sent.",
    type: ChangePasswordResponseDto,
    example: {
      message: "Password changed successfully. All other sessions have been terminated.",
      sessionsTerminated: 3,
    },
  })
  @ApiResponse({
    status: 400,
    description: "Password does not meet complexity requirements",
    schema: {
      example: {
        error: {
          code: "PASSWORD_TOO_WEAK",
          message: "Password does not meet complexity requirements",
          details: {
            password: [
              "Password must be at least 8 characters long",
              "Password must contain at least one uppercase letter",
              "Password must contain at least one number",
              "Password must contain at least one special character",
            ],
          },
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Current password is incorrect or unauthorized",
    schema: {
      example: {
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Current password is incorrect",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ): Promise<ChangePasswordResponseDto> {
    const user: AuthenticatedUser = req.user;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Use CQRS command for password change (Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8)
    return this.commandBus.execute(
      new ChangePasswordCommand(
        user.userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
        user.sessionId || "",
        ipAddress,
        userAgent,
      ),
    );
  }

  @Post("oauth/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Initiate OAuth login",
    description:
      "Initiate OAuth login flow with Google or GitHub. Returns authorization URL to redirect user to. Supports organization-specific OAuth configuration.",
  })
  @ApiBody({
    type: OAuthLoginDto,
    examples: {
      google: {
        summary: "Google OAuth login",
        value: {
          provider: "google",
          organizationId: "org-1234567890",
          redirectUrl: "https://app.example.com/auth/callback",
        },
      },
      github: {
        summary: "GitHub OAuth login",
        value: {
          provider: "github",
          organizationId: "org-1234567890",
          redirectUrl: "https://app.example.com/auth/callback",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "OAuth login initiated successfully. Redirect user to the returned authorization URL.",
    type: OAuthLoginResponseDto,
    example: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
      state: "random-state-string-for-csrf-protection",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid provider or OAuth not configured for this organization",
    schema: {
      example: {
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid OAuth provider or OAuth not configured",
          details: {
            provider: ["Provider must be one of: google, github"],
          },
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async oauthLogin(
    @Body() oauthLoginDto: OAuthLoginDto,
  ): Promise<OAuthLoginResponseDto> {
    // Use CQRS command for OAuth login initiation (Requirement: 1.3)
    return this.commandBus.execute(
      new OAuthLoginCommand(
        oauthLoginDto.provider,
        oauthLoginDto.organizationId,
        oauthLoginDto.redirectUrl,
      ),
    );
  }

  @Post("oauth/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Handle OAuth callback",
    description:
      "Handle OAuth callback from provider. Exchanges authorization code for tokens and creates/links user account. Creates session with device information. Sends email notification for new device login.",
  })
  @ApiBody({
    type: OAuthCallbackDto,
    examples: {
      example1: {
        summary: "OAuth callback",
        value: {
          code: "authorization-code-from-provider",
          state: "random-state-string-for-csrf-protection",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "OAuth authentication successful. User account created or linked. Returns access token, refresh token, and user profile.",
    type: TokenResponseDto,
    example: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: 900,
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "john.doe@example.com",
        username: "johndoe",
        isEmailVerified: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid authorization code or state mismatch (CSRF protection)",
    schema: {
      example: {
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Invalid authorization code or state",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async oauthCallback(
    @Body() oauthCallbackDto: OAuthCallbackDto,
    @Request() req: any,
  ): Promise<TokenResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for OAuth callback (Requirements: 1.3, 1.5, 1.7)
    return this.commandBus.execute(
      new OAuthCallbackCommand(
        oauthCallbackDto.code,
        oauthCallbackDto.state,
        ipAddress,
        userAgent,
      ),
    );
  }

  @Post("sso/login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Initiate SSO login",
    description:
      "Initiate SSO login flow with configured SSO provider (SAML/OIDC). Returns authorization URL to redirect user to. Supports organization-specific SSO configuration.",
  })
  @ApiBody({
    type: SSOLoginDto,
    examples: {
      example1: {
        summary: "SSO login",
        value: {
          providerId: "okta-sso-provider",
          organizationId: "org-1234567890",
          redirectUrl: "https://app.example.com/auth/sso/callback",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "SSO login initiated successfully. Redirect user to the returned authorization URL.",
    type: SSOLoginResponseDto,
    example: {
      authorizationUrl: "https://sso.example.com/saml/login?SAMLRequest=...",
      state: "random-state-string-for-csrf-protection",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid provider ID or SSO not configured for this organization",
    schema: {
      example: {
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid SSO provider or SSO not configured",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async ssoLogin(
    @Body() ssoLoginDto: SSOLoginDto,
  ): Promise<SSOLoginResponseDto> {
    // Use CQRS command for SSO login initiation (Requirement: 1.4)
    return this.commandBus.execute(
      new SSOLoginCommand(
        ssoLoginDto.providerId,
        ssoLoginDto.organizationId,
        ssoLoginDto.redirectUrl,
      ),
    );
  }

  @Post("sso/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Handle SSO callback",
    description:
      "Handle SSO callback from provider. Exchanges authorization code/SAML response for tokens and creates/links user account. Creates session with device information. Sends email notification for new device login.",
  })
  @ApiBody({
    type: SSOCallbackDto,
    examples: {
      example1: {
        summary: "SSO callback",
        value: {
          code: "authorization-code-from-sso-provider",
          state: "random-state-string-for-csrf-protection",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "SSO authentication successful. User account created or linked. Returns access token, refresh token, and user profile.",
    type: TokenResponseDto,
    example: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: 900,
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "john.doe@example.com",
        username: "johndoe",
        isEmailVerified: true,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid authorization code or state mismatch (CSRF protection)",
    schema: {
      example: {
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Invalid authorization code or state",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async ssoCallback(
    @Body() ssoCallbackDto: SSOCallbackDto,
    @Request() req: any,
  ): Promise<TokenResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for SSO callback (Requirements: 1.4, 1.5, 1.7)
    return this.commandBus.execute(
      new SSOCallbackCommand(
        ssoCallbackDto.code,
        ssoCallbackDto.state,
        ipAddress,
        userAgent,
      ),
    );
  }

  @Get("verify-email/:token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify email address",
    description:
      "Verify user email address using the token sent via email. Activates the account and marks email as verified. Token is single-use and expires after a set period.",
  })
  @ApiParam({
    name: "token",
    description: "Email verification token sent to user's email address",
    type: String,
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @ApiResponse({
    status: 200,
    description: "Email verified successfully. Account activated.",
    type: VerifyEmailResponseDto,
    example: {
      message: "Email verified successfully. Your account is now active.",
      userId: "550e8400-e29b-41d4-a716-446655440000",
      email: "john.doe@example.com",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid or expired verification token",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or expired verification token. Please request a new verification email.",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async verifyEmail(
    @Param("token") token: string,
    @Request() _req: any,
  ): Promise<VerifyEmailResponseDto> {
    return this.commandBus.execute(new VerifyEmailCommand(token));
  }

  @Post("verify-email/resend")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resend verification email",
    description:
      "Resend email verification link to the user's registered email address. Returns generic success message to prevent email enumeration attacks.",
  })
  @ApiBody({
    type: SendVerificationEmailDto,
    examples: {
      example1: {
        summary: "Resend verification",
        value: {
          email: "john.doe@example.com",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Generic success message. Verification email sent if account exists and is unverified.",
    schema: {
      example: {
        message: "If an account exists with this email, a verification email has been sent",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid email format",
    schema: {
      example: {
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid email format",
          details: {
            email: ["Invalid email format"],
          },
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async resendVerificationEmail(
    @Body() sendVerificationEmailDto: SendVerificationEmailDto,
  ): Promise<{ message: string }> {
    // Return a generic success message to prevent email enumeration
    const user = await this.userRepository.findOne({
      where: { email: sendVerificationEmailDto.email, deletedAt: null },
    });

    if (user && user.isActive && !user.emailVerified) {
      // Only send email if user exists, is active, and email is not verified
      await this.emailVerificationService.sendVerificationEmail(
        user.id,
        user.email,
      );
    }

    // Always return same message to prevent email enumeration
    return {
      message: "If an account exists with this email, a verification email has been sent",
    };
  }

  @Post("password-reset/request")
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour
    keyGenerator: (req) => {
      const email = req.body?.email || "unknown";
      return `password-reset:${email}`;
    },
    skipIf: () => process.env.NODE_ENV === "development",
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Request password reset",
    description:
      "Request a password reset link to be sent via email. Generates a time-limited reset token (1 hour expiry). Rate limited to 3 requests per hour per email address. Returns generic success message to prevent email enumeration attacks.",
  })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      example1: {
        summary: "Password reset request",
        value: {
          email: "john.doe@example.com",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Generic success message. Password reset email sent if account exists.",
    schema: {
      example: {
        message: "If an account exists with this email, a password reset link has been sent",
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: "Too many password reset requests. Rate limit exceeded.",
    schema: {
      example: {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many password reset requests. Please try again later.",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async requestPasswordReset(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for password reset request (Requirements: 5.1, 5.2, 5.7)
    await this.commandBus.execute(
      new RequestPasswordResetCommand(
        forgotPasswordDto.email,
        ipAddress,
        userAgent,
      ),
    );

    // Always return success to prevent email enumeration
    return {
      message:
        "If an account exists with this email, a password reset link has been sent",
    };
  }

  @Post("password-reset/confirm")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Confirm password reset",
    description:
      "Reset password using the token sent via email. Validates reset token, updates password, and invalidates all existing sessions. Sends confirmation email. Password must meet complexity requirements (minimum 8 characters, mix of uppercase, lowercase, numbers, symbols).",
  })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      example1: {
        summary: "Password reset",
        value: {
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          newPassword: "NewSecureP@ssw0rd!",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Password reset successfully. All sessions terminated. Confirmation email sent.",
    type: ResetPasswordResponseDto,
    example: {
      message: "Password reset successfully. All sessions have been terminated. Please log in with your new password.",
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid or expired reset token, or password does not meet complexity requirements",
    schema: {
      oneOf: [
        {
          example: {
            error: {
              code: "TOKEN_INVALID",
              message: "Invalid or expired reset token. Please request a new password reset.",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
        {
          example: {
            error: {
              code: "PASSWORD_TOO_WEAK",
              message: "Password does not meet complexity requirements",
              details: {
                password: [
                  "Password must be at least 8 characters long",
                  "Password must contain at least one uppercase letter",
                ],
              },
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
      ],
    },
  })
  async confirmPasswordReset(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Request() req: any,
  ): Promise<ResetPasswordResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for password reset confirmation (Requirements: 5.4, 5.5, 5.6, 5.8)
    return this.commandBus.execute(
      new ConfirmPasswordResetCommand(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
        ipAddress,
        userAgent,
      ),
    );
  }

  @Post("password-reminder/request")
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000, // 3 requests per day
    keyGenerator: (req) => {
      const email = req.body?.email || "unknown";
      return `password-reminder:${email}`;
    },
    skipIf: () => process.env.NODE_ENV === "development",
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Request password reminder",
    description:
      "Request a password reminder to be sent via email. Sends encrypted password reminder if user has set one. Rate limited to 3 requests per day per account. Returns generic success message to prevent email enumeration attacks.",
  })
  @ApiBody({
    type: RequestPasswordReminderDto,
    examples: {
      example1: {
        summary: "Password reminder request",
        value: {
          email: "john.doe@example.com",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Generic success message. Password reminder sent if account exists and has a reminder set.",
    type: PasswordReminderResponseDto,
    example: {
      message: "If an account exists with this email and has a password reminder set, it has been sent",
    },
  })
  @ApiResponse({
    status: 429,
    description: "Too many password reminder requests. Rate limit exceeded.",
    schema: {
      example: {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many password reminder requests. Please try again later.",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async requestPasswordReminder(
    @Body() requestPasswordReminderDto: RequestPasswordReminderDto,
    @Request() req: any,
  ): Promise<PasswordReminderResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for password reminder request (Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7)
    await this.commandBus.execute(
      new RequestPasswordReminderCommand(
        requestPasswordReminderDto.email,
        ipAddress,
        userAgent,
      ),
    );

    // Always return success to prevent email enumeration
    return {
      message:
        "If an account exists with this email and has a password reminder set, it has been sent",
    };
  }

  @Get("mfa/setup")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Setup MFA",
    description:
      "Generate MFA secret, QR code, and backup codes for the authenticated user. Returns data needed to configure authenticator app (Google Authenticator, Authy, etc.). MFA is not enabled until verified with /mfa/enable endpoint.",
  })
  @ApiResponse({
    status: 200,
    description: "MFA setup data generated successfully. Use QR code to configure authenticator app. Save backup codes securely.",
    type: SetupMfaResponseDto,
    example: {
      secret: "JBSWY3DPEHPK3PXP",
      qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      backupCodes: [
        "ABCD-EFGH-IJKL-MNOP",
        "QRST-UVWX-YZAB-CDEF",
        "GHIJ-KLMN-OPQR-STUV",
        "WXYZ-ABCD-EFGH-IJKL",
        "MNOP-QRST-UVWX-YZAB",
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async setupMfa(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<SetupMfaResponseDto> {
    const user: AuthenticatedUser = req.user;

    // Use CQRS query for MFA setup (Requirements: 7.1, 7.8)
    return this.queryBus.execute(new SetupMFAQuery(user.userId));
  }

  @Post("mfa/enable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Enable MFA",
    description:
      "Enable MFA for the authenticated user after verifying the initial TOTP code from authenticator app. Requires valid TOTP code to confirm setup. Sends confirmation email.",
  })
  @ApiBody({
    type: VerifyMfaSetupDto,
    examples: {
      example1: {
        summary: "Enable MFA",
        value: {
          code: "123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "MFA enabled successfully. Confirmation email sent. Future logins will require TOTP code.",
    schema: {
      example: {
        message: "MFA enabled successfully",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid TOTP code. Verify code from authenticator app.",
    schema: {
      example: {
        error: {
          code: "AUTH_MFA_INVALID",
          message: "Invalid TOTP code. Please verify the code from your authenticator app.",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async enableMfa(
    @Body() verifyMfaSetupDto: VerifyMfaSetupDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const user: AuthenticatedUser = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for MFA enablement (Requirements: 7.2, 7.3)
    await this.commandBus.execute(
      new EnableMFACommand(
        user.userId,
        verifyMfaSetupDto.code,
        ipAddress,
        userAgent,
      ),
    );

    return { message: "MFA enabled successfully" };
  }

  @Post("mfa/disable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Disable MFA",
    description:
      "Disable MFA for the authenticated user after verifying the password. Requires password re-authentication for security. Sends confirmation email.",
  })
  @ApiBody({
    type: DisableMfaDto,
    examples: {
      example1: {
        summary: "Disable MFA",
        value: {
          password: "SecureP@ssw0rd!",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "MFA disabled successfully. Confirmation email sent. Future logins will not require TOTP code.",
    schema: {
      example: {
        message: "MFA disabled successfully",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid password. Password verification failed.",
    schema: {
      example: {
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Invalid password",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async disableMfa(
    @Body() disableMfaDto: DisableMfaDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const user: AuthenticatedUser = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Use CQRS command for MFA disablement (Requirements: 7.7)
    await this.commandBus.execute(
      new DisableMFACommand(
        user.userId,
        disableMfaDto.password,
        ipAddress,
        userAgent,
      ),
    );

    return { message: "MFA disabled successfully" };
  }

  @Get("devices")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user devices",
    description:
      "Get all known devices for the authenticated user. Includes device fingerprint, browser, OS, IP address, location, and last seen information. Devices are tracked automatically on login.",
  })
  @ApiResponse({
    status: 200,
    description: "List of user devices with details. Verified devices have logged in more than once. Trusted devices are manually marked by user.",
    type: [DeviceDto],
    example: [
      {
        id: "device-123",
        fingerprint: "abc123def456",
        name: "My Laptop",
        browser: "Chrome 120.0",
        os: "macOS 14.0",
        lastIpAddress: "192.168.1.100",
        lastLocation: '{"city":"San Francisco","country":"US"}',
        firstSeenAt: "2024-01-01T00:00:00Z",
        lastSeenAt: "2026-02-27T10:30:00Z",
        isVerified: true,
        isTrusted: true,
      },
      {
        id: "device-456",
        fingerprint: "xyz789ghi012",
        name: null,
        browser: "Firefox 121.0",
        os: "Windows 11",
        lastIpAddress: "203.0.113.42",
        lastLocation: '{"city":"New York","country":"US"}',
        firstSeenAt: "2024-01-10T00:00:00Z",
        lastSeenAt: "2024-01-14T15:20:00Z",
        isVerified: true,
        isTrusted: false,
      },
    ],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async getDevices(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<DeviceDto[]> {
    const user: AuthenticatedUser = req.user;

    // Get devices from device service (Requirements: 8.3, 8.4)
    const devices = await this.deviceService.getUserDevices(user.userId);

    // Map Device[] to DeviceDto[]
    return devices.map((device) => ({
      id: device.id,
      fingerprint: device.fingerprint,
      name: device.name,
      browser: device.browser,
      os: device.os,
      lastIpAddress: device.lastIpAddress,
      lastLocation: device.lastLocation
        ? JSON.stringify(device.lastLocation)
        : null,
      firstSeenAt: device.firstSeenAt,
      lastSeenAt: device.lastSeenAt,
      isVerified: device.loginCount > 1,
      isTrusted: device.isTrusted,
    }));
  }

  @Patch("devices/:deviceId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update device",
    description:
      "Update device name or label for easy identification. Mark device as trusted to skip additional verification. Only the device owner can update their devices.",
  })
  @ApiParam({
    name: "deviceId",
    description: "Unique device identifier",
    type: String,
    example: "device-123",
  })
  @ApiBody({
    type: UpdateDeviceDto,
    examples: {
      nameUpdate: {
        summary: "Update device name",
        value: {
          name: "My Work Laptop",
        },
      },
      trustDevice: {
        summary: "Mark device as trusted",
        value: {
          name: "My Home Desktop",
          isTrusted: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Device updated successfully",
    type: DeviceDto,
    example: {
      id: "device-123",
      fingerprint: "abc123def456",
      name: "My Work Laptop",
      browser: "Chrome 120.0",
      os: "macOS 14.0",
      lastIpAddress: "192.168.1.100",
      lastLocation: '{"city":"San Francisco","country":"US"}',
      firstSeenAt: "2024-01-01T00:00:00Z",
      lastSeenAt: "2026-02-27T10:30:00Z",
      isVerified: true,
      isTrusted: true,
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Device not found or does not belong to user",
    schema: {
      example: {
        error: {
          code: "NOT_FOUND",
          message: "Device not found",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async updateDevice(
    @Param("deviceId") deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @Request() req: { user: AuthenticatedUser },
  ): Promise<DeviceDto> {
    const user: AuthenticatedUser = req.user;

    // Update device name (Requirements: 8.9)
    if (updateDeviceDto.name !== undefined) {
      await this.deviceService.updateDeviceName(deviceId, updateDeviceDto.name);
    }

    if (updateDeviceDto.isTrusted !== undefined) {
      if (updateDeviceDto.isTrusted) {
        await this.deviceService.trustDevice(deviceId);
      } else {
        await this.deviceService.untrustDevice(deviceId);
      }
    }

    // Get updated device
    const devices = await this.deviceService.getUserDevices(user.userId);
    const device = devices.find((d) => d.id === deviceId);

    if (!device) {
      throw new NotFoundException("Device not found");
    }

    return {
      id: device.id,
      fingerprint: device.fingerprint,
      name: device.name,
      browser: device.browser || "Unknown",
      os: device.os || "Unknown",
      lastIpAddress: device.lastIpAddress || "Unknown",
      lastLocation: device.lastLocation
        ? JSON.stringify(device.lastLocation)
        : null,
      firstSeenAt: device.firstSeenAt,
      lastSeenAt: device.lastSeenAt,
      isVerified: device.loginCount > 1,
      isTrusted: device.isTrusted,
    };
  }

  @Delete("devices/:deviceId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Revoke device",
    description:
      "Revoke a device and invalidate all sessions associated with it. Use this to remove access from lost or stolen devices. Sends notification email.",
  })
  @ApiParam({
    name: "deviceId",
    description: "Unique device identifier to revoke",
    type: String,
    example: "device-123",
  })
  @ApiResponse({
    status: 200,
    description: "Device revoked successfully. All sessions for this device terminated. Notification email sent.",
    type: RevokeDeviceResponseDto,
    example: {
      message: "Device revoked successfully. All sessions for this device have been terminated.",
      sessionsTerminated: 2,
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Device not found or does not belong to user",
    schema: {
      example: {
        error: {
          code: "NOT_FOUND",
          message: "Device not found",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async revokeDevice(
    @Param("deviceId") deviceId: string,
    @Request() req: any,
  ): Promise<RevokeDeviceResponseDto> {
    const user: AuthenticatedUser = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Revoke device sessions first to count them
    await this.sessionService.revokeDeviceSessions(deviceId, "Device revoked by user");
    
    // Get session count before revoking (for response)
    const allSessions = await this.sessionService.getUserSessions(user.userId);
    const deviceSessions = allSessions.filter(s => s.sessionToken === deviceId);
    const sessionsTerminated = deviceSessions.length;
    
    // Revoke device (Requirements: 8.5, 8.6)
    await this.deviceService.revokeDevice(deviceId);

    this.auditService.logAuth("device_revoked", AuditEventResult.SUCCESS, {
      userId: user.userId,
      userEmail: user.email,
      resource: "device",
      ipAddress,
      userAgent,
      metadata: {
        requestMethod: "DELETE",
        requestPath: `/api/v2/auth/devices/${deviceId}`,
        deviceId,
        sessionsTerminated,
      },
    });

    return { 
      message: "Device revoked successfully. All sessions for this device have been terminated.",
      sessionsTerminated,
    };
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user sessions",
    description:
      "Get all active sessions for the authenticated user. Includes device information, IP address, location, and activity timestamps. Current session is marked with isCurrent flag.",
  })
  @ApiResponse({
    status: 200,
    description: "List of active sessions with device and location information",
    type: [SessionDto],
    example: [
      {
        id: "session-123",
        deviceId: "device-123",
        deviceName: "My Laptop",
        browser: "Chrome 120.0",
        os: "macOS 14.0",
        ipAddress: "192.168.1.100",
        location: '{"city":"San Francisco","country":"US"}',
        createdAt: "2026-02-27T10:00:00Z",
        lastActivityAt: "2026-02-27T10:30:00Z",
        expiresAt: "2024-01-22T10:00:00Z",
        isCurrent: true,
      },
      {
        id: "session-456",
        deviceId: "device-456",
        deviceName: null,
        browser: "Firefox 121.0",
        os: "Windows 11",
        ipAddress: "203.0.113.42",
        location: '{"city":"New York","country":"US"}',
        createdAt: "2024-01-14T15:00:00Z",
        lastActivityAt: "2024-01-14T15:20:00Z",
        expiresAt: "2024-01-21T15:00:00Z",
        isCurrent: false,
      },
    ],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async getSessions(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<SessionDto[]> {
    const user: AuthenticatedUser = req.user;
    const currentSessionId = user.sessionId || "";

    // Get sessions from session service (Requirements: 9.9)
    const sessions = await this.sessionService.getUserSessions(user.userId);
    
    // Get devices to enrich session data
    const devices = await this.deviceService.getUserDevices(user.userId);
    const deviceMap = new Map(devices.map(d => [d.id, d]));
    
    // Map Session[] to SessionDto[]
    return sessions.map(session => {
      const device = deviceMap.get(session.sessionToken);
      return {
        id: session.id,
        deviceId: session.sessionToken,
        deviceName: session.deviceName,
        browser: session.browser || device?.browser || "Unknown",
        os: session.os || device?.os || "Unknown",
        ipAddress: session.ipAddress || "Unknown",
        location: this.formatLocation(session.location ?? device?.lastLocation),
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        isCurrent: session.id === currentSessionId,
      };
    });
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Revoke session",
    description:
      "Revoke a specific session for the authenticated user. Use this to terminate a session from another device. Cannot revoke the current session (use logout instead).",
  })
  @ApiParam({
    name: "sessionId",
    description: "Unique session identifier to revoke",
    type: String,
    example: "session-456",
  })
  @ApiResponse({
    status: 200,
    description: "Session revoked successfully. User will be logged out from that device.",
    type: RevokeSessionResponseDto,
    example: {
      message: "Session revoked successfully",
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Session not found or does not belong to user",
    schema: {
      example: {
        error: {
          code: "NOT_FOUND",
          message: "Session not found",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async revokeSession(
    @Param("sessionId") sessionId: string,
    @Request() req: any,
  ): Promise<RevokeSessionResponseDto> {
    const user: AuthenticatedUser = req.user;
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Revoke specific session (Requirements: 9.10)
    await this.sessionService.revokeSession(sessionId, "Revoked by user");

    this.auditService.logAuth("session_revoked", AuditEventResult.SUCCESS, {
      userId: user.userId,
      userEmail: user.email,
      resource: "session",
      ipAddress,
      userAgent,
      metadata: {
        requestMethod: "DELETE",
        requestPath: `/api/v2/auth/sessions/${sessionId}`,
        sessionId,
      },
    });

    return { message: "Session revoked successfully" };
  }

  @Delete("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Revoke all sessions",
    description:
      "Revoke all sessions for the authenticated user except the current one. Use this to log out from all other devices while keeping the current session active. Useful if you suspect unauthorized access.",
  })
  @ApiResponse({
    status: 200,
    description: "All other sessions revoked successfully. Current session remains active.",
    type: RevokeAllSessionsResponseDto,
    example: {
      message: "All other sessions have been terminated.",
      sessionsTerminated: 3,
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized. Invalid or missing access token.",
    schema: {
      example: {
        error: {
          code: "TOKEN_INVALID",
          message: "Invalid or missing access token",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async revokeAllSessions(
    @Request() req: any,
  ): Promise<RevokeAllSessionsResponseDto> {
    const user: AuthenticatedUser = req.user;
    const currentSessionId = user.sessionId || "";
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Get session count before revoking
    const allSessions = await this.sessionService.getUserSessions(user.userId);
    const sessionsToRevoke = allSessions.filter(s => s.id !== currentSessionId);
    const sessionsTerminated = sessionsToRevoke.length;

    // Revoke all sessions except current (Requirements: 9.10)
    await this.sessionService.revokeUserSessions(
      user.userId,
      currentSessionId,
      "All sessions revoked by user",
    );

    this.auditService.logAuth(
      "all_sessions_revoked",
      AuditEventResult.SUCCESS,
      {
        userId: user.userId,
        userEmail: user.email,
        resource: "session",
        ipAddress,
        userAgent,
        metadata: {
          requestMethod: "DELETE",
          requestPath: "/api/v2/auth/sessions",
          sessionsTerminated,
          currentSessionId,
        },
      },
    );

    return {
      message: "All other sessions have been terminated.",
      sessionsTerminated,
    };
  }

  private formatLocation(location: { city?: string; region?: string; country?: string } | null | undefined): string | null {
    if (!location) return null;
    const parts = [location.city, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
}
