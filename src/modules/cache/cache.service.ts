import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    return null; // Stub implementation
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Stub implementation
  }

  async del(key: string): Promise<void> {
    // Stub implementation
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Stub implementation
  }

  async delPattern(pattern: string): Promise<number> {
    return 0; // Stub implementation
  }
}
