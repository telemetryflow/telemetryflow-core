import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EnableMFACommand } from "../commands/EnableMFA.command";
import { UserEntity } from "../../../iam/infrastructure/persistence/entities/User.entity";
import { MfaService } from "../../services/mfa.service";
import { EmailService } from "../../services/email.service";
import { AuditService, AuditEventResult } from "../../../audit/audit.service";

/**
 * EnableMFAHandler - Handles MFA enablement command
 *
 * Responsibilities:
 * - Verify initial TOTP code before enabling (Requirement: 7.2)
 * - Enable MFA for the user
 * - Send confirmation email (Requirement: 7.3)
 *
 * Requirements: 7.2, 7.3
 */
@CommandHandler(EnableMFACommand)
@Injectable()
export class EnableMFAHandler implements ICommandHandler<EnableMFACommand> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mfaService: MfaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: EnableMFACommand): Promise<{ message: string }> {
    // 1. Find user
    const user = await this.userRepository.findOne({
      where: { id: command.userId, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    // 2. Verify TOTP code before enabling (Requirement: 7.2)
    // This delegates to MfaService which handles the verification logic
    try {
      await this.mfaService.verifyMfaSetup(command.userId, command.code);
    } catch (error) {
      // Log failed attempt
      await this.auditService.logAuth(
        "mfa_enable",
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

    // 3. Send confirmation email (Requirement: 7.3)
    try {
      await this.emailService.sendMFAConfirmation(user.email, true);
    } catch (error) {
      // Email failure should not block MFA enablement
      console.error("Failed to send MFA confirmation email:", error);
    }

    // 4. Log successful MFA enablement
    await this.auditService.logAuth("mfa_enable", AuditEventResult.SUCCESS, {
      userId: command.userId,
      userEmail: user.email,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    });

    return {
      message: "MFA enabled successfully",
    };
  }
}
