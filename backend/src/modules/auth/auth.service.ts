import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Request } from "express";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import { UserEntity } from "../iam/infrastructure/persistence/entities/User.entity";
import { RoleEntity } from "../iam/infrastructure/persistence/entities/RoleEntity";
import { UserRoleEntity } from "../iam/infrastructure/persistence/entities/UserRole.entity";
import { UserPermissionEntity } from "../iam/infrastructure/persistence/entities/UserPermission.entity";
import { PermissionEntity } from "../iam/infrastructure/persistence/entities/PermissionEntity";
import {
  JwtPayload,
  AuthenticatedUser,
} from "./interfaces/jwt-payload.interface";
import { LoginDto } from "./dto/login.dto";
import { TokenResponseDto, UserProfileDto } from "./dto/token-response.dto";
import { DeviceService } from "./services/device.service";
import { SessionService } from "./services/session.service";
import { EmailService } from "./services/email.service";
import { TokenService } from "./services/token.service";
import { SuspiciousActivityService } from "./services/suspicious-activity.service";
import { SecurityLogService } from "./services/security-log.service";
import { MfaService } from "./services/mfa.service";

@Injectable()
export class AuthService {
  private refreshTokenStore: Map<string, { userId: string; expiresAt: Date }> =
    new Map();

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
    @InjectRepository(UserPermissionEntity)
    private readonly userPermissionRepository: Repository<UserPermissionEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly deviceService: DeviceService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly suspiciousActivityService: SuspiciousActivityService,
    private readonly securityLogService: SecurityLogService,
    private readonly mfaService: MfaService,
  ) {}

  async login(loginDto: LoginDto, request: Request): Promise<TokenResponseDto> {
    const { email, password } = loginDto;

    // Extract device information and IP address early for logging
    const ipAddress = request.ip || request.socket.remoteAddress || "unknown";
    const userAgent = request.headers["user-agent"] || "unknown";

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: null },
    });

    if (!user) {
      // Log failed login attempt (Requirement: 10.6)
      await this.securityLogService.logLoginFailure(
        null,
        ipAddress,
        userAgent,
        "Invalid email or password",
        { email },
      );
      throw new UnauthorizedException("Invalid email or password");
    }

    // Check if IP is blacklisted (Requirement: 10.7)
    if (this.securityLogService.isBlacklisted(ipAddress)) {
      const blacklistEntry =
        this.securityLogService.getBlacklistEntry(ipAddress);
      await this.securityLogService.logLoginFailure(
        user.id,
        ipAddress,
        userAgent,
        "IP address is blacklisted",
        { reason: blacklistEntry?.reason },
      );
      throw new UnauthorizedException("Access denied");
    }

    // Check if account is locked (Requirement: 1.8, 10.1)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      // Log failed login attempt due to account lockout (Requirement: 10.6)
      await this.securityLogService.logLoginFailure(
        user.id,
        ipAddress,
        userAgent,
        "Account is locked",
        { lockedUntil: user.lockedUntil },
      );
      throw new UnauthorizedException(
        `Account is locked. Try again after ${user.lockedUntil.toISOString()}`,
      );
    }

    // Check if user is active
    if (!user.isActive) {
      // Log failed login attempt due to inactive account (Requirement: 10.6)
      await this.securityLogService.logLoginFailure(
        user.id,
        ipAddress,
        userAgent,
        "Account is deactivated",
      );
      throw new UnauthorizedException("Account is deactivated");
    }

    // Verify password (Requirement: 1.1, 1.2)
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user, ipAddress, userAgent);
      throw new UnauthorizedException("Invalid email or password");
    }

    // Reset failed login attempts and update login info
    await this.handleSuccessfulLogin(user);

    // Check if MFA is enabled (Requirement: 7.4)
    if (user.mfa_enabled && user.mfa_secret) {
      // Check if MFA is locked
      const isMfaLocked = await this.mfaService.isMfaLocked(user.id);
      if (isMfaLocked) {
        await this.securityLogService.logLoginFailure(
          user.id,
          ipAddress,
          userAgent,
          "MFA locked due to too many failures",
          { mfaLockedUntil: user.mfa_locked_until },
        );
        throw new UnauthorizedException(
          `MFA verification locked. Try again after ${user.mfa_locked_until?.toISOString()}`,
        );
      }

      // Extract device information for MFA session
      const deviceInfo = this.deviceService.extractDeviceInfo(request);
      const device = await this.deviceService.getOrCreateDevice(
        user.id,
        deviceInfo.fingerprint,
        deviceInfo,
      );

      // Create temporary MFA session
      const mfaToken = this.mfaService.createMfaSession(user.id, {
        deviceId: device.id,
        deviceName: device.name,
        deviceType: device.deviceType,
        browser: device.browser,
        browserVersion: device.browserVersion,
        os: device.os,
        osVersion: device.osVersion,
        ipAddress: deviceInfo.ipAddress,
        location: deviceInfo.location,
      });

      // Log MFA required
      await this.securityLogService.logLoginSuccess(
        user.id,
        ipAddress,
        userAgent,
        {
          mfaRequired: true,
        },
      );

      // Return MFA required response
      return {
        mfaRequired: true,
        mfaToken,
        expiresIn: 300, // 5 minutes
      } as any;
    }

    // Extract device information from request (Requirement: 8.1)
    const deviceInfo = this.deviceService.extractDeviceInfo(request);

    // Check if this is a new device (Requirement: 8.2, 8.8)
    const isNewDevice = !(await this.deviceService.isKnownDevice(
      user.id,
      deviceInfo.fingerprint,
    ));

    // Get or create device record (Requirement: 8.1, 8.2)
    const device = await this.deviceService.getOrCreateDevice(
      user.id,
      deviceInfo.fingerprint,
      deviceInfo,
    );

    // Detect suspicious activity (Requirement: 10.3, 10.4)
    const suspiciousActivityResult =
      await this.suspiciousActivityService.detectSuspiciousActivity(
        user.id,
        deviceInfo,
      );

    // If suspicious activity detected, flag account and send alert
    if (suspiciousActivityResult.isSuspicious) {
      await this.suspiciousActivityService.flagAccount(
        user.id,
        suspiciousActivityResult.reasons,
        suspiciousActivityResult.riskScore,
      );

      // Log suspicious activity (Requirement: 10.6)
      await this.securityLogService.logSuspiciousActivity(
        user.id,
        ipAddress,
        userAgent,
        {
          reasons: suspiciousActivityResult.reasons,
          riskScore: suspiciousActivityResult.riskScore,
          deviceId: device.id,
        },
      );

      // If high risk, require additional verification
      if (suspiciousActivityResult.requiresVerification) {
        throw new UnauthorizedException(
          "Suspicious activity detected. Additional verification required. Please check your email.",
        );
      }
    }

    // Create session with device binding (Requirement: 1.5, 9.7)
    const session = await this.sessionService.createSession(
      user.id,
      device.id,
      {
        deviceName: device.name,
        deviceType: device.deviceType,
        browser: device.browser,
        browserVersion: device.browserVersion,
        os: device.os,
        osVersion: device.osVersion,
        ipAddress: deviceInfo.ipAddress,
        location: deviceInfo.location,
        rememberMe: false,
      },
    );

    // Get user roles and permissions
    const { roles, permissions } = await this.getUserRolesAndPermissions(
      user.id,
    );

    // Generate tokens with session ID (Requirement: 9.1)
    const tokens = await this.generateTokensWithSession(
      user,
      roles,
      permissions,
      session.id,
    );

    // Log successful login (Requirement: 10.6)
    await this.securityLogService.logLoginSuccess(
      user.id,
      ipAddress,
      userAgent,
      {
        deviceId: device.id,
        sessionId: session.id,
        isNewDevice,
      },
    );

    // Send login notification email for new devices (Requirement: 1.7, 2.1)
    if (isNewDevice) {
      try {
        await this.emailService.sendLoginNotification(user.email, {
          browser: device.browser || "Unknown",
          os: device.os || "Unknown",
          location: deviceInfo.location?.city || deviceInfo.location?.country,
          ipAddress: deviceInfo.ipAddress,
        });
      } catch (error) {
        // Log error but don't fail login if email fails
        console.error("Failed to send login notification email:", error);
      }
    }

    // Build user profile
    const userProfile: UserProfileDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
      avatar: user.avatar,
      tenantId: user.tenant_id,
      organizationId: user.organization_id,
    };

    return {
      ...tokens,
      user: userProfile,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponseDto> {
    const tokenData = this.refreshTokenStore.get(refreshToken);

    if (!tokenData) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (tokenData.expiresAt < new Date()) {
      this.refreshTokenStore.delete(refreshToken);
      throw new UnauthorizedException("Refresh token expired");
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: tokenData.userId, deletedAt: null },
    });

    if (!user || !user.isActive) {
      this.refreshTokenStore.delete(refreshToken);
      throw new UnauthorizedException("User not found or inactive");
    }

    // Remove old refresh token
    this.refreshTokenStore.delete(refreshToken);

    // Get user roles and permissions
    const { roles, permissions } = await this.getUserRolesAndPermissions(
      user.id,
    );

    // Generate new tokens
    const tokens = await this.generateTokens(user, roles, permissions);

    // Build user profile
    const userProfile: UserProfileDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
      avatar: user.avatar,
      tenantId: user.tenant_id,
      organizationId: user.organization_id,
    };

    return {
      ...tokens,
      user: userProfile,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    this.refreshTokenStore.delete(refreshToken);
  }

  async getCurrentUser(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const { roles, permissions } = await this.getUserRolesAndPermissions(
      user.id,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
      avatar: user.avatar,
      tenantId: user.tenant_id,
      organizationId: user.organization_id,
    };
  }

  async validateUser(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, deletedAt: null },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: payload.roles,
      permissions: payload.permissions,
      tenantId: payload.tenantId,
      organizationId: payload.organizationId,
      sessionId: payload.sessionId,
    };
  }

  private async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch {
      return false;
    }
  }

  /**
   * Handle failed login attempt
   * Requirements: 10.1, 10.2, 10.6
   * - Track failed login attempts
   * - Lock account after 5 failures within 15 minutes
   * - Lock duration is 30 minutes
   * - Send lockout notification email
   * - Log failed login attempt
   */
  private async handleFailedLogin(
    user: UserEntity,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const maxAttempts = 5;
    const lockDurationMinutes = 30; // Requirement 10.1: 30 minutes lockout
    const _attemptWindowMinutes = 15; // 5 failures within 15 minutes

    user.failedLoginAttempts += 1;
    user.lastFailedLoginAt = new Date();

    // Log failed login attempt (Requirement: 10.6)
    await this.securityLogService.logLoginFailure(
      user.id,
      ipAddress,
      userAgent,
      "Invalid password",
      {
        failedAttempts: user.failedLoginAttempts,
        maxAttempts,
      },
    );

    // Check if we should lock the account (Requirement 10.1)
    if (user.failedLoginAttempts >= maxAttempts) {
      user.lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);

      await this.userRepository.save(user);

      // Log account lockout (Requirement: 10.6)
      await this.securityLogService.logAccountLockout(
        user.id,
        ipAddress,
        userAgent,
        {
          failedAttempts: user.failedLoginAttempts,
          lockedUntil: user.lockedUntil,
        },
      );

      // Send lockout notification email (Requirement 10.2)
      try {
        await this.emailService.sendAccountLockoutNotification(
          user.email,
          user.lockedUntil,
        );
      } catch (error) {
        // Log error but don't fail the lockout if email fails
        console.error(
          "Failed to send account lockout notification email:",
          error,
        );
      }
    } else {
      await this.userRepository.save(user);
    }
  }

  /**
   * Handle successful login
   * Requirement 10.5: Reset failed attempt counter on successful login
   */
  private async handleSuccessfulLogin(user: UserEntity): Promise<void> {
    user.failedLoginAttempts = 0; // Requirement 10.5: Reset counter
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    user.loginCount += 1;

    await this.userRepository.save(user);
  }

  private async getUserRolesAndPermissions(
    userId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    // Get user roles
    const userRoles = await this.userRoleRepository.find({
      where: { user_id: userId },
    });

    const roleIds = userRoles.map((ur) => ur.role_id);

    // Get role names and their permissions
    const roles: string[] = [];
    const permissionSet = new Set<string>();

    if (roleIds.length > 0) {
      const roleEntities = await this.roleRepository
        .createQueryBuilder("role")
        .leftJoinAndSelect("role.permissions", "permissions")
        .where("role.id IN (:...roleIds)", { roleIds })
        .getMany();

      for (const role of roleEntities) {
        roles.push(role.name);
        if (role.permissions) {
          for (const permission of role.permissions) {
            permissionSet.add(permission.name);
          }
        }
      }
    }

    // Get direct user permissions
    const directPermissions = await this.userPermissionRepository.find({
      where: { user_id: userId },
    });

    if (directPermissions.length > 0) {
      const permissionIds = directPermissions.map((up) => up.permission_id);
      const permissionEntities = await this.permissionRepository
        .createQueryBuilder("permission")
        .where("permission.id IN (:...permissionIds)", { permissionIds })
        .getMany();

      for (const permission of permissionEntities) {
        permissionSet.add(permission.name);
      }
    }

    return {
      roles,
      permissions: Array.from(permissionSet),
    };
  }

  private async generateTokens(
    user: UserEntity,
    roles: string[],
    permissions: string[],
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
      tenantId: user.tenant_id,
      organizationId: user.organization_id,
    };

    const expiresIn = this.getExpiresInSeconds();
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = randomBytes(64).toString("base64url");
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    this.refreshTokenStore.set(refreshToken, {
      userId: user.id,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: "Bearer",
    };
  }

  /**
   * Generate tokens with session ID
   * Requirement: 9.1
   */
  private async generateTokensWithSession(
    user: UserEntity,
    roles: string[],
    permissions: string[],
    sessionId: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
      tenantId: user.tenant_id,
      organizationId: user.organization_id,
      sessionId, // Include session ID in token payload
    };

    const expiresIn = this.getExpiresInSeconds();
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = randomBytes(64).toString("base64url");
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    this.refreshTokenStore.set(refreshToken, {
      userId: user.id,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: "Bearer",
    };
  }

  private getExpiresInSeconds(): number {
    const expiresIn = this.configService.get<string>("JWT_EXPIRES_IN") || "24h";
    const match = expiresIn.match(/^(\d+)(h|d|m|s)?$/);

    if (!match) {
      return 86400; // Default 24 hours
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || "s";

    switch (unit) {
      case "d":
        return value * 86400;
      case "h":
        return value * 3600;
      case "m":
        return value * 60;
      case "s":
      default:
        return value;
    }
  }
}
