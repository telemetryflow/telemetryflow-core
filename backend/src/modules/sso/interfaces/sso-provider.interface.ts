/**
 * SSO Provider Types
 */
export enum SsoProviderType {
  OAUTH2 = 'oauth2',
  SAML = 'saml',
  OIDC = 'oidc',
}

/**
 * OAuth2 Provider Names
 */
export enum OAuth2Provider {
  GOOGLE = 'google',
  GITHUB = 'github',
  MICROSOFT = 'microsoft',
  AZURE_AD = 'azure_ad',
  OKTA = 'okta',
  CUSTOM = 'custom',
}

/**
 * SSO User Profile returned from providers
 */
export interface SsoUserProfile {
  providerId: string;
  providerType: SsoProviderType;
  providerName: string;
  externalId: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  locale?: string;
  raw?: Record<string, unknown>;
}

/**
 * SSO Provider Configuration
 */
export interface SsoProviderConfig {
  id: string;
  organizationId: string;
  name: string;
  providerType: SsoProviderType;
  providerName: string;
  enabled: boolean;

  // OAuth2/OIDC specific
  clientId?: string;
  clientSecret?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scopes?: string[];

  // SAML specific
  entityId?: string;
  ssoUrl?: string;
  sloUrl?: string;
  certificate?: string;
  privateKey?: string;
  signatureAlgorithm?: string;

  // Common
  callbackUrl?: string;
  allowedDomains?: string[];
  autoCreateUsers?: boolean;
  defaultRoleId?: string;
  attributeMapping?: Record<string, string>;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SSO Connection (user's linked identity)
 */
export interface SsoConnection {
  id: string;
  userId: string;
  providerId: string;
  providerType: SsoProviderType;
  providerName: string;
  externalId: string;
  email: string;
  displayName?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  lastLoginAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SSO Authentication Result
 */
export interface SsoAuthResult {
  success: boolean;
  user?: SsoUserProfile;
  connection?: SsoConnection;
  isNewUser?: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * SSO Provider Interface
 */
export interface ISsoProvider {
  getType(): SsoProviderType;
  getName(): string;

  getAuthorizationUrl(state: string, nonce?: string): Promise<string>;
  handleCallback(code: string, state: string): Promise<SsoAuthResult>;
  getUserProfile(accessToken: string): Promise<SsoUserProfile>;
  refreshToken?(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }>;
  logout?(token: string): Promise<void>;
}
