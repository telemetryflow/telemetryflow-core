/**
 * Unit Tests for useApiError Composable
 * Feature: frontend-backend-monitoring-uptime-integration
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useApiError } from "../useApiError";

describe("useApiError", () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("handleError", () => {
    /**
     * Requirement 7.1: Handle 404 errors
     * Test that 404 error displays "Monitor not found" message
     */
    it("should handle 404 error with correct message and redirect", () => {
      const { handleError } = useApiError();

      const error = {
        response: {
          status: 404,
          data: {},
        },
      };

      const result = handleError(error);

      expect(result.type).toBe("not_found");
      expect(result.message).toBe("Monitor not found. It may have been deleted.");
      expect(result.canRetry).toBe(false);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe("/monitoring/uptime");
    });

    /**
     * Requirement 7.2: Handle 401/403 errors
     * Test that 401 error displays authentication error message
     */
    it("should handle 401 error with correct message and redirect", () => {
      const { handleError } = useApiError();

      const error = {
        response: {
          status: 401,
          data: {},
        },
      };

      const result = handleError(error);

      expect(result.type).toBe("auth_error");
      expect(result.message).toBe("You don't have permission to access this monitor.");
      expect(result.canRetry).toBe(false);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe("/login");
    });

    /**
     * Requirement 7.2: Handle 401/403 errors
     * Test that 403 error displays authorization error message
     */
    it("should handle 403 error with correct message and redirect", () => {
      const { handleError } = useApiError();

      const error = {
        response: {
          status: 403,
          data: {},
        },
      };

      const result = handleError(error);

      expect(result.type).toBe("auth_error");
      expect(result.message).toBe("You don't have permission to access this monitor.");
      expect(result.canRetry).toBe(false);
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe("/login");
    });

    /**
     * Requirement 7.3: Handle 500 errors
     * Test that 500 error displays server error message
     */
    it("should handle 500 error with correct message and retry option", () => {
      const { handleError } = useApiError();

      const error = {
        response: {
          status: 500,
          data: {},
        },
      };

      const result = handleError(error);

      expect(result.type).toBe("server_error");
      expect(result.message).toBe("Server error occurred. Please try again later.");
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(2000);
    });

    /**
     * Requirement 7.3: Handle 500 errors
     * Test that 502 error is handled as server error
     */
    it("should handle 502 error as server error", () => {
      const { handleError } = useApiError();

      const error = {
        response: {
          status: 502,
          data: {},
        },
      };

      const result = handleError(error);

      expect(result.type).toBe("server_error");
      expect(result.canRetry).toBe(true);
    });

    /**
     * Requirement 7.3: Handle 500 errors
     * Test that 503 error is handled as server error
     */
    it("should handle 503 error as server error", () => {
      const { handleError } = useApiError();

      const error = {
        response: {
          status: 503,
          data: {},
        },
      };

      const result = handleError(error);

      expect(result.type).toBe("server_error");
      expect(result.canRetry).toBe(true);
    });

    /**
     * Requirement 7.4: Handle network errors
     * Test that network request failure displays connection error message
     */
    it("should handle network error with correct message", () => {
      const { handleError } = useApiError();

      const error = {
        request: {},
        message: "Network Error",
      };

      const result = handleError(error);

      expect(result.type).toBe("network_error");
      expect(result.message).toBe("Connection failed. Please check your internet connection.");
      expect(result.canRetry).toBe(true);
      expect(result.retryDelay).toBe(3000);
    });

    it("should handle 400 validation error with details", () => {
      const { handleError } = useApiError();

      const error = {
        response: {
          status: 400,
          data: {
            message: "Validation failed",
            errors: {
              name: "Name is required",
              url: "Invalid URL format",
            },
          },
        },
      };

      const result = handleError(error);

      expect(result.type).toBe("validation_error");
      expect(result.message).toBe("Validation failed");
      expect(result.details).toEqual({
        name: "Name is required",
        url: "Invalid URL format",
      });
      expect(result.canRetry).toBe(false);
    });

    it("should handle unknown HTTP status codes", () => {
      const { handleError } = useApiError();

      const error = {
        response: {
          status: 418, // I'm a teapot
          data: {},
        },
      };

      const result = handleError(error);

      expect(result.type).toBe("unknown_error");
      expect(result.message).toBe("An unexpected error occurred");
      expect(result.canRetry).toBe(true);
    });

    it("should handle errors without response or request", () => {
      const { handleError } = useApiError();

      const error = {
        message: "Something went wrong",
      };

      const result = handleError(error);

      expect(result.type).toBe("unknown_error");
      expect(result.message).toBe("Something went wrong");
      expect(result.canRetry).toBe(false);
    });

    it("should handle errors without message", () => {
      const { handleError } = useApiError();

      const error = {};

      const result = handleError(error);

      expect(result.type).toBe("unknown_error");
      expect(result.message).toBe("An unexpected error occurred");
      expect(result.canRetry).toBe(false);
    });
  });

  describe("logError", () => {
    it("should log error with context to console", () => {
      const { logError } = useApiError();

      const error = {
        message: "Test error",
        response: {
          status: 500,
          data: { error: "Internal server error" },
        },
        stack: "Error stack trace",
      };

      logError(error, "fetchMonitors");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Uptime API Error] fetchMonitors:",
        {
          message: "Test error",
          response: { error: "Internal server error" },
          status: 500,
          stack: "Error stack trace",
        }
      );
    });

    it("should handle errors without response", () => {
      const { logError } = useApiError();

      const error = {
        message: "Network error",
        stack: "Error stack trace",
      };

      logError(error, "getMonitor");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Uptime API Error] getMonitor:",
        {
          message: "Network error",
          response: undefined,
          status: undefined,
          stack: "Error stack trace",
        }
      );
    });
  });

  describe("fetchWithRetry", () => {
    it("should return result on first successful attempt", async () => {
      const { fetchWithRetry } = useApiError();

      const mockFn = vi.fn().mockResolvedValue("success");

      const result = await fetchWithRetry(mockFn);

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable errors", async () => {
      const { fetchWithRetry } = useApiError();

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({
          response: { status: 500 },
        })
        .mockRejectedValueOnce({
          response: { status: 500 },
        })
        .mockResolvedValue("success");

      const result = await fetchWithRetry(mockFn, 3, 10); // Short delay for testing

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it("should not retry on non-retryable errors", async () => {
      const { fetchWithRetry } = useApiError();

      const error = {
        response: { status: 404 },
      };

      const mockFn = vi.fn().mockRejectedValue(error);

      await expect(fetchWithRetry(mockFn)).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should throw error after max retries", async () => {
      const { fetchWithRetry } = useApiError();

      const error = {
        response: { status: 500 },
      };

      const mockFn = vi.fn().mockRejectedValue(error);

      await expect(fetchWithRetry(mockFn, 2, 10)).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should use exponential backoff for retries", async () => {
      const { fetchWithRetry } = useApiError();

      const startTime = Date.now();
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValue("success");

      await fetchWithRetry(mockFn, 2, 100); // 100ms base delay

      const elapsed = Date.now() - startTime;

      // First retry: 100ms, second retry: 200ms = 300ms total minimum
      expect(elapsed).toBeGreaterThanOrEqual(300);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });
});
