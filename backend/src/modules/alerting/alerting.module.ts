import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CqrsModule } from "@nestjs/cqrs";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

// Infrastructure
import {
  AlertRuleEntity,
  AlertInstanceEntity,
  NotificationChannelEntity,
} from "./infrastructure/entities";
import {
  AlertRuleRepository,
  AlertInstanceRepository,
} from "./infrastructure/repositories";
import {
  NOTIFICATION_SENDER,
  NotificationSender,
} from "./infrastructure/services";

// Infrastructure - Schedulers
import { AlertEvaluationScheduler } from "./infrastructure/schedulers/AlertEvaluation.scheduler";

// Domain
import { ALERT_RULE_REPOSITORY, ALERT_INSTANCE_REPOSITORY } from "./domain";

// Application
import { CommandHandlers, QueryHandlers } from "./application/handlers";
import {
  NotificationChannelService,
  TfqlValidationService,
} from "./application/services";

// Presentation
import {
  AlertRulesController,
  AlertInstancesController,
  NotificationChannelsController,
} from "./presentation/controllers";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlertRuleEntity,
      AlertInstanceEntity,
      NotificationChannelEntity,
    ]),
    CqrsModule,
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AlertRulesController,
    AlertInstancesController,
    NotificationChannelsController,
  ],
  providers: [
    // Repository bindings
    {
      provide: ALERT_RULE_REPOSITORY,
      useClass: AlertRuleRepository,
    },
    {
      provide: ALERT_INSTANCE_REPOSITORY,
      useClass: AlertInstanceRepository,
    },
    // Notification sender
    {
      provide: NOTIFICATION_SENDER,
      useClass: NotificationSender,
    },
    // Services
    NotificationChannelService,
    TfqlValidationService,
    // Schedulers
    AlertEvaluationScheduler,
    // Command & Query Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    ALERT_RULE_REPOSITORY,
    ALERT_INSTANCE_REPOSITORY,
    NotificationChannelService,
  ],
})
export class AlertingModule {}
