export { QueueModule } from "./queue.module";
export { QueueService } from "./queue.service";
export { QueueConfig, getQueueConfig, QUEUE_CONFIG } from "./queue.config";
export {
  IQueueService,
  QueueName,
  QUEUE_NAMES,
  JobData,
  JobOptions,
  QueueStats,
  QUEUE_SERVICE,
} from "./interfaces/queue.interface";

export {
  BaseProcessor,
  DomainEventsProcessor,
  DomainEventJobType,
  AlertsProcessor,
  AlertJobType,
  NotificationsProcessor,
  NotificationJobType,
  AllProcessors,
} from "./processors";
