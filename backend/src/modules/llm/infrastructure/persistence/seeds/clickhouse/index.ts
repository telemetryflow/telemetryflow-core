/**
 * LLM Module ClickHouse Seeds Index
 *
 * Exports all LLM ClickHouse seeds in execution order.
 */

import type { ClickHouseSeed } from "../../../../../../database/shared/interfaces";

// Import all seeds
import { SeedLLMUsageAnalytics1721000000010 } from "./1721000000010-seed-llm-usage-analytics";

/**
 * All LLM module ClickHouse seeds
 */
export const LLMClickHouseSeeds: (new () => ClickHouseSeed)[] = [
  SeedLLMUsageAnalytics1721000000010,
];

/**
 * LLM Module ClickHouse seed configuration
 */
export const LLMClickHouseSeedConfig = {
  moduleName: "llm",
  database: "clickhouse" as const,
  seeds: LLMClickHouseSeeds,
};

// Re-export individual seeds
export { SeedLLMUsageAnalytics1721000000010 };
