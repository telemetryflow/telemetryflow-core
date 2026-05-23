import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditModule } from "../audit/audit.module";
import { CacheModule } from "../../shared/cache/cache.module";
import { SsoModule } from "../sso/sso.module";
import { IAMModule } from "../iam/iam.module";
import { ApiKeysModule } from "../api-keys/api-keys.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import { SuperAdminGuard } from "./guards/super-admin.guard";
import { UserEntity } from "../iam/infrastructure/persistence/entities/User.entity";
import { RoleEntity } from "../iam/infrastructure/persistence/entities/RoleEntity";
import { UserRoleEntity } from "../iam/infrastructure/persistence/entities/UserRole.entity";
import { UserPermissionEntity } from "../iam/infrastructure/persistence/entities/UserPermission.entity";
import { PermissionEntity } from "../iam/infrastructure/persistence/entities/PermissionEntity";
import { SessionEntity } from "./infrastructure/persistence/entities/Session.entity";
import { DeviceEntity } from "./infrastructure/persistence/entities/Device.entity";
import { SecurityLogEntity } from "./infrastructure/persistence/entities/SecurityLog.entity";
import { InviteTokenEntity } from "./infrastructure/persistence/entities/InviteToken.entity";

// Enhanced auth services
import { MfaService } from "./services/mfa.service";
import { EmailVerificationService } from "./services/email-verification.service";
import { PasswordResetService } from "./services/password-reset.service";
import { RegistrationService } from "./services/registration.service";
import { EmailService } from "./services/email.service";
import { UserService } from "./services/user.service";
import { TokenService } from "./services/token.service";
import { SessionService } from "./services/session.service";
import { DeviceService } from "./services/device.service";
import { RateLimiterService } from "./services/rate-limiter.service";
import { SuspiciousActivityService } from "./services/suspicious-activity.service";
import { SecurityLogService } from "./services/security-log.service";
import { OrganizationService } from "./services/organization.service";
import { AdminManagementService } from "./services/admin-management.service";

// Enhanced auth controllers
import { MfaController } from "./controllers/mfa.controller";
import { EmailVerificationController } from "./controllers/email-verification.controller";
import { PasswordResetController } from "./controllers/password-reset.controller";
import { OrganizationController } from "./controllers/organization.controller";
import { AdminManagementController } from "./controllers/admin-management.controller";

// CQRS Command Handlers
import { RegisterHandler } from "./application/handlers/Register.handler";
import { VerifyEmailHandler } from "./application/handlers/VerifyEmail.handler";
import { LogoutHandler } from "./application/handlers/Logout.handler";
import { ChangePasswordHandler } from "./application/handlers/ChangePassword.handler";
import { RequestPasswordResetHandler } from "./application/handlers/RequestPasswordReset.handler";
import { ConfirmPasswordResetHandler } from "./application/handlers/ConfirmPasswordReset.handler";
import { RequestPasswordReminderHandler } from "./application/handlers/RequestPasswordReminder.handler";
import { EnableMFAHandler } from "./application/handlers/EnableMFA.handler";
import { DisableMFAHandler } from "./application/handlers/DisableMFA.handler";
import { VerifyMFAHandler } from "./application/handlers/VerifyMFA.handler";
import { OAuthLoginHandler } from "./application/handlers/OAuthLogin.handler";
import { OAuthCallbackHandler } from "./application/handlers/OAuthCallback.handler";
import { SSOLoginHandler } from "./application/handlers/SSOLogin.handler";
import { SSOCallbackHandler } from "./application/handlers/SSOCallback.handler";
import { SendVerificationEmailHandler } from "./application/handlers/SendVerificationEmail.handler";

// CQRS Query Handlers
import { SetupMFAHandler } from "./application/handlers/SetupMFA.handler";

@Module({
  imports: [
    CqrsModule,
    AuditModule,
    CacheModule,
    SsoModule,
    IAMModule,
    ApiKeysModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>("JWT_SECRET") || "default-secret",
        signOptions: {
          expiresIn: (configService.get<string>("JWT_EXPIRES_IN") ||
            "24h") as any,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      UserRoleEntity,
      UserPermissionEntity,
      PermissionEntity,
      SessionEntity,
      DeviceEntity,
      SecurityLogEntity,
      InviteTokenEntity,
    ]),
  ],
  controllers: [
    AuthController,
    MfaController,
    EmailVerificationController,
    PasswordResetController,
    OrganizationController,
    AdminManagementController,
  ],
  providers: [
    AuthService,
    MfaService,
    EmailVerificationService,
    PasswordResetService,
    RegistrationService,
    EmailService,
    UserService,
    TokenService,
    SessionService,
    DeviceService,
    RateLimiterService,
    SuspiciousActivityService,
    SecurityLogService,
    OrganizationService,
    AdminManagementService,
    JwtStrategy,
    JwtAuthGuard,
    PermissionsGuard,
    RateLimitGuard,
    SuperAdminGuard,
    // CQRS Command Handlers
    RegisterHandler,
    VerifyEmailHandler,
    LogoutHandler,
    ChangePasswordHandler,
    RequestPasswordResetHandler,
    ConfirmPasswordResetHandler,
    RequestPasswordReminderHandler,
    EnableMFAHandler,
    DisableMFAHandler,
    VerifyMFAHandler,
    OAuthLoginHandler,
    OAuthCallbackHandler,
    SSOLoginHandler,
    SSOCallbackHandler,
    SendVerificationEmailHandler,
    // CQRS Query Handlers
    SetupMFAHandler,
  ],
  exports: [
    AuthService,
    MfaService,
    EmailVerificationService,
    PasswordResetService,
    RegistrationService,
    EmailService,
    UserService,
    TokenService,
    SessionService,
    DeviceService,
    SuspiciousActivityService,
    SecurityLogService,
    OrganizationService,
    AdminManagementService,
    JwtAuthGuard,
    PermissionsGuard,
    RateLimitGuard,
    SuperAdminGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
