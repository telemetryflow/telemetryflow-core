/**
 * LLM Module ClickHouse Migrations Index
 *
 * Exports all LLM ClickHouse migrations in execution order.
 * Timestamp range: 1721000000001 - 1721999999999
 */

import type { ClickHouseMigration } from "../../../../../../database/shared/interfaces";

// Import all migrations
import { CreateLLMUsageAnalyticsTables1721000000010 } from "./1721000000010-CreateLLMUsageAnalyticsTables";
import { AddLLMUsageIntervalViews1721000000011 } from "./1721000000011-AddLLMUsageIntervalViews";

/**
 * All LLM module ClickHouse migrations in execution order
 */
export const LLMClickHouseMigrations: (new () => ClickHouseMigration)[] = [
  CreateLLMUsageAnalyticsTables1721000000010,
  AddLLMUsageIntervalViews1721000000011,
];

/**
 * LLM Module ClickHouse migration configuration
 */
export const LLMClickHouseMigrationConfig = {
  moduleName: "llm",
  database: "clickhouse" as const,
  migrations: LLMClickHouseMigrations,
};

// Re-export individual migrations
export { CreateLLMUsageAnalyticsTables1721000000010 };
export { AddLLMUsageIntervalViews1721000000011 };
