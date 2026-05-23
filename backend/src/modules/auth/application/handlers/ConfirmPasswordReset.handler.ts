import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable, BadRequestException } from "@nestjs/common";
import * as crypto from "crypto";
import { ConfirmPasswordResetCommand } from "../commands/ConfirmPasswordReset.command";
import { UserService } from "../../services/user.service";
import { SessionService } from "../../services/session.service";
import { EmailService } from "../../services/email.service";
import { SecurityLogService } from "../../services/security-log.service";
import { AuditService, AuditEventResult } from "../../../audit/audit.service";
import { RequestPasswordResetHandler } from "./RequestPasswordReset.handler";

/**
 * ConfirmPasswordResetHandler - Handles password reset confirmation command
 *
 * Responsibilities:
 * - Validate reset token (Requirement: 5.4)
 * - Update password with complexity validation (Requirement: 5.4)
 * - Invalidate all sessions (Requirement: 5.5)
 * - Send confirmation email (Requirement: 5.8)
 * - Log password reset event (Requirement: 10.6)
 *
 * Requirements: 5.4, 5.5, 5.6, 5.8, 10.6
 */
@CommandHandler(ConfirmPasswordResetCommand)
@Injectable()
export class ConfirmPasswordResetHandler implements ICommandHandler<ConfirmPasswordResetCommand> {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
    private readonly securityLogService: SecurityLogService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: ConfirmPasswordResetCommand): Promise<{
    message: string;
  }> {
    // 1. Validate reset token (Requirement: 5.4)
    const tokenHash = crypto
      .createHash("sha256")
      .update(command.token)
      .digest("hex");

    const tokenData = RequestPasswordResetHandler.getResetToken(tokenHash);

    if (!tokenData) {
      // Log failed attempt
      await this.auditService.logAuth(
        "password_reset_confirm",
        AuditEventResult.FAILURE,
        {
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "Invalid or expired reset token",
        },
      );

      throw new BadRequestException("Invalid or expired reset token");
    }

    // Check if token expired
    if (tokenData.expiresAt < new Date()) {
      // Clean up expired token
      RequestPasswordResetHandler.deleteResetToken(tokenHash);

      // Log failed attempt
      await this.auditService.logAuth(
        "password_reset_confirm",
        AuditEventResult.FAILURE,
        {
          userId: tokenData.userId,
          userEmail: tokenData.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "Reset token has expired",
        },
      );

      throw new BadRequestException("Reset token has expired");
    }

    // 2. Find user
    const user = await this.userService.findById(tokenData.userId);

    if (!user) {
      // Clean up token
      RequestPasswordResetHandler.deleteResetToken(tokenHash);

      // Log failed attempt
      await this.auditService.logAuth(
        "password_reset_confirm",
        AuditEventResult.FAILURE,
        {
          userId: tokenData.userId,
          userEmail: tokenData.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "User not found",
        },
      );

      throw new BadRequestException("User not found");
    }

    // 3. Update password (validates complexity automatically) (Requirement: 5.4)
    try {
      await this.userService.updatePassword(
        tokenData.userId,
        command.newPassword,
      );
    } catch (error) {
      // Log failed attempt
      await this.auditService.logAuth(
        "password_reset_confirm",
        AuditEventResult.FAILURE,
        {
          userId: tokenData.userId,
          userEmail: tokenData.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: error.message,
        },
      );

      throw error;
    }

    // 4. Invalidate all sessions (Requirement: 5.5)
    await this.sessionService.revokeUserSessions(
      tokenData.userId,
      undefined, // No exception - revoke all sessions
      "Password reset",
    );

    // 5. Clean up token (Requirement: 5.6)
    RequestPasswordResetHandler.deleteResetToken(tokenHash);

    // 6. Send confirmation email (Requirement: 5.8)
    try {
      await this.emailService.sendPasswordChangeConfirmation(tokenData.email);
    } catch (error) {
      // Email failure should not block password reset
      console.error("Failed to send password reset confirmation email:", error);
    }

    // 7. Log successful password reset (Requirement: 10.6)
    await this.securityLogService.logPasswordReset(
      tokenData.userId,
      command.ipAddress,
      command.userAgent,
      {
        allSessionsInvalidated: true,
      },
    );

    await this.auditService.logAuth(
      "password_reset_confirm",
      AuditEventResult.SUCCESS,
      {
        userId: tokenData.userId,
        userEmail: tokenData.email,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        metadata: {
          allSessionsInvalidated: true,
        },
      },
    );

    return {
      message:
        "Password has been reset successfully. All sessions have been terminated.",
    };
  }
}
