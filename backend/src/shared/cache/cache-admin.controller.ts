import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheStats } from './interfaces/cache.interface';

/**
 * Cache Admin Controller
 * Provides endpoints for cache management and monitoring
 *
 * Base path: /admin/cache
 */
@Controller('admin/cache')
export class CacheAdminController {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Get cache statistics
   * GET /admin/cache/stats
   */
  @Get('stats')
  getStats(): CacheStats {
    return this.cacheService.getStats();
  }

  /**
   * Get cache health status
   * GET /admin/cache/health
   */
  @Get('health')
  getHealth(): {
    status: string;
    l1: { enabled: boolean; size: number };
    l2: { enabled: boolean; connected: boolean };
  } {
    const stats = this.cacheService.getStats();

    return {
      status: stats.l2.connected || stats.l1.size >= 0 ? 'healthy' : 'degraded',
      l1: {
        enabled: true,
        size: stats.l1.size,
      },
      l2: {
        enabled: true,
        connected: stats.l2.connected,
      },
    };
  }

  /**
   * Flush cache
   * POST /admin/cache/flush
   * Query params:
   *   - layer: 'L1' | 'L2' | 'all' (default: 'all')
   */
  @Post('flush')
  @HttpCode(HttpStatus.OK)
  async flush(
    @Query('layer') layer?: 'L1' | 'L2' | 'all',
  ): Promise<{ success: boolean; message: string }> {
    await this.cacheService.flush(layer || 'all');

    return {
      success: true,
      message: `Cache ${layer || 'all'} flushed successfully`,
    };
  }

  /**
   * Delete cache entries by pattern
   * DELETE /admin/cache/pattern
   * Query params:
   *   - pattern: Key pattern (e.g., "user:*")
   */
  @Delete('pattern')
  async deletePattern(
    @Query('pattern') pattern: string,
  ): Promise<{ success: boolean; deleted: number }> {
    if (!pattern) {
      return { success: false, deleted: 0 };
    }

    const deleted = await this.cacheService.deletePattern(pattern);

    return {
      success: true,
      deleted,
    };
  }

  /**
   * Delete specific cache key
   * DELETE /admin/cache/key
   * Query params:
   *   - key: Cache key to delete
   */
  @Delete('key')
  async deleteKey(
    @Query('key') key: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!key) {
      return { success: false, message: 'Key is required' };
    }

    await this.cacheService.delete(key);

    return {
      success: true,
      message: `Key '${key}' deleted`,
    };
  }

  /**
   * Check if key exists
   * GET /admin/cache/exists
   * Query params:
   *   - key: Cache key to check
   */
  @Get('exists')
  async checkExists(
    @Query('key') key: string,
  ): Promise<{ key: string; exists: boolean }> {
    const exists = await this.cacheService.has(key);

    return {
      key,
      exists,
    };
  }
}
