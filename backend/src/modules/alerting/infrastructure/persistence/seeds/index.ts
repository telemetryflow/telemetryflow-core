/**
 * Alerting Module Seeds — Index
 *
 * Aggregates all alerting seed classes in execution order.
 * Each category lives in its own file:
 *
 *   01-AlertRulesSeed.ts           → Infrastructure + SSL certificate alert rules
 *   02-NotificationChannelsSeed.ts → Default notification channels (all types)
 *   03-AlertInstancesSeed.ts       → Sample firing instances (mock mode only)
 */

import { DataSource } from "typeorm";
import { AlertRulesSeed } from "./01-AlertRulesSeed";
import { NotificationChannelsSeed } from "./02-NotificationChannelsSeed";
import { AlertInstancesSeed } from "./03-AlertInstancesSeed";

export { AlertRulesSeed } from "./01-AlertRulesSeed";
export { NotificationChannelsSeed } from "./02-NotificationChannelsSeed";
export { AlertInstancesSeed } from "./03-AlertInstancesSeed";

export const AlertingSeeds = [
  AlertRulesSeed,
  NotificationChannelsSeed,
  AlertInstancesSeed,
];

export async function runAlertingSeeds(dataSource: DataSource): Promise<void> {
  console.log("\n========================================");
  console.log("  Running Alerting Module Seeds");
  console.log("========================================\n");

  for (const SeedClass of AlertingSeeds) {
    const seed = new SeedClass();
    await seed.run(dataSource);
  }

  console.log("\n========================================");
  console.log("  Alerting Module Seeds Complete");
  console.log("========================================\n");
}
