import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { LogoutCommand } from "../commands/Logout.command";
import { SessionService } from "../../services/session.service";
import { TokenService } from "../../services/token.service";

/**
 * LogoutHandler - Handles logout command
 *
 * Responsibilities:
 * - Revoke current session
 * - Add access and refresh tokens to revocation list
 * - Clean up authentication state
 *
 * Requirements: 9.4
 */
@CommandHandler(LogoutCommand)
@Injectable()
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    // 1. Revoke the current session (Requirement: 9.4)
    await this.sessionService.revokeSession(command.sessionId, "User logout");

    // 2. Add access token to revocation list (Requirement: 9.4)
    await this.tokenService.revokeToken(command.accessToken);

    // 3. Add refresh token to revocation list (Requirement: 9.4)
    await this.tokenService.revokeToken(command.refreshToken);

    // Session and tokens are now invalidated
    // Frontend should clear stored tokens and reset authentication state (Requirement: 9.5)
  }
}
