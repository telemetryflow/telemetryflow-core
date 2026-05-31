/**
 * Property-Based Tests for User Service - Password Hashing
 *
 * Feature: frontend-backend-auth-integration
 * Property 37: Password hashing with bcrypt
 * Validates: Requirements 10.10
 *
 * Tests that all passwords are hashed using bcrypt with a cost factor of at least 12,
 * ensuring secure password storage and verification.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserService } from "../services/user.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 37: Password hashing with bcrypt", () => {
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

    it(
      "should hash any valid password using bcrypt with cost factor 12",
      async () => {
        await fc.assert(
        fc.asyncProperty(
          // Generate valid passwords (8-100 chars with required complexity)
          fc
            .string({ minLength: 8, maxLength: 100 })
            .filter((s) => {
              // Must contain at least one uppercase, lowercase, number, and special char
              return (
                /[A-Z]/.test(s) &&
                /[a-z]/.test(s) &&
                /[0-9]/.test(s) &&
                /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)
              );
            }),
          async (password) => {
            // Hash the password
            const hash = await service.hashPassword(password);

            // Property 1: Hash must be a non-empty string
            expect(typeof hash).toBe("string");
            expect(hash.length).toBeGreaterThan(0);

            // Property 2: Hash must be different from the original password
            expect(hash).not.toBe(password);

            // Property 3: Hash must be a valid bcrypt hash (starts with $2b$ or $2a$)
            expect(hash).toMatch(/^\$2[ab]\$/);

            // Property 4: Hash must use cost factor 12 (encoded in hash as $2b$12$)
            const costFactorMatch = hash.match(/^\$2[ab]\$(\d+)\$/);
            expect(costFactorMatch).not.toBeNull();
            const costFactor = parseInt(costFactorMatch![1], 10);
            expect(costFactor).toBe(12);

            // Property 5: Hash must be verifiable with bcrypt.compare
            const isValid = await bcrypt.compare(password, hash);
            expect(isValid).toBe(true);

            // Property 6: Hash must not verify with a different password
            const differentPassword = password + "X";
            const isInvalid = await bcrypt.compare(differentPassword, hash);
            expect(isInvalid).toBe(false);

            return true;
          },
        ),
        { numRuns: 10 }, // Reduced runs since bcrypt is computationally expensive
      );
    },
    60000,
  ); // 60 second timeout for bcrypt operations

    it(
      "should produce different hashes for the same password (salt randomness)",
      async () => {
        await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 8, maxLength: 100 })
            .filter((s) => {
              return (
                /[A-Z]/.test(s) &&
                /[a-z]/.test(s) &&
                /[0-9]/.test(s) &&
                /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)
              );
            }),
          async (password) => {
            // Hash the same password twice
            const hash1 = await service.hashPassword(password);
            const hash2 = await service.hashPassword(password);

            // Property: Different hashes should be generated due to random salt
            expect(hash1).not.toBe(hash2);

            // Property: Both hashes should verify the same password
            const isValid1 = await bcrypt.compare(password, hash1);
            const isValid2 = await bcrypt.compare(password, hash2);
            expect(isValid1).toBe(true);
            expect(isValid2).toBe(true);

            return true;
          },
        ),
        { numRuns: 5 }, // Reduced runs due to computational cost
      );
    },
    120000,
  );

    it(
      "should verify password correctly against its hash",
      async () => {
        await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 8, maxLength: 100 })
            .filter((s) => {
              return (
                /[A-Z]/.test(s) &&
                /[a-z]/.test(s) &&
                /[0-9]/.test(s) &&
                /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)
              );
            }),
          async (password) => {
            // Hash the password
            const hash = await service.hashPassword(password);

            // Property: verifyPassword should return true for correct password
            const isValid = await service.verifyPassword(password, hash);
            expect(isValid).toBe(true);

            return true;
          },
        ),
        { numRuns: 10 },
      );
    },
    90000,
  );

    it(
      "should reject incorrect passwords during verification",
      async () => {
        await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            fc
              .string({ minLength: 8, maxLength: 100 })
              .filter((s) => {
                return (
                  /[A-Z]/.test(s) &&
                  /[a-z]/.test(s) &&
                  /[0-9]/.test(s) &&
/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)
                );
              }),
            fc.string({ minLength: 1, maxLength: 50 }),
          ),
          async ([correctPassword, wrongSuffix]) => {
            // Create a wrong password by appending something
            const wrongPassword = correctPassword + wrongSuffix;

            // Hash the correct password
            const hash = await service.hashPassword(correctPassword);

            // Property: verifyPassword should return false for incorrect password
            const isValid = await service.verifyPassword(wrongPassword, hash);
            expect(isValid).toBe(false);

            return true;
          },
        ),
        { numRuns: 10 },
      );
    },
    90000,
  );

    it(
      "should maintain hash format consistency across different password types",
      async () => {
        await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Short valid password
            fc.constant("Abc123!@"),
            // Long valid password
            fc.constant(
              "ThisIsAVeryLongPasswordWith123NumbersAndSpecialChars!@#$%",
            ),
            // Password with many special characters
            fc.constant("P@ssw0rd!@#$%^&*()_+-=[]{}"),
            // Password with unicode (if supported)
            fc.constant("Pässw0rd!123"),
            // Password with spaces
            fc.constant("My P@ssw0rd 123"),
          ),
          async (password) => {
            const hash = await service.hashPassword(password);

            // Property: All hashes must follow bcrypt format
            expect(hash).toMatch(/^\$2[ab]\$12\$/);

            // Property: Hash length should be consistent (60 characters for bcrypt)
            expect(hash.length).toBe(60);

            // Property: Hash must be verifiable
            const isValid = await service.verifyPassword(password, hash);
            expect(isValid).toBe(true);

            return true;
          },
        ),
        { numRuns: 10 },
      );
    },
    30000,
  ); // 30 second timeout

    it(
      "should use minimum cost factor of 12 as per security requirements",
      async () => {
        await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 8, maxLength: 50 })
            .filter((s) => {
              return (
                /[A-Z]/.test(s) &&
                /[a-z]/.test(s) &&
                /[0-9]/.test(s) &&
                /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s)
              );
            }),
          async (password) => {
            const hash = await service.hashPassword(password);

            // Extract cost factor from hash
            const costFactorMatch = hash.match(/^\$2[ab]\$(\d+)\$/);
            expect(costFactorMatch).not.toBeNull();

            const costFactor = parseInt(costFactorMatch![1], 10);

            // Property: Cost factor must be at least 12 (Requirement 10.10)
            expect(costFactor).toBeGreaterThanOrEqual(12);

            // Property: Cost factor should be exactly 12 as configured
            expect(costFactor).toBe(12);

            return true;
          },
        ),
        { numRuns: 10 },
      );
    },
    30000,
  ); // 30 second timeout

    it(
      "should handle edge case passwords correctly",
      async () => {
        const edgeCasePasswords = [
        "Abcd123!", // Minimum length (8 chars)
        "A".repeat(95) + "bc1!@", // Near maximum length (100 chars)
        "!@#$%^&*()_+-=[]{}A1a", // Many special chars
        "AAAA1111aaaa!!!!", // Repeated characters
        "P@ssw0rd\n123", // With newline
        "P@ssw0rd\t123", // With tab
      ];

      for (const password of edgeCasePasswords) {
        const hash = await service.hashPassword(password);

        // Property: All edge case passwords must hash successfully
        expect(hash).toMatch(/^\$2[ab]\$12\$/);
        expect(hash.length).toBe(60);

        // Property: All edge case hashes must verify correctly
        const isValid = await service.verifyPassword(password, hash);
        expect(isValid).toBe(true);
      }
    },
    30000,
  ); // 30 second timeout for edge cases
  });
});
