import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Domain
import { RETENTION_POLICY_REPOSITORY } from './domain/repositories/IRetentionPolicyRepository';

// Infrastructure - Entities
import { RetentionPolicyEntity } from './infrastructure/persistence/entities/RetentionPolicy.entity';

// Infrastructure - Repositories
import { RetentionPolicyRepository } from './infrastructure/persistence/repositories/RetentionPolicy.repository';

// Infrastructure - Schedulers
import { RetentionEnforcementScheduler } from './infrastructure/schedulers/RetentionEnforcement.scheduler';

// Application - Handlers
import { CommandHandlers, QueryHandlers } from './application/handlers';

// Application - Services
import { RetentionEnforcementService } from './application/services/RetentionEnforcement.service';

// Presentation - Controllers
import { RetentionPolicyController } from './presentation/controllers/RetentionPolicy.controller';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([RetentionPolicyEntity]),
    ScheduleModule.forRoot(),
  ],
  controllers: [RetentionPolicyController],
  providers: [
    // Repository
    {
      provide: RETENTION_POLICY_REPOSITORY,
      useClass: RetentionPolicyRepository,
    },
    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    // Services
    RetentionEnforcementService,
    // Schedulers
    RetentionEnforcementScheduler,
  ],
  exports: [RETENTION_POLICY_REPOSITORY, RetentionEnforcementService],
})
export class RetentionModule {}
