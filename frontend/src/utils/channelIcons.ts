/**
 * Notification Channel Icons and Utilities
 * Provides icons for different notification channel types
 */

import type { NotificationChannelType } from "@/types";

const channelIcons: Record<NotificationChannelType, string> = {
  email: "carbon:email",
  slack: "carbon:logo-slack",
  discord: "carbon:logo-discord",
  msteams: "mdi:microsoft-teams",
  zoom: "mdi:video",
  telegram: "mdi:telegram",
  webhook: "carbon:webhook",
  pagerduty: "simple-icons:pagerduty",
  opsgenie: "simple-icons:opsgenie",
};

/**
 * Get icon string for a notification channel type
 */
export function getChannelIcon(type: NotificationChannelType | string): string {
  return channelIcons[type as NotificationChannelType] || "carbon:notification";
}
