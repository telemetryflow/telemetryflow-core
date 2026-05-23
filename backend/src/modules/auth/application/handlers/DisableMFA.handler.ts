import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DisableMFACommand } from "../commands/DisableMFA.command";
import { UserEntity } from "../../../iam/infrastructure/persistence/entities/User.entity";
import { MfaService } from "../../services/mfa.service";
import { EmailService } from "../../services/email.service";
import { AuditService, AuditEventResult } from "../../../audit/audit.service";

/**
 * DisableMFAHandler - Handles MFA disablement command
 *
 * Responsibilities:
 * - Require password re-authentication (Requirement: 7.7)
 * - Disable MFA for the user
 * - Send confirmation email (Requirement: 7.7)
 *
 * Requirements: 7.7
 */
@CommandHandler(DisableMFACommand)
@Injectable()
export class DisableMFAHandler implements ICommandHandler<DisableMFACommand> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mfaService: MfaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: DisableMFACommand): Promise<{ message: string }> {
    // 1. Find user
    const user = await this.userRepository.findOne({
      where: { id: command.userId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    // 2. Disable MFA with password re-authentication (Requirement: 7.7)
    // This delegates to MfaService which handles password verification and MFA disablement
    try {
      await this.mfaService.disableMfa(
        command.userId,
        command.password,
        command.code,
      );
    } catch (error) {
      // Log failed attempt
      await this.auditService.logAuth(
        "mfa_disable",
        AuditEventResult.FAILURE,
        {
          userId: command.userId,
          userEmail: user.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: error.message,
        },
      );

      throw error;
    }

    // 3. Send confirmation email (Requirement: 7.7)
    try {
      await this.emailService.sendMFAConfirmation(user.email, false);
    } catch (error) {
      // Email failure should not block MFA disablement
      console.error("Failed to send MFA confirmation email:", error);
    }

    // 4. Log successful MFA disablement
    await this.auditService.logAuth("mfa_disable", AuditEventResult.SUCCESS, {
      userId: command.userId,
      userEmail: user.email,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    });

    return {
      message: "MFA disabled successfully",
    };
  }
}
