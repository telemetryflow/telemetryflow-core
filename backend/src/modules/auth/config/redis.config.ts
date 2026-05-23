/**
 * Redis Configuration for Auth Module
 *
 * Configuration for Redis connection used for:
 * - Session storage
 * - Token revocation list
 * - Rate limiting
 */

export interface AuthRedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  connectTimeout: number;
  commandTimeout: number;
}

export const getAuthRedisConfig = (): AuthRedisConfig => ({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_SESSION_DB || "0", 10),
  keyPrefix: "auth:",
  connectTimeout: 10000,
  commandTimeout: 5000,
});
