/**
 * IAM API client for TelemetryFlow Platform backend
 * Handles authentication and IAM operations with JWT token management
 *
 * Token storage strategy:
 * - Access tokens: stored in memory only (via the Pinia auth store's `accessToken` ref).
 *   They are NEVER written to localStorage or sessionStorage to limit XSS exposure.
 *   The iamClient receives the current access token at request time via `setAccessToken()`.
 *
 * - Refresh tokens: stored in localStorage.
 *   SECURITY NOTE: Storing refresh tokens in localStorage is a pragmatic tradeoff for
 *   SPAs that cannot set httpOnly cookies from the client side. The ideal approach is to
 *   have the backend set the refresh token as an httpOnly, Secure, SameSite=Strict cookie
 *   so that JavaScript cannot read it at all. Until the backend supports cookie-based
 *   refresh tokens, localStorage is used with the understanding that:
 *     1. The app must enforce strict Content-Security-Policy headers to mitigate XSS.
 *     2. Refresh tokens are long-lived (7 days) so their exposure window is wider than
 *        access tokens (15 min) — this is the primary risk of this approach.
 *     3. Token rotation on every refresh limits the blast radius of a stolen token.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";
import { config } from "@/config";

// Access tokens are NOT stored in localStorage — they live in the Pinia auth store.
// This key is intentionally absent to prevent accidental writes.
const REFRESH_TOKEN_KEY = "tfo-refresh-token";

class IamClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  // In-memory access token — never persisted to localStorage.
  // Set by the auth store after login/refresh; cleared on logout.
  private _accessToken: string | null = null;

  // Optional callback invoked whenever the token is refreshed internally
  // (e.g. via the 401 response interceptor). The auth store registers this
  // so its reactive `accessToken` ref stays in sync without the store needing
  // to poll or observe the iamClient directly.
  private _onTokenRefreshed: ((accessToken: string) => void) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${config.iamApiUrl}/api/v2`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add JWT token and request tracing ID
    this.client.interceptors.request.use(
      (requestConfig) => {
        // Use in-memory access token — never read from localStorage
        const token = this._accessToken;
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }

        // Add a unique request ID for distributed tracing
        requestConfig.headers["X-Request-ID"] = crypto.randomUUID();

        return requestConfig;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - handle 401 and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't retry these endpoints — retrying them would either create an
          // infinite refresh loop (/auth/refresh) or is pointless (/auth/login,
          // /auth/logout, /auth/register). Protected endpoints like /auth/me
          // should still be retried after a token refresh.
          const noRetryUrls = ["/auth/refresh", "/auth/login", "/auth/logout", "/auth/register"];
          if (noRetryUrls.some((u) => originalRequest.url?.includes(u))) {
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Wait for token refresh
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers = {
                  ...originalRequest.headers,
                  Authorization: `Bearer ${token}`,
                };
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              this.handleAuthFailure();
              return Promise.reject(error);
            }

            const response = await this.client.post("/auth/refresh", {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } =
              response.data;
            this.setTokens(accessToken, newRefreshToken);

            // Notify the auth store so its reactive accessToken ref stays in sync
            if (this._onTokenRefreshed) {
              this._onTokenRefreshed(accessToken);
            }

            // Notify subscribers
            this.refreshSubscribers.forEach((callback) =>
              callback(accessToken),
            );
            this.refreshSubscribers = [];

            // Retry original request
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${accessToken}`,
            };
            return this.client(originalRequest);
          } catch (refreshError) {
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private handleAuthFailure(): void {
    this.clearTokens();
    // Redirect to login page
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      window.location.href = `/login?expired=true&redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  /**
   * Returns the in-memory access token.
   * Access tokens are never stored in localStorage — they live only in memory.
   */
  getAccessToken(): string | null {
    return this._accessToken;
  }

  /**
   * Returns the persisted refresh token from localStorage.
   * See the module-level security note for the tradeoff rationale.
   */
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Store tokens after a successful login or token refresh.
   * - accessToken is kept in memory only (never written to localStorage).
   * - refreshToken is persisted to localStorage so the session survives page reloads.
   */
  setTokens(accessToken: string, refreshToken: string): void {
    // Access token: memory only
    this._accessToken = accessToken;
    // Refresh token: localStorage (see security note at top of file)
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Clear all stored tokens on logout or auth failure.
   * Wipes both the in-memory access token and the persisted refresh token.
   */
  clearTokens(): void {
    this._accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Returns true when a refresh token is present, indicating the session
   * may still be resumable (the access token will be refreshed on next request).
   * Checks the refresh token rather than the access token because access tokens
   * are not persisted and will be absent after a page reload.
   */
  hasValidToken(): boolean {
    return !!this.getRefreshToken();
  }

  /**
   * Register a callback that is invoked whenever the iamClient internally
   * refreshes the access token (i.e. via the 401 response interceptor).
   * The auth store uses this to keep its reactive `accessToken` ref in sync
   * without requiring a direct dependency on the iamClient's private state.
   *
   * Pass `null` to deregister the callback (e.g. on logout).
   */
  setAccessTokenCallback(
    callback: ((accessToken: string) => void) | null,
  ): void {
    this._onTokenRefreshed = callback;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const iamClient = new IamClient();
export default iamClient;
