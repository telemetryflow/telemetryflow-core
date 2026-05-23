import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheAdminController } from './cache-admin.controller';
import { CACHE_SERVICE } from './interfaces/cache.interface';
import { CACHE_CONFIG, getCacheConfig } from './cache.config';

@Global()
@Module({
  controllers: [CacheAdminController],
  providers: [
    CacheService,
    {
      provide: CACHE_SERVICE,
      useExisting: CacheService,
    },
    {
      provide: CACHE_CONFIG,
      useFactory: getCacheConfig,
    },
  ],
  exports: [CacheService, CACHE_SERVICE],
})
export class CacheModule {}
