/**
 * Stat Panel Registry — NOTIFICATIONS (NOT)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const NOT_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ NOTIFICATIONS (NOT) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "NOT20001",
    module: "NOT",
    title: "Total Channels",
    icon: "carbon:notification",
    color: "primary",
    unit: "count",
    size: "small",
    dataSource: "channelsStore.totalChannels",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total notification channels",
    view: "settings/notification-channels/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "NOT20002",
    module: "NOT",
    title: "Enabled",
    icon: "carbon:checkmark-filled",
    color: "success",
    unit: "count",
    size: "small",
    dataSource: "channelsStore.enabledChannels",
    hasTrend: false,
    hasTimeRange: false,
    description: "Enabled notification channels",
    view: "settings/notification-channels/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "NOT20003",
    module: "NOT",
    title: "Default Channels",
    icon: "carbon:star-filled",
    color: "warning",
    unit: "count",
    size: "small",
    dataSource: "channelsStore.defaultChannels",
    hasTrend: false,
    hasTimeRange: false,
    description: "Default notification channels",
    view: "settings/notification-channels/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "NOT20004",
    module: "NOT",
    title: "Disabled",
    icon: "carbon:close-filled",
    color: "error",
    unit: "count",
    size: "small",
    dataSource: "channelsStore.disabledChannels",
    hasTrend: false,
    hasTimeRange: false,
    description: "Disabled notification channels",
    view: "settings/notification-channels/index.vue",
    position: "stats-row",
  },
];
