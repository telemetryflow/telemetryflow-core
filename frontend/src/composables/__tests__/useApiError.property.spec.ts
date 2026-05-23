/**
 * Property-Based Tests for useApiError Composable
 * Feature: frontend-backend-monitoring-uptime-integration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import { useApiError } from "../useApiError";

describe("useApiError - Property-Based Tests", () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  /**
   * **Validates: Requirements 7.6**
   * 
   * Property 21: API Error Logging
   * 
   * For any API error encountered, the Frontend should log the error to the
   * console with sufficient detail for debugging.
   */
  describe("Property 21: API Error Logging", () => {
    it("should log all API errors to console with context", () => {
      fc.assert(
        fc.property(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 200 }),
            status: fc.option(fc.integer({ min: 400, max: 599 }), {
              nil: undefined,
            }),
            responseData: fc.option(
              fc.record({
                error: fc.string(),
                message: fc.string(),
              }),
              { nil: undefined }
            ),
            stack: fc.option(fc.string(), { nil: undefined }),
          }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (errorData, context) => {
            const { logError } = useApiError();
            consoleErrorSpy.mockClear();

            const error: any = {
              message: errorData.message,
              stack: errorData.stack,
            };

            if (errorData.status !== undefined) {
              error.response = {
                status: errorData.status,
                data: errorData.responseData,
              };
            }

            logError(error, context);

            // Verify console.error was called
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

            // Verify the log includes context
            const logCall = consoleErrorSpy.mock.calls[0];
            expect(logCall[0]).toContain(context);
            expect(logCall[0]).toContain("[Uptime API Error]");

            // Verify the log includes error details
            const logDetails = logCall[1];
            expect(logDetails.message).toBe(errorData.message);
            
            // Handle undefined status and response data
            if (errorData.status !== undefined) {
              expect(logDetails.status).toBe(errorData.status);
              expect(logDetails.response).toBe(errorData.responseData);
            } else {
              expect(logDetails.status).toBeUndefined();
              expect(logDetails.response).toBeUndefined();
            }
            
            expect(logDetails.stack).toBe(errorData.stack);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should log errors with varying response structures", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // HTTP error with response
            fc.record({
              message: fc.string(),
              response: fc.record({
                status: fc.integer({ min: 400, max: 599 }),
                data: fc.anything(),
              }),
            }),
            // Network error without response
            fc.record({
              message: fc.string(),
              request: fc.constant({}),
            }),
            // Generic error
            fc.record({
              message: fc.string(),
            })
          ),
          fc.string({ minLength: 1, maxLength: 50 }),
          (error, context) => {
            const { logError } = useApiError();
            consoleErrorSpy.mockClear();

            logError(error, context);

            // Verify logging occurred
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

            // Verify context is included
            expect(consoleErrorSpy.mock.calls[0][0]).toContain(context);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Validates: Requirements 7.5**
   * 
   * Property 20: Error Retry Availability
   * 
   * For any API error (404, 401, 403, 500, network failure), the Frontend
   * should provide an option to retry the failed request.
   */
  describe("Property 20: Error Retry Availability", () => {
    it("should indicate retry availability for all error types", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // 404 error
            fc.record({
              response: fc.record({
                status: fc.constant(404),
                data: fc.anything(),
              }),
            }),
            // 401 error
            fc.record({
              response: fc.record({
                status: fc.constant(401),
                data: fc.anything(),
              }),
            }),
            // 403 error
            fc.record({
              response: fc.record({
                status: fc.constant(403),
                data: fc.anything(),
              }),
            }),
            // 500 error
            fc.record({
              response: fc.record({
                status: fc.constant(500),
                data: fc.anything(),
              }),
            }),
            // Network error
            fc.record({
              request: fc.constant({}),
              message: fc.string(),
            })
          ),
          (error) => {
            const { handleError } = useApiError();

            const errorInfo = handleError(error);

            // Verify ErrorInfo has canRetry field
            expect(errorInfo).toHaveProperty("canRetry");
            expect(typeof errorInfo.canRetry).toBe("boolean");

            // Verify error type is categorized
            expect(errorInfo.type).toMatch(
              /^(not_found|auth_error|server_error|network_error|validation_error|unknown_error)$/
            );

            // Verify message is provided
            expect(errorInfo.message).toBeTruthy();
            expect(typeof errorInfo.message).toBe("string");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should correctly categorize retryable vs non-retryable errors", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }),
          (statusCode) => {
            const { handleError } = useApiError();

            const error = {
              response: {
                status: statusCode,
                data: {},
              },
            };

            const errorInfo = handleError(error);

            // Non-retryable: 404, 401, 403, 400
            const nonRetryableStatuses = [400, 401, 403, 404];
            // Retryable: 500, 502, 503
            const retryableStatuses = [500, 502, 503];

            if (nonRetryableStatuses.includes(statusCode)) {
              expect(errorInfo.canRetry).toBe(false);
            } else if (retryableStatuses.includes(statusCode)) {
              expect(errorInfo.canRetry).toBe(true);
              expect(errorInfo.retryDelay).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should provide retry delay for retryable errors", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(500, 502, 503),
          (statusCode) => {
            const { handleError } = useApiError();

            const error = {
              response: {
                status: statusCode,
                data: {},
              },
            };

            const errorInfo = handleError(error);

            // Retryable errors should have retry delay
            if (errorInfo.canRetry) {
              expect(errorInfo.retryDelay).toBeDefined();
              expect(errorInfo.retryDelay).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should successfully retry and return result for any retryable operation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 3 }),
          fc.anything(),
          async (failureCount, successValue) => {
            const { fetchWithRetry } = useApiError();

            let attempts = 0;
            const mockFn = vi.fn(async () => {
              attempts++;
              if (attempts <= failureCount) {
                throw { response: { status: 500 } };
              }
              return successValue;
            });

            if (failureCount <= 3) {
              // Should succeed within max retries
              const result = await fetchWithRetry(mockFn, 3, 10);
              expect(result).toEqual(successValue);
              expect(mockFn).toHaveBeenCalledTimes(failureCount + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should respect exponential backoff timing for retries", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 50, max: 100 }), // Reduced range for faster tests
          async (baseDelay) => {
            const { fetchWithRetry } = useApiError();

            const startTime = Date.now();
            let attempts = 0;

            const mockFn = vi.fn(async () => {
              attempts++;
              if (attempts <= 2) {
                throw { response: { status: 500 } };
              }
              return "success";
            });

            await fetchWithRetry(mockFn, 2, baseDelay);

            const elapsed = Date.now() - startTime;

            // First retry: baseDelay, second retry: baseDelay * 2
            // Total minimum: baseDelay + baseDelay * 2 = baseDelay * 3
            const expectedMinDelay = baseDelay * 3;

            expect(elapsed).toBeGreaterThanOrEqual(expectedMinDelay - 10); // Allow 10ms tolerance
            expect(mockFn).toHaveBeenCalledTimes(3);
          }
        ),
        { numRuns: 20 } // Reduced runs due to timing sensitivity
      );
    }, 10000); // 10 second timeout for timing-sensitive test

    it("should not retry non-retryable errors regardless of max retries", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(404, 401, 403, 400),
          fc.integer({ min: 1, max: 5 }),
          async (statusCode, maxRetries) => {
            const { fetchWithRetry } = useApiError();

            const error = { response: { status: statusCode } };
            const mockFn = vi.fn().mockRejectedValue(error);

            await expect(fetchWithRetry(mockFn, maxRetries, 10)).rejects.toEqual(
              error
            );

            // Should only be called once, no retries
            expect(mockFn).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Error message consistency
   * 
   * Verify that error messages are always strings and non-empty
   */
  describe("Error Message Consistency", () => {
    it("should always return non-empty string messages for any error", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({
              response: fc.record({
                status: fc.integer({ min: 400, max: 599 }),
                data: fc.anything(),
              }),
            }),
            fc.record({
              request: fc.constant({}),
              message: fc.option(fc.string(), { nil: undefined }),
            }),
            fc.record({
              message: fc.option(fc.string(), { nil: undefined }),
            })
          ),
          (error) => {
            const { handleError } = useApiError();

            const errorInfo = handleError(error);

            // Message should always be a non-empty string
            expect(typeof errorInfo.message).toBe("string");
            expect(errorInfo.message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
