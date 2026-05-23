export { BaseProcessor } from "./base.processor";

export {
  DomainEventsProcessor,
  DomainEventJobType,
} from "./domain-events.processor";

export { AlertsProcessor, AlertJobType } from "./alerts.processor";

export {
  NotificationsProcessor,
  NotificationJobType,
} from "./notifications.processor";

import { DomainEventsProcessor as _DomainEventsProcessor } from "./domain-events.processor";
import { AlertsProcessor as _AlertsProcessor } from "./alerts.processor";
import { NotificationsProcessor as _NotificationsProcessor } from "./notifications.processor";

export const AllProcessors = [
  _DomainEventsProcessor,
  _AlertsProcessor,
  _NotificationsProcessor,
];
