/**
 * ClickHouse Modular Migration Runner
 *
 * Collects migrations from all modules and runs them in timestamp order.
 * Uses @clickhouse/client for database operations.
 *
 * Usage:
 *   pnpm db:migrate:clickhouse              # Run all migrations
 *   pnpm db:migrate:clickhouse --modules=audit,telemetry  # Run specific modules
 *   pnpm db:migrate:clickhouse --revert     # Revert last migration
 *   pnpm db:migrate:clickhouse --show       # Show pending migrations
 */

import { createClient, ClickHouseClient } from "@clickhouse/client";
import { config } from "dotenv";
import type { ClickHouseMigration } from "../shared/interfaces";
import { extractTimestamp } from "../shared/interfaces";

config();

// ============================================================================
// Configuration
// ============================================================================

const CLICKHOUSE_HOST = process.env.CLICKHOUSE_HOST || "localhost";
const CLICKHOUSE_PORT = process.env.CLICKHOUSE_PORT || "8123";
const CLICKHOUSE_DB = process.env.CLICKHOUSE_DB || "telemetryflow_db";
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || "default";
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || "";

// Migration tracking table
const MIGRATIONS_TABLE = "schema_migrations";

// ============================================================================
// Module Migration Imports
// ============================================================================

// Type for migration constructor
type MigrationConstructor = new () => ClickHouseMigration;

function tryRequire(path: string, exportKey: string): MigrationConstructor[] {
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
  migrations: MigrationConstructor[];
  enabled: boolean;
}

const MODULES: ModuleConfig[] = [
  // Core (logs, metrics, traces + optimization views)
  {
    name: "core",
    migrations: tryRequire("./migrations", "CoreClickHouseMigrations"),
    enabled: true,
  },
  // Audit
  {
    name: "audit",
    migrations: tryRequire(
      "../../modules/audit/infrastructure/persistence/migrations/clickhouse",
      "AuditClickHouseMigrations",
    ),
    enabled: true,
  },
  // Telemetry sub-modules
  {
    name: "telemetry-exemplars",
    migrations: tryRequire(
      "../../modules/telemetry/exemplars/infrastructure/persistence/migrations/clickhouse",
      "ExemplarsClickHouseMigrations",
    ),
    enabled: true,
  },
  {
    name: "telemetry-correlations",
    migrations: tryRequire(
      "../../modules/telemetry/correlations/infrastructure/persistence/migrations/clickhouse",
      "CorrelationsClickHouseMigrations",
    ),
    enabled: true,
  },
  // Monitoring
  {
    name: "monitoring-db-inventory",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-inventory/infrastructure/persistence/migrations",
      "DbInventoryClickHouseMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-db-clickhouse",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-clickhouse/infrastructure/persistence/migrations/clickhouse",
      "DbMonitoringClickHouseClickHouseMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-kubernetes",
    migrations: tryRequire(
      "../../modules/monitoring/kubernetes/infrastructure/persistence/migrations/clickhouse",
      "KubernetesClickHouseMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-vm",
    migrations: tryRequire(
      "../../modules/monitoring/vm/infrastructure/persistence/migrations/clickhouse",
      "VMClickHouseMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-uptime",
    migrations: tryRequire(
      "../../modules/monitoring/uptime/infrastructure/persistence/migrations/clickhouse",
      "UptimeClickHouseMigrations",
    ),
    enabled: true,
  },
  // LLM
  {
    name: "llm",
    migrations: tryRequire(
      "../../modules/llm/infrastructure/persistence/migrations/clickhouse",
      "LLMClickHouseMigrations",
    ),
    enabled: true,
  },
  // Service Map
  {
    name: "monitoring-service-map",
    migrations: tryRequire(
      "../../modules/monitoring/service-map/infrastructure/persistence/migrations/clickhouse",
      "ServiceMapClickHouseMigrations",
    ),
    enabled: true,
  },
  // Network Map
  {
    name: "monitoring-network-map",
    migrations: tryRequire(
      "../../modules/monitoring/network-map/infrastructure/persistence/migrations/clickhouse",
      "NetworkMapClickHouseMigrations",
    ),
    enabled: true,
  },
  // AI Intelligence
  {
    name: "ai-intelligence",
    migrations: tryRequire(
      "../../modules/ai-intelligence/anomaly-detection/infrastructure/persistence/migrations/clickhouse",
      "AIIntelligenceClickHouseMigrations",
    ),
    enabled: true,
  },
  {
    name: "cost-optimization",
    migrations: tryRequire(
      "../../modules/ai-intelligence/cost-optimization/infrastructure/persistence/migrations/clickhouse",
      "CostOptimizationClickHouseMigrations",
    ),
    enabled: true,
  },
  {
    name: "predictive-maintenance",
    migrations: tryRequire(
      "../../modules/ai-intelligence/predictive-maintenance/infrastructure/persistence/migrations/clickhouse",
      "PredictiveMaintenanceClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - MySQL/MariaDB/Percona
  {
    name: "monitoring-db-mysql",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mysql/infrastructure/persistence/migrations/clickhouse",
      "DbMysqlClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - PostgreSQL
  {
    name: "monitoring-db-monitoring",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-postgresql/infrastructure/persistence/migrations/clickhouse",
      "DbMonitoringClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - ClickHouse
  {
    name: "monitoring-db-clickhouse",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-clickhouse/infrastructure/persistence/migrations/clickhouse",
      "DbMonitoringClickHouseClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - AWS DynamoDB
  {
    name: "monitoring-db-aws-dynamodb",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-dynamodb/infrastructure/persistence/migrations/clickhouse",
      "DbAwsDynamodbClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - AWS RDS Aurora
  {
    name: "monitoring-db-aws-rds-aurora",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-aurora/infrastructure/persistence/migrations/clickhouse",
      "DbAwsRdsAuroraClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - AWS RDS MySQL
  {
    name: "monitoring-db-aws-rds-mysql",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-mysql/infrastructure/persistence/migrations/clickhouse",
      "DbAwsRdsMysqlClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - CockroachDB
  {
    name: "monitoring-db-cockroachdb",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-cockroachdb/infrastructure/persistence/migrations/clickhouse",
      "DbCockroachdbClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - MongoDB Atlas
  {
    name: "monitoring-db-mongodb-atlas",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mongodb-atlas/infrastructure/persistence/migrations/clickhouse",
      "DbMongodbAtlasClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - MongoDB Community
  {
    name: "monitoring-db-mongodb-community",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mongodb-community/infrastructure/persistence/migrations/clickhouse",
      "DbMongodbCommunityClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - MSSQL
  {
    name: "monitoring-db-mssql",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mssql/infrastructure/persistence/migrations/clickhouse",
      "DbMssqlClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - SQLite3
  {
    name: "monitoring-db-sqlite3",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-sqlite3/infrastructure/persistence/migrations/clickhouse",
      "DbSqlite3ClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - TimescaleDB
  {
    name: "monitoring-db-timescaledb",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-timescaledb/infrastructure/persistence/migrations/clickhouse",
      "DbTimescaledbClickHouseMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - AWS RDS PostgreSQL
  {
    name: "monitoring-db-aws-rds-postgresql",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-postgresql/infrastructure/persistence/migrations/clickhouse",
      "DbAwsRdsPostgresqlClickHouseMigrations",
    ),
    enabled: true,
  },
];

// ============================================================================
// Migration Tracking
// ============================================================================

async function ensureMigrationsTable(
  client: ClickHouseClient,
  database: string,
): Promise<void> {
  await client.command({
    query: `CREATE DATABASE IF NOT EXISTS ${database}`,
  });

  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${database}.${MIGRATIONS_TABLE} (
        name String,
        module String,
        timestamp UInt64,
        executed_at DateTime64(3) DEFAULT now64(3)
      )
      ENGINE = MergeTree()
      ORDER BY (timestamp, name)
    `,
  });
}

async function getExecutedMigrations(
  client: ClickHouseClient,
  database: string,
): Promise<Set<string>> {
  const result = await client.query({
    query: `SELECT name FROM ${database}.${MIGRATIONS_TABLE}`,
    format: "JSONEachRow",
  });
  const data = (await result.json()) as Array<{ name: string }>;
  return new Set(data.map((row) => row.name));
}

async function recordMigration(
  client: ClickHouseClient,
  database: string,
  migration: ClickHouseMigration,
): Promise<void> {
  await client.insert({
    table: `${database}.${MIGRATIONS_TABLE}`,
    values: [
      {
        name: migration.name,
        module: migration.moduleName,
        timestamp: migration.timestamp,
      },
    ],
    format: "JSONEachRow",
  });
}

async function removeMigrationRecord(
  client: ClickHouseClient,
  database: string,
  migrationName: string,
): Promise<void> {
  await client.command({
    query: `ALTER TABLE ${database}.${MIGRATIONS_TABLE} DELETE WHERE name = '${migrationName}'`,
  });
}

// ============================================================================
// Migration Collection
// ============================================================================

function collectMigrations(moduleFilter?: string[]): MigrationConstructor[] {
  const allMigrations: MigrationConstructor[] = [];

  for (const module of MODULES) {
    // Skip if module filter is specified and this module is not included
    if (moduleFilter && !moduleFilter.includes(module.name)) {
      continue;
    }

    // Skip disabled modules
    if (!module.enabled) {
      continue;
    }

    allMigrations.push(...module.migrations);
  }

  // Sort by timestamp extracted from class name
  allMigrations.sort((a, b) => {
    const timestampA = extractTimestamp(a.name);
    const timestampB = extractTimestamp(b.name);
    return timestampA - timestampB;
  });

  return allMigrations;
}

// ============================================================================
// CLI Parsing
// ============================================================================

interface CLIOptions {
  modules?: string[];
  revert: boolean;
  show: boolean;
  help: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    revert: false,
    show: false,
    help: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--modules=")) {
      options.modules = arg
        .split("=")[1]
        .split(",")
        .map((m) => m.trim());
    } else if (arg === "--revert") {
      options.revert = true;
    } else if (arg === "--show") {
      options.show = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
ClickHouse Modular Migration Runner

Usage:
  ts-node migration-runner.ts [options]

Options:
  --modules=<list>   Comma-separated list of modules to run (e.g., audit,telemetry)
  --revert           Revert the last executed migration
  --show             Show pending migrations without running them
  --help, -h         Show this help message

Available Modules:
${MODULES.map((m) => `  - ${m.name}`).join("\n")}

Examples:
  ts-node migration-runner.ts                    # Run all migrations
  ts-node migration-runner.ts --modules=audit    # Run only Audit migrations
  ts-node migration-runner.ts --show             # Show pending migrations
  ts-node migration-runner.ts --revert           # Revert last migration
`);
}

// ============================================================================
// Main Runner
// ============================================================================

async function runMigrations(options: CLIOptions): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║       ClickHouse Modular Migrations - TelemetryFlow        ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");

  // Collect migrations
  const migrations = collectMigrations(options.modules);

  if (migrations.length === 0) {
    console.log("ℹ️  No migrations found for the specified modules");
    console.log("");
    console.log("   Note: Migrations may still be in the legacy location.");
    console.log("   Run the legacy migration runner or migrate modules first.");
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
  console.log(`   • Found:    ${migrations.length} migration(s)`);
  console.log("");

  // Create ClickHouse client
  const client = createClient({
    url: `http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}`,
    username: CLICKHOUSE_USER,
    password: CLICKHOUSE_PASSWORD,
  });

  try {
    // Ensure migrations tracking table exists
    await ensureMigrationsTable(client, CLICKHOUSE_DB);
    console.log("✅ Database connection established");
    console.log("");

    // Get already executed migrations
    const executed = await getExecutedMigrations(client, CLICKHOUSE_DB);

    if (options.show) {
      // Show pending migrations
      const pending = migrations.filter((M) => !executed.has(M.name));
      if (pending.length === 0) {
        console.log("ℹ️  No pending migrations");
      } else {
        console.log(`📋 Pending migrations (${pending.length}):`);
        for (const MigrationClass of pending) {
          const instance = new MigrationClass();
          console.log(`   • [${instance.moduleName}] ${instance.name}`);
        }
      }
    } else if (options.revert) {
      // Revert last migration
      const lastExecuted = Array.from(executed).pop();
      if (!lastExecuted) {
        console.log("ℹ️  No migrations to revert");
        return;
      }

      const MigrationClass = migrations.find((M) => M.name === lastExecuted);
      if (!MigrationClass) {
        console.log(`❌ Migration class not found: ${lastExecuted}`);
        return;
      }

      const instance = new MigrationClass();
      console.log(`🔄 Reverting: [${instance.moduleName}] ${instance.name}`);
      await instance.down(client, CLICKHOUSE_DB);
      await removeMigrationRecord(client, CLICKHOUSE_DB, instance.name);
      console.log("✅ Migration reverted successfully!");
    } else {
      // Run pending migrations
      const pending = migrations.filter((M) => !executed.has(M.name));

      if (pending.length === 0) {
        console.log("ℹ️  No pending migrations");
      } else {
        console.log(`🔄 Running ${pending.length} migration(s)...`);
        console.log("");

        let counter = 1;
        for (const MigrationClass of pending) {
          const instance = new MigrationClass();
          console.log(
            `[${counter}/${pending.length}] 📝 Running: [${instance.moduleName}] ${instance.name}`,
          );

          try {
            await instance.up(client, CLICKHOUSE_DB);
            await recordMigration(client, CLICKHOUSE_DB, instance);
            console.log(
              `[${counter}/${pending.length}] ✅ Completed: ${instance.name}`,
            );
          } catch (error) {
            console.error(
              `[${counter}/${pending.length}] ❌ Failed: ${instance.name}`,
            );
            throw error;
          }

          console.log("");
          counter++;
        }

        console.log(
          "╔═════════════════════════════════════════════════════════════╗",
        );
        console.log(
          "║   ✨ All ClickHouse migrations completed successfully! ✨   ║",
        );
        console.log(
          "╚═════════════════════════════════════════════════════════════╝",
        );
      }
    }
  } catch (error) {
    console.error("");
    console.error("❌ Migration failed:", error);
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

runMigrations(options)
  .then(() => {
    console.log("");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
