/**
 * useAuthError — maps backend error codes to user-friendly messages
 * Requirements: 11.2, 11.10
 *
 * Property 39: Error code mapping
 * Property 42: Consistent error UI
 */

// ─── Error code → message map ─────────────────────────────────────────────────
const ERROR_CODE_MAP: Record<string, string> = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'Invalid username or password.',
  AUTH_ACCOUNT_DEACTIVATED: 'Your account has been deactivated. Contact your administrator.',
  AUTH_ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts. Try again later.',
  AUTH_EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
  AUTH_MFA_REQUIRED: 'Two-factor authentication is required.',
  AUTH_MFA_INVALID_CODE: 'Invalid verification code. Please try again.',
  AUTH_MFA_LOCKED: 'Too many failed MFA attempts. Account temporarily locked.',
  AUTH_TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_TOKEN_INVALID: 'Invalid session token. Please log in again.',
  AUTH_REFRESH_TOKEN_INVALID: 'Session expired. Please log in again.',

  // Registration errors
  REG_EMAIL_TAKEN: 'This email address is already registered.',
  REG_USERNAME_TAKEN: 'This username is already taken.',
  REG_WEAK_PASSWORD: 'Password does not meet complexity requirements.',
  REG_INVALID_EMAIL: 'Please enter a valid email address.',

  // Password errors
  PWD_CURRENT_INCORRECT: 'Current password is incorrect.',
  PWD_SAME_AS_CURRENT: 'New password must be different from your current password.',
  PWD_RESET_TOKEN_EXPIRED: 'Password reset link has expired. Please request a new one.',
  PWD_RESET_TOKEN_INVALID: 'Invalid password reset link.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait before trying again.',

  // Organization errors
  ORG_NOT_FOUND: 'Organization not found.',
  ORG_UNAUTHORIZED: 'You do not have permission to modify this organization.',
  ORG_CREATOR_ONLY: 'Only the organization creator can perform this action.',

  // Device / session errors
  DEVICE_NOT_FOUND: 'Device not found.',
  SESSION_NOT_FOUND: 'Session not found or already expired.',

  // Generic
  VALIDATION_ERROR: 'Please check your input and try again.',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Unable to connect to the server. Check your internet connection.',
};

// ─── HTTP status → fallback message ──────────────────────────────────────────
const HTTP_STATUS_MAP: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Authentication required. Please log in.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The resource may already exist.',
  422: 'Validation failed. Please check your input.',
  429: 'Too many requests. Please wait and try again.',
  500: 'Server error. Please try again later.',
  502: 'Service temporarily unavailable.',
  503: 'Service temporarily unavailable.',
};

export interface MappedError {
  message: string;
  code: string | null;
  isNetworkError: boolean;
  isRateLimit: boolean;
  retryAfter: number | null;
}

/**
 * Map an API error to a user-friendly message.
 * Handles: error code strings, HTTP status codes, network errors.
 */
export function mapAuthError(error: unknown): MappedError {
  // Network / no response
  if (!error || typeof error !== 'object') {
    return { message: ERROR_CODE_MAP.NETWORK_ERROR, code: 'NETWORK_ERROR', isNetworkError: true, isRateLimit: false, retryAfter: null };
  }

  const err = error as {
    response?: {
      status?: number;
      data?: { message?: string; error?: { code?: string }; retryAfter?: number };
      headers?: Record<string, string>;
    };
    message?: string;
    code?: string;
  };

  // No response — network error
  if (!err.response) {
    return { message: ERROR_CODE_MAP.NETWORK_ERROR, code: 'NETWORK_ERROR', isNetworkError: true, isRateLimit: false, retryAfter: null };
  }

  const status = err.response.status ?? 0;
  const code = err.response.data?.error?.code ?? null;
  const retryAfter = err.response.data?.retryAfter ?? null;
  const isRateLimit = status === 429;

  // Map by error code first
  if (code && Object.hasOwn(ERROR_CODE_MAP, code)) {
    return { message: ERROR_CODE_MAP[code], code, isNetworkError: false, isRateLimit, retryAfter };
  }

  // Map by HTTP status
  if (HTTP_STATUS_MAP[status]) {
    return { message: HTTP_STATUS_MAP[status], code, isNetworkError: false, isRateLimit, retryAfter };
  }

  // Fall back to server message or generic
  const serverMessage = err.response.data?.message;
  return {
    message: serverMessage || 'An unexpected error occurred.',
    code,
    isNetworkError: false,
    isRateLimit,
    retryAfter,
  };
}

/**
 * Composable for consistent auth error handling in views.
 */
export function useAuthError() {
  return { mapAuthError, ERROR_CODE_MAP };
}
