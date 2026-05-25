import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestPasswordReminderCommand } from "../commands/RequestPasswordReminder.command";
import { UserEntity } from "../../../iam/infrastructure/persistence/entities/User.entity";
import { EmailService } from "../../services/email.service";
import { RateLimiterService } from "../../services/rate-limiter.service";
import { SecurityLogService } from "../../services/security-log.service";
import { AuditService, AuditEventResult } from "../../../audit/audit.service";

/**
 * RequestPasswordReminderHandler - Handles password reminder request command
 *
 * Responsibilities:
 * - Verify user identity through email (Requirement: 6.2)
 * - Check rate limiting (3 per day per account) (Requirement: 6.4)
 * - Send encrypted password reminder (Requirement: 6.1, 6.3, 6.6)
 * - Log reminder request (Requirement: 6.7, 10.6)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 10.6
 *
 * Note: This implementation requires the User entity to have a password_reminder field
 * which should be added via database migration. The field should store encrypted reminders.
 */
@CommandHandler(RequestPasswordReminderCommand)
@Injectable()
export class RequestPasswordReminderHandler implements ICommandHandler<RequestPasswordReminderCommand> {
  // Rate limit: 3 requests per day per account
  private readonly RATE_LIMIT_MAX = 3;
  private readonly RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly securityLogService: SecurityLogService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RequestPasswordReminderCommand): Promise<{
    message: string;
  }> {
    const email = command.email.toLowerCase().trim();

    // 1. Find user (Requirement: 6.2)
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: null },
    });

    if (!user || !user.isActive) {
      // Log failed attempt
      await this.auditService.logAuth(
        "password_reminder_request",
        AuditEventResult.FAILURE,
        {
          userEmail: email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "User not found or inactive",
        },
      );

      // Return generic message to prevent email enumeration
      return {
        message:
          "If an account exists with this email and has a password reminder set, it will be sent.",
      };
    }

    // 2. Check rate limiting (Requirement: 6.4)
    const rateLimitKey = `password-reminder:${user.id}`;
    try {
      await this.rateLimiterService.checkRateLimit(
        rateLimitKey,
        this.RATE_LIMIT_MAX,
        this.RATE_LIMIT_WINDOW_MS,
      );
    } catch (error) {
      // Log rate limit exceeded
      await this.auditService.logAuth(
        "password_reminder_request",
        AuditEventResult.FAILURE,
        {
          userId: user.id,
          userEmail: user.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "Rate limit exceeded",
        },
      );

      throw error;
    }

    // 3. Check if user has a password reminder set
    // Note: This requires a password_reminder field in the User entity
    // which should be added via database migration
    const passwordReminder = (user as any).password_reminder || null;

    if (!passwordReminder) {
      // Log no reminder set
      await this.auditService.logAuth(
        "password_reminder_request",
        AuditEventResult.FAILURE,
        {
          userId: user.id,
          userEmail: user.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "No password reminder set",
        },
      );

      // Return generic message to prevent information disclosure
      return {
        message:
          "If an account exists with this email and has a password reminder set, it will be sent.",
      };
    }

    // 4. Send password reminder email (Requirement: 6.1, 6.3, 6.6)
    // The reminder is stored encrypted, so we decrypt it before sending
    // Note: Decryption logic should be implemented based on encryption method
    try {
      await this.emailService.sendPasswordReminder(
        user.email,
        passwordReminder,
      );
    } catch (error) {
      // Email failure should not block the request
      console.error("Failed to send password reminder email:", error);

      // Log email failure
      await this.auditService.logAuth(
        "password_reminder_request",
        AuditEventResult.FAILURE,
        {
          userId: user.id,
          userEmail: user.email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: `Email send failed: ${error.message}`,
        },
      );
    }

    // 5. Log successful request (Requirement: 6.7, 10.6)
    await this.securityLogService.logPasswordReminderRequest(
      user.id,
      command.ipAddress,
      command.userAgent,
    );

    await this.auditService.logAuth(
      "password_reminder_request",
      AuditEventResult.SUCCESS,
      {
        userId: user.id,
        userEmail: user.email,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
      },
    );

    return {
      message:
        "If an account exists with this email and has a password reminder set, it will be sent.",
    };
  }
}
