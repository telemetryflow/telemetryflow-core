/**
 * SSO (Single Sign-On) API client
 * Manages SSO provider configuration, authentication flows, and user connections
 * Uses collectorClient for real HTTP calls with config.useMock branching
 */

import { collectorClient } from "./collector";
import { config } from "@/config";

// ==================== TYPES ====================
// Note: Types are also available in @/types/sso.ts

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
  status?: SSOProviderStatus;
  configuration?: Partial<SSOProviderConfiguration>;
  defaultRole?: string;
  autoProvision?: boolean;
  domainRestrictions?: string[];
  allowedDomains?: string[];
}

export interface SSOInitiateRequest {
  organizationId?: string;
  providerId: string;
  redirectUrl?: string;
  state?: string;
}

export interface SSOInitiateResponse {
  authorizationUrl: string;
  state: string;
  nonce: string;
  expiresAt: number;
}

export interface SSOCallbackRequest {
  providerId: string;
  code?: string;
  state: string;
  samlResponse?: string;
}

export interface SSOCallbackResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    ssoProvider: string;
    isNewUser: boolean;
  };
}

export interface SSOConnection {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  providerId: string;
  providerName: string;
  providerVendor: SSOProviderVendor;
  externalId: string;
  externalEmail: string;
  connectedAt: number;
  lastLoginAt: number | null;
  loginCount: number;
  isActive: boolean;
}

export interface SSOConnectionListResponse {
  connections: SSOConnection[];
  total: number;
}

// ==================== ENDPOINTS ====================

export const SSO_ENDPOINTS = {
  PUBLIC_PROVIDERS: (orgId: string) => `/api/v2/sso/providers/${orgId}/public`,
  INITIATE: "/api/v2/sso/initiate",
  CALLBACK: "/api/v2/sso/callback",
  PROVIDERS: "/api/v2/sso/providers",
  PROVIDER: (id: string) => `/api/v2/sso/providers/${id}`,
  CONNECTIONS: "/api/v2/sso/connections",
  CONNECTION: (id: string) => `/api/v2/sso/connections/${id}`,
} as const;

// ==================== MOCK DATA ====================

function generateMockPublicProviders(): SSOPublicProvider[] {
  return [
    {
      id: "sso-google",
      name: "google-workspace",
      displayName: "Google Workspace",
      vendor: "google",
      type: "oidc",
      iconUrl: "https://www.google.com/favicon.ico",
      loginUrl: "/api/v2/sso/initiate?provider=sso-google",
      enabled: true,
    },
    {
      id: "sso-microsoft",
      name: "microsoft-entra",
      displayName: "Microsoft Entra ID",
      vendor: "microsoft",
      type: "oidc",
      iconUrl: "https://www.microsoft.com/favicon.ico",
      loginUrl: "/api/v2/sso/initiate?provider=sso-microsoft",
      enabled: true,
    },
    {
      id: "sso-okta",
      name: "okta-enterprise",
      displayName: "Okta",
      vendor: "okta",
      type: "saml",
      iconUrl: "https://www.okta.com/favicon.ico",
      loginUrl: "/api/v2/sso/initiate?provider=sso-okta",
      enabled: false,
    },
  ];
}

function generateMockProviders(): SSOProvider[] {
  const now = Date.now();

  return [
    {
      id: "sso-google",
      organizationId: "org-devopscorner",
      name: "google-workspace",
      displayName: "Google Workspace",
      vendor: "google",
      type: "oidc",
      status: "active",
      iconUrl: "https://www.google.com/favicon.ico",
      configuration: {
        clientId: "123456789-abcdefgh.apps.googleusercontent.com",
        clientSecret: "GOCSPX-xxxxxxxxxxxxxxxxxxxx",
        issuerUrl: "https://accounts.google.com",
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
        scopes: ["openid", "email", "profile"],
        callbackUrl: "https://dashboard.telemetryflow.id/auth/sso/callback",
        logoutRedirectUrl: "https://dashboard.telemetryflow.id/login",
        attributeMapping: {
          email: "email",
          firstName: "given_name",
          lastName: "family_name",
          avatar: "picture",
        },
      },
      defaultRole: "role-viewer",
      autoProvision: true,
      domainRestrictions: ["devopscorner.id", "telemetryflow.id"],
      allowedDomains: ["devopscorner.id", "telemetryflow.id"],
      userCount: 12,
      lastLoginAt: now - 2 * 60 * 60 * 1000,
      createdAt: now - 180 * 24 * 60 * 60 * 1000,
      updatedAt: now - 15 * 24 * 60 * 60 * 1000,
      createdBy: "user-001",
    },
    {
      id: "sso-microsoft",
      organizationId: "org-devopscorner",
      name: "microsoft-entra",
      displayName: "Microsoft Entra ID",
      vendor: "microsoft",
      type: "oidc",
      status: "active",
      iconUrl: "https://www.microsoft.com/favicon.ico",
      configuration: {
        clientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        clientSecret: "xxxxxxxx~xxxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        issuerUrl:
          "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/v2.0",
        authorizationUrl:
          "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/oauth2/v2.0/authorize",
        tokenUrl:
          "https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/oauth2/v2.0/token",
        userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
        scopes: ["openid", "email", "profile", "User.Read"],
        callbackUrl: "https://dashboard.telemetryflow.id/auth/sso/callback",
        logoutRedirectUrl: "https://dashboard.telemetryflow.id/login",
        attributeMapping: {
          email: "email",
          firstName: "givenName",
          lastName: "surname",
          avatar: "photo",
        },
      },
      defaultRole: "role-viewer",
      autoProvision: true,
      domainRestrictions: ["devopscorner.id"],
      allowedDomains: ["devopscorner.id"],
      userCount: 5,
      lastLoginAt: now - 8 * 60 * 60 * 1000,
      createdAt: now - 120 * 24 * 60 * 60 * 1000,
      updatedAt: now - 30 * 24 * 60 * 60 * 1000,
      createdBy: "user-001",
    },
    {
      id: "sso-okta",
      organizationId: "org-devopscorner",
      name: "okta-enterprise",
      displayName: "Okta Enterprise",
      vendor: "okta",
      type: "saml",
      status: "inactive",
      iconUrl: "https://www.okta.com/favicon.ico",
      configuration: {
        entityId: "https://www.okta.com/exkxxxxxxxxxxxxxxx",
        ssoUrl:
          "https://devopscorner.okta.com/app/telemetryflow/exkxxxxxxx/sso/saml",
        sloUrl:
          "https://devopscorner.okta.com/app/telemetryflow/exkxxxxxxx/slo/saml",
        certificate: "MIIDpDCCAoygAwIBAgIGAY...<truncated>",
        metadataUrl:
          "https://devopscorner.okta.com/app/exkxxxxxxx/sso/saml/metadata",
        callbackUrl:
          "https://dashboard.telemetryflow.id/auth/sso/saml/callback",
        logoutRedirectUrl: "https://dashboard.telemetryflow.id/login",
        attributeMapping: {
          email:
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
          firstName:
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
          lastName:
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
        },
      },
      defaultRole: "role-developer",
      autoProvision: false,
      domainRestrictions: [],
      allowedDomains: ["devopscorner.id"],
      userCount: 0,
      lastLoginAt: null,
      createdAt: now - 45 * 24 * 60 * 60 * 1000,
      updatedAt: now - 45 * 24 * 60 * 60 * 1000,
      createdBy: "user-002",
    },
    {
      id: "sso-cognito",
      organizationId: "org-devopscorner",
      name: "aws-cognito",
      displayName: "AWS Cognito",
      vendor: "aws_cognito",
      type: "oidc",
      status: "pending_setup",
      iconUrl: null,
      configuration: {
        clientId: "",
        clientSecret: "",
        issuerUrl:
          "https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_XXXXXXXXX",
        scopes: ["openid", "email", "profile"],
        callbackUrl: "https://dashboard.telemetryflow.id/auth/sso/callback",
      },
      defaultRole: "role-viewer",
      autoProvision: false,
      domainRestrictions: [],
      allowedDomains: [],
      userCount: 0,
      lastLoginAt: null,
      createdAt: now - 10 * 24 * 60 * 60 * 1000,
      updatedAt: now - 10 * 24 * 60 * 60 * 1000,
      createdBy: "user-001",
    },
  ];
}

function generateMockConnections(): SSOConnection[] {
  const now = Date.now();

  return [
    {
      id: "ssoconn-001",
      userId: "user-002",
      userEmail: "administrator.telemetryflow@telemetryflow.id",
      userName: "Admin TelemetryFlow",
      providerId: "sso-google",
      providerName: "Google Workspace",
      providerVendor: "google",
      externalId: "google-uid-100001",
      externalEmail: "admin@telemetryflow.id",
      connectedAt: now - 150 * 24 * 60 * 60 * 1000,
      lastLoginAt: now - 2 * 60 * 60 * 1000,
      loginCount: 245,
      isActive: true,
    },
    {
      id: "ssoconn-002",
      userId: "user-003",
      userEmail: "developer.telemetryflow@telemetryflow.id",
      userName: "Developer TelemetryFlow",
      providerId: "sso-google",
      providerName: "Google Workspace",
      providerVendor: "google",
      externalId: "google-uid-100002",
      externalEmail: "developer@telemetryflow.id",
      connectedAt: now - 120 * 24 * 60 * 60 * 1000,
      lastLoginAt: now - 6 * 60 * 60 * 1000,
      loginCount: 180,
      isActive: true,
    },
    {
      id: "ssoconn-003",
      userId: "user-006",
      userEmail: "devops.lead@telemetryflow.id",
      userName: "DevOps Lead",
      providerId: "sso-google",
      providerName: "Google Workspace",
      providerVendor: "google",
      externalId: "google-uid-100003",
      externalEmail: "devops.lead@telemetryflow.id",
      connectedAt: now - 100 * 24 * 60 * 60 * 1000,
      lastLoginAt: now - 12 * 60 * 60 * 1000,
      loginCount: 156,
      isActive: true,
    },
    {
      id: "ssoconn-004",
      userId: "user-007",
      userEmail: "sre.engineer@telemetryflow.id",
      userName: "SRE Engineer",
      providerId: "sso-microsoft",
      providerName: "Microsoft Entra ID",
      providerVendor: "microsoft",
      externalId: "ms-uid-200001",
      externalEmail: "sre.engineer@telemetryflow.id",
      connectedAt: now - 90 * 24 * 60 * 60 * 1000,
      lastLoginAt: now - 8 * 60 * 60 * 1000,
      loginCount: 98,
      isActive: true,
    },
    {
      id: "ssoconn-005",
      userId: "user-008",
      userEmail: "platform.engineer@telemetryflow.id",
      userName: "Platform Engineer",
      providerId: "sso-microsoft",
      providerName: "Microsoft Entra ID",
      providerVendor: "microsoft",
      externalId: "ms-uid-200002",
      externalEmail: "platform.engineer@telemetryflow.id",
      connectedAt: now - 80 * 24 * 60 * 60 * 1000,
      lastLoginAt: now - 24 * 60 * 60 * 1000,
      loginCount: 72,
      isActive: true,
    },
    {
      id: "ssoconn-006",
      userId: "user-010",
      userEmail: "qa.engineer@telemetryflow.id",
      userName: "QA Engineer",
      providerId: "sso-google",
      providerName: "Google Workspace",
      providerVendor: "google",
      externalId: "google-uid-100010",
      externalEmail: "qa.engineer@telemetryflow.id",
      connectedAt: now - 60 * 24 * 60 * 60 * 1000,
      lastLoginAt: now - 30 * 24 * 60 * 60 * 1000,
      loginCount: 15,
      isActive: false,
    },
  ];
}

// ==================== API CLIENT ====================

export const ssoApi = {
  /**
   * Get publicly available SSO providers for an organization
   * Used on the login page to show SSO login buttons
   */
  async getPublicProviders(orgId: string): Promise<SSOPublicProvider[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return generateMockPublicProviders();
    }

    const response = await collectorClient.get<SSOPublicProvider[]>(
      SSO_ENDPOINTS.PUBLIC_PROVIDERS(orgId),
    );
    return response.data;
  },

  /**
   * Initiate an SSO authentication flow
   * Returns the authorization URL to redirect the user to
   */
  async initiateSSO(data: SSOInitiateRequest): Promise<SSOInitiateResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const providers = generateMockProviders();
      const provider = providers.find((p) => p.id === data.providerId);
      const state = `state_${crypto.randomUUID()}`;
      const nonce = `nonce_${crypto.randomUUID()}`;

      let authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
      if (provider?.vendor === "microsoft") {
        authUrl =
          "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
      } else if (provider?.vendor === "okta") {
        authUrl = "https://devopscorner.okta.com/oauth2/v1/authorize";
      }

      return {
        authorizationUrl: `${authUrl}?client_id=${provider?.configuration.clientId || "mock"}&redirect_uri=${encodeURIComponent(data.redirectUrl || "/auth/sso/callback")}&state=${state}&nonce=${nonce}&response_type=code&scope=openid+email+profile`,
        state,
        nonce,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
    }

    const response = await collectorClient.post<SSOInitiateResponse>(
      SSO_ENDPOINTS.INITIATE,
      data,
    );
    return response.data;
  },

  /**
   * Handle SSO callback after provider authentication
   * Exchanges the authorization code for tokens and creates/links the user
   */
  async handleCallback(data: SSOCallbackRequest): Promise<SSOCallbackResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        accessToken: `mock_access_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
        expiresIn: 3600,
        tokenType: "Bearer",
        user: {
          id: "user-002",
          email: "administrator.telemetryflow@telemetryflow.id",
          firstName: "Admin",
          lastName: "TelemetryFlow",
          avatar: null,
          ssoProvider: data.providerId,
          isNewUser: false,
        },
      };
    }

    const response = await collectorClient.post<SSOCallbackResponse>(
      SSO_ENDPOINTS.CALLBACK,
      data,
    );
    return response.data;
  },

  /**
   * List all configured SSO providers for the organization (admin view)
   * Returns full configuration details including secrets (masked)
   */
  async listProviders(): Promise<SSOProvider[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockProviders();
    }

    const response = await collectorClient.get<SSOProvider[]>(
      SSO_ENDPOINTS.PROVIDERS,
    );
    return response.data;
  },

  /**
   * Create a new SSO provider configuration
   */
  async createProvider(data: CreateSSOProviderRequest): Promise<SSOProvider> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = Date.now();
      return {
        id: `sso-${Date.now()}`,
        organizationId: "org-devopscorner",
        name: data.name,
        displayName: data.displayName || data.name,
        vendor: data.vendor,
        type: data.type,
        status: "pending_setup",
        iconUrl: null,
        configuration: data.configuration,
        defaultRole: data.defaultRole || "role-viewer",
        autoProvision: data.autoProvision || false,
        domainRestrictions: data.domainRestrictions || [],
        allowedDomains: data.allowedDomains || [],
        userCount: 0,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
        createdBy: "user-001",
      };
    }

    const response = await collectorClient.post<SSOProvider>(
      SSO_ENDPOINTS.PROVIDERS,
      data,
    );
    return response.data;
  },

  /**
   * Update an existing SSO provider configuration
   * Supports partial updates via PATCH
   */
  async updateProvider(
    id: string,
    data: UpdateSSOProviderRequest,
  ): Promise<SSOProvider> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const providers = generateMockProviders();
      const provider = providers.find((p) => p.id === id) || providers[0];
      return {
        ...provider,
        id,
        displayName: data.displayName || provider.displayName,
        status: data.status || provider.status,
        configuration: {
          ...provider.configuration,
          ...(data.configuration || {}),
        },
        defaultRole: data.defaultRole || provider.defaultRole,
        autoProvision:
          data.autoProvision !== undefined
            ? data.autoProvision
            : provider.autoProvision,
        domainRestrictions:
          data.domainRestrictions || provider.domainRestrictions,
        allowedDomains: data.allowedDomains || provider.allowedDomains,
        updatedAt: Date.now(),
      };
    }

    const response = await collectorClient.patch<SSOProvider>(
      SSO_ENDPOINTS.PROVIDER(id),
      data,
    );
    return response.data;
  },

  /**
   * Delete an SSO provider configuration
   * Warning: This will disconnect all users linked via this provider
   */
  async deleteProvider(id: string): Promise<{ message: string }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { message: "SSO provider deleted successfully" };
    }

    const response = await collectorClient.delete<{ message: string }>(
      SSO_ENDPOINTS.PROVIDER(id),
    );
    return response.data;
  },

  /**
   * List all SSO connections (user-to-provider links)
   * Shows which users are connected via which SSO providers
   */
  async listConnections(): Promise<SSOConnectionListResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const connections = generateMockConnections();
      return {
        connections,
        total: connections.length,
      };
    }

    const response = await collectorClient.get<SSOConnectionListResponse>(
      SSO_ENDPOINTS.CONNECTIONS,
    );
    return response.data;
  },

  /**
   * Delete an SSO connection (unlink a user from a provider)
   * The user will need to re-authenticate via SSO to reconnect
   */
  async deleteConnection(id: string): Promise<{ message: string }> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { message: "SSO connection removed successfully" };
    }

    const response = await collectorClient.delete<{ message: string }>(
      SSO_ENDPOINTS.CONNECTION(id),
    );
    return response.data;
  },
};

export default ssoApi;
