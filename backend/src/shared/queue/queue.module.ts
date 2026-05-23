import { Module, Global, OnModuleInit, Logger } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { QueueAdminController } from "./queue-admin.controller";
import { QUEUE_SERVICE, QUEUE_NAMES } from "./interfaces/queue.interface";
import { QUEUE_CONFIG, getQueueConfig } from "./queue.config";
import {
  DomainEventsProcessor,
  AlertsProcessor,
  NotificationsProcessor,
} from "./processors";
import { AlertingModule } from "../../modules/alerting/alerting.module";
import { NotificationModule } from "../../modules/notification/notification.module";
import { EmailService } from "../../modules/auth/services/email.service";

@Global()
@Module({
  imports: [AlertingModule, NotificationModule],
  controllers: [QueueAdminController],
  providers: [
    QueueService,
    {
      provide: QUEUE_SERVICE,
      useExisting: QueueService,
    },
    {
      provide: QUEUE_CONFIG,
      useFactory: getQueueConfig,
    },
    EmailService,
    DomainEventsProcessor,
    AlertsProcessor,
    NotificationsProcessor,
  ],
  exports: [QueueService, QUEUE_SERVICE],
})
export class QueueModule implements OnModuleInit {
  private readonly logger = new Logger(QueueModule.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly domainEventsProcessor: DomainEventsProcessor,
    private readonly alertsProcessor: AlertsProcessor,
    private readonly notificationsProcessor: NotificationsProcessor,
  ) {}

  async onModuleInit(): Promise<void> {
    this.queueService.registerProcessor(
      QUEUE_NAMES.DOMAIN_EVENTS,
      this.domainEventsProcessor.process.bind(this.domainEventsProcessor),
    );

    this.queueService.registerProcessor(
      QUEUE_NAMES.ALERTS,
      this.alertsProcessor.process.bind(this.alertsProcessor),
    );

    this.queueService.registerProcessor(
      QUEUE_NAMES.NOTIFICATIONS,
      this.notificationsProcessor.process.bind(this.notificationsProcessor),
    );

    this.logger.log("All queue processors registered");
  }
}
