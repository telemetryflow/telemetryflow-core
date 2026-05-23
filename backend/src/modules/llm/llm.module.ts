/**
 * LLM Module
 * Provides AI/LLM capabilities for observability insights
 */

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

// Infrastructure - Entities
import {
  LLMProviderEntity,
  ConversationEntity,
  MessageEntity,
  ContextSnapshotEntity,
} from "./infrastructure/entities";

// Infrastructure - Repositories
import {
  LLMProviderRepository,
  ConversationRepository,
} from "./infrastructure/repositories";

// Infrastructure - Providers (LLM Adapters)
import {
  ClaudeAdapter,
  OpenAIAdapter,
  GeminiAdapter,
  DeepSeekAdapter,
  QwenAdapter,
  OllamaAdapter,
  CustomAdapter,
  LLMAdapterFactory,
} from "./infrastructure/providers";

// Infrastructure - Guards
import { LLMRateLimiterGuard } from "./infrastructure/guards";

// Application - Services
import {
  LLMEncryptionService,
  PromptBuilderService,
  ContextCollectorService,
  InsightGeneratorService,
} from "./application/services";

// Presentation - Controllers
import {
  LLMProvidersController,
  ChatController,
  InsightsController,
} from "./presentation/controllers";

// Domain - Repository tokens
import {
  LLM_PROVIDER_REPOSITORY,
  CONVERSATION_REPOSITORY,
} from "./domain/repositories";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      LLMProviderEntity,
      ConversationEntity,
      MessageEntity,
      ContextSnapshotEntity,
    ]),
  ],
  controllers: [LLMProvidersController, ChatController, InsightsController],
  providers: [
    // Repository bindings
    {
      provide: LLM_PROVIDER_REPOSITORY,
      useClass: LLMProviderRepository,
    },
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: ConversationRepository,
    },
    // Repositories (also available directly)
    LLMProviderRepository,
    ConversationRepository,
    // LLM Adapters
    ClaudeAdapter,
    OpenAIAdapter,
    GeminiAdapter,
    DeepSeekAdapter,
    QwenAdapter,
    OllamaAdapter,
    CustomAdapter,
    LLMAdapterFactory,
    // Application Services
    LLMEncryptionService,
    PromptBuilderService,
    ContextCollectorService,
    InsightGeneratorService,
    // Guards
    LLMRateLimiterGuard,
  ],
  exports: [
    LLM_PROVIDER_REPOSITORY,
    CONVERSATION_REPOSITORY,
    LLMProviderRepository,
    ConversationRepository,
    LLMAdapterFactory,
    LLMEncryptionService,
    PromptBuilderService,
    ContextCollectorService,
    InsightGeneratorService,
    LLMRateLimiterGuard,
  ],
})
export class LLMModule {}
