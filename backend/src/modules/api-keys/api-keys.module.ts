import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CqrsModule } from "@nestjs/cqrs";
import { ConfigModule } from "@nestjs/config";

// Infrastructure
import { ApiKeyEntity } from "./infrastructure/entities/ApiKey.entity";
import { ApiKeyRepository } from "./infrastructure/repositories/ApiKey.repository";
import {
  ApiKeyEncryptionService,
  API_KEY_ENCRYPTION_SERVICE,
} from "./infrastructure/services/ApiKeyEncryption.service";
import {
  ApiKeyService,
  API_KEY_SERVICE,
} from "./infrastructure/services/ApiKey.service";
import {
  IngestionRateLimiterService,
  INGESTION_RATE_LIMITER_SERVICE,
} from "./infrastructure/services/IngestionRateLimiter.service";

// Domain
import { API_KEY_REPOSITORY } from "./domain";

// Application
import { CommandHandlers, QueryHandlers } from "./application/handlers";

// Presentation
import { ApiKeysController } from "./presentation/controllers/ApiKeys.controller";

// Guards
import { ApiKeyGuard } from "./guards/ApiKey.guard";
import { IngestionAuthGuard } from "./guards/IngestionAuth.guard";

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity]), CqrsModule, ConfigModule],
  controllers: [ApiKeysController],
  providers: [
    // Repository binding
    {
      provide: API_KEY_REPOSITORY,
      useClass: ApiKeyRepository,
    },
    // Encryption service binding
    {
      provide: API_KEY_ENCRYPTION_SERVICE,
      useClass: ApiKeyEncryptionService,
    },
    // API Key service binding
    {
      provide: API_KEY_SERVICE,
      useClass: ApiKeyService,
    },
    // Rate limiter service binding
    {
      provide: INGESTION_RATE_LIMITER_SERVICE,
      useClass: IngestionRateLimiterService,
    },
    // Command & Query Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    // Guards
    ApiKeyGuard,
    IngestionAuthGuard,
  ],
  exports: [
    API_KEY_REPOSITORY,
    API_KEY_ENCRYPTION_SERVICE,
    API_KEY_SERVICE,
    INGESTION_RATE_LIMITER_SERVICE,
    ApiKeyGuard,
    IngestionAuthGuard,
  ],
})
export class ApiKeysModule {}
