import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { OAuthLoginCommand } from "../commands/OAuthLogin.command";

/**
 * OAuthLoginHandler - Initiates OAuth login flow
 *
 * Responsibilities:
 * - Validate OAuth provider (Google, GitHub)
 * - Generate state token for CSRF protection
 * - Build authorization URL with proper scopes
 * - Return redirect URL for frontend
 *
 * Requirements: 1.3
 */
@CommandHandler(OAuthLoginCommand)
@Injectable()
export class OAuthLoginHandler implements ICommandHandler<OAuthLoginCommand> {
  private readonly oauthConfigs = {
    google: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: this.configService.get<string>("OAUTH_GOOGLE_CLIENT_ID"),
      redirectUri: this.configService.get<string>(
        "OAUTH_GOOGLE_REDIRECT_URI",
        "http://localhost:3000/auth/oauth/google/callback",
      ),
      scopes: ["openid", "email", "profile"],
    },
    github: {
      authorizationUrl: "https://github.com/login/oauth/authorize",
      clientId: this.configService.get<string>("OAUTH_GITHUB_CLIENT_ID"),
      redirectUri: this.configService.get<string>(
        "OAUTH_GITHUB_REDIRECT_URI",
        "http://localhost:3000/auth/oauth/github/callback",
      ),
      scopes: ["user:email", "read:user"],
    },
  };

  // In-memory store for pending OAuth states (in production, use Redis)
  private static pendingStates = new Map<
    string,
    {
      provider: string;
      organizationId: string;
      redirectUrl?: string;
      createdAt: Date;
    }
  >();

  constructor(private readonly configService: ConfigService) {}

  async execute(command: OAuthLoginCommand): Promise<{
    authorizationUrl: string;
    state: string;
  }> {
    // 1. Validate provider
    const provider = command.provider.toLowerCase();
    if (!["google", "github"].includes(provider)) {
      throw new BadRequestException(
        `Unsupported OAuth provider: ${command.provider}. Supported providers: google, github`,
      );
    }

    const config = this.oauthConfigs[provider as "google" | "github"];

    // 2. Check if OAuth is configured
    if (!config.clientId) {
      throw new BadRequestException(
        `OAuth provider ${provider} is not configured. Please set OAUTH_${provider.toUpperCase()}_CLIENT_ID environment variable.`,
      );
    }

    // 3. Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");

    // 4. Store pending state (expires in 10 minutes)
    OAuthLoginHandler.pendingStates.set(state, {
      provider,
      organizationId: command.organizationId,
      redirectUrl: command.redirectUrl,
      createdAt: new Date(),
    });

    // 5. Clean up expired states (older than 10 minutes)
    this.cleanupExpiredStates();

    // 6. Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId!,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      state,
      access_type: "offline",
      prompt: "consent",
    });

    const authorizationUrl = `${config.authorizationUrl}?${params.toString()}`;

    return {
      authorizationUrl,
      state,
    };
  }

  /**
   * Validate and retrieve pending OAuth state
   */
  static validateState(state: string): {
    provider: string;
    organizationId: string;
    redirectUrl?: string;
  } | null {
    const pending = this.pendingStates.get(state);

    if (!pending) {
      return null;
    }

    // Check if expired (10 minutes)
    const age = Date.now() - pending.createdAt.getTime();
    if (age > 10 * 60 * 1000) {
      this.pendingStates.delete(state);
      return null;
    }

    // Remove state after validation (single use)
    this.pendingStates.delete(state);

    return {
      provider: pending.provider,
      organizationId: pending.organizationId,
      redirectUrl: pending.redirectUrl,
    };
  }

  /**
   * Clean up expired states (older than 10 minutes)
   */
  private cleanupExpiredStates(): void {
    const now = Date.now();
    const expiredStates: string[] = [];

    OAuthLoginHandler.pendingStates.forEach((value, key) => {
      const age = now - value.createdAt.getTime();
      if (age > 10 * 60 * 1000) {
        expiredStates.push(key);
      }
    });

    expiredStates.forEach((state) => {
      OAuthLoginHandler.pendingStates.delete(state);
    });
  }
}
