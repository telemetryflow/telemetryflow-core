/**
 * Application configuration
 *
 * Priority: runtime env (window.__TELEMETRYFLOW_RUNTIME__) > build-time (import.meta.env) > defaults
 */

import { rt } from "./runtime";

export interface AppConfig {
  appTitle: string;
  appCode: string;
  baseUrl: string;
  apiUrl: string;
  iamApiUrl: string;
  grpcUrl: string;
  wsUrl: string;
  useMock: boolean;
  refreshInterval: number;
  // TASK-06: API Key for security layer
  apiKey: string;
  apiKeySecret: string;
  apiKeyHeader: string;
  // Cache settings
  enableCache: boolean;
  cacheTTL: number; // in milliseconds
  // Soft limit: default rows per fetch (env: TELEMETRYFLOW_LIMIT_DATA)
  limitData: number;
  // Hard limit: absolute max rows per fetch (env: TELEMETRYFLOW_LIMIT_DATA_MAX)
  limitDataMax: number;
  // Environment name (production, staging, development, etc.)
  environment: string;
  // Whether the current environment is production
  isProduction: boolean;
}

export interface AuthConfig {
  username: string;
  email: string;
  password: string;
}

export interface SSOConfig {
  google: boolean;
  github: boolean;
  microsoft: boolean;
  apple: boolean;
  slack: boolean;
  cognito: boolean;
}

// Resolve environment: TELEMETRYFLOW_ENV > NODE_ENV > "development"
const _env = (rt("TELEMETRYFLOW_ENV") || rt("NODE_ENV") || "development").toUpperCase();
const _isProd = _env === "PROD" || _env === "PRODUCTION";

export const config: AppConfig = {
  appTitle: rt("TELEMETRYFLOW_APP_TITLE", "TelemetryFlow Viz"),
  appCode: rt("TELEMETRYFLOW_APP_CODE", "TFO-Viz"),
  baseUrl: rt("TELEMETRYFLOW_BASE_URL", "/"),
  apiUrl: rt("TELEMETRYFLOW_API_URL"),
  iamApiUrl: rt("TELEMETRYFLOW_IAM_API_URL"),
  grpcUrl: rt("TELEMETRYFLOW_GRPC_URL", "http://localhost:4317"),
  wsUrl: rt("TELEMETRYFLOW_WS_URL", "ws://localhost:4319"),
  useMock: rt("TELEMETRYFLOW_USE_MOCK", "false") === "true",
  refreshInterval: parseInt(rt("TELEMETRYFLOW_REFRESH_INTERVAL", "30000"), 10),
  // TASK-06: API Key configuration (matches backend x-api-key header)
  apiKey: rt("TELEMETRYFLOW_API_KEY_ID"),
  apiKeySecret: rt("TELEMETRYFLOW_API_KEY_SECRET"),
  apiKeyHeader: rt("TELEMETRYFLOW_API_KEY_HEADER", "x-api-key"),
  enableCache: rt("TELEMETRYFLOW_ENABLE_CACHE", "true") !== "false",
  cacheTTL: parseInt(rt("TELEMETRYFLOW_CACHE_TTL", "300000"), 10),
  limitData: parseInt(rt("TELEMETRYFLOW_LIMIT_DATA", "50000"), 10),
  limitDataMax: parseInt(rt("TELEMETRYFLOW_LIMIT_DATA_MAX", "100000"), 10),
  environment: _env,
  isProduction: _isProd,
};

export const authConfig: AuthConfig = {
  username: rt("TELEMETRYFLOW_VIZ_USERNAME", ""),
  email: rt("TELEMETRYFLOW_VIZ_EMAIL", ""),
  password: rt("TELEMETRYFLOW_VIZ_PASSWORD", ""),
};

export const ssoConfig: SSOConfig = {
  google: rt("TELEMETRYFLOW_SSO_GOOGLE", "false") === "true",
  github: rt("TELEMETRYFLOW_SSO_GITHUB", "false") === "true",
  microsoft: rt("TELEMETRYFLOW_SSO_MICROSOFT", "false") === "true",
  apple: rt("TELEMETRYFLOW_SSO_APPLE", "false") === "true",
  slack: rt("TELEMETRYFLOW_SSO_SLACK", "false") === "true",
  cognito: rt("TELEMETRYFLOW_SSO_COGNITO", "false") === "true",
};

/** Shared Naive UI theme overrides for all auth form inputs (dark left-panel style) */
export const authInputOverrides = {
  textColor: "#ffffff",
  placeholderColor: "rgba(255, 255, 255, 0.5)",
  color: "rgba(255, 255, 255, 0.08)",
  colorFocus: "rgba(255, 255, 255, 0.12)",
  border: "2px solid rgba(255, 255, 255, 0.5)",
  borderHover: "2px solid rgba(255, 255, 255, 0.7)",
  borderFocus: "2px solid rgba(255, 255, 255, 0.9)",
  caretColor: "#ffffff",
};

// Export white label config
export {
  whiteLabelConfig,
  getCopyrightText,
  getLogo,
  brandDefaults,
} from "./whitelabel";

export default config;
