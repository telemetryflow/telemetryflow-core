/**
 * ClickHouse Modular Seed Runner
 *
 * Collects seeds from all modules and runs them with dependency resolution.
 * Uses @clickhouse/client for database operations.
 *
 * Usage:
 *   pnpm db:seed:clickhouse              # Run all seeds
 *   pnpm db:seed:clickhouse --modules=audit,telemetry  # Run specific modules
 */

import { createClient, ClickHouseClient } from "@clickhouse/client";
import { config } from "dotenv";
import type { ClickHouseSeed } from "../shared/interfaces";

config();

// ============================================================================
// Configuration
// ============================================================================

const CLICKHOUSE_HOST = process.env.CLICKHOUSE_HOST || "localhost";
const CLICKHOUSE_PORT = process.env.CLICKHOUSE_PORT || "8123";
const CLICKHOUSE_DB = process.env.CLICKHOUSE_DB || "telemetryflow_db";
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || "default";
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || "";

// ============================================================================
// Module Seed Imports
// ============================================================================

// Type for seed constructor
type SeedConstructor = new () => ClickHouseSeed;

function tryRequire(path: string, exportKey: string): SeedConstructor[] {
  try {
    const mod = require(path);
    return mod[exportKey] || [];
  } catch {
    return [];
  }
}

// ============================================================================
// Module Configuration
// ============================================================================

interface ModuleConfig {
  name: string;
  seeds: SeedConstructor[];
  enabled: boolean;
}

const MODULES: ModuleConfig[] = [
  {
    name: "audit",
    seeds: tryRequire(
      "../../modules/audit/infrastructure/persistence/seeds/clickhouse",
      "AuditClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "llm",
    seeds: tryRequire(
      "../../modules/llm/infrastructure/persistence/seeds/clickhouse",
      "LLMClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-uptime",
    seeds: tryRequire(
      "../../modules/monitoring/uptime/infrastructure/persistence/seeds/clickhouse",
      "UptimeClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-mysql",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mysql/infrastructure/persistence/seeds/mariadb-metrics.seeds",
      "MariaDBMetricsSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-percona",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mysql/infrastructure/persistence/seeds/percona-metrics.seeds",
      "PerconaMetricsSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-aws-dynamodb",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-dynamodb/infrastructure/persistence/seeds/clickhouse",
      "DbAwsDynamodbClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-aws-rds-aurora",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-aurora/infrastructure/persistence/seeds/clickhouse",
      "DbAwsRdsAuroraClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-aws-rds-mysql",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-mysql/infrastructure/persistence/seeds/clickhouse",
      "DbAwsRdsMysqlClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-cockroachdb",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-cockroachdb/infrastructure/persistence/seeds/clickhouse",
      "DbCockroachdbClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-mongodb-atlas",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mongodb-atlas/infrastructure/persistence/seeds/clickhouse",
      "DbMongodbAtlasClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-mongodb-community",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mongodb-community/infrastructure/persistence/seeds/clickhouse",
      "DbMongodbCommunityClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-mssql",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mssql/infrastructure/persistence/seeds/clickhouse",
      "DbMssqlClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-sqlite3",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-sqlite3/infrastructure/persistence/seeds/clickhouse",
      "DbSqlite3ClickHouseSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-timescaledb",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-timescaledb/infrastructure/persistence/seeds/clickhouse",
      "DbTimescaledbClickHouseSeeds",
    ),
    enabled: true,
  },
];

// ============================================================================
// Dependency Resolution (Topological Sort)
// ============================================================================

function resolveDependencies(seeds: SeedConstructor[]): SeedConstructor[] {
  const seedMap = new Map<string, SeedConstructor>();
  const instances = new Map<string, ClickHouseSeed>();
  const visited = new Set<string>();
  const result: SeedConstructor[] = [];

  // Build maps
  for (const SeedClass of seeds) {
    const instance = new SeedClass();
    seedMap.set(instance.name, SeedClass);
    instances.set(instance.name, instance);
  }

  // Topological sort with cycle detection
  function visit(name: string, stack: Set<string>): void {
    if (visited.has(name)) return;

    if (stack.has(name)) {
      throw new Error(
        `Circular dependency detected: ${Array.from(stack).join(" -> ")} -> ${name}`,
      );
    }

    const instance = instances.get(name);
    if (!instance) return;

    stack.add(name);

    // Visit dependencies first
    for (const depName of instance.dependencies ?? []) {
      visit(depName, stack);
    }

    stack.delete(name);
    visited.add(name);

    const SeedClass = seedMap.get(name);
    if (SeedClass) {
      result.push(SeedClass);
    }
  }

  // Sort by module order first, then by seed order within module
  const sortedByOrder = [...seeds].sort((a, b) => {
    const instanceA = new a();
    const instanceB = new b();

    // First sort by module
    const moduleOrder = MODULES.map((m) => m.name);
    const moduleIndexA = moduleOrder.indexOf(instanceA.moduleName);
    const moduleIndexB = moduleOrder.indexOf(instanceB.moduleName);

    if (moduleIndexA !== moduleIndexB) {
      return moduleIndexA - moduleIndexB;
    }

    // Then sort by order within module
    return instanceA.order - instanceB.order;
  });

  // Resolve dependencies
  for (const SeedClass of sortedByOrder) {
    const instance = new SeedClass();
    visit(instance.name, new Set());
  }

  return result;
}

// ============================================================================
// Seed Collection
// ============================================================================

function collectSeeds(moduleFilter?: string[]): SeedConstructor[] {
  const allSeeds: SeedConstructor[] = [];

  for (const module of MODULES) {
    // Skip if module filter is specified and this module is not included
    if (moduleFilter && !moduleFilter.includes(module.name)) {
      continue;
    }

    // Skip disabled modules
    if (!module.enabled) {
      continue;
    }

    allSeeds.push(...module.seeds);
  }

  // Resolve dependencies
  return resolveDependencies(allSeeds);
}

// ============================================================================
// CLI Parsing
// ============================================================================

interface CLIOptions {
  modules?: string[];
  help: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    help: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--modules=")) {
      options.modules = arg
        .split("=")[1]
        .split(",")
        .map((m) => m.trim());
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
ClickHouse Modular Seed Runner

Usage:
  ts-node seed-runner.ts [options]

Options:
  --modules=<list>   Comma-separated list of modules to run (e.g., audit,telemetry)
  --help, -h         Show this help message

Available Modules:
${MODULES.map((m) => `  - ${m.name}`).join("\n")}

Examples:
  ts-node seed-runner.ts                    # Run all seeds
  ts-node seed-runner.ts --modules=audit    # Run only Audit seeds
`);
}

// ============================================================================
// Main Runner
// ============================================================================

async function runSeeds(options: CLIOptions): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         ClickHouse Modular Seeds - TelemetryFlow           ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");

  // Collect seeds
  let seeds: SeedConstructor[];
  try {
    seeds = collectSeeds(options.modules);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Circular dependency")
    ) {
      console.error("❌", error.message);
      process.exit(1);
    }
    throw error;
  }

  if (seeds.length === 0) {
    console.log("ℹ️  No seeds found for the specified modules");
    console.log("");
    console.log("   Note: Seeds may still be in the legacy location.");
    console.log("   Run the legacy seed runner or migrate modules first.");
    return;
  }

  console.log("📋 Configuration:");
  console.log(`   • Host:     ${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}`);
  console.log(`   • Database: ${CLICKHOUSE_DB}`);
  console.log(`   • User:     ${CLICKHOUSE_USER}`);
  if (options.modules) {
    console.log(`   • Modules:  ${options.modules.join(", ")}`);
  } else {
    console.log(`   • Modules:  all`);
  }
  console.log(`   • Found:    ${seeds.length} seed(s)`);
  console.log("");

  // Show seed order
  console.log("📋 Seed execution order:");
  for (let i = 0; i < seeds.length; i++) {
    const instance = new seeds[i]();
    console.log(`   ${i + 1}. [${instance.moduleName}] ${instance.name}`);
  }
  console.log("");

  // Create ClickHouse client
  const client: ClickHouseClient = createClient({
    url: `http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}`,
    username: CLICKHOUSE_USER,
    password: CLICKHOUSE_PASSWORD,
  });

  try {
    // Ensure database exists
    await client.command({
      query: `CREATE DATABASE IF NOT EXISTS ${CLICKHOUSE_DB}`,
    });
    console.log("✅ Database connection established");
    console.log("");

    console.log("🌱 Running seeds...");
    console.log("");

    let counter = 1;
    for (const SeedClass of seeds) {
      const seed = new SeedClass();
      console.log(
        `[${counter}/${seeds.length}] 📦 Running: [${seed.moduleName}] ${seed.name}`,
      );

      try {
        await seed.run(client, CLICKHOUSE_DB);
        console.log(`[${counter}/${seeds.length}] ✅ Completed: ${seed.name}`);
      } catch (error) {
        console.error(`[${counter}/${seeds.length}] ❌ Failed: ${seed.name}`);
        throw error;
      }

      console.log("");
      counter++;
    }

    console.log(
      "╔════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║     ✨ All ClickHouse seeds completed successfully! ✨     ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════╝",
    );
  } catch (error) {
    console.error("");
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// ============================================================================
// Entry Point
// ============================================================================

const options = parseArgs();

if (options.help) {
  printHelp();
  process.exit(0);
}

runSeeds(options)
  .then(() => {
    console.log("");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
