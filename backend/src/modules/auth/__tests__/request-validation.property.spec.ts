/**
 * Property-Based Tests for Authentication - Request Payload Validation
 *
 * Feature: frontend-backend-auth-integration
 * Property 44: Request payload validation
 * Validates: Requirements 12.4
 *
 * Tests that for any incoming request, the backend validates the payload
 * against the defined schema and rejects invalid requests with detailed
 * validation errors.
 */

import fc from "fast-check";
import { validate, ValidationError } from "class-validator";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 44: Request payload validation", () => {
    /**
     * Helper function to validate a DTO and return validation errors
     */
    async function validateDto(
      dtoClass: any,
      payload: any,
    ): Promise<ValidationError[]> {
      const dto = Object.assign(new dtoClass(), payload);
      return await validate(dto);
    }

    /**
     * Helper function to check if validation errors contain expected fields
     */
    function hasValidationErrorForField(
      errors: ValidationError[],
      field: string,
    ): boolean {
      return errors.some((error) => error.property === field);
    }

    it("should accept valid login payloads", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 128 }),
          async (email, password) => {
            const payload = { email, password };
            const errors = await validateDto(LoginDto, payload);

            // Property: Valid payloads should pass validation
            expect(errors).toHaveLength(0);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should reject invalid email formats in login", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => !s.includes("@")), // Invalid email
          fc.string({ minLength: 8, maxLength: 128 }),
          async (invalidEmail, password) => {
            const payload = { email: invalidEmail, password };
            const errors = await validateDto(LoginDto, payload);

            // Property: Invalid email should be rejected
            expect(errors.length).toBeGreaterThan(0);
            expect(hasValidationErrorForField(errors, "email")).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should reject passwords that are too short", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 7 }), // Too short
          async (email, shortPassword) => {
            const payload = { email, password: shortPassword };
            const errors = await validateDto(LoginDto, payload);

            // Property: Short passwords should be rejected
            expect(errors.length).toBeGreaterThan(0);
            expect(hasValidationErrorForField(errors, "password")).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should return all validation errors for invalid login payloads", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter((s) => !s.includes("@")), // Invalid email
          fc.string({ maxLength: 7 }), // Too short password
          async (invalidEmail, shortPassword) => {
            const payload = { email: invalidEmail, password: shortPassword };
            const errors = await validateDto(LoginDto, payload);

            // Property: All validation errors should be returned
            expect(errors.length).toBeGreaterThanOrEqual(2);
            expect(hasValidationErrorForField(errors, "email")).toBe(true);
            expect(hasValidationErrorForField(errors, "password")).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should accept valid registration payloads", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.uuid({ version: 4 }), // Only version 4 UUIDs
          async (username, email, firstName, lastName, regionId) => {
            // Generate a valid password
            const password = "SecurePass@123";

            const payload = {
              username,
              email,
              password,
              firstName,
              lastName,
              regionId,
            };
            const errors = await validateDto(RegisterDto, payload);

            // Property: Valid payloads should pass validation
            expect(errors).toHaveLength(0);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should reject weak passwords in registration", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.uuid({ version: 4 }), // Only version 4 UUIDs
          fc.oneof(
            fc.constant("password"), // No uppercase, number, or special char
            fc.constant("PASSWORD123"), // No lowercase or special char
            fc.constant("Password"), // No number or special char
          ),
          async (
            username,
            email,
            firstName,
            lastName,
            regionId,
            weakPassword,
          ) => {
            const payload = {
              username,
              email,
              password: weakPassword,
              firstName,
              lastName,
              regionId,
            };
            const errors = await validateDto(RegisterDto, payload);

            // Property: Weak passwords should be rejected
            expect(errors.length).toBeGreaterThan(0);
            expect(hasValidationErrorForField(errors, "password")).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should reject invalid UUIDs for regionId", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string().filter((s) => !isValidUUID(s)), // Invalid UUID
          async (username, email, firstName, lastName, invalidRegionId) => {
            const password = "SecurePass@123";

            const payload = {
              username,
              email,
              password,
              firstName,
              lastName,
              regionId: invalidRegionId,
            };
            const errors = await validateDto(RegisterDto, payload);

            // Property: Invalid UUIDs should be rejected
            expect(errors.length).toBeGreaterThan(0);
            expect(hasValidationErrorForField(errors, "regionId")).toBe(true);
          },
        ),
        { numRuns: 30 },
      );
    }, 30000);

    it("should return all validation errors for multiple invalid fields", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ maxLength: 2 }), // Too short username
          fc.string().filter((s) => !s.includes("@")), // Invalid email
          fc.string({ maxLength: 7 }), // Too short password
          fc.string({ maxLength: 0 }), // Empty firstName
          fc.string({ maxLength: 0 }), // Empty lastName
          fc.string().filter((s) => !isValidUUID(s)), // Invalid UUID
          async (
            shortUsername,
            invalidEmail,
            shortPassword,
            emptyFirstName,
            emptyLastName,
            invalidRegionId,
          ) => {
            const payload = {
              username: shortUsername,
              email: invalidEmail,
              password: shortPassword,
              firstName: emptyFirstName,
              lastName: emptyLastName,
              regionId: invalidRegionId,
            };
            const errors = await validateDto(RegisterDto, payload);

            // Property: All validation errors should be returned in a single response
            expect(errors.length).toBeGreaterThanOrEqual(4);

            // Verify multiple fields have errors
            const errorFields = errors.map((e) => e.property);
            expect(errorFields.length).toBeGreaterThan(1);
          },
        ),
        { numRuns: 30 },
      );
    }, 30000);

    it("should accept valid password change payloads", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 100 }),
          async (currentPassword) => {
            const newPassword = "NewSecure@123";

            const payload = { currentPassword, newPassword };
            const errors = await validateDto(ChangePasswordDto, payload);

            // Property: Valid payloads should pass validation
            expect(errors).toHaveLength(0);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should reject weak new passwords", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 100 }),
          fc.oneof(
            fc.constant("weakpass"), // No uppercase, number, or special char
            fc.constant("WEAKPASS123"), // No lowercase or special char
            fc.constant("WeakPass"), // No number or special char
          ),
          async (currentPassword, weakNewPassword) => {
            const payload = {
              currentPassword,
              newPassword: weakNewPassword,
            };
            const errors = await validateDto(ChangePasswordDto, payload);

            // Property: Weak new passwords should be rejected
            expect(errors.length).toBeGreaterThan(0);
            expect(hasValidationErrorForField(errors, "newPassword")).toBe(
              true,
            );
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    it("should reject empty current password", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(""), async (emptyPassword) => {
          const newPassword = "NewSecure@123";

          const payload = {
            currentPassword: emptyPassword,
            newPassword,
          };
          const errors = await validateDto(ChangePasswordDto, payload);

          // Property: Empty current password should be rejected
          expect(errors.length).toBeGreaterThan(0);
          expect(hasValidationErrorForField(errors, "currentPassword")).toBe(
            true,
          );
        }),
        { numRuns: 30 },
      );
    }, 30000);
  });
});

/**
 * Helper function to check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
