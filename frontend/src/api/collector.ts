/**
 * Base collector API client
 * TASK-06: Enhanced with TFO-API-KEY security and caching support
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "@/config";
import type { ApiResponse, CollectorStatus } from "@/types";
import { COLLECTOR_ENDPOINTS } from "@/config/collector";
import { getFromCache, setInCache, type CacheOptions } from "@/utils/api-cache";
import { useAuthStore } from "@/store/auth";

class CollectorClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 120000, // 120s — enterprise analytics queries (patterns, service-breakdown) can be heavy
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (axiosConfig: InternalAxiosRequestConfig) => {
        // Attach JWT token for authenticated API requests
        // Token is kept in-memory in the auth store (not localStorage) for security
        const authStore = useAuthStore();
        const token = authStore.accessToken;
        if (token) {
          axiosConfig.headers.Authorization = `Bearer ${token}`;
        }

        // TASK-06: Add TFO-API-KEY header if configured
        if (config.apiKey) {
          axiosConfig.headers[config.apiKeyHeader] = config.apiKey;
        }

        // Add timestamp to prevent browser caching (when not using our cache)
        if (
          axiosConfig.method === "get" &&
          !axiosConfig.params?._skipTimestamp
        ) {
          axiosConfig.params = {
            ...axiosConfig.params,
            _t: Date.now(),
          };
        }
        // Remove internal flag
        if (axiosConfig.params?._skipTimestamp) {
          delete axiosConfig.params._skipTimestamp;
        }

        return axiosConfig;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - handle 401 with silent token refresh + retry
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest =
          error.config as import("axios").InternalAxiosRequestConfig & {
            _retry?: boolean;
          };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const authStore = useAuthStore();
          const refreshed = await authStore.refreshToken().catch(() => false);
          if (refreshed && authStore.accessToken) {
            originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
            return this.client(originalRequest);
          }
          // Refresh failed (refreshToken already cleared auth state) — redirect to login
          window.location.href = "/auth/login";
          return Promise.reject(error);
        }

        // Only log non-404, non-401 errors
        if (error.response?.status !== 404 && error.response?.status !== 401) {
          const message =
            error.response?.data?.message || error.message || "Request failed";
          console.error("[Collector API Error]", message);
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T>(
    url: string,
    axiosConfig?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(
      url,
      axiosConfig,
    );
    return response.data;
  }

  /**
   * TASK-06: GET with localStorage caching support
   * Returns cached data if available and not expired
   */
  async getCached<T>(
    url: string,
    axiosConfig?: AxiosRequestConfig,
    cacheOptions?: CacheOptions,
  ): Promise<{ data: ApiResponse<T>; fromCache: boolean }> {
    const params = axiosConfig?.params as Record<string, unknown> | undefined;

    // Try cache first (unless force refresh)
    if (!cacheOptions?.forceRefresh) {
      const cached = getFromCache<ApiResponse<T>>(url, params, cacheOptions);
      if (cached !== null) {
        return { data: cached, fromCache: true };
      }
    }

    // Fetch fresh data
    const response = await this.get<T>(url, axiosConfig);

    // Store in cache
    setInCache(url, response, params, cacheOptions);

    return { data: response, fromCache: false };
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(
      url,
      data,
      config,
    );
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(
      url,
      data,
      config,
    );
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(
      url,
      data,
      config,
    );
    return response.data;
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(
      url,
      config,
    );
    return response.data;
  }

  async getStatus(): Promise<CollectorStatus> {
    try {
      const response = await this.get<CollectorStatus>(
        COLLECTOR_ENDPOINTS.STATUS,
      );
      return response.data;
    } catch {
      return {
        connected: false,
        metrics: { received: 0, processed: 0, errors: 0 },
        logs: { received: 0, processed: 0, errors: 0 },
        traces: { received: 0, processed: 0, errors: 0 },
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.get(COLLECTOR_ENDPOINTS.HEALTH);
      return true;
    } catch {
      return false;
    }
  }

  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }
}

export const collectorClient = new CollectorClient();
export default collectorClient;
