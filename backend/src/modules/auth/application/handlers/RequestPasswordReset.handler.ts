import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { RequestPasswordResetCommand } from "../commands/RequestPasswordReset.command";
import { UserEntity } from "../../../iam/infrastructure/persistence/entities/User.entity";
import { EmailService } from "../../services/email.service";
import { RateLimiterService } from "../../services/rate-limiter.service";
import { AuditService, AuditEventResult } from "../../../audit/audit.service";

/**
 * RequestPasswordResetHandler - Handles password reset request command
 *
 * Responsibilities:
 * - Check rate limiting (3 per hour per email) (Requirement: 5.7)
 * - Generate time-limited reset token (1 hour) (Requirement: 5.1)
 * - Send password reset email (Requirement: 5.2)
 * - Prevent email enumeration (always returns success)
 * - Log reset request
 *
 * Requirements: 5.1, 5.2, 5.7
 */
@CommandHandler(RequestPasswordResetCommand)
@Injectable()
export class RequestPasswordResetHandler implements ICommandHandler<RequestPasswordResetCommand> {
  // In-memory token storage (in production, use Redis or database)
  private static resetTokens: Map<
    string,
    {
      userId: string;
      email: string;
      tokenHash: string;
      expiresAt: Date;
    }
  > = new Map();

  // Rate limit: 3 requests per hour per email
  private readonly RATE_LIMIT_MAX = 3;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  // Token expiry: 1 hour
  private readonly TOKEN_EXPIRY_MS = 60 * 60 * 1000;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<{
    message: string;
  }> {
    const email = command.email.toLowerCase().trim();

    // 1. Check rate limiting (Requirement: 5.7)
    const rateLimitKey = `password-reset:${email}`;
    try {
      await this.rateLimiterService.checkRateLimit(
        rateLimitKey,
        this.RATE_LIMIT_MAX,
        this.RATE_LIMIT_WINDOW_MS,
      );
    } catch (error) {
      // Log rate limit exceeded
      await this.auditService.logAuth(
        "password_reset_request",
        AuditEventResult.FAILURE,
        {
          userEmail: email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "Rate limit exceeded",
        },
      );

      throw error;
    }

    // 2. Find user (always return success to prevent email enumeration)
    const user = await this.userRepository.findOne({
      where: { email, deletedAt: null },
    });

    if (!user || !user.isActive) {
      // Log failed attempt (user not found or inactive)
      await this.auditService.logAuth(
        "password_reset_request",
        AuditEventResult.FAILURE,
        {
          userEmail: email,
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
          errorMessage: "User not found or inactive",
        },
      );

      // Still return success to prevent email enumeration
      return {
        message:
          "If an account exists with this email, a password reset link will be sent.",
      };
    }

    // 3. Generate reset token (Requirement: 5.1)
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MS);

    // Clean up any existing tokens for this user
    for (const [
      key,
      value,
    ] of RequestPasswordResetHandler.resetTokens.entries()) {
      if (value.userId === user.id) {
        RequestPasswordResetHandler.resetTokens.delete(key);
      }
    }

    // Store token
    RequestPasswordResetHandler.resetTokens.set(tokenHash, {
      userId: user.id,
      email: user.email,
      tokenHash,
      expiresAt,
    });

    // 4. Send password reset email (Requirement: 5.2)
    try {
      await this.emailService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      // Email failure should not block the request
      console.error("Failed to send password reset email:", error);

      // Log email failure
      await this.auditService.logAuth(
        "password_reset_request",
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

    // 5. Log successful request
    await this.auditService.logAuth(
      "password_reset_request",
      AuditEventResult.SUCCESS,
      {
        userId: user.id,
        userEmail: user.email,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        metadata: {
          tokenExpiresAt: expiresAt.toISOString(),
        },
      },
    );

    return {
      message:
        "If an account exists with this email, a password reset link will be sent.",
    };
  }

  /**
   * Get stored reset token (used by ConfirmPasswordReset handler)
   */
  static getResetToken(tokenHash: string) {
    return RequestPasswordResetHandler.resetTokens.get(tokenHash);
  }

  /**
   * Delete stored reset token (used by ConfirmPasswordReset handler)
   */
  static deleteResetToken(tokenHash: string) {
    RequestPasswordResetHandler.resetTokens.delete(tokenHash);
  }
}
