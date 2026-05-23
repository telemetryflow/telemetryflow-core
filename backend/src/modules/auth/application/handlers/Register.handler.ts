import { CommandHandler, ICommandHandler, CommandBus } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { RegisterCommand } from "../commands/Register.command";
import { RegisterUserCommand } from "../../../iam/application/commands/RegisterUser.command";
import { EmailVerificationService } from "../../services/email-verification.service";

/**
 * RegisterHandler - Handles registration command
 *
 * Responsibilities:
 * - Delegate user creation to IAM module via CQRS
 * - Generate verification token and send email
 * - Handle duplicate email/username (handled by IAM module)
 *
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */
@CommandHandler(RegisterCommand)
@Injectable()
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async execute(command: RegisterCommand): Promise<{
    message: string;
    userId: string;
    email: string;
  }> {
    // 1. Execute registration command via CQRS (handled by IAM module)
    // This creates an unverified user account (Requirement: 3.1)
    // Duplicate email/username checking is handled by IAM module (Requirement: 3.4)
    const userId: string = await this.commandBus.execute(
      new RegisterUserCommand(
        command.username,
        command.email,
        command.password,
        command.firstName,
        command.lastName,
        command.regionId,
        command.organizationId,
        command.workspaceId,
        command.tenantId,
        command.sendEmailVerification,
      ),
    );

    // 2. Conditionally send verification email (Requirement: 3.2)
    const shouldSendEmail = command.sendEmailVerification !== false;
    if (shouldSendEmail) {
      try {
        await this.emailVerificationService.sendVerificationEmail(
          userId,
          command.email,
        );
      } catch (error) {
        // Email verification failure should not block registration
        // The user can resend verification later
        console.error("Failed to send verification email:", error);
      }
    }

    return {
      message: shouldSendEmail
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful.",
      userId,
      email: command.email,
    };
  }
}
