/**
 * SSO Types
 * Type definitions for Single Sign-On providers and configurations
 */

export type SSOProviderType = "saml" | "oidc" | "oauth2";
export type SSOProviderStatus =
  | "active"
  | "inactive"
  | "pending_setup"
  | "error";
export type SSOProviderVendor =
  | "google"
  | "microsoft"
  | "okta"
  | "auth0"
  | "onelogin"
  | "jumpcloud"
  | "aws_cognito"
  | "custom";

export interface SSOPublicProvider {
  id: string;
  name: string;
  displayName: string;
  vendor: SSOProviderVendor;
  type: SSOProviderType;
  iconUrl: string | null;
  loginUrl: string;
  enabled: boolean;
}

export interface SSOProvider {
  id: string;
  organizationId: string;
  name: string;
  displayName: string;
  vendor: SSOProviderVendor;
  type: SSOProviderType;
  status: SSOProviderStatus;
  iconUrl: string | null;
  configuration: SSOProviderConfiguration;
  defaultRole: string;
  autoProvision: boolean;
  domainRestrictions: string[];
  allowedDomains: string[];
  userCount: number;
  lastLoginAt: number | null;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface SSOProviderConfiguration {
  // OIDC / OAuth2
  clientId?: string;
  clientSecret?: string;
  issuerUrl?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scopes?: string[];
  // SAML
  entityId?: string;
  ssoUrl?: string;
  sloUrl?: string;
  certificate?: string;
  metadataUrl?: string;
  // Common
  callbackUrl?: string;
  logoutRedirectUrl?: string;
  attributeMapping?: Record<string, string>;
}

export interface CreateSSOProviderRequest {
  name: string;
  displayName?: string;
  vendor: SSOProviderVendor;
  type: SSOProviderType;
  configuration: SSOProviderConfiguration;
  defaultRole?: string;
  autoProvision?: boolean;
  domainRestrictions?: string[];
  allowedDomains?: string[];
}

export interface UpdateSSOProviderRequest {
  displayName?: string;
  configuration?: Partial<SSOProviderConfiguration>;
  defaultRole?: string;
  autoProvision?: boolean;
  domainRestrictions?: string[];
  allowedDomains?: string[];
  status?: SSOProviderStatus;
}

export interface SSOInitiateResponse {
  authUrl: string;
  state: string;
  nonce?: string;
}

export interface SSOCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}
