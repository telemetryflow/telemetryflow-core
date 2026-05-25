import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VerifyMFACommand } from "../commands/VerifyMFA.command";
import { UserEntity } from "../../../iam/infrastructure/persistence/entities/User.entity";
import { MfaService } from "../../services/mfa.service";
import { SessionService } from "../../services/session.service";
import { TokenService } from "../../services/token.service";
import { SecurityLogService } from "../../services/security-log.service";
import { TokenResponseDto, UserProfileDto } from "../../dto/token-response.dto";

/**
 * VerifyMFAHandler - Handles MFA verification during login
 *
 * Responsibilities:
 * - Validate MFA session token
 * - Verify TOTP or backup code (Requirements: 7.4, 7.9)
 * - Track MFA failures (Requirement: 7.5)
 * - Implement lockout after 5 failures (Requirement: 7.6)
 * - Create session and generate tokens on success
 * - Log MFA verification events
 *
 * Requirements: 7.4, 7.5, 7.6, 7.9
 */
@CommandHandler(VerifyMFACommand)
@Injectable()
export class VerifyMFAHandler implements ICommandHandler<VerifyMFACommand> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mfaService: MfaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly securityLogService: SecurityLogService,
  ) {}

  async execute(command: VerifyMFACommand): Promise<TokenResponseDto> {
    // 1. Validate MFA session token (Requirement: 7.4)
    const mfaSession = this.mfaService.validateMfaSession(command.mfaToken);

    if (!mfaSession) {
      throw new UnauthorizedException(
        "Invalid or expired MFA session. Please login again.",
      );
    }

    const { userId, deviceInfo } = mfaSession;

    // 2. Find user
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }

    // 3. Check if MFA is enabled
    if (!user.mfa_enabled || !user.mfa_secret) {
      throw new BadRequestException("MFA is not enabled for this user");
    }

    // 4. Check if MFA is locked (Requirement: 7.6)
    const isLocked = await this.mfaService.isMfaLocked(userId);
    if (isLocked) {
      await this.securityLogService.logMFAFailure(
        userId,
        command.ipAddress,
        command.userAgent,
        "MFA locked due to too many failures",
        {
          mfaLockedUntil: user.mfa_locked_until,
        },
      );

      throw new UnauthorizedException(
        `MFA verification locked. Try again after ${user.mfa_locked_until?.toISOString()}`,
      );
    }

    // 5. Verify MFA code (Requirements: 7.4, 7.9)
    let isValid = false;
    try {
      isValid = await this.mfaService.verifyMfaCode(
        userId,
        command.code,
        command.isRecoveryCode,
      );
    } catch (error) {
      // Log error but continue to handle as invalid code
      console.error("Error verifying MFA code:", error);
    }

    // 6. Handle invalid code (Requirement: 7.5)
    if (!isValid) {
      await this.mfaService.incrementMfaFailures(userId);

      // Refresh user to get updated failure count
      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
      });

      await this.securityLogService.logMFAFailure(
        userId,
        command.ipAddress,
        command.userAgent,
        "Invalid MFA code",
        {
          failureCount: updatedUser?.mfa_failure_count || 0,
          isRecoveryCode: command.isRecoveryCode,
        },
      );

      throw new UnauthorizedException("Invalid verification code");
    }

    // 7. Reset MFA failure count on success (Requirement: 7.5)
    await this.mfaService.resetMfaFailures(userId);

    // 8. Remove MFA session token
    this.mfaService.removeMfaSession(command.mfaToken);

    // 9. Create session with device binding
    const session = await this.sessionService.createSession(
      userId,
      deviceInfo.deviceId,
      {
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        os: deviceInfo.os,
        osVersion: deviceInfo.osVersion,
        ipAddress: command.ipAddress,
        location: deviceInfo.location,
        rememberMe: false,
      },
    );

    // 10. Generate tokens with session ID
    const tokens = this.tokenService.generateSessionTokens(
      userId,
      session.id,
      deviceInfo.deviceId,
    );

    // 11. Get user roles and permissions
    const { roles, permissions } =
      await this.getUserRolesAndPermissions(userId);

    // 12. Log successful MFA verification
    await this.securityLogService.logMFASuccess(
      userId,
      command.ipAddress,
      command.userAgent,
      {
        sessionId: session.id,
        deviceId: deviceInfo.deviceId,
        isRecoveryCode: command.isRecoveryCode,
      },
    );

    // 13. Build user profile
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
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: "Bearer",
      user: userProfile,
    };
  }

  private async getUserRolesAndPermissions(
    _userId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    // This is a simplified version - in production, you'd query the actual roles/permissions
    // For now, return empty arrays as this is handled by the auth service
    return {
      roles: [],
      permissions: [],
    };
  }
}
