import { Injectable } from '@nestjs/common';

import {
  ISsoProvider,
  SsoProviderType,
  SsoProviderConfig,
  SsoUserProfile,
  SsoAuthResult,
  OAuth2Provider,
} from '../interfaces';

interface OAuth2TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

// Provider-specific configurations
const PROVIDER_CONFIGS: Record<string, {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}> = {
  [OAuth2Provider.GOOGLE]: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scopes: ['openid', 'email', 'profile'],
  },
  [OAuth2Provider.GITHUB]: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['user:email', 'read:user'],
  },
  [OAuth2Provider.MICROSOFT]: {
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['openid', 'email', 'profile', 'User.Read'],
  },
  [OAuth2Provider.AZURE_AD]: {
    authorizationUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: ['openid', 'email', 'profile', 'User.Read'],
  },
};

@Injectable()
export class OAuth2ProviderService implements ISsoProvider {
  private config: SsoProviderConfig;
  private providerUrls: typeof PROVIDER_CONFIGS[string];

  constructor(config: SsoProviderConfig) {
    this.config = config;
    this.providerUrls = this.getProviderUrls();
  }

  getType(): SsoProviderType {
    return SsoProviderType.OAUTH2;
  }

  getName(): string {
    return this.config.providerName;
  }

  async getAuthorizationUrl(state: string, nonce?: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.config.clientId!,
      redirect_uri: this.config.callbackUrl!,
      response_type: 'code',
      scope: (this.config.scopes || this.providerUrls.scopes).join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    if (nonce) {
      params.append('nonce', nonce);
    }

    return `${this.providerUrls.authorizationUrl}?${params.toString()}`;
  }

  async handleCallback(code: string, _state: string): Promise<SsoAuthResult> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCode(code);

      // Get user profile
      const user = await this.getUserProfile(tokens.access_token);

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        errorCode: 'OAUTH_ERROR',
      };
    }
  }

  async getUserProfile(accessToken: string): Promise<SsoUserProfile> {
    const response = await fetch(this.providerUrls.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return this.mapUserProfile(data);
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    const response = await fetch(this.providerUrls.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const tokens: OAuth2TokenResponse = await response.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    };
  }

  private async exchangeCode(code: string): Promise<OAuth2TokenResponse> {
    const response = await fetch(this.providerUrls.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        code,
        redirect_uri: this.config.callbackUrl!,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    return response.json();
  }

  private mapUserProfile(data: Record<string, unknown>): SsoUserProfile {
    const mapping = this.config.attributeMapping || this.getDefaultMapping();

    const getValue = (key: string): string | undefined => {
      const path = mapping[key] || key;
      return this.getNestedValue(data, path) as string | undefined;
    };

    return {
      providerId: this.config.id,
      providerType: SsoProviderType.OAUTH2,
      providerName: this.config.providerName,
      externalId: getValue('id') || getValue('sub') || '',
      email: getValue('email') || '',
      emailVerified: (getValue('email_verified') as unknown as boolean) || false,
      firstName: getValue('given_name') || getValue('first_name'),
      lastName: getValue('family_name') || getValue('last_name'),
      displayName: getValue('name') || getValue('login'),
      avatar: getValue('picture') || getValue('avatar_url'),
      locale: getValue('locale'),
      raw: data,
    };
  }

  private getDefaultMapping(): Record<string, string> {
    switch (this.config.providerName) {
      case OAuth2Provider.GOOGLE:
        return {
          id: 'sub',
          email: 'email',
          email_verified: 'email_verified',
          given_name: 'given_name',
          family_name: 'family_name',
          name: 'name',
          picture: 'picture',
          locale: 'locale',
        };
      case OAuth2Provider.GITHUB:
        return {
          id: 'id',
          email: 'email',
          name: 'name',
          login: 'login',
          avatar_url: 'avatar_url',
        };
      case OAuth2Provider.MICROSOFT:
      case OAuth2Provider.AZURE_AD:
        return {
          id: 'id',
          email: 'mail',
          given_name: 'givenName',
          family_name: 'surname',
          name: 'displayName',
        };
      default:
        return {};
    }
  }

  private getProviderUrls(): typeof PROVIDER_CONFIGS[string] {
    const preset = PROVIDER_CONFIGS[this.config.providerName];

    if (preset) {
      return {
        authorizationUrl: this.config.authorizationUrl || preset.authorizationUrl,
        tokenUrl: this.config.tokenUrl || preset.tokenUrl,
        userInfoUrl: this.config.userInfoUrl || preset.userInfoUrl,
        scopes: this.config.scopes || preset.scopes,
      };
    }

    // Custom provider
    return {
      authorizationUrl: this.config.authorizationUrl!,
      tokenUrl: this.config.tokenUrl!,
      userInfoUrl: this.config.userInfoUrl!,
      scopes: this.config.scopes || ['openid', 'email', 'profile'],
    };
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj as unknown);
  }
}

@Injectable()
export class OAuth2ProviderFactory {
  create(config: SsoProviderConfig): OAuth2ProviderService {
    return new OAuth2ProviderService(config);
  }
}
