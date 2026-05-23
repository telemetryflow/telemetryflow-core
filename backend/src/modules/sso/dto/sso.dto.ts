import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsEnum, IsUUID, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SsoProviderType, OAuth2Provider } from '../interfaces';

// --- Configuration DTOs ---

export class CreateSsoProviderDto {
  @ApiProperty({ description: 'Display name for the provider' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: SsoProviderType, description: 'SSO provider type' })
  @IsEnum(SsoProviderType)
  providerType: SsoProviderType;

  @ApiProperty({ enum: OAuth2Provider, description: 'Provider name (for OAuth2)' })
  @IsString()
  @IsNotEmpty()
  providerName: string;

  @ApiPropertyOptional({ description: 'OAuth2/OIDC Client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'OAuth2/OIDC Client Secret' })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Authorization URL (for custom providers)' })
  @IsOptional()
  @IsUrl()
  authorizationUrl?: string;

  @ApiPropertyOptional({ description: 'Token URL (for custom providers)' })
  @IsOptional()
  @IsUrl()
  tokenUrl?: string;

  @ApiPropertyOptional({ description: 'User info URL (for custom providers)' })
  @IsOptional()
  @IsUrl()
  userInfoUrl?: string;

  @ApiPropertyOptional({ description: 'OAuth2 scopes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ description: 'SAML Entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'SAML SSO URL' })
  @IsOptional()
  @IsUrl()
  ssoUrl?: string;

  @ApiPropertyOptional({ description: 'SAML SLO URL' })
  @IsOptional()
  @IsUrl()
  sloUrl?: string;

  @ApiPropertyOptional({ description: 'SAML Certificate (PEM format)' })
  @IsOptional()
  @IsString()
  certificate?: string;

  @ApiPropertyOptional({ description: 'Allowed email domains', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiPropertyOptional({ description: 'Auto-create users on first login' })
  @IsOptional()
  @IsBoolean()
  autoCreateUsers?: boolean;

  @ApiPropertyOptional({ description: 'Default role ID for auto-created users' })
  @IsOptional()
  @IsUUID()
  defaultRoleId?: string;

  @ApiPropertyOptional({ description: 'Attribute mapping for user profile' })
  @IsOptional()
  attributeMapping?: Record<string, string>;
}

export class UpdateSsoProviderDto {
  @ApiPropertyOptional({ description: 'Display name for the provider' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Enable/disable the provider' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'OAuth2/OIDC Client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'OAuth2/OIDC Client Secret' })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Authorization URL' })
  @IsOptional()
  @IsUrl()
  authorizationUrl?: string;

  @ApiPropertyOptional({ description: 'Token URL' })
  @IsOptional()
  @IsUrl()
  tokenUrl?: string;

  @ApiPropertyOptional({ description: 'User info URL' })
  @IsOptional()
  @IsUrl()
  userInfoUrl?: string;

  @ApiPropertyOptional({ description: 'OAuth2 scopes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({ description: 'Allowed email domains', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiPropertyOptional({ description: 'Auto-create users on first login' })
  @IsOptional()
  @IsBoolean()
  autoCreateUsers?: boolean;

  @ApiPropertyOptional({ description: 'Default role ID for auto-created users' })
  @IsOptional()
  @IsUUID()
  defaultRoleId?: string;

  @ApiPropertyOptional({ description: 'Attribute mapping for user profile' })
  @IsOptional()
  attributeMapping?: Record<string, string>;
}

// --- Response DTOs ---

export class SsoProviderResponseDto {
  @ApiProperty({ description: 'Provider ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Display name' })
  name: string;

  @ApiProperty({ enum: SsoProviderType })
  providerType: SsoProviderType;

  @ApiProperty({ description: 'Provider name' })
  providerName: string;

  @ApiProperty({ description: 'Whether the provider is enabled' })
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Client ID (masked)' })
  clientId?: string;

  @ApiPropertyOptional({ description: 'Callback URL' })
  callbackUrl?: string;

  @ApiPropertyOptional({ description: 'Allowed email domains' })
  allowedDomains?: string[];

  @ApiProperty({ description: 'Auto-create users on first login' })
  autoCreateUsers: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class SsoConnectionResponseDto {
  @ApiProperty({ description: 'Connection ID' })
  id: string;

  @ApiProperty({ description: 'Provider type' })
  providerType: SsoProviderType;

  @ApiProperty({ description: 'Provider name' })
  providerName: string;

  @ApiProperty({ description: 'Email from provider' })
  email: string;

  @ApiPropertyOptional({ description: 'Display name from provider' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Connection created at' })
  createdAt: Date;
}

// --- Auth Flow DTOs ---

export class SsoInitiateDto {
  @ApiProperty({ description: 'Provider ID to authenticate with' })
  @IsUUID()
  providerId: string;

  @ApiPropertyOptional({ description: 'Redirect URL after authentication' })
  @IsOptional()
  @IsUrl()
  redirectUrl?: string;
}

export class SsoCallbackDto {
  @ApiProperty({ description: 'Authorization code from provider' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'State parameter for CSRF protection' })
  @IsString()
  @IsNotEmpty()
  state: string;
}

export class SsoAuthResponseDto {
  @ApiProperty({ description: 'Access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration in seconds' })
  expiresIn: number;

  @ApiProperty({ description: 'Token type' })
  tokenType: string;

  @ApiProperty({ description: 'Whether this is a new user' })
  isNewUser: boolean;

  @ApiProperty({ description: 'User profile' })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: string[];
  };
}

export class SsoInitiateResponseDto {
  @ApiProperty({ description: 'Authorization URL to redirect user to' })
  authorizationUrl: string;

  @ApiProperty({ description: 'State parameter (for verification)' })
  state: string;
}
