/**
 * Property-Based Tests for User Service - Password Complexity Enforcement
 *
 * Feature: frontend-backend-auth-integration
 * Property 12: Password complexity enforcement
 * Validates: Requirements 3.8, 4.5
 *
 * Tests that password complexity requirements are enforced during registration
 * and password changes, rejecting passwords that don't meet the criteria.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 12: Password complexity enforcement", () => {
    let service: UserService;
    let userRepository: Repository<UserEntity>;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserService,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
              softDelete: jest.fn(),
            },
          },
        ],
      }).compile();

      service = module.get<UserService>(UserService);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
    });

    it("should accept any password that meets all complexity requirements", () => {
      fc.assert(
        fc.property(
          // Generate passwords that meet all requirements
          fc.string({ minLength: 8, maxLength: 100 }).filter((s) => {
            // Must contain at least one uppercase, lowercase, number, and special char
            return (
              /[A-Z]/.test(s) &&
              /[a-z]/.test(s) &&
              /[0-9]/.test(s) &&
/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)
            );
          }),
          (password) => {
            // Property: Valid passwords should not throw an exception
            expect(() => {
              service.validatePasswordComplexity(password);
            }).not.toThrow();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject any password shorter than 8 characters", () => {
      fc.assert(
        fc.property(
          // Generate passwords shorter than 8 characters
          fc.string({ minLength: 0, maxLength: 7 }),
          (password) => {
            // Property: Short passwords should always be rejected
            expect(() => {
              service.validatePasswordComplexity(password);
            }).toThrow(BadRequestException);

            // Property: Error message should mention minimum length
            try {
              service.validatePasswordComplexity(password);
            } catch (error) {
              expect(error).toBeInstanceOf(BadRequestException);
              expect(error.message).toContain("complexity requirements");
              const response = error.getResponse() as any;
              expect(response.errors).toBeDefined();
              expect(
                response.errors.some((e: string) =>
                  e.includes("at least 8 characters"),
                ),
              ).toBe(true);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject any password longer than 100 characters", () => {
      fc.assert(
        fc.property(
          // Generate passwords longer than 100 characters
          fc.string({ minLength: 101, maxLength: 200 }),
          (password) => {
            // Property: Long passwords should always be rejected
            expect(() => {
              service.validatePasswordComplexity(password);
            }).toThrow(BadRequestException);

            // Property: Error message should mention maximum length
            try {
              service.validatePasswordComplexity(password);
            } catch (error) {
              expect(error).toBeInstanceOf(BadRequestException);
              const response = error.getResponse() as any;
              expect(response.errors).toBeDefined();
              expect(
                response.errors.some((e: string) =>
                  e.includes("not exceed 100 characters"),
                ),
              ).toBe(true);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject any password without an uppercase letter", () => {
      fc.assert(
        fc.property(
          // Generate passwords without uppercase letters
          fc
            .string({ minLength: 8, maxLength: 100 })
            .filter((s) => !/[A-Z]/.test(s) && s.length >= 8),
          (password) => {
            // Property: Passwords without uppercase should be rejected
            expect(() => {
              service.validatePasswordComplexity(password);
            }).toThrow(BadRequestException);

            // Property: Error message should mention uppercase requirement
            try {
              service.validatePasswordComplexity(password);
            } catch (error) {
              expect(error).toBeInstanceOf(BadRequestException);
              const response = error.getResponse() as any;
              expect(response.errors).toBeDefined();
              expect(
                response.errors.some((e: string) =>
                  e.includes("uppercase letter"),
                ),
              ).toBe(true);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject any password without a lowercase letter", () => {
      fc.assert(
        fc.property(
          // Generate passwords without lowercase letters
          fc
            .string({ minLength: 8, maxLength: 100 })
            .filter((s) => !/[a-z]/.test(s) && s.length >= 8),
          (password) => {
            // Property: Passwords without lowercase should be rejected
            expect(() => {
              service.validatePasswordComplexity(password);
            }).toThrow(BadRequestException);

            // Property: Error message should mention lowercase requirement
            try {
              service.validatePasswordComplexity(password);
            } catch (error) {
              expect(error).toBeInstanceOf(BadRequestException);
              const response = error.getResponse() as any;
              expect(response.errors).toBeDefined();
              expect(
                response.errors.some((e: string) =>
                  e.includes("lowercase letter"),
                ),
              ).toBe(true);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject any password without a number", () => {
      fc.assert(
        fc.property(
          // Generate passwords without numbers
          fc
            .string({ minLength: 8, maxLength: 100 })
            .filter((s) => !/[0-9]/.test(s) && s.length >= 8),
          (password) => {
            // Property: Passwords without numbers should be rejected
            expect(() => {
              service.validatePasswordComplexity(password);
            }).toThrow(BadRequestException);

            // Property: Error message should mention number requirement
            try {
              service.validatePasswordComplexity(password);
            } catch (error) {
              expect(error).toBeInstanceOf(BadRequestException);
              const response = error.getResponse() as any;
              expect(response.errors).toBeDefined();
              expect(
                response.errors.some((e: string) => e.includes("one number")),
              ).toBe(true);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject any password without a special character", () => {
      fc.assert(
        fc.property(
          // Generate passwords without special characters
          fc
            .string({ minLength: 8, maxLength: 100 })
            .filter(
              (s) =>
                !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s) &&
                s.length >= 8,
            ),
          (password) => {
            // Property: Passwords without special chars should be rejected
            expect(() => {
              service.validatePasswordComplexity(password);
            }).toThrow(BadRequestException);

            // Property: Error message should mention special character requirement
            try {
              service.validatePasswordComplexity(password);
            } catch (error) {
              expect(error).toBeInstanceOf(BadRequestException);
              const response = error.getResponse() as any;
              expect(response.errors).toBeDefined();
              expect(
                response.errors.some((e: string) =>
                  e.includes("special character"),
                ),
              ).toBe(true);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return all validation errors for passwords with multiple violations", () => {
      fc.assert(
        fc.property(
          // Generate passwords that violate multiple rules
          fc.oneof(
            fc.constant("abc"), // Too short, no uppercase, no number, no special
            fc.constant("abcdefgh"), // No uppercase, no number, no special
            fc.constant("ABCDEFGH"), // No lowercase, no number, no special
            fc.constant("12345678"), // No uppercase, no lowercase, no special
            fc.constant("abcABC12"), // No special character
            fc.constant("a".repeat(101)), // Too long, no uppercase, no number, no special
          ),
          (password) => {
            // Property: Invalid passwords should throw BadRequestException
            expect(() => {
              service.validatePasswordComplexity(password);
            }).toThrow(BadRequestException);

            // Property: All violations should be reported in the error
            try {
              service.validatePasswordComplexity(password);
            } catch (error) {
              expect(error).toBeInstanceOf(BadRequestException);
              const response = error.getResponse() as any;
              expect(response.errors).toBeDefined();
              expect(Array.isArray(response.errors)).toBe(true);
              expect(response.errors.length).toBeGreaterThan(0);

              // Verify error message structure
              expect(response.message).toBe(
                "Password does not meet complexity requirements",
              );
            }

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle edge case valid passwords correctly", () => {
      const validEdgeCases = [
        "Abcd123!", // Minimum length (8 chars)
        "A".repeat(95) + "bc1!@", // Maximum length (100 chars)
        "!@#$%^&*()_+-=[]{}A1a", // Many special chars
        "AAAA1111aaaa!!!!", // Repeated characters
        "P@ssw0rd 123", // With space
        "Test123!@#$%^&*()", // Multiple special chars
      ];

      for (const password of validEdgeCases) {
        // Property: All edge case valid passwords should be accepted
        expect(() => {
          service.validatePasswordComplexity(password);
        }).not.toThrow();
      }
    });

    it("should handle edge case invalid passwords correctly", () => {
      const invalidEdgeCases = [
        { password: "", expectedErrors: ["at least 8 characters"] },
        { password: "a", expectedErrors: ["at least 8 characters"] },
        { password: "1234567", expectedErrors: ["at least 8 characters"] },
        {
          password: "a".repeat(101),
          expectedErrors: ["not exceed 100 characters"],
        },
        {
          password: "abcdefgh",
          expectedErrors: ["uppercase", "number", "special"],
        },
        { password: "ABCDEFGH", expectedErrors: ["lowercase", "number"] },
        { password: "12345678", expectedErrors: ["uppercase", "lowercase"] },
        { password: "abcABC12", expectedErrors: ["special"] },
      ];

      for (const testCase of invalidEdgeCases) {
        // Property: All edge case invalid passwords should be rejected
        expect(() => {
          service.validatePasswordComplexity(testCase.password);
        }).toThrow(BadRequestException);

        // Property: Expected errors should be present
        try {
          service.validatePasswordComplexity(testCase.password);
        } catch (error) {
          expect(error).toBeInstanceOf(BadRequestException);
          const response = error.getResponse() as any;
          expect(response.errors).toBeDefined();

          // Check that expected error keywords are present
          const errorString = response.errors.join(" ");
          for (const expectedError of testCase.expectedErrors) {
            expect(errorString.toLowerCase()).toContain(
              expectedError.toLowerCase(),
            );
          }
        }
      }
    });

    it("should consistently validate the same password", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 150 }), (password) => {
          // Property: Multiple validations of the same password should have consistent results
          let firstResult: "valid" | "invalid" = "valid";
          let firstError: any = null;

          try {
            service.validatePasswordComplexity(password);
          } catch (error) {
            firstResult = "invalid";
            firstError = error;
          }

          // Validate again
          let secondResult: "valid" | "invalid" = "valid";
          let secondError: any = null;

          try {
            service.validatePasswordComplexity(password);
          } catch (error) {
            secondResult = "invalid";
            secondError = error;
          }

          // Property: Results should be consistent
          expect(firstResult).toBe(secondResult);

          // Property: If invalid, error messages should be consistent
          if (firstResult === "invalid") {
            expect(firstError).toBeInstanceOf(BadRequestException);
            expect(secondError).toBeInstanceOf(BadRequestException);

            const firstResponse = firstError.getResponse() as any;
            const secondResponse = secondError.getResponse() as any;

            expect(firstResponse.errors).toEqual(secondResponse.errors);
          }

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("should validate passwords with various character encodings", () => {
      const specialCharPasswords = [
        "P@ssw0rd!", // Standard special chars
        "Test123#$%", // Hash and dollar
        "Pass[word]1", // Brackets
        "My{Pass}123!", // Braces
        "Test;Pass:1!", // Semicolon and colon
        "Pass\"word'1!", // Quotes
        "Test\\Pass|1!", // Backslash and pipe
        "Pass<word>1!", // Angle brackets
        "Test/Pass?1!", // Slash and question mark
      ];

      for (const password of specialCharPasswords) {
        // Property: All passwords with valid special characters should be accepted
        expect(() => {
          service.validatePasswordComplexity(password);
        }).not.toThrow();
      }
    });
  });
});
