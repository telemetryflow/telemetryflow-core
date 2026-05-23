/**
 * Cache Configuration
 * Defines configuration for L1 (in-memory) and L2 (Redis) cache layers
 */

export interface CacheConfig {
  /** L1 in-memory cache configuration */
  l1: {
    /** Enable L1 cache */
    enabled: boolean;
    /** TTL in seconds (default: 60) */
    ttl: number;
    /** Maximum number of entries (default: 1000) */
    maxSize: number;
  };
  /** L2 Redis cache configuration */
  l2: {
    /** Enable L2 cache */
    enabled: boolean;
    /** Redis host */
    host: string;
    /** Redis port */
    port: number;
    /** Redis password */
    password?: string;
    /** Redis database number */
    db: number;
    /** TTL in seconds (default: 1800 = 30 minutes) */
    ttl: number;
    /** Key prefix for all cache keys */
    keyPrefix: string;
    /** Connection timeout in milliseconds */
    connectTimeout: number;
    /** Command timeout in milliseconds */
    commandTimeout: number;
  };
}

export const getCacheConfig = (): CacheConfig => ({
  l1: {
    enabled: process.env.CACHE_L1_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_L1_TTL || '60', 10),
    maxSize: parseInt(process.env.CACHE_L1_MAX_SIZE || '1000', 10),
  },
  l2: {
    enabled: process.env.CACHE_L2_ENABLED === 'true' || !!process.env.REDIS_HOST,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: parseInt(process.env.CACHE_L2_TTL || '1800', 10),
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'tf:cache:',
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '3000', 10),
  },
});

export const CACHE_CONFIG = Symbol('CACHE_CONFIG');
