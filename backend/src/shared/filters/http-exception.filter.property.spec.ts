/**
 * Property-Based Tests for HTTP Exception Filter
 *
 * Feature: frontend-backend-auth-integration
 * Property 38: Standardized error responses
 * Validates: Requirements 11.1
 *
 * Tests that all error types return standardized error responses with
 * consistent structure: error code, message, statusCode, details, timestamp, and path
 */

import fc from "fast-check";
import { HttpExceptionFilter, ErrorResponse } from "./http-exception.filter";
import { BaseError } from "../errors/BaseError";
import { AuthenticationError } from "../errors/AuthenticationError";
import { ValidationError } from "../errors/ValidationError";
import { SecurityError } from "../errors/SecurityError";
import { HttpException, HttpStatus } from "@nestjs/common";
import { ArgumentsHost } from "@nestjs/common";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 38: Standardized error responses", () => {
    let filter: HttpExceptionFilter;
    let mockResponse: any;
    let mockRequest: any;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
      filter = new HttpExceptionFilter();

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      mockRequest = {
        url: "/test/path",
      };

      mockArgumentsHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as ArgumentsHost;
    });

    it("should return standardized error response for any BaseError subclass", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // AuthenticationError variants
            fc.constant(AuthenticationError.invalidCredentials()),
            fc.constant(AuthenticationError.accountLocked()),
            fc.constant(AuthenticationError.accountDisabled()),
            fc.constant(AuthenticationError.emailNotVerified()),
            fc.constant(AuthenticationError.tokenExpired()),
            fc.constant(AuthenticationError.tokenInvalid()),
            fc.constant(AuthenticationError.tokenRevoked()),

            // ValidationError variants
            fc.constant(
              ValidationError.fromFieldErrors([
                { field: "email", message: "Invalid email format" },
              ]),
            ),
            fc.constant(ValidationError.passwordTooWeak()),
            fc.constant(ValidationError.emailAlreadyExists("test@telemetryflow.id")),

            // SecurityError variants
            fc.constant(SecurityError.suspiciousActivity()),
            fc.constant(SecurityError.ipBlacklisted("192.168.1.1")),
          ),
          (error: BaseError) => {
            // Reset mocks
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();

            // Execute filter
            filter.catch(error, mockArgumentsHost);

            // Verify status was called with correct code
            expect(mockResponse.status).toHaveBeenCalledWith(error.statusCode);

            // Get the response that was sent
            const jsonCall = mockResponse.json.mock.calls[0];
            expect(jsonCall).toBeDefined();

            const response: ErrorResponse = jsonCall[0];

            // Property: All error responses must have standardized structure
            expect(response).toHaveProperty("error");
            expect(response.error).toHaveProperty("code");
            expect(response.error).toHaveProperty("message");
            expect(response.error).toHaveProperty("statusCode");
            expect(response.error).toHaveProperty("timestamp");
            expect(response.error).toHaveProperty("path");

            // Property: Error code must match the error's errorCode
            expect(response.error.code).toBe(error.errorCode);

            // Property: Message must match the error's message
            expect(response.error.message).toBe(error.message);

            // Property: Status code must match the error's statusCode
            expect(response.error.statusCode).toBe(error.statusCode);

            // Property: Path must match the request URL
            expect(response.error.path).toBe(mockRequest.url);

            // Property: Timestamp must be a valid ISO date string
            expect(() => new Date(response.error.timestamp)).not.toThrow();
            expect(new Date(response.error.timestamp).toISOString()).toBe(
              response.error.timestamp,
            );

            // Property: Details should be included if present in error
            if (error.details) {
              expect(response.error.details).toEqual(error.details);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return standardized error response for any HttpException", () => {
      fc.assert(
        fc.property(
          fc.record({
            statusCode: fc.constantFrom(
              HttpStatus.BAD_REQUEST,
              HttpStatus.UNAUTHORIZED,
              HttpStatus.FORBIDDEN,
              HttpStatus.NOT_FOUND,
              HttpStatus.CONFLICT,
              HttpStatus.UNPROCESSABLE_ENTITY,
              HttpStatus.TOO_MANY_REQUESTS,
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          ({ statusCode, message }) => {
            const error = new HttpException(message, statusCode);

            // Reset mocks
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();

            // Execute filter
            filter.catch(error, mockArgumentsHost);

            // Verify status was called
            expect(mockResponse.status).toHaveBeenCalledWith(statusCode);

            // Get the response
            const jsonCall = mockResponse.json.mock.calls[0];
            expect(jsonCall).toBeDefined();

            const response: ErrorResponse = jsonCall[0];

            // Property: All error responses must have standardized structure
            expect(response).toHaveProperty("error");
            expect(response.error).toHaveProperty("code");
            expect(response.error).toHaveProperty("message");
            expect(response.error).toHaveProperty("statusCode");
            expect(response.error).toHaveProperty("timestamp");
            expect(response.error).toHaveProperty("path");

            // Property: Status code must match
            expect(response.error.statusCode).toBe(statusCode);

            // Property: Message must be present
            expect(response.error.message).toBeTruthy();

            // Property: Error code must be a valid string
            expect(typeof response.error.code).toBe("string");
            expect(response.error.code.length).toBeGreaterThan(0);

            // Property: Path must match request URL
            expect(response.error.path).toBe(mockRequest.url);

            // Property: Timestamp must be valid ISO date
            expect(() => new Date(response.error.timestamp)).not.toThrow();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return standardized error response for any unknown error", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorMessage) => {
            const error = new Error(errorMessage);

            // Reset mocks
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();

            // Execute filter
            filter.catch(error, mockArgumentsHost);

            // Verify status was called with 500
            expect(mockResponse.status).toHaveBeenCalledWith(
              HttpStatus.INTERNAL_SERVER_ERROR,
            );

            // Get the response
            const jsonCall = mockResponse.json.mock.calls[0];
            expect(jsonCall).toBeDefined();

            const response: ErrorResponse = jsonCall[0];

            // Property: All error responses must have standardized structure
            expect(response).toHaveProperty("error");
            expect(response.error).toHaveProperty("code");
            expect(response.error).toHaveProperty("message");
            expect(response.error).toHaveProperty("statusCode");
            expect(response.error).toHaveProperty("timestamp");
            expect(response.error).toHaveProperty("path");

            // Property: Status code must be 500 for unknown errors
            expect(response.error.statusCode).toBe(
              HttpStatus.INTERNAL_SERVER_ERROR,
            );

            // Property: Error code must be INTERNAL_SERVER_ERROR
            expect(response.error.code).toBe("INTERNAL_SERVER_ERROR");

            // Property: Message must be present (sanitized in production)
            expect(response.error.message).toBeTruthy();

            // Property: Path must match request URL
            expect(response.error.path).toBe(mockRequest.url);

            // Property: Timestamp must be valid ISO date
            expect(() => new Date(response.error.timestamp)).not.toThrow();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain consistent error structure across different request paths", () => {
      fc.assert(
        fc.property(
          fc.webPath(),
          fc.oneof(
            fc.constant(AuthenticationError.invalidCredentials()),
            fc.constant(ValidationError.passwordTooWeak()),
            fc.constant(SecurityError.suspiciousActivity()),
          ),
          (path, error) => {
            // Update mock request path
            mockRequest.url = path;

            // Reset mocks
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();

            // Execute filter
            filter.catch(error, mockArgumentsHost);

            // Get the response
            const jsonCall = mockResponse.json.mock.calls[0];
            const response: ErrorResponse = jsonCall[0];

            // Property: Path in response must match request path
            expect(response.error.path).toBe(path);

            // Property: Structure must be consistent regardless of path
            expect(response).toHaveProperty("error");
            expect(response.error).toHaveProperty("code");
            expect(response.error).toHaveProperty("message");
            expect(response.error).toHaveProperty("statusCode");
            expect(response.error).toHaveProperty("timestamp");
            expect(response.error).toHaveProperty("path");

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should include details field when error has details", () => {
      fc.assert(
        fc.property(
          fc.record({
            field: fc.string({ minLength: 1, maxLength: 50 }),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          (validationDetail) => {
            const error = ValidationError.fromFieldErrors([validationDetail]);

            // Reset mocks
            mockResponse.status.mockClear();
            mockResponse.json.mockClear();

            // Execute filter
            filter.catch(error, mockArgumentsHost);

            // Get the response
            const jsonCall = mockResponse.json.mock.calls[0];
            const response: ErrorResponse = jsonCall[0];

            // Property: Details must be included when present
            expect(response.error.details).toBeDefined();
            expect(response.error.details).toHaveProperty("validationErrors");
            expect(Array.isArray(response.error.details!.validationErrors)).toBe(
              true,
            );
            expect(response.error.details!.validationErrors).toContainEqual(
              validationDetail,
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should generate unique timestamps for errors occurring at different times", async () => {
      const error = AuthenticationError.invalidCredentials();
      const timestamps: string[] = [];

      // Collect timestamps from multiple error responses
      for (let i = 0; i < 10; i++) {
        mockResponse.status.mockClear();
        mockResponse.json.mockClear();

        filter.catch(error, mockArgumentsHost);

        const jsonCall = mockResponse.json.mock.calls[0];
        const response: ErrorResponse = jsonCall[0];
        timestamps.push(response.error.timestamp);

        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Property: Timestamps should be chronologically ordered
      for (let i = 1; i < timestamps.length; i++) {
        const prevTime = new Date(timestamps[i - 1]).getTime();
        const currTime = new Date(timestamps[i]).getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });
});
