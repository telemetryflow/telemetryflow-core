/**
 * Stat Panel Registry — LLM (LLM)
 * 4 stat panel registry definitions
 */

import type { StatPanelDefinition } from "./types";

export const LLM_STAT_PANEL_REGISTRY: StatPanelDefinition[] = [
  // │ LLM (LLM) — 4 stat panels
  // └──────────────────────────────────────────────────────────────────────────────
  {
    statPanelId: "LLM20001",
    module: "LLM",
    title: "Total Providers",
    icon: "carbon:machine-learning-model",
    color: "primary",
    unit: "count",
    size: "small",
    dataSource: "llmStore.totalProviders",
    hasTrend: false,
    hasTimeRange: false,
    description: "Total LLM providers configured",
    view: "settings/ai-assistant/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "LLM20002",
    module: "LLM",
    title: "Enabled",
    icon: "carbon:checkmark-filled",
    color: "success",
    unit: "count",
    size: "small",
    dataSource: "llmStore.enabledProviders",
    hasTrend: false,
    hasTimeRange: false,
    description: "Enabled LLM providers",
    view: "settings/ai-assistant/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "LLM20003",
    module: "LLM",
    title: "Default Provider",
    icon: "carbon:star-filled",
    color: "warning",
    unit: "",
    size: "small",
    dataSource: "llmStore.defaultProvider.displayName",
    hasTrend: false,
    hasTimeRange: false,
    description: "Current default LLM provider",
    view: "settings/ai-assistant/index.vue",
    position: "stats-row",
  },
  {
    statPanelId: "LLM20004",
    module: "LLM",
    title: "Total Tokens Used",
    icon: "carbon:hashtag",
    color: "info",
    unit: "tokens",
    size: "small",
    dataSource: "llmStore.totalTokensUsed",
    hasTrend: true,
    hasTimeRange: true,
    description: "Total tokens consumed across providers",
    view: "settings/ai-assistant/index.vue",
    position: "stats-row",
  },
];
