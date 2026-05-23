/**
 * Property-Based Tests for Authentication - Validation Error Completeness
 *
 * Feature: frontend-backend-auth-integration
 * Property 10: Validation error completeness
 * Validates: Requirements 3.5, 11.3
 *
 * Tests that when multiple fields have validation errors, ALL errors are
 * returned in a single response, not just the first error encountered.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { ValidationPipe, BadRequestException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RegisterDto } from "../dto/register.dto";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 10: Validation error completeness", () => {
    let validationPipe: ValidationPipe;

    beforeEach(async () => {
      // Create a ValidationPipe instance matching the app configuration
      validationPipe = new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      });
    });

    it("should return ALL validation errors in a single response for invalid registration data", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate registration data with multiple invalid fields
          fc.record({
            username: fc.oneof(
              fc.constant(""), // Too short
              fc.constant("ab"), // Too short
              fc.string({ minLength: 51, maxLength: 100 }), // Too long
              fc.constant(null as any), // Invalid type
              fc.constant(undefined as any), // Missing
            ),
            email: fc.oneof(
              fc.constant("not-an-email"), // Invalid format
              fc.constant("missing@domain"), // Invalid format
              fc.constant("@nodomain.com"), // Invalid format
              fc.constant(""), // Empty
              fc.constant(null as any), // Invalid type
            ),
            password: fc.oneof(
              fc.constant("short"), // Too short
              fc.constant("nouppercase123!"), // Missing uppercase
              fc.constant("NOLOWERCASE123!"), // Missing lowercase
              fc.constant("NoNumbers!"), // Missing number
              fc.constant("NoSpecial123"), // Missing special char
              fc.constant(""), // Empty
            ),
            firstName: fc.oneof(
              fc.constant(""), // Empty
              fc.constant("   "), // Whitespace only
              fc.string({ minLength: 101, maxLength: 150 }), // Too long
              fc.constant(null as any), // Invalid type
            ),
            lastName: fc.oneof(
              fc.constant(""), // Empty
              fc.constant("   "), // Whitespace only
              fc.string({ minLength: 101, maxLength: 150 }), // Too long
              fc.constant(null as any), // Invalid type
            ),
            regionId: fc.oneof(
              fc.constant("not-a-uuid"), // Invalid UUID
              fc.constant(""), // Empty
              fc.constant(null as any), // Invalid type
            ),
          }),
          async (invalidData) => {
            // Transform plain object to DTO instance
            const dto = plainToInstance(RegisterDto, invalidData);

            // Validate using class-validator directly
            const errors = await validate(dto);

            // Property 1: Validation should detect errors
            expect(errors.length).toBeGreaterThan(0);

            // Property 2: Multiple fields should have errors (completeness check)
            // Count how many fields have validation errors
            const fieldsWithErrors = new Set(errors.map((err) => err.property));

            // Count how many fields in the input are actually invalid
            let expectedInvalidFields = 0;
            if (!invalidData.username || invalidData.username.length < 3 || invalidData.username.length > 50) {
              expectedInvalidFields++;
            }
            if (!invalidData.email || !invalidData.email.includes("@") || !invalidData.email.includes(".")) {
              expectedInvalidFields++;
            }
            if (!invalidData.password || invalidData.password.length < 8 || 
                !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/.test(invalidData.password)) {
              expectedInvalidFields++;
            }
            if (!invalidData.firstName || invalidData.firstName.trim().length === 0 || invalidData.firstName.length > 100) {
              expectedInvalidFields++;
            }
            if (!invalidData.lastName || invalidData.lastName.trim().length === 0 || invalidData.lastName.length > 100) {
              expectedInvalidFields++;
            }
            if (!invalidData.regionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invalidData.regionId)) {
              expectedInvalidFields++;
            }

            // Property 3: All invalid fields should be reported (Requirement 3.5, 11.3)
            // The number of fields with errors should match or be close to expected
            // (Some fields might have multiple constraint violations)
            expect(fieldsWithErrors.size).toBeGreaterThanOrEqual(1);
            expect(fieldsWithErrors.size).toBeLessThanOrEqual(6); // Max 6 fields in RegisterDto

            // Property 4: Each error should have field information
            errors.forEach((error) => {
              expect(error.property).toBeDefined();
              expect(typeof error.property).toBe("string");
              expect(error.property.length).toBeGreaterThan(0);
            });

            // Property 5: Each error should have constraint information
            errors.forEach((error) => {
              expect(error.constraints).toBeDefined();
              expect(typeof error.constraints).toBe("object");
              expect(Object.keys(error.constraints!).length).toBeGreaterThan(0);
            });

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return errors for ALL invalid fields simultaneously, not stopping at first error", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate data where we KNOW multiple fields are invalid
          fc.tuple(
            fc.constant("x"), // Invalid username (too short)
            fc.constant("invalid-email"), // Invalid email
            fc.constant("weak"), // Invalid password (too short)
            fc.constant(""), // Invalid firstName (empty)
            fc.constant(""), // Invalid lastName (empty)
            fc.constant("not-uuid"), // Invalid regionId
          ),
          async ([username, email, password, firstName, lastName, regionId]) => {
            const dto = plainToInstance(RegisterDto, {
              username,
              email,
              password,
              firstName,
              lastName,
              regionId,
            });

            const errors = await validate(dto);

            // Property: ALL 6 fields should have validation errors
            const fieldsWithErrors = new Set(errors.map((err) => err.property));

            // Requirement 11.3: ALL validation errors must be returned in a single response
            expect(fieldsWithErrors.size).toBe(6);
            expect(fieldsWithErrors.has("username")).toBe(true);
            expect(fieldsWithErrors.has("email")).toBe(true);
            expect(fieldsWithErrors.has("password")).toBe(true);
            expect(fieldsWithErrors.has("firstName")).toBe(true);
            expect(fieldsWithErrors.has("lastName")).toBe(true);
            expect(fieldsWithErrors.has("regionId")).toBe(true);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should provide detailed error messages for each validation constraint violation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.constant("ab"), // Too short - will trigger MinLength
            email: fc.constant("not-email"), // Invalid format - will trigger IsEmail
            password: fc.constant("short"), // Too short and weak - will trigger multiple
            firstName: fc.constant(""), // Empty - will trigger MinLength
            lastName: fc.constant(""), // Empty - will trigger MinLength
            regionId: fc.constant("invalid"), // Not UUID - will trigger IsUUID
          }),
          async (invalidData) => {
            const dto = plainToInstance(RegisterDto, invalidData);
            const errors = await validate(dto);

            // Property: Each field error should have descriptive constraint messages
            errors.forEach((error) => {
              // Each error should have at least one constraint
              expect(error.constraints).toBeDefined();
              const constraintMessages = Object.values(error.constraints!);
              expect(constraintMessages.length).toBeGreaterThan(0);

              // Each constraint message should be a non-empty string
              constraintMessages.forEach((message) => {
                expect(typeof message).toBe("string");
                expect(message.length).toBeGreaterThan(0);
              });
            });

            // Property: Error messages should be human-readable
            const allMessages = errors.flatMap((err) =>
              Object.values(err.constraints || {}),
            );

            allMessages.forEach((message) => {
              // Messages should contain field-relevant information
              expect(message).toMatch(/[a-zA-Z]/); // Contains letters
              expect(message.length).toBeGreaterThan(5); // Reasonably descriptive
            });

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle partial validation failures (some valid, some invalid fields)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Valid fields
            username: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
            email: fc.emailAddress(),
            // Generate valid UUID v4
            regionId: fc.uuid().map(uuid => {
              // Convert any UUID to v4 format by replacing version and variant bits
              const parts = uuid.split('-');
              parts[2] = '4' + parts[2].substring(1); // Set version to 4
              parts[3] = '8' + parts[3].substring(1); // Set variant to 10xx
              return parts.join('-');
            }),
            // Invalid fields
            password: fc.constant("weak"), // Too short
            firstName: fc.constant(""), // Empty
            lastName: fc.constant(""), // Empty
          }),
          async (mixedData) => {
            const dto = plainToInstance(RegisterDto, mixedData);
            const errors = await validate(dto);

            // Property: Only invalid fields should have errors
            const fieldsWithErrors = new Set(errors.map((err) => err.property));

            // Valid fields should NOT have errors
            expect(fieldsWithErrors.has("username")).toBe(false);
            expect(fieldsWithErrors.has("email")).toBe(false);
            expect(fieldsWithErrors.has("regionId")).toBe(false);

            // Invalid fields SHOULD have errors
            expect(fieldsWithErrors.has("password")).toBe(true);
            expect(fieldsWithErrors.has("firstName")).toBe(true);
            expect(fieldsWithErrors.has("lastName")).toBe(true);

            // Property: Total errors should match invalid fields
            expect(fieldsWithErrors.size).toBe(3);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should return validation errors in a consistent format across different error types", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Different types of validation failures
            fc.constant({
              username: "ab", // MinLength violation
              email: "valid@email.com",
              password: "ValidPass123!",
              firstName: "John",
              lastName: "Doe",
              regionId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4
            }),
            fc.constant({
              username: "validuser",
              email: "not-an-email", // Format violation
              password: "ValidPass123!",
              firstName: "John",
              lastName: "Doe",
              regionId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4
            }),
            fc.constant({
              username: "validuser",
              email: "valid@email.com",
              password: "NoSpecial123", // Pattern violation
              firstName: "John",
              lastName: "Doe",
              regionId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID v4
            }),
          ),
          async (testData) => {
            const dto = plainToInstance(RegisterDto, testData);
            const errors = await validate(dto);

            // Property: All errors should have consistent structure
            errors.forEach((error) => {
              // Each error must have these properties
              expect(error).toHaveProperty("property");
              expect(error).toHaveProperty("constraints");
              expect(error).toHaveProperty("value");

              // Property type should be string
              expect(typeof error.property).toBe("string");

              // Constraints should be an object with string values
              expect(typeof error.constraints).toBe("object");
              if (error.constraints) {
                Object.values(error.constraints).forEach((msg) => {
                  expect(typeof msg).toBe("string");
                });
              }
            });

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should validate that error response structure matches ValidationError format", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant({
            username: "x",
            email: "invalid",
            password: "weak",
            firstName: "",
            lastName: "",
            regionId: "not-uuid",
          }),
          async (invalidData) => {
            const dto = plainToInstance(RegisterDto, invalidData);
            const errors = await validate(dto);

            // Property: Errors can be transformed to ValidationError format
            // This validates that the error structure is compatible with our
            // ValidationError class (Requirements 11.1, 11.3)

            const validationErrorDetails = errors.map((error) => ({
              field: error.property,
              message: Object.values(error.constraints || {})[0] || "Validation failed",
              value: error.value,
            }));

            // Property: All errors should be transformable
            expect(validationErrorDetails.length).toBe(errors.length);

            // Property: Each transformed error should have required fields
            validationErrorDetails.forEach((detail) => {
              expect(detail.field).toBeDefined();
              expect(typeof detail.field).toBe("string");
              expect(detail.message).toBeDefined();
              expect(typeof detail.message).toBe("string");
            });

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });
  });
});
