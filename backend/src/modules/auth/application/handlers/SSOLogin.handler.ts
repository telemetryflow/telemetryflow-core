import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { SSOLoginCommand } from "../commands/SSOLogin.command";
import { SsoService } from "../../../sso/sso.service";

/**
 * SSOLoginHandler - Initiates SSO login flow
 *
 * Responsibilities:
 * - Validate SSO provider ID
 * - Delegate to SSO module for authorization URL generation
 * - Return redirect URL for frontend
 *
 * Requirements: 1.4
 */
@CommandHandler(SSOLoginCommand)
@Injectable()
export class SSOLoginHandler implements ICommandHandler<SSOLoginCommand> {
  constructor(
    @Inject(SsoService)
    private readonly ssoService: SsoService,
  ) {}

  async execute(command: SSOLoginCommand): Promise<{
    authorizationUrl: string;
    state: string;
  }> {
    try {
      // Delegate to SSO module to initiate authentication
      const result = await this.ssoService.initiateAuth(
        command.organizationId,
        command.providerId,
        command.redirectUrl,
      );

      return {
        authorizationUrl: result.authorizationUrl,
        state: result.state,
      };
    } catch (error) {
      // Re-throw with more context if needed
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to initiate SSO login: ${error.message}`,
      );
    }
  }
}
