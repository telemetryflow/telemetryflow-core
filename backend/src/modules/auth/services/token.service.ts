import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { getJwtConfig } from "../config/jwt.config";
import { getAuthRedisConfig } from "../config/redis.config";

/**
 * Token payload interface
 */
export interface TokenPayload {
  userId: string;
  sessionId: string;
  deviceId: string;
  iat?: number;
  exp?: number;
}

/**
 * Session tokens interface
 */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * TokenService - JWT token generation and validation
 *
 * Responsibilities:
 * - Generate access and refresh tokens
 * - Validate tokens and extract payload
 * - Manage token revocation list using Redis
 * - Handle token refresh with optional rotation
 *
 * Requirements: 9.1, 9.3, 9.4
 */
@Injectable()
export class TokenService {
  private readonly jwtConfig = getJwtConfig();
  private readonly redisClient: Redis;

  // Token expiry in seconds
  private readonly ACCESS_TOKEN_EXPIRY = 900; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 604800; // 7 days

  // Redis key prefixes
  private readonly REVOKED_TOKEN_PREFIX = "revoked:";
  private readonly REFRESH_TOKEN_PREFIX = "refresh:";

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Redis client for token revocation
    const redisConfig = getAuthRedisConfig();
    this.redisClient = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
    });
  }

  /**
   * Generate access token
   * Requirement: 9.1
   *
   * @param userId - User ID
   * @param sessionId - Session ID
   * @param deviceId - Device ID
   * @returns JWT access token
   */
  generateAccessToken(
    userId: string,
    sessionId: string,
    deviceId: string,
  ): string {
    const payload: TokenPayload = {
      userId,
      sessionId,
      deviceId,
    };

    return this.jwtService.sign(payload, {
      secret: this.jwtConfig.secret,
      expiresIn: this.jwtConfig.accessTokenExpiry as any,
    });
  }

  /**
   * Generate refresh token
   * Requirement: 9.1
   *
   * @param userId - User ID
   * @param sessionId - Session ID
   * @param deviceId - Device ID
   * @returns JWT refresh token
   */
  generateRefreshToken(
    userId: string,
    sessionId: string,
    deviceId: string,
  ): string {
    const payload: TokenPayload = {
      userId,
      sessionId,
      deviceId,
    };

    return this.jwtService.sign(payload, {
      secret: this.jwtConfig.refreshSecret,
      expiresIn: this.jwtConfig.refreshTokenExpiry as any,
    });
  }

  /**
   * Generate both access and refresh tokens
   * Requirement: 9.1
   *
   * @param userId - User ID
   * @param sessionId - Session ID
   * @param deviceId - Device ID
   * @returns Session tokens object
   */
  generateSessionTokens(
    userId: string,
    sessionId: string,
    deviceId: string,
  ): SessionTokens {
    const accessToken = this.generateAccessToken(userId, sessionId, deviceId);
    const refreshToken = this.generateRefreshToken(userId, sessionId, deviceId);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    };
  }

  /**
   * Validate access token and extract payload
   *
   * @param token - JWT access token
   * @returns Token payload
   * @throws UnauthorizedException if token is invalid or revoked
   */
  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        throw new UnauthorizedException("Token has been revoked");
      }

      // Verify and decode token
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.jwtConfig.secret,
      });

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  /**
   * Validate refresh token and extract payload
   *
   * @param token - JWT refresh token
   * @returns Token payload
   * @throws UnauthorizedException if token is invalid or revoked
   */
  async validateRefreshToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        throw new UnauthorizedException("Refresh token has been revoked");
      }

      // Verify and decode token
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.jwtConfig.refreshSecret,
      });

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  /**
   * Refresh access token using refresh token
   * Requirement: 9.2, 9.3
   *
   * @param refreshToken - JWT refresh token
   * @param rotateRefreshToken - Whether to rotate refresh token (optional)
   * @returns New session tokens
   * @throws UnauthorizedException if refresh token is invalid
   */
  async refreshAccessToken(
    refreshToken: string,
    rotateRefreshToken: boolean = false,
  ): Promise<SessionTokens> {
    // Validate refresh token
    const payload = await this.validateRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = this.generateAccessToken(
      payload.userId,
      payload.sessionId,
      payload.deviceId,
    );

    // Optionally rotate refresh token
    let newRefreshToken = refreshToken;
    if (rotateRefreshToken) {
      // Revoke old refresh token
      await this.revokeToken(refreshToken);

      // Generate new refresh token
      newRefreshToken = this.generateRefreshToken(
        payload.userId,
        payload.sessionId,
        payload.deviceId,
      );
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    };
  }

  /**
   * Revoke a token by adding it to the revocation list
   * Requirement: 9.4
   *
   * @param token - JWT token to revoke
   */
  async revokeToken(token: string): Promise<void> {
    try {
      // Decode token to get expiry
      const decoded = this.jwtService.decode(token) as TokenPayload;

      if (!decoded || !decoded.exp) {
        return;
      }

      // Calculate TTL (time until token expires)
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl > 0) {
        // Add token to revocation list with TTL
        const key = `${this.REVOKED_TOKEN_PREFIX}${token}`;
        await this.redisClient.setex(key, ttl, "1");
      }
    } catch (error) {
      // Log error but don't throw - revocation is best effort
      console.error("Error revoking token:", error);
    }
  }

  /**
   * Revoke all tokens for a user
   * Requirement: 9.4
   *
   * @param userId - User ID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Store user ID in revoked users set with expiry
      const key = `revoked_user:${userId}`;
      await this.redisClient.setex(key, this.REFRESH_TOKEN_EXPIRY, "1");
    } catch (error) {
      console.error("Error revoking user tokens:", error);
    }
  }

  /**
   * Check if a token is revoked
   *
   * @param token - JWT token
   * @returns True if token is revoked
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    try {
      // Check if token is in revocation list
      const tokenKey = `${this.REVOKED_TOKEN_PREFIX}${token}`;
      const tokenRevoked = await this.redisClient.exists(tokenKey);

      if (tokenRevoked) {
        return true;
      }

      // Check if user's tokens are revoked
      const decoded = this.jwtService.decode(token) as TokenPayload;
      if (decoded && decoded.userId) {
        const userKey = `revoked_user:${decoded.userId}`;
        const userRevoked = await this.redisClient.exists(userKey);
        return userRevoked === 1;
      }

      return false;
    } catch (error) {
      console.error("Error checking token revocation:", error);
      return false;
    }
  }

  /**
   * Extract payload from token without validation
   * Useful for getting user info from expired tokens
   *
   * @param token - JWT token
   * @returns Token payload or null
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.decode(token) as TokenPayload;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Cleanup method to close Redis connection
   */
  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
