import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CqrsModule } from "@nestjs/cqrs";

// Infrastructure
import { DataMaskingPolicyEntity } from "./infrastructure/persistence/entities/DataMaskingPolicy.entity";
import { DataMaskingPolicyRepository } from "./infrastructure/persistence/repositories/DataMaskingPolicy.repository";
import {
  DataMaskingService,
  DATA_MASKING_SERVICE,
} from "./infrastructure/services/DataMasking.service";

// Domain
import { DATA_MASKING_POLICY_REPOSITORY } from "./domain/repositories/IDataMaskingPolicyRepository";

// Application
import { CommandHandlers, QueryHandlers } from "./application/handlers";

// Presentation
import { DataMaskingController } from "./presentation/controllers/DataMasking.controller";

// Shared
import { CacheModule } from "@/shared/cache";

@Module({
  imports: [
    TypeOrmModule.forFeature([DataMaskingPolicyEntity]),
    CqrsModule,
    CacheModule,
  ],
  controllers: [DataMaskingController],
  providers: [
    // Repository binding
    {
      provide: DATA_MASKING_POLICY_REPOSITORY,
      useClass: DataMaskingPolicyRepository,
    },
    // Service binding
    {
      provide: DATA_MASKING_SERVICE,
      useClass: DataMaskingService,
    },
    // Direct class for injection by other modules
    DataMaskingService,
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    DATA_MASKING_POLICY_REPOSITORY,
    DATA_MASKING_SERVICE,
    DataMaskingService,
  ],
})
export class DataMaskingModule {}
