/**
 * Cache Module Interfaces
 * Defines contracts for cache operations with L1 (in-memory) and L2 (Redis) layers
 */

export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
  /** Use L2 (Redis) cache */
  useL2?: boolean;
}

export interface CacheEntry<T = unknown> {
  /** Cached value */
  value: T;
  /** Expiration timestamp */
  expiresAt: number;
  /** Cache layer where entry was found */
  layer: 'L1' | 'L2';
}

export interface CacheStats {
  /** L1 cache statistics */
  l1: {
    hits: number;
    misses: number;
    size: number;
    maxSize: number;
  };
  /** L2 cache statistics */
  l2: {
    hits: number;
    misses: number;
    connected: boolean;
  };
  /** Overall hit rate */
  hitRate: number;
}

export interface ICacheService {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Delete all values matching pattern
   * @param pattern Key pattern (e.g., "user:*")
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Check if key exists in cache
   * @param key Cache key
   */
  has(key: string): Promise<boolean>;

  /**
   * Get cache statistics
   */
  getStats(): CacheStats;

  /**
   * Flush all cache entries
   * @param layer Optional layer to flush ('L1', 'L2', or both)
   */
  flush(layer?: 'L1' | 'L2' | 'all'): Promise<void>;

  /**
   * Get or set cache value
   * @param key Cache key
   * @param factory Factory function to create value if not cached
   * @param options Cache options
   */
  getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>;
}

export const CACHE_SERVICE = Symbol('CACHE_SERVICE');
