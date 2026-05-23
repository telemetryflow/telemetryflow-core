import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { ChangePasswordCommand } from "../commands/ChangePassword.command";
import { UserService } from "../../services/user.service";
import { SessionService } from "../../services/session.service";
import { EmailService } from "../../services/email.service";
import { SecurityLogService } from "../../services/security-log.service";
import { AuditService, AuditEventResult } from "../../../audit/audit.service";

/**
 * ChangePasswordHandler - Handles password change command
 *
 * Responsibilities:
 * - Validate current password (Requirement: 4.1, 4.4)
 * - Update password with complexity validation (Requirement: 4.1, 4.5)
 * - Invalidate other sessions except current (Requirement: 4.2)
 * - Send confirmation email (Requirement: 4.3)
 * - Log password change event (Requirement: 4.8)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8
 */
@CommandHandler(ChangePasswordCommand)
@Injectable()
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
    private readonly securityLogService: SecurityLogService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<{
    message: string;
  }> {
    // 1. Find user
    const user = await this.userService.findById(command.userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // 2. Validate current password (Requirement: 4.4)
    const isCurrentPasswordValid = await this.userService.verifyPassword(
      command.currentPassword,
      user.getPasswordHash(),
    );

    if (!isCurrentPasswordValid) {
      // Log failed attempt
      await this.auditService.logAuth(
        "password_change",
        AuditEventResult.FAILURE,
        {
          userId: command.userId,
          userEmail: user.getEmail().getValue(),
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "Invalid current password",
        },
      );

      throw new UnauthorizedException("Current password is incorrect");
    }

    // 3. Update password (validates complexity automatically) (Requirement: 4.1, 4.5)
    try {
      await this.userService.updatePassword(
        command.userId,
        command.newPassword,
      );
    } catch (error) {
      // Log failed attempt
      await this.auditService.logAuth(
        "password_change",
        AuditEventResult.FAILURE,
        {
          userId: command.userId,
          userEmail: user.getEmail().getValue(),
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: error.message,
        },
      );

      throw error;
    }

    // 4. Invalidate all other sessions except current (Requirement: 4.2)
    await this.sessionService.revokeUserSessions(
      command.userId,
      command.sessionId,
      "Password changed",
    );

    // 5. Send confirmation email (Requirement: 4.3)
    try {
      await this.emailService.sendPasswordChangeConfirmation(
        user.getEmail().getValue(),
      );
    } catch (error) {
      // Email failure should not block password change
      console.error(
        "Failed to send password change confirmation email:",
        error,
      );
    }

    // 6. Log successful password change (Requirement: 4.8, 10.6)
    await this.securityLogService.logPasswordChange(
      command.userId,
      command.ipAddress,
      command.userAgent,
      {
        sessionsInvalidated: true,
      },
    );

    await this.auditService.logAuth(
      "password_change",
      AuditEventResult.SUCCESS,
      {
        userId: command.userId,
        userEmail: user.getEmail().getValue(),
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        metadata: {
          sessionsInvalidated: true,
        },
      },
    );

    return {
      message:
        "Password changed successfully. Other sessions have been terminated.",
    };
  }
}
