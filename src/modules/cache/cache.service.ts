import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  async get<T>(_key: string): Promise<T | null> {
    return null; // Stub implementation
  }

  async set(_key: string, _value: any, _ttl?: number): Promise<void> {
    // Stub implementation
  }

  async del(_key: string): Promise<void> {
    // Stub implementation
  }

  async invalidatePattern(_pattern: string): Promise<void> {
    // Stub implementation
  }

  async delPattern(_pattern: string): Promise<number> {
    return 0; // Stub implementation
  }
}
