/**
 * Property-Based Tests for Authentication - Logout Token Revocation
 *
 * Feature: frontend-backend-auth-integration
 * Property 30: Logout token revocation
 * Validates: Requirements 9.4
 *
 * Tests that for any explicit logout, the current session should be invalidated
 * and tokens should be added to the revocation list.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { LogoutHandler } from "../application/handlers/Logout.handler";
import { LogoutCommand } from "../application/commands/Logout.command";
import { SessionService } from "../services/session.service";
import { TokenService } from "../services/token.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 30: Logout token revocation", () => {
    let logoutHandler: LogoutHandler;
    let sessionService: SessionService;
    let tokenService: TokenService;

    beforeEach(async () => {
      // Mock SessionService
      const mockSessionService = {
        revokeSession: jest.fn().mockResolvedValue(undefined),
        getSession: jest.fn().mockResolvedValue({
          id: "session-id",
          userId: "user-id",
          sessionToken: "device-id",
        }),
      };

      // Mock TokenService
      const mockTokenService = {
        revokeToken: jest.fn().mockResolvedValue(undefined),
        isTokenRevoked: jest.fn().mockResolvedValue(false),
        generateSessionTokens: jest.fn((userId, sessionId, deviceId) => ({
          accessToken: `access-${userId}-${sessionId}-${deviceId}`,
          refreshToken: `refresh-${userId}-${sessionId}-${deviceId}`,
          expiresIn: 900,
        })),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LogoutHandler,
          {
            provide: SessionService,
            useValue: mockSessionService,
          },
          {
            provide: TokenService,
            useValue: mockTokenService,
          },
        ],
      }).compile();

      logoutHandler = module.get<LogoutHandler>(LogoutHandler);
      sessionService = module.get<SessionService>(SessionService);
      tokenService = module.get<TokenService>(TokenService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should revoke session for any logout command", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid user IDs (UUIDs)
          fc.uuid(),
          // Generate valid session IDs (UUIDs)
          fc.uuid(),
          // Generate valid access tokens
          fc.string({ minLength: 20, maxLength: 200 }),
          // Generate valid refresh tokens
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();

            // Create logout command
            const command = new LogoutCommand(
              userId,
              sessionId,
              accessToken,
              refreshToken,
            );

            // Execute logout
            await logoutHandler.execute(command);

            // Property: Session should be revoked
            expect(sessionService.revokeSession).toHaveBeenCalledWith(
              sessionId,
              "User logout",
            );
            expect(sessionService.revokeSession).toHaveBeenCalledTimes(1);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should revoke access token for any logout command", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            // Create logout command
            const command = new LogoutCommand(
              userId,
              sessionId,
              accessToken,
              refreshToken,
            );

            // Execute logout
            await logoutHandler.execute(command);

            // Property: Access token should be revoked
            expect(tokenService.revokeToken).toHaveBeenCalledWith(accessToken);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should revoke refresh token for any logout command", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            // Create logout command
            const command = new LogoutCommand(
              userId,
              sessionId,
              accessToken,
              refreshToken,
            );

            // Execute logout
            await logoutHandler.execute(command);

            // Property: Refresh token should be revoked
            expect(tokenService.revokeToken).toHaveBeenCalledWith(refreshToken);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should revoke both tokens for any logout command", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            // Ensure tokens are different
            fc.pre(accessToken !== refreshToken);

            // Clear mocks before each property test run
            jest.clearAllMocks();

            // Create logout command
            const command = new LogoutCommand(
              userId,
              sessionId,
              accessToken,
              refreshToken,
            );

            // Execute logout
            await logoutHandler.execute(command);

            // Property: Both tokens should be revoked
            expect(tokenService.revokeToken).toHaveBeenCalledTimes(2);
            expect(tokenService.revokeToken).toHaveBeenCalledWith(accessToken);
            expect(tokenService.revokeToken).toHaveBeenCalledWith(refreshToken);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should revoke session and tokens in correct order", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            fc.pre(accessToken !== refreshToken);
            // Track call order
            const callOrder: string[] = [];

            (sessionService.revokeSession as jest.Mock).mockImplementation(
              async () => {
                callOrder.push("session");
              },
            );

            (tokenService.revokeToken as jest.Mock).mockImplementation(
              async (token: string) => {
                if (token === accessToken) {
                  callOrder.push("access");
                } else if (token === refreshToken) {
                  callOrder.push("refresh");
                }
              },
            );

            // Create logout command
            const command = new LogoutCommand(
              userId,
              sessionId,
              accessToken,
              refreshToken,
            );

            // Execute logout
            await logoutHandler.execute(command);

            // Property: Session should be revoked first, then tokens
            expect(callOrder).toEqual(["session", "access", "refresh"]);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle logout with same token used for both access and refresh", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, token) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();

            // Create logout command with same token for both
            const command = new LogoutCommand(userId, sessionId, token, token);

            // Execute logout
            await logoutHandler.execute(command);

            // Property: Token should be revoked twice (once for access, once for refresh)
            expect(tokenService.revokeToken).toHaveBeenCalledTimes(2);
            expect(tokenService.revokeToken).toHaveBeenCalledWith(token);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle logout for different users independently", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId1, userId2, sessionId1, sessionId2) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);
            fc.pre(sessionId1 !== sessionId2);

            const accessToken1 = `access-${userId1}`;
            const refreshToken1 = `refresh-${userId1}`;
            const accessToken2 = `access-${userId2}`;
            const refreshToken2 = `refresh-${userId2}`;

            // Create logout commands for both users
            const command1 = new LogoutCommand(
              userId1,
              sessionId1,
              accessToken1,
              refreshToken1,
            );
            const command2 = new LogoutCommand(
              userId2,
              sessionId2,
              accessToken2,
              refreshToken2,
            );

            // Execute both logouts
            await logoutHandler.execute(command1);
            await logoutHandler.execute(command2);

            // Property: Each user's session should be revoked independently
            expect(sessionService.revokeSession).toHaveBeenCalledWith(
              sessionId1,
              "User logout",
            );
            expect(sessionService.revokeSession).toHaveBeenCalledWith(
              sessionId2,
              "User logout",
            );

            // Property: Each user's tokens should be revoked independently
            expect(tokenService.revokeToken).toHaveBeenCalledWith(accessToken1);
            expect(tokenService.revokeToken).toHaveBeenCalledWith(
              refreshToken1,
            );
            expect(tokenService.revokeToken).toHaveBeenCalledWith(accessToken2);
            expect(tokenService.revokeToken).toHaveBeenCalledWith(
              refreshToken2,
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should complete logout even if session revocation fails", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            // Mock session revocation to fail
            (sessionService.revokeSession as jest.Mock).mockRejectedValueOnce(
              new Error("Session revocation failed"),
            );

            // Create logout command
            const command = new LogoutCommand(
              userId,
              sessionId,
              accessToken,
              refreshToken,
            );

            // Property: Logout should throw error if session revocation fails
            await expect(logoutHandler.execute(command)).rejects.toThrow(
              "Session revocation failed",
            );

            // Property: Tokens should not be revoked if session revocation fails
            expect(tokenService.revokeToken).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should handle concurrent logout requests for same session", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.integer({ min: 2, max: 5 }),
          async (userId, sessionId, accessToken, refreshToken, numRequests) => {
            // Clear mocks before each property test run
            jest.clearAllMocks();

            // Create multiple logout commands for same session
            const commands = Array(numRequests)
              .fill(null)
              .map(
                () =>
                  new LogoutCommand(
                    userId,
                    sessionId,
                    accessToken,
                    refreshToken,
                  ),
              );

            // Execute all logout commands concurrently
            await Promise.all(
              commands.map((cmd) => logoutHandler.execute(cmd)),
            );

            // Property: Session should be revoked for each request
            expect(sessionService.revokeSession).toHaveBeenCalledTimes(
              numRequests,
            );

            // Property: Tokens should be revoked for each request (2 tokens per request)
            expect(tokenService.revokeToken).toHaveBeenCalledTimes(
              numRequests * 2,
            );

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should handle logout with minimal valid data", async () => {
      const userId = "00000000-0000-0000-0000-000000000000";
      const sessionId = "00000000-0000-0000-0000-000000000001";
      const accessToken = "a".repeat(20);
      const refreshToken = "r".repeat(20);

      // Create logout command with minimal valid data
      const command = new LogoutCommand(
        userId,
        sessionId,
        accessToken,
        refreshToken,
      );

      // Execute logout
      await logoutHandler.execute(command);

      // Property: Should work with minimal valid data
      expect(sessionService.revokeSession).toHaveBeenCalledWith(
        sessionId,
        "User logout",
      );
      expect(tokenService.revokeToken).toHaveBeenCalledWith(accessToken);
      expect(tokenService.revokeToken).toHaveBeenCalledWith(refreshToken);
    });

    it("should handle logout with maximum length tokens", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 500, maxLength: 1000 }),
          fc.string({ minLength: 500, maxLength: 1000 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            // Create logout command with long tokens
            const command = new LogoutCommand(
              userId,
              sessionId,
              accessToken,
              refreshToken,
            );

            // Execute logout
            await logoutHandler.execute(command);

            // Property: Should handle long tokens correctly
            expect(sessionService.revokeSession).toHaveBeenCalledWith(
              sessionId,
              "User logout",
            );
            expect(tokenService.revokeToken).toHaveBeenCalledWith(accessToken);
            expect(tokenService.revokeToken).toHaveBeenCalledWith(refreshToken);

            return true;
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should ensure all revocation operations complete", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            // Track completion
            let sessionRevoked = false;
            let accessTokenRevoked = false;
            let refreshTokenRevoked = false;

            (sessionService.revokeSession as jest.Mock).mockImplementation(
              async () => {
                sessionRevoked = true;
              },
            );

            (tokenService.revokeToken as jest.Mock).mockImplementation(
              async (token: string) => {
                if (token === accessToken) {
                  accessTokenRevoked = true;
                } else if (token === refreshToken) {
                  refreshTokenRevoked = true;
                }
              },
            );

            // Create logout command
            const command = new LogoutCommand(
              userId,
              sessionId,
              accessToken,
              refreshToken,
            );

            // Execute logout
            await logoutHandler.execute(command);

            // Property: All revocation operations should complete
            expect(sessionRevoked).toBe(true);
            expect(accessTokenRevoked).toBe(true);
            expect(refreshTokenRevoked).toBe(true);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle logout with special characters in tokens", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 20, maxLength: 200 }),
          fc.string({ minLength: 20, maxLength: 200 }),
          async (userId, sessionId, accessToken, refreshToken) => {
            // Add special characters to tokens
            const specialAccessToken = `${accessToken}!@#$%^&*()`;
            const specialRefreshToken = `${refreshToken}!@#$%^&*()`;

            // Create logout command
            const command = new LogoutCommand(
              userId,
              sessionId,
              specialAccessToken,
              specialRefreshToken,
            );

            // Execute logout
            await logoutHandler.execute(command);

            // Property: Should handle tokens with special characters
            expect(tokenService.revokeToken).toHaveBeenCalledWith(
              specialAccessToken,
            );
            expect(tokenService.revokeToken).toHaveBeenCalledWith(
              specialRefreshToken,
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
