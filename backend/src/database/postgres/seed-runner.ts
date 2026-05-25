/**
 * PostgreSQL Modular Seed Runner
 *
 * Collects seeds from all modules and runs them with dependency resolution.
 * Uses TypeORM for database operations.
 *
 * Usage:
 *   pnpm db:seed:postgres                     # Run all seeds
 *   pnpm db:seed:postgres --modules=iam,auth  # Run specific modules
 *   pnpm db:seed:postgres --fresh             # Truncate and reseed
 */

import "reflect-metadata";
import * as path from "path";
import { DataSource } from "typeorm";
import { config } from "dotenv";
import type { PostgresSeed } from "../shared/interfaces";

config();

// ============================================================================
// Module Seed Imports
// ============================================================================

// Type for seed constructor
type SeedConstructor = new () => PostgresSeed;

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
  /** When true, this module only seeds when TELEMETRYFLOW_USE_MOCK=true (demo/fake data) */
  mockOnly?: boolean;
}

// When USE_MOCK is false, skip demo/fake data seeds — only seed real config
const USE_MOCK =
  (process.env.TELEMETRYFLOW_USE_MOCK || "false").toLowerCase() === "true";

const MODULES: ModuleConfig[] = [
  // ── Core (always seed — real config / platform essentials) ──────────
  // When TELEMETRYFLOW_USE_MOCK=false only these 8 modules run:
  //   IAM (incl. Tenancy), API-Keys, Subscription, Alerting, Uptime, LLM,
  //   Retention, Reporting
  {
    name: "iam",
    seeds: tryRequire(
      "../../modules/iam/infrastructure/persistence/seeds",
      "IAMSeeds",
    ),
    enabled: true,
  },
  {
    name: "api-keys",
    seeds: tryRequire(
      "../../modules/api-keys/infrastructure/persistence/seeds",
      "ApiKeysSeeds",
    ),
    enabled: true,
  },
  {
    name: "subscription",
    seeds: tryRequire(
      "../../modules/subscription/infrastructure/persistence/seeds",
      "SubscriptionSeeds",
    ),
    enabled: true,
  },
  {
    name: "alerting",
    seeds: tryRequire(
      "../../modules/alerting/infrastructure/persistence/seeds",
      "AlertingSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-uptime",
    seeds: tryRequire(
      "../../modules/monitoring/uptime/infrastructure/persistence/seeds",
      "UptimeSeeds",
    ),
    enabled: true,
  },
  {
    name: "llm",
    seeds: tryRequire(
      "../../modules/llm/infrastructure/persistence/seeds",
      "LLMSeeds",
    ),
    enabled: true,
  },
  {
    name: "retention",
    seeds: tryRequire(
      "../../modules/retention/infrastructure/persistence/seeds",
      "RetentionSeeds",
    ),
    enabled: true,
  },
  {
    name: "reporting",
    seeds: tryRequire(
      "../../modules/reporting/infrastructure/persistence/seeds",
      "ReportingSeeds",
    ),
    enabled: true,
  },
  {
    name: "ai-intelligence",
    seeds: tryRequire(
      "../../modules/ai-intelligence/anomaly-detection/infrastructure/persistence/seeds",
      "AIIntelligenceSeeds",
    ),
    enabled: true,
  },
  {
    name: "corrective-maintenance",
    seeds: tryRequire(
      "../../modules/ai-intelligence/corrective-maintenance/infrastructure/persistence/seeds",
      "CorrectiveMaintenanceSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "cost-optimization",
    seeds: tryRequire(
      "../../modules/ai-intelligence/cost-optimization/infrastructure/persistence/seeds",
      "CostOptimizationSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "predictive-maintenance",
    seeds: tryRequire(
      "../../modules/ai-intelligence/predictive-maintenance/infrastructure/persistence/seeds",
      "PredictiveMaintenanceSeeds",
    ),
    enabled: true,
  },
  // ── Demo / fake data (mockOnly — skipped when USE_MOCK=false) ───────
  {
    name: "auth",
    seeds: tryRequire(
      "../../modules/auth/infrastructure/persistence/seeds",
      "AuthSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "notification",
    seeds: tryRequire(
      "../../modules/notification/infrastructure/persistence/seeds",
      "NotificationSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "telemetry",
    seeds: tryRequire(
      "../../modules/telemetry/infrastructure/persistence/seeds",
      "TelemetrySeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "dashboard",
    seeds: tryRequire(
      "../../modules/dashboard/infrastructure/persistence/seeds",
      "DashboardSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-inventory",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-inventory/infrastructure/persistence/seeds/inventory-demo.seeds",
      "DbInventorySeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-agent",
    seeds: tryRequire(
      "../../modules/monitoring/agent/infrastructure/persistence/seeds",
      "AgentSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-kubernetes",
    seeds: tryRequire(
      "../../modules/monitoring/kubernetes/infrastructure/persistence/seeds",
      "KubernetesSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-vm",
    seeds: tryRequire(
      "../../modules/monitoring/vm/infrastructure/persistence/seeds",
      "VMSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-status-page",
    seeds: tryRequire(
      "../../modules/monitoring/status-page/infrastructure/persistence/seeds",
      "StatusPageSeeds",
    ),
    enabled: true,
  },
  {
    name: "monitoring-service-map",
    seeds: tryRequire(
      "../../modules/monitoring/service-map/infrastructure/persistence/seeds/postgresql",
      "ServiceMapSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-network-map",
    seeds: tryRequire(
      "../../modules/monitoring/network-map/infrastructure/persistence/seeds/postgresql",
      "NetworkMapSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "data-masking",
    seeds: tryRequire(
      "../../modules/data-masking/infrastructure/persistence/seeds",
      "DataMaskingSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-mysql",
    seeds: tryRequire(
      "../../modules/monitoring/db-mysql/infrastructure/persistence/seeds/db-mysql-seeds",
      "DbMysqlSeedArray",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-monitoring",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-postgresql/infrastructure/persistence/seeds",
      "DbMonitoringPostgresqlSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-clickhouse",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-clickhouse/infrastructure/persistence/seeds",
      "DbClickHouseInstanceSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-aws-dynamodb",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-dynamodb/infrastructure/persistence/seeds",
      "DbAwsDynamodbSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-aws-rds-aurora",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-aurora/infrastructure/persistence/seeds",
      "DbAwsRdsAuroraSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-aws-rds-mysql",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-mysql/infrastructure/persistence/seeds",
      "DbAwsRdsMysqlSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-cockroachdb",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-cockroachdb/infrastructure/persistence/seeds",
      "DbCockroachdbSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-mongodb-atlas",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mongodb-atlas/infrastructure/persistence/seeds",
      "DbMongodbAtlasSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-mongodb-community",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mongodb-community/infrastructure/persistence/seeds",
      "DbMongodbCommunitySeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-mssql",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mssql/infrastructure/persistence/seeds",
      "DbMssqlSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-sqlite3",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-sqlite3/infrastructure/persistence/seeds",
      "DbSqlite3Seeds",
    ),
    enabled: true,
    mockOnly: true,
  },
  {
    name: "monitoring-db-timescaledb",
    seeds: tryRequire(
      "../../modules/monitoring/db-monitoring/db-timescaledb/infrastructure/persistence/seeds",
      "DbTimescaledbPostgresSeeds",
    ),
    enabled: true,
    mockOnly: true,
  },
];

// ============================================================================
// Dependency Resolution (Topological Sort)
// ============================================================================

function resolveDependencies(seeds: SeedConstructor[]): SeedConstructor[] {
  const seedMap = new Map<string, SeedConstructor>();
  const instances = new Map<string, PostgresSeed>();
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
    for (const depName of instance.dependencies || []) {
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
  const skippedMock: string[] = [];

  for (const module of MODULES) {
    // Skip if module filter is specified and this module is not included
    if (moduleFilter && !moduleFilter.includes(module.name)) {
      continue;
    }

    // Skip disabled modules
    if (!module.enabled) {
      continue;
    }

    // Skip mockOnly modules when USE_MOCK is false (real data mode)
    if (module.mockOnly && !USE_MOCK) {
      skippedMock.push(module.name);
      continue;
    }

    allSeeds.push(...module.seeds);
  }

  if (skippedMock.length > 0) {
    console.log(
      `⏭️  Skipped mock-only modules (TELEMETRYFLOW_USE_MOCK=false):`,
    );
    console.log(`   ${skippedMock.join(", ")}`);
    console.log("");
  }

  // Resolve dependencies
  return resolveDependencies(allSeeds);
}

// ============================================================================
// DataSource Configuration
// ============================================================================

function createDataSource(): DataSource {
  const isCompiled = __filename.endsWith(".js");
  // In compiled mode: resolve absolute path from this file's location
  // __dirname = /app/backend/dist/database/postgres → ../../modules = /app/backend/dist/modules
  const entities = isCompiled
    ? [path.join(__dirname, "../../modules/**/*.entity.js")]
    : ["backend/src/modules/**/infrastructure/entities/**/*.entity.ts"];

  return new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USERNAME || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "telemetryflow_db",
    entities,
    synchronize: false,
    logging: process.env.DB_LOGGING === "true",
  });
}

// ============================================================================
// CLI Parsing
// ============================================================================

interface CLIOptions {
  modules?: string[];
  fresh: boolean;
  help: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    fresh: false,
    help: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--modules=")) {
      options.modules = arg
        .split("=")[1]
        .split(",")
        .map((m) => m.trim());
    } else if (arg === "--fresh") {
      options.fresh = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
PostgreSQL Modular Seed Runner

Usage:
  ts-node seed-runner.ts [options]

Options:
  --modules=<list>   Comma-separated list of modules to run (e.g., iam,auth)
  --fresh            Truncate tables before seeding (dangerous!)
  --help, -h         Show this help message

Available Modules:
${MODULES.map((m) => `  - ${m.name}`).join("\n")}

Examples:
  ts-node seed-runner.ts                    # Run all seeds
  ts-node seed-runner.ts --modules=iam      # Run only IAM seeds
  ts-node seed-runner.ts --fresh            # Fresh seed (truncate first)
`);
}

// ============================================================================
// Main Runner
// ============================================================================

async function runSeeds(options: CLIOptions): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         PostgreSQL Modular Seeds - TelemetryFlow           ║");
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
  console.log(`   • Host:     ${process.env.POSTGRES_HOST || "localhost"}`);
  console.log(`   • Port:     ${process.env.POSTGRES_PORT || "5432"}`);
  console.log(
    `   • Database: ${process.env.POSTGRES_DB || "telemetryflow_db"}`,
  );
  console.log(
    `   • Mock:     ${USE_MOCK ? "ON (seed all)" : "OFF (core only)"}`,
  );
  if (options.modules) {
    console.log(`   • Modules:  ${options.modules.join(", ")}`);
  } else {
    console.log(`   • Modules:  all`);
  }
  console.log(`   • Found:    ${seeds.length} seed(s)`);
  if (options.fresh) {
    console.log(`   • Mode:     FRESH (will truncate tables)`);
  }
  console.log("");

  // Show seed order
  console.log("📋 Seed execution order:");
  for (let i = 0; i < seeds.length; i++) {
    const instance = new seeds[i]();
    console.log(`   ${i + 1}. [${instance.moduleName}] ${instance.name}`);
  }
  console.log("");

  // Create DataSource
  const dataSource = createDataSource();

  try {
    console.log("🔌 Connecting to database...");
    await dataSource.initialize();
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
        await seed.run(dataSource);
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
      "║     ✨ All PostgreSQL seeds completed successfully! ✨     ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════╝",
    );
  } catch (error) {
    console.error("");
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log("");
      console.log("🔌 Database connection closed");
    }
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
