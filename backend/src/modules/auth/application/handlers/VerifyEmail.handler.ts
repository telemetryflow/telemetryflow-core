import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { VerifyEmailCommand } from "../commands/VerifyEmail.command";
import { EmailVerificationService } from "../../services/email-verification.service";

/**
 * VerifyEmailHandler - Handles email verification command
 *
 * Responsibilities:
 * - Validate verification token
 * - Activate user account
 * - Handle expired tokens
 *
 * Requirements: 3.3, 3.7
 */
@CommandHandler(VerifyEmailCommand)
@Injectable()
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<{ message: string }> {
    // Validate token and activate account (Requirements: 3.3, 3.7)
    // The service handles expired token validation
    return await this.emailVerificationService.verifyByToken(command.token);
  }
}
