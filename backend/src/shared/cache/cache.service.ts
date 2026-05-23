import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ICacheService, CacheOptions, CacheStats } from './interfaces/cache.interface';
import { CacheConfig, getCacheConfig } from './cache.config';

interface L1CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class CacheService implements ICacheService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly config: CacheConfig;

  // L1: In-memory cache
  private readonly l1Cache: Map<string, L1CacheEntry> = new Map();
  private l1CleanupInterval: NodeJS.Timeout | null = null;

  // L2: Redis cache
  private redis: Redis | null = null;

  // Statistics
  private stats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
  };

  constructor() {
    this.config = getCacheConfig();
  }

  async onModuleInit(): Promise<void> {
    // Initialize L1 cache cleanup
    if (this.config.l1.enabled) {
      this.startL1Cleanup();
      this.logger.log(`L1 cache enabled (TTL: ${this.config.l1.ttl}s, MaxSize: ${this.config.l1.maxSize})`);
    }

    // Initialize L2 Redis connection
    if (this.config.l2.enabled) {
      await this.initializeRedis();
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Stop L1 cleanup
    if (this.l1CleanupInterval) {
      clearInterval(this.l1CleanupInterval);
      this.l1CleanupInterval = null;
    }

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.logger.log('Redis connection closed');
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.l2.host,
        port: this.config.l2.port,
        password: this.config.l2.password,
        db: this.config.l2.db,
        connectTimeout: this.config.l2.connectTimeout,
        commandTimeout: this.config.l2.commandTimeout,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed after 3 attempts, disabling L2 cache');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`);
      });

      this.redis.on('connect', () => {
        this.logger.log(`L2 cache connected to Redis at ${this.config.l2.host}:${this.config.l2.port}`);
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.warn(`Failed to connect to Redis: ${error.message}. L2 cache disabled.`);
      this.redis = null;
    }
  }

  private startL1Cleanup(): void {
    // Cleanup expired entries every 30 seconds
    this.l1CleanupInterval = setInterval(() => {
      const now = Date.now();
      let removed = 0;

      for (const [key, entry] of this.l1Cache.entries()) {
        if (entry.expiresAt <= now) {
          this.l1Cache.delete(key);
          removed++;
        }
      }

      if (removed > 0) {
        this.logger.debug(`L1 cache cleanup: removed ${removed} expired entries`);
      }
    }, 30000);
  }

  private getL1Key(key: string): string {
    return key;
  }

  private getL2Key(key: string): string {
    return `${this.config.l2.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    // Try L1 first
    if (this.config.l1.enabled) {
      const l1Entry = this.l1Cache.get(this.getL1Key(key));
      if (l1Entry && l1Entry.expiresAt > Date.now()) {
        this.stats.l1Hits++;
        return l1Entry.value as T;
      }
      this.stats.l1Misses++;
    }

    // Try L2
    if (this.redis) {
      try {
        const l2Value = await this.redis.get(this.getL2Key(key));
        if (l2Value) {
          this.stats.l2Hits++;
          const parsed = JSON.parse(l2Value) as T;

          // Promote to L1
          if (this.config.l1.enabled) {
            this.setL1(key, parsed, this.config.l1.ttl);
          }

          return parsed;
        }
        this.stats.l2Misses++;
      } catch (error) {
        this.logger.error(`Redis get error: ${error.message}`);
      }
    }

    return null;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const useL2 = options?.useL2 !== false;

    // Set in L1
    if (this.config.l1.enabled) {
      const ttl = options?.ttl || this.config.l1.ttl;
      this.setL1(key, value, ttl);
    }

    // Set in L2
    if (this.redis && useL2) {
      try {
        const ttl = options?.ttl || this.config.l2.ttl;
        await this.redis.setex(this.getL2Key(key), ttl, JSON.stringify(value));
      } catch (error) {
        this.logger.error(`Redis set error: ${error.message}`);
      }
    }
  }

  private setL1<T>(key: string, value: T, ttl: number): void {
    // Check max size and evict oldest if needed
    if (this.l1Cache.size >= this.config.l1.maxSize) {
      const oldestKey = this.l1Cache.keys().next().value;
      if (oldestKey) {
        this.l1Cache.delete(oldestKey);
      }
    }

    this.l1Cache.set(this.getL1Key(key), {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    // Delete from L1
    this.l1Cache.delete(this.getL1Key(key));

    // Delete from L2
    if (this.redis) {
      try {
        await this.redis.del(this.getL2Key(key));
      } catch (error) {
        this.logger.error(`Redis delete error: ${error.message}`);
      }
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    let deleted = 0;

    // Delete from L1
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const l1Pattern = new RegExp(`^${escapedPattern.replace(/\\\*/g, '.*')}$`);
    for (const key of this.l1Cache.keys()) {
      if (l1Pattern.test(key)) {
        this.l1Cache.delete(key);
        deleted++;
      }
    }

    // Delete from L2
    if (this.redis) {
      try {
        const keys = await this.redis.keys(this.getL2Key(pattern));
        if (keys.length > 0) {
          const l2Deleted = await this.redis.del(...keys);
          deleted += l2Deleted;
        }
      } catch (error) {
        this.logger.error(`Redis deletePattern error: ${error.message}`);
      }
    }

    return deleted;
  }

  async has(key: string): Promise<boolean> {
    // Check L1
    if (this.config.l1.enabled) {
      const l1Entry = this.l1Cache.get(this.getL1Key(key));
      if (l1Entry && l1Entry.expiresAt > Date.now()) {
        return true;
      }
    }

    // Check L2
    if (this.redis) {
      try {
        const exists = await this.redis.exists(this.getL2Key(key));
        return exists === 1;
      } catch (error) {
        this.logger.error(`Redis has error: ${error.message}`);
      }
    }

    return false;
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.l1Hits + this.stats.l1Misses + this.stats.l2Hits + this.stats.l2Misses;
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;

    return {
      l1: {
        hits: this.stats.l1Hits,
        misses: this.stats.l1Misses,
        size: this.l1Cache.size,
        maxSize: this.config.l1.maxSize,
      },
      l2: {
        hits: this.stats.l2Hits,
        misses: this.stats.l2Misses,
        connected: this.redis?.status === 'ready',
      },
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
    };
  }

  async flush(layer?: 'L1' | 'L2' | 'all'): Promise<void> {
    const target = layer || 'all';

    if (target === 'L1' || target === 'all') {
      this.l1Cache.clear();
      this.logger.log('L1 cache flushed');
    }

    if ((target === 'L2' || target === 'all') && this.redis) {
      try {
        const keys = await this.redis.keys(`${this.config.l2.keyPrefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        this.logger.log(`L2 cache flushed (${keys.length} keys)`);
      } catch (error) {
        this.logger.error(`Redis flush error: ${error.message}`);
      }
    }

    // Reset stats
    this.stats = { l1Hits: 0, l1Misses: 0, l2Hits: 0, l2Misses: 0 };
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate value and cache it
    const value = await factory();
    await this.set(key, value, options);

    return value;
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.redis?.status === 'ready';
  }

  /**
   * Get L1 cache entries count
   */
  getL1Size(): number {
    return this.l1Cache.size;
  }
}
