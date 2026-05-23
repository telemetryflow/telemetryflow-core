/**
 * Property-Based Tests for Authentication - Session Invalidation
 *
 * Feature: frontend-backend-auth-integration
 * Property 14: Session invalidation on security events
 * Validates: Requirements 4.2, 5.5, 9.8
 *
 * Tests that for any password change or password reset, all existing sessions
 * should be invalidated except the current session (for password change only).
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SessionService } from "../services/session.service";
import { SessionEntity } from "../infrastructure/persistence/entities/Session.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 14: Session invalidation on security events", () => {
    let sessionService: SessionService;
    let sessionRepository: Repository<SessionEntity>;
    let mockSessions: Map<string, any>;
    let mockQueryBuilder: any;

    beforeEach(async () => {
      // Initialize mock sessions storage
      mockSessions = new Map();

      // Create a persistent mock query builder
      mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn(async () => {
          // This simulates the bulk update for revokeUserSessions
          return { affected: mockSessions.size };
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SessionService,
          {
            provide: getRepositoryToken(SessionEntity),
            useValue: {
              create: jest.fn((data) => ({
                ...data,
                id: `session-${Date.now()}-${Math.random()}`,
                created_at: new Date(),
                terminated_at: null,
                terminated_reason: null,
              })),
              save: jest.fn((entity) => {
                mockSessions.set(entity.id, { ...entity });
                return Promise.resolve(entity);
              }),
              findOne: jest.fn((options) => {
                const sessions = Array.from(mockSessions.values());
                const session = sessions.find((s) => {
                  if (options.where.id) {
                    return s.id === options.where.id;
                  }
                  return false;
                });
                return Promise.resolve(session || null);
              }),
              find: jest.fn((options) => {
                const sessions = Array.from(mockSessions.values());
                return Promise.resolve(
                  sessions.filter((s) => {
                    if (options.where.user_id) {
                      return (
                        s.user_id === options.where.user_id &&
                        s.terminated_at === null
                      );
                    }
                    return false;
                  }),
                );
              }),
              update: jest.fn((criteria, updates) => {
                const sessions = Array.from(mockSessions.entries());
                sessions.forEach(([id, session]) => {
                  if (criteria.id && session.id === criteria.id) {
                    Object.assign(session, updates);
                  }
                });
                return Promise.resolve({ affected: 1 });
              }),
              delete: jest.fn(() => Promise.resolve({ affected: 1 })),
              createQueryBuilder: jest.fn(() => mockQueryBuilder),
            },
          },
        ],
      }).compile();

      sessionService = module.get<SessionService>(SessionService);
      sessionRepository = module.get<Repository<SessionEntity>>(
        getRepositoryToken(SessionEntity),
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
      mockSessions.clear();
    });

    it("should invalidate all sessions except current on password change", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate user ID
          fc.uuid(),
          // Generate number of sessions (2-10)
          fc.integer({ min: 2, max: 10 }),
          // Generate current session index
          fc.integer({ min: 0, max: 9 }),
          async (userId, numSessions, currentSessionIndex) => {
            // Ensure currentSessionIndex is within bounds
            const currentIdx = currentSessionIndex % numSessions;

            // Create multiple sessions for the user
            const sessionIds: string[] = [];
            for (let i = 0; i < numSessions; i++) {
              const session = await sessionService.createSession(
                userId,
                `device-${i}`,
                {
                  rememberMe: false,
                  ipAddress: `192.168.1.${i}`,
                },
              );
              sessionIds.push(session.id);
            }

            // Property: All sessions should be active before password change
            const sessionsBeforeChange =
              await sessionService.getUserSessions(userId);
            expect(sessionsBeforeChange.length).toBe(numSessions);
            sessionsBeforeChange.forEach((session) => {
              expect(session.terminatedAt).toBeNull();
              expect(session.isCurrent).toBe(true);
            });

            // Simulate password change - invalidate all except current
            const currentSessionId = sessionIds[currentIdx];
            await sessionService.revokeUserSessions(
              userId,
              currentSessionId,
              "Password changed",
            );

            // Property: Query builder should have been called for bulk update
            expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should invalidate all sessions on password reset", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate user ID
          fc.uuid(),
          // Generate number of sessions (1-10)
          fc.integer({ min: 1, max: 10 }),
          async (userId, numSessions) => {
            // Create multiple sessions for the user
            const sessionIds: string[] = [];
            for (let i = 0; i < numSessions; i++) {
              const session = await sessionService.createSession(
                userId,
                `device-${i}`,
                {
                  rememberMe: false,
                  ipAddress: `192.168.1.${i}`,
                },
              );
              sessionIds.push(session.id);
            }

            // Property: All sessions should be active before password reset
            const sessionsBeforeReset =
              await sessionService.getUserSessions(userId);
            expect(sessionsBeforeReset.length).toBe(numSessions);
            sessionsBeforeReset.forEach((session) => {
              expect(session.terminatedAt).toBeNull();
              expect(session.isCurrent).toBe(true);
            });

            // Simulate password reset - invalidate ALL sessions (no exception)
            await sessionService.revokeUserSessions(
              userId,
              undefined,
              "Password reset",
            );

            // Property: Query builder should have been called for bulk update
            expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should set correct termination reason for password change", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 2, max: 5 }),
          async (userId, numSessions) => {
            // Create sessions
            const sessionIds: string[] = [];
            for (let i = 0; i < numSessions; i++) {
              const session = await sessionService.createSession(
                userId,
                `device-${i}`,
                { rememberMe: false },
              );
              sessionIds.push(session.id);
            }

            // Revoke all except first with password change reason
            const currentSessionId = sessionIds[0];
            await sessionService.revokeUserSessions(
              userId,
              currentSessionId,
              "Password changed",
            );

            // Property: The query builder should be called with correct reason
            expect(mockQueryBuilder.set).toHaveBeenCalledWith(
              expect.objectContaining({
                terminated_reason: "Password changed",
              }),
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should set correct termination reason for password reset", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 5 }),
          async (userId, numSessions) => {
            // Create sessions
            for (let i = 0; i < numSessions; i++) {
              await sessionService.createSession(userId, `device-${i}`, {
                rememberMe: false,
              });
            }

            // Revoke all with password reset reason
            await sessionService.revokeUserSessions(
              userId,
              undefined,
              "Password reset",
            );

            // Property: The query builder should be called with correct reason
            expect(mockQueryBuilder.set).toHaveBeenCalledWith(
              expect.objectContaining({
                terminated_reason: "Password reset",
              }),
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should handle single session password change correctly", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Create a single session
          const session = await sessionService.createSession(
            userId,
            "device-1",
            {
              rememberMe: false,
              ipAddress: "192.168.1.1",
            },
          );

          // Property: Session should be active
          expect(session.terminatedAt).toBeNull();
          expect(session.isCurrent).toBe(true);

          // Simulate password change - keep current session
          await sessionService.revokeUserSessions(
            userId,
            session.id,
            "Password changed",
          );

          // Property: Query builder should still be called (even if no sessions to revoke)
          expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();

          return true;
        }),
        { numRuns: 30 },
      );
    });

    it("should handle multiple users independently", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          async (userId1, userId2, numSessions1, numSessions2) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);

            // Create sessions for user 1
            const user1SessionIds: string[] = [];
            for (let i = 0; i < numSessions1; i++) {
              const session = await sessionService.createSession(
                userId1,
                `device-u1-${i}`,
                { rememberMe: false },
              );
              user1SessionIds.push(session.id);
            }

            // Create sessions for user 2
            const user2SessionIds: string[] = [];
            for (let i = 0; i < numSessions2; i++) {
              const session = await sessionService.createSession(
                userId2,
                `device-u2-${i}`,
                { rememberMe: false },
              );
              user2SessionIds.push(session.id);
            }

            // Revoke user 1's sessions (password reset)
            await sessionService.revokeUserSessions(
              userId1,
              undefined,
              "Password reset",
            );

            // Property: Query builder should be called with user 1's ID
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
              "user_id = :userId",
              { userId: userId1 },
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should use default reason when none provided", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 3 }),
          async (userId, numSessions) => {
            // Create sessions
            for (let i = 0; i < numSessions; i++) {
              await sessionService.createSession(userId, `device-${i}`, {
                rememberMe: false,
              });
            }

            // Revoke without specifying reason
            await sessionService.revokeUserSessions(userId);

            // Property: Should use default "Security event" reason
            expect(mockQueryBuilder.set).toHaveBeenCalledWith(
              expect.objectContaining({
                terminated_reason: "Security event",
              }),
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should set terminated_at timestamp on invalidation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 3 }),
          async (userId, numSessions) => {
            // Create sessions
            for (let i = 0; i < numSessions; i++) {
              await sessionService.createSession(userId, `device-${i}`, {
                rememberMe: false,
              });
            }

            const beforeRevocation = new Date();

            // Revoke sessions
            await sessionService.revokeUserSessions(
              userId,
              undefined,
              "Test revocation",
            );

            const afterRevocation = new Date();

            // Property: terminated_at should be set to current time
            const setCall = mockQueryBuilder.set.mock.calls[0][0];
            expect(setCall.terminated_at).toBeInstanceOf(Date);
            expect(setCall.terminated_at.getTime()).toBeGreaterThanOrEqual(
              beforeRevocation.getTime() - 1000,
            );
            expect(setCall.terminated_at.getTime()).toBeLessThanOrEqual(
              afterRevocation.getTime() + 1000,
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should set is_current to false on invalidation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 3 }),
          async (userId, numSessions) => {
            // Create sessions
            for (let i = 0; i < numSessions; i++) {
              await sessionService.createSession(userId, `device-${i}`, {
                rememberMe: false,
              });
            }

            // Revoke sessions
            await sessionService.revokeUserSessions(
              userId,
              undefined,
              "Test revocation",
            );

            // Property: is_current should be set to false
            expect(mockQueryBuilder.set).toHaveBeenCalledWith(
              expect.objectContaining({
                is_current: false,
              }),
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should only invalidate active sessions (not already terminated)", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Create sessions
          await sessionService.createSession(userId, "device-1", {
            rememberMe: false,
          });
          await sessionService.createSession(userId, "device-2", {
            rememberMe: false,
          });

          // Revoke sessions
          await sessionService.revokeUserSessions(
            userId,
            undefined,
            "Password reset",
          );

          // Property: Query should filter for non-terminated sessions
          expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
            "terminated_at IS NULL",
          );

          return true;
        }),
        { numRuns: 30 },
      );
    });

    it("should handle edge case with zero sessions gracefully", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (userId) => {
          // Don't create any sessions

          // Attempt to revoke sessions for user with no sessions
          await expect(
            sessionService.revokeUserSessions(
              userId,
              undefined,
              "Password reset",
            ),
          ).resolves.not.toThrow();

          // Property: Query builder should still be called
          expect(sessionRepository.createQueryBuilder).toHaveBeenCalled();

          return true;
        }),
        { numRuns: 20 },
      );
    });

    it("should handle various termination reasons correctly", async () => {
      const reasons = [
        "Password changed",
        "Password reset",
        "Security event",
        "Account compromised",
        "User requested",
        "Admin action",
      ];

      for (const reason of reasons) {
        const userId = `user-${Math.random()}`;

        // Create a session
        await sessionService.createSession(userId, "device-1", {
          rememberMe: false,
        });

        // Revoke with specific reason
        await sessionService.revokeUserSessions(userId, undefined, reason);

        // Property: Reason should be set correctly
        expect(mockQueryBuilder.set).toHaveBeenCalledWith(
          expect.objectContaining({
            terminated_reason: reason,
          }),
        );

        // Clear mocks for next iteration
        jest.clearAllMocks();
      }
    });

    it("should construct correct query for excluding current session", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 2, max: 5 }),
          async (userId, currentSessionId, numSessions) => {
            // Create sessions
            for (let i = 0; i < numSessions; i++) {
              await sessionService.createSession(userId, `device-${i}`, {
                rememberMe: false,
              });
            }

            // Revoke all except current
            await sessionService.revokeUserSessions(
              userId,
              currentSessionId,
              "Password changed",
            );

            // Property: Query should exclude the current session
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
              "id != :exceptSessionId",
              { exceptSessionId: currentSessionId },
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should not exclude any session when exceptSessionId is undefined", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 5 }),
          async (userId, numSessions) => {
            // Create sessions
            for (let i = 0; i < numSessions; i++) {
              await sessionService.createSession(userId, `device-${i}`, {
                rememberMe: false,
              });
            }

            // Clear previous calls
            jest.clearAllMocks();

            // Revoke all (no exception)
            await sessionService.revokeUserSessions(
              userId,
              undefined,
              "Password reset",
            );

            // Property: Query should NOT have the exceptSessionId clause
            const andWhereCalls = mockQueryBuilder.andWhere.mock.calls;

            // Should only have the "terminated_at IS NULL" call, not the exceptSessionId call
            const hasExceptClause = andWhereCalls.some(
              (call: any[]) => call[0] === "id != :exceptSessionId",
            );
            expect(hasExceptClause).toBe(false);

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });
  });
});
