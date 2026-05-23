import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { SendVerificationEmailCommand } from "../commands/SendVerificationEmail.command";
import { EmailVerificationService } from "../../services/email-verification.service";

@CommandHandler(SendVerificationEmailCommand)
@Injectable()
export class SendVerificationEmailHandler implements ICommandHandler<SendVerificationEmailCommand> {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async execute(command: SendVerificationEmailCommand): Promise<void> {
    try {
      await this.emailVerificationService.sendVerificationEmail(
        command.userId,
        command.email,
      );
    } catch (error) {
      // Non-fatal — user can request re-send later
      console.error(
        `Failed to send verification email to ${command.email}:`,
        error,
      );
    }
  }
}
