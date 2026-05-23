/**
 * API Cache Utility
 * TASK-06: LocalStorage caching for API responses with TTL and security
 */

import { config } from "@/config";

// ==================== TYPES ====================

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  endpoint: string;
  params?: Record<string, unknown>;
}

export interface CacheMetadata {
  key: string;
  endpoint: string;
  timestamp: number;
  expiresAt: number;
  size: number;
}

export interface CacheOptions {
  /** Custom TTL in milliseconds (overrides global config) */
  ttl?: number;
  /** Whether to bypass cache and force refresh */
  forceRefresh?: boolean;
  /** Custom cache key prefix */
  keyPrefix?: string;
  /** Whether to store in sessionStorage instead of localStorage */
  useSessionStorage?: boolean;
}

// ==================== CONSTANTS ====================

const CACHE_PREFIX = "tfo_api_cache_";
const CACHE_INDEX_KEY = "tfo_api_cache_index";
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB max cache size

// ==================== CACHE UTILITIES ====================

/**
 * Generate a deterministic cache key from endpoint and params
 */
export function generateCacheKey(
  endpoint: string,
  params?: Record<string, unknown>,
  prefix?: string,
): string {
  const baseKey = prefix || CACHE_PREFIX;
  const paramString = params
    ? "_" + JSON.stringify(sortObjectKeys(params))
    : "";
  const hash = simpleHash(endpoint + paramString);
  return `${baseKey}${hash}`;
}

/**
 * Simple hash function for cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Sort object keys for consistent hashing
 */
function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce(
      (sorted, key) => {
        sorted[key] = obj[key];
        return sorted;
      },
      {} as Record<string, unknown>,
    );
}

/**
 * Get storage interface based on options
 */
function getStorage(useSessionStorage?: boolean): Storage {
  return useSessionStorage ? sessionStorage : localStorage;
}

/**
 * Get cache index (list of all cached keys)
 */
function getCacheIndex(storage: Storage): string[] {
  try {
    const index = storage.getItem(CACHE_INDEX_KEY);
    return index ? JSON.parse(index) : [];
  } catch {
    return [];
  }
}

/**
 * Update cache index
 */
function updateCacheIndex(storage: Storage, keys: string[]): void {
  try {
    storage.setItem(CACHE_INDEX_KEY, JSON.stringify(keys));
  } catch {
    // Storage full - clear old entries
    clearOldestEntries(storage, 5);
  }
}

/**
 * Clear oldest cache entries
 */
function clearOldestEntries(storage: Storage, count: number): void {
  const index = getCacheIndex(storage);
  const entries: Array<{ key: string; timestamp: number }> = [];

  for (const key of index) {
    try {
      const item = storage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item) as CacheEntry;
        entries.push({ key, timestamp: parsed.timestamp });
      }
    } catch {
      // Invalid entry, mark for removal
      entries.push({ key, timestamp: 0 });
    }
  }

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest entries
  const toRemove = entries.slice(0, count);
  for (const { key } of toRemove) {
    storage.removeItem(key);
  }

  // Update index
  const newIndex = index.filter((k) => !toRemove.some((r) => r.key === k));
  updateCacheIndex(storage, newIndex);
}

// ==================== MAIN CACHE API ====================

/**
 * Get cached data if valid
 */
export function getFromCache<T>(
  endpoint: string,
  params?: Record<string, unknown>,
  options?: CacheOptions,
): T | null {
  if (!config.enableCache || options?.forceRefresh) {
    return null;
  }

  const storage = getStorage(options?.useSessionStorage);
  const key = generateCacheKey(endpoint, params, options?.keyPrefix);

  try {
    const item = storage.getItem(key);
    if (!item) return null;

    const entry = JSON.parse(item) as CacheEntry<T>;
    const ttl = options?.ttl ?? entry.ttl ?? config.cacheTTL;
    const now = Date.now();

    // Check if expired
    if (now - entry.timestamp > ttl) {
      // Remove expired entry
      storage.removeItem(key);
      const index = getCacheIndex(storage);
      updateCacheIndex(
        storage,
        index.filter((k) => k !== key),
      );
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Store data in cache
 */
export function setInCache<T>(
  endpoint: string,
  data: T,
  params?: Record<string, unknown>,
  options?: CacheOptions,
): boolean {
  if (!config.enableCache) {
    return false;
  }

  const storage = getStorage(options?.useSessionStorage);
  const key = generateCacheKey(endpoint, params, options?.keyPrefix);
  const ttl = options?.ttl ?? config.cacheTTL;

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
    endpoint,
    params,
  };

  try {
    const serialized = JSON.stringify(entry);

    // Check if this would exceed storage limits
    if (serialized.length > MAX_CACHE_SIZE) {
      console.warn("[API Cache] Data too large to cache:", endpoint);
      return false;
    }

    storage.setItem(key, serialized);

    // Update index
    const index = getCacheIndex(storage);
    if (!index.includes(key)) {
      index.push(key);
      updateCacheIndex(storage, index);
    }

    return true;
  } catch (e) {
    // Storage quota exceeded - clear old entries and retry
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      clearOldestEntries(storage, 10);
      try {
        storage.setItem(key, JSON.stringify(entry));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Remove specific cache entry
 */
export function removeFromCache(
  endpoint: string,
  params?: Record<string, unknown>,
  options?: CacheOptions,
): void {
  const storage = getStorage(options?.useSessionStorage);
  const key = generateCacheKey(endpoint, params, options?.keyPrefix);

  storage.removeItem(key);

  const index = getCacheIndex(storage);
  updateCacheIndex(
    storage,
    index.filter((k) => k !== key),
  );
}

/**
 * Clear all cache entries
 */
export function clearAllCache(useSessionStorage?: boolean): void {
  const storage = getStorage(useSessionStorage);
  const index = getCacheIndex(storage);

  for (const key of index) {
    storage.removeItem(key);
  }

  storage.removeItem(CACHE_INDEX_KEY);
}

/**
 * Clear cache entries matching a pattern
 */
export function clearCacheByPattern(
  pattern: string | RegExp,
  useSessionStorage?: boolean,
): number {
  const storage = getStorage(useSessionStorage);
  const index = getCacheIndex(storage);
  let cleared = 0;

  const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
  const remaining: string[] = [];

  for (const key of index) {
    try {
      const item = storage.getItem(key);
      if (item) {
        const entry = JSON.parse(item) as CacheEntry;
        if (regex.test(entry.endpoint)) {
          storage.removeItem(key);
          cleared++;
        } else {
          remaining.push(key);
        }
      }
    } catch {
      storage.removeItem(key);
      cleared++;
    }
  }

  updateCacheIndex(storage, remaining);
  return cleared;
}

/**
 * Get cache metadata for all entries
 */
export function getCacheMetadata(useSessionStorage?: boolean): CacheMetadata[] {
  const storage = getStorage(useSessionStorage);
  const index = getCacheIndex(storage);
  const metadata: CacheMetadata[] = [];

  for (const key of index) {
    try {
      const item = storage.getItem(key);
      if (item) {
        const entry = JSON.parse(item) as CacheEntry;
        metadata.push({
          key,
          endpoint: entry.endpoint,
          timestamp: entry.timestamp,
          expiresAt: entry.timestamp + (entry.ttl || config.cacheTTL),
          size: item.length,
        });
      }
    } catch {
      // Invalid entry
    }
  }

  return metadata;
}

/**
 * Get total cache size in bytes
 */
export function getCacheSize(useSessionStorage?: boolean): number {
  const storage = getStorage(useSessionStorage);
  const index = getCacheIndex(storage);
  let totalSize = 0;

  for (const key of index) {
    const item = storage.getItem(key);
    if (item) {
      totalSize += item.length * 2; // UTF-16 encoding
    }
  }

  return totalSize;
}

/**
 * Clean expired entries
 */
export function cleanExpiredCache(useSessionStorage?: boolean): number {
  const storage = getStorage(useSessionStorage);
  const index = getCacheIndex(storage);
  const now = Date.now();
  let cleaned = 0;
  const remaining: string[] = [];

  for (const key of index) {
    try {
      const item = storage.getItem(key);
      if (item) {
        const entry = JSON.parse(item) as CacheEntry;
        const ttl = entry.ttl || config.cacheTTL;
        if (now - entry.timestamp > ttl) {
          storage.removeItem(key);
          cleaned++;
        } else {
          remaining.push(key);
        }
      }
    } catch {
      storage.removeItem(key);
      cleaned++;
    }
  }

  updateCacheIndex(storage, remaining);
  return cleaned;
}

// ==================== CACHED FETCH WRAPPER ====================

/**
 * Wrapper for fetch that handles caching automatically
 */
export async function cachedFetch<T>(
  endpoint: string,
  fetchFn: () => Promise<T>,
  params?: Record<string, unknown>,
  options?: CacheOptions,
): Promise<{ data: T; fromCache: boolean }> {
  // Try to get from cache first
  const cached = getFromCache<T>(endpoint, params, options);
  if (cached !== null) {
    return { data: cached, fromCache: true };
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  setInCache(endpoint, data, params, options);

  return { data, fromCache: false };
}

export default {
  get: getFromCache,
  set: setInCache,
  remove: removeFromCache,
  clearAll: clearAllCache,
  clearByPattern: clearCacheByPattern,
  getMetadata: getCacheMetadata,
  getSize: getCacheSize,
  cleanExpired: cleanExpiredCache,
  cachedFetch,
  generateKey: generateCacheKey,
};
