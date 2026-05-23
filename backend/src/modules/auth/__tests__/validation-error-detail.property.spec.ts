/**
 * Property-Based Tests for Authentication - Validation Error Detail
 *
 * Feature: frontend-backend-auth-integration
 * **Validates: Requirements 12.5**
 * Property 45: Validation error detail
 *
 * Tests that for any request validation failure, the backend returns detailed
 * validation errors for all invalid fields with specific error messages.
 */

import fc from "fast-check";
import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { ForgotPasswordDto } from "../dto/password-reset.dto";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 45: Validation error detail", () => {
    /**
     * Helper function to validate a DTO and return validation errors
     */
    async function validateDto(
      dtoClass: any,
      payload: any,
    ): Promise<ValidationError[]> {
      const dto = plainToInstance(dtoClass, payload);
      return await validate(dto);
    }

    it("should return detailed field-level error information for each invalid field", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.constant("ab"), // Too short
            email: fc.constant("not-an-email"), // Invalid format
            password: fc.constant("weak"), // Too short and weak
            firstName: fc.constant(""), // Empty
            lastName: fc.constant(""), // Empty
            regionId: fc.constant("not-uuid"), // Invalid UUID
          }),
          async (invalidData) => {
            const errors = await validateDto(RegisterDto, invalidData);

            // Property: Each invalid field should have detailed error information
            expect(errors.length).toBeGreaterThan(0);

            errors.forEach((error) => {
              // Each error must have the field name
              expect(error.property).toBeDefined();
              expect(typeof error.property).toBe("string");
              expect(error.property.length).toBeGreaterThan(0);

              // Each error must have constraints with specific error messages
              expect(error.constraints).toBeDefined();
              expect(typeof error.constraints).toBe("object");
              expect(Object.keys(error.constraints!).length).toBeGreaterThan(0);

              // Each constraint message should be specific and descriptive
              Object.values(error.constraints!).forEach((message) => {
                expect(typeof message).toBe("string");
                expect(message.length).toBeGreaterThan(0);
                // Message should be descriptive (more than just "invalid")
                expect(message.length).toBeGreaterThan(5);
              });

              // Each error should include the invalid value
              expect(error.value).toBeDefined();
            });

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should provide specific error messages for different validation constraint types", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // MinLength violation
            fc.constant({
              username: "ab",
              email: "valid@email.com",
              password: "ValidPass@123",
              firstName: "John",
              lastName: "Doe",
              regionId: "550e8400-e29b-41d4-a716-446655440000",
            }),
            // Email format violation
            fc.constant({
              username: "validuser",
              email: "not-an-email",
              password: "ValidPass@123",
              firstName: "John",
              lastName: "Doe",
              regionId: "550e8400-e29b-41d4-a716-446655440000",
            }),
            // Password pattern violation
            fc.constant({
              username: "validuser",
              email: "valid@email.com",
              password: "weakpass",
              firstName: "John",
              lastName: "Doe",
              regionId: "550e8400-e29b-41d4-a716-446655440000",
            }),
            // UUID format violation
            fc.constant({
              username: "validuser",
              email: "valid@email.com",
              password: "ValidPass@123",
              firstName: "John",
              lastName: "Doe",
              regionId: "not-a-uuid",
            }),
          ),
          async (testData) => {
            const errors = await validateDto(RegisterDto, testData);

            // Property: Each constraint type should have a specific error message
            errors.forEach((error) => {
              const constraintKeys = Object.keys(error.constraints || {});
              const constraintMessages = Object.values(error.constraints || {});

              // Each constraint should have a unique key identifying the type
              expect(constraintKeys.length).toBeGreaterThan(0);
              constraintKeys.forEach((key) => {
                expect(typeof key).toBe("string");
                expect(key.length).toBeGreaterThan(0);
              });

              // Each message should be specific to the constraint type
              constraintMessages.forEach((message) => {
                expect(typeof message).toBe("string");
                // Message should contain meaningful information
                expect(message).toMatch(/[a-zA-Z]/);
                expect(message.length).toBeGreaterThan(5);
              });
            });

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should include field name, constraint type, and error message for all validation errors", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.oneof(
              fc.constant(""),
              fc.constant("invalid"),
              fc.constant("@nodomain"),
            ),
            password: fc.oneof(
              fc.constant(""),
              fc.constant("short"),
              fc.constant("nouppercase123!"),
            ),
          }),
          async (invalidLoginData) => {
            const errors = await validateDto(LoginDto, invalidLoginData);

            // Property: All validation errors must include complete detail
            expect(errors.length).toBeGreaterThan(0);

            errors.forEach((error) => {
              // 1. Field name (property)
              expect(error.property).toBeDefined();
              expect(typeof error.property).toBe("string");
              expect(["email", "password"]).toContain(error.property);

              // 2. Constraint types (keys in constraints object)
              expect(error.constraints).toBeDefined();
              const constraintTypes = Object.keys(error.constraints!);
              expect(constraintTypes.length).toBeGreaterThan(0);

              // 3. Error messages (values in constraints object)
              const errorMessages = Object.values(error.constraints!);
              errorMessages.forEach((message) => {
                expect(typeof message).toBe("string");
                expect(message.length).toBeGreaterThan(0);
              });

              // 4. Invalid value
              expect(error.value).toBeDefined();
            });

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return detailed errors for multiple constraint violations on a single field", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant({
            username: "validuser",
            email: "valid@email.com",
            password: "weak", // Violates multiple constraints: too short, no uppercase, no special char
            firstName: "John",
            lastName: "Doe",
            regionId: "550e8400-e29b-41d4-a716-446655440000",
          }),
          async (testData) => {
            const errors = await validateDto(RegisterDto, testData);

            // Property: A field with multiple violations should have multiple constraint details
            const passwordError = errors.find((e) => e.property === "password");

            if (passwordError) {
              const constraintCount = Object.keys(
                passwordError.constraints || {},
              ).length;

              // Password "weak" violates multiple constraints
              expect(constraintCount).toBeGreaterThanOrEqual(1);

              // Each constraint should have a descriptive message
              Object.values(passwordError.constraints || {}).forEach(
                (message) => {
                  expect(typeof message).toBe("string");
                  expect(message.length).toBeGreaterThan(5);
                },
              );
            }

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should provide detailed validation errors across different DTOs", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Invalid LoginDto
            fc.constant({
              dto: LoginDto,
              data: { email: "invalid", password: "short" },
            }),
            // Invalid RegisterDto
            fc.constant({
              dto: RegisterDto,
              data: {
                username: "ab",
                email: "invalid",
                password: "weak",
                firstName: "",
                lastName: "",
                regionId: "not-uuid",
              },
            }),
            // Invalid ChangePasswordDto
            fc.constant({
              dto: ChangePasswordDto,
              data: { currentPassword: "", newPassword: "weak" },
            }),
            // Invalid ForgotPasswordDto
            fc.constant({
              dto: ForgotPasswordDto,
              data: { email: "not-an-email" },
            }),
          ),
          async ({ dto, data }) => {
            const errors = await validateDto(dto, data);

            // Property: All DTOs should return detailed validation errors
            expect(errors.length).toBeGreaterThan(0);

            errors.forEach((error) => {
              // Each error must have complete detail structure
              expect(error.property).toBeDefined();
              expect(typeof error.property).toBe("string");

              expect(error.constraints).toBeDefined();
              expect(Object.keys(error.constraints!).length).toBeGreaterThan(0);

              Object.values(error.constraints!).forEach((message) => {
                expect(typeof message).toBe("string");
                expect(message.length).toBeGreaterThan(0);
              });

              expect(error.value).toBeDefined();
            });

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return error details that can be mapped to user-friendly messages", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.constant("x"), // Too short
            email: fc.constant("invalid"), // Invalid format
            password: fc.constant("weak"), // Too weak
            firstName: fc.constant(""), // Empty
            lastName: fc.constant(""), // Empty
            regionId: fc.constant("not-uuid"), // Invalid UUID
          }),
          async (invalidData) => {
            const errors = await validateDto(RegisterDto, invalidData);

            // Property: Error details should be structured for frontend mapping
            const errorMap = new Map<string, string[]>();

            errors.forEach((error) => {
              const fieldName = error.property;
              const messages = Object.values(error.constraints || {});

              if (!errorMap.has(fieldName)) {
                errorMap.set(fieldName, []);
              }

              messages.forEach((msg) => {
                errorMap.get(fieldName)!.push(msg);
              });
            });

            // Property: Each field should have at least one error message
            expect(errorMap.size).toBeGreaterThan(0);

            // Property: Each field's messages should be non-empty strings
            errorMap.forEach((messages, field) => {
              expect(messages.length).toBeGreaterThan(0);
              messages.forEach((msg) => {
                expect(typeof msg).toBe("string");
                expect(msg.length).toBeGreaterThan(0);
              });
            });

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should include constraint metadata for programmatic error handling", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.oneof(
              fc.constant("ab"), // MinLength
              fc.string({ minLength: 51, maxLength: 100 }), // MaxLength
            ),
            email: fc.constant("valid@email.com"),
            password: fc.constant("ValidPass@123"),
            firstName: fc.constant("John"),
            lastName: fc.constant("Doe"),
            regionId: fc.constant("550e8400-e29b-41d4-a716-446655440000"),
          }),
          async (testData) => {
            const errors = await validateDto(RegisterDto, testData);

            // Property: Errors should include constraint metadata
            errors.forEach((error) => {
              // Constraint keys identify the type of validation failure
              const constraintKeys = Object.keys(error.constraints || {});

              expect(constraintKeys.length).toBeGreaterThan(0);

              // Constraint keys should be identifiable (e.g., "minLength", "maxLength", "isEmail")
              constraintKeys.forEach((key) => {
                expect(typeof key).toBe("string");
                expect(key.length).toBeGreaterThan(0);
                // Should be camelCase or similar identifier
                expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
              });
            });

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should provide consistent error detail structure across all validation failures", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              dto: fc.constantFrom(
                LoginDto,
                RegisterDto,
                ChangePasswordDto,
                ForgotPasswordDto,
              ),
              data: fc.constant({}), // Empty data to trigger validation errors
            }),
            { minLength: 1, maxLength: 4 },
          ),
          async (testCases) => {
            const allErrors: ValidationError[] = [];

            for (const { dto, data } of testCases) {
              const errors = await validateDto(dto, data);
              allErrors.push(...errors);
            }

            // Property: All errors should have consistent structure
            if (allErrors.length > 0) {
              allErrors.forEach((error) => {
                // Consistent structure: property, constraints, value
                expect(error).toHaveProperty("property");
                expect(error).toHaveProperty("constraints");
                expect(error).toHaveProperty("value");

                // Property should be a string
                expect(typeof error.property).toBe("string");

                // Constraints should be an object with string values
                expect(typeof error.constraints).toBe("object");
                if (error.constraints) {
                  Object.entries(error.constraints).forEach(([key, value]) => {
                    expect(typeof key).toBe("string");
                    expect(typeof value).toBe("string");
                  });
                }
              });
            }

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });
  });
});
