/**
 * PostgreSQL Modular Migration Runner
 *
 * Collects migrations from all modules and runs them in timestamp order.
 * Uses TypeORM for database operations.
 *
 * Usage:
 *   pnpm db:migrate:postgres              # Run all migrations
 *   pnpm db:migrate:postgres --modules=iam,auth  # Run specific modules
 *   pnpm db:migrate:postgres --revert     # Revert last migration
 *   pnpm db:migrate:postgres --show       # Show pending migrations
 */

import "reflect-metadata";
import { DataSource, MigrationInterface } from "typeorm";
import { config } from "dotenv";
import { extractTimestamp } from "../shared/interfaces";

config();

// ============================================================================
// Module Migration Imports
// ============================================================================

// Import migrations from each module
// Each try/catch block handles modules that may not yet be compiled

interface ModuleConfig {
  name: string;
  migrations: (new () => MigrationInterface)[];
  enabled: boolean;
}

function tryRequire(
  path: string,
  exportKey: string,
): (new () => MigrationInterface)[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path);
    return mod[exportKey] || [];
  } catch {
    return [];
  }
}

// ============================================================================
// Module Configuration
// ============================================================================

const MODULES: ModuleConfig[] = [
  // Core identity & access
  {
    name: "iam",
    migrations: tryRequire(
      "../../modules/iam/infrastructure/persistence/migrations",
      "IAMMigrations",
    ),
    enabled: true,
  },
  {
    name: "auth",
    migrations: tryRequire(
      "../../modules/auth/infrastructure/persistence/migrations",
      "AuthMigrations",
    ),
    enabled: true,
  },
  {
    name: "api-keys",
    migrations: tryRequire(
      "../../modules/api-keys/infrastructure/persistence/migrations",
      "ApiKeysMigrations",
    ),
    enabled: true,
  },
  {
    name: "sso",
    migrations: tryRequire(
      "../../modules/sso/infrastructure/persistence/migrations",
      "SsoMigrations",
    ),
    enabled: true,
  },
  {
    name: "audit",
    migrations: tryRequire(
      "../../modules/audit/infrastructure/persistence/migrations/postgres",
      "AuditPostgresMigrations",
    ),
    enabled: true,
  },
  // Platform features
  {
    name: "dashboard",
    migrations: tryRequire(
      "../../modules/dashboard/infrastructure/persistence/migrations",
      "DashboardMigrations",
    ),
    enabled: true,
  },
  {
    name: "alerting",
    migrations: tryRequire(
      "../../modules/alerting/infrastructure/persistence/migrations",
      "AlertingMigrations",
    ),
    enabled: true,
  },
  {
    name: "notification",
    migrations: tryRequire(
      "../../modules/notification/infrastructure/persistence/migrations",
      "NotificationMigrations",
    ),
    enabled: true,
  },
  {
    name: "retention",
    migrations: tryRequire(
      "../../modules/retention/infrastructure/persistence/migrations",
      "RetentionMigrations",
    ),
    enabled: true,
  },
  {
    name: "subscription",
    migrations: tryRequire(
      "../../modules/subscription/infrastructure/persistence/migrations/postgresql",
      "SubscriptionMigrations",
    ),
    enabled: true,
  },
  {
    name: "llm",
    migrations: tryRequire(
      "../../modules/llm/infrastructure/persistence/migrations",
      "LLMMigrations",
    ),
    enabled: true,
  },
  // Monitoring
  {
    name: "monitoring-db-inventory",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-inventory/infrastructure/persistence/migrations",
      "DbInventoryPostgresMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-agent",
    migrations: tryRequire(
      "../../modules/monitoring/agent/infrastructure/persistence/migrations",
      "AgentMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-kubernetes",
    migrations: tryRequire(
      "../../modules/monitoring/kubernetes/infrastructure/persistence/migrations/postgres",
      "KubernetesPostgresMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-vm",
    migrations: tryRequire(
      "../../modules/monitoring/vm/infrastructure/persistence/migrations/postgres",
      "VMPostgresMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-uptime",
    migrations: tryRequire(
      "../../modules/monitoring/uptime/infrastructure/persistence/migrations/postgresql",
      "UptimeMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-status-page",
    migrations: tryRequire(
      "../../modules/monitoring/status-page/infrastructure/persistence/migrations/postgresql",
      "StatusPageMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-service-map",
    migrations: tryRequire(
      "../../modules/monitoring/service-map/infrastructure/persistence/migrations/postgresql",
      "ServiceMapMigrations",
    ),
    enabled: true,
  },
  {
    name: "monitoring-network-map",
    migrations: tryRequire(
      "../../modules/monitoring/network-map/infrastructure/persistence/migrations/postgresql",
      "NetworkMapMigrations",
    ),
    enabled: true,
  },
  // Reporting
  {
    name: "reporting",
    migrations: tryRequire(
      "../../modules/reporting/infrastructure/persistence/migrations",
      "ReportingPostgresMigrations",
    ),
    enabled: true,
  },
  // AI Intelligence
  {
    name: "ai-intelligence",
    migrations: tryRequire(
      "../../modules/ai-intelligence/anomaly-detection/infrastructure/persistence/migrations",
      "AIIntelligencePostgresMigrations",
    ),
    enabled: true,
  },
  {
    name: "corrective-maintenance",
    migrations: tryRequire(
      "../../modules/ai-intelligence/corrective-maintenance/infrastructure/persistence/migrations",
      "CorrectiveMaintenancePostgresMigrations",
    ),
    enabled: true,
  },
  {
    name: "cost-optimization",
    migrations: tryRequire(
      "../../modules/ai-intelligence/cost-optimization/infrastructure/persistence/migrations",
      "CostOptimizationPostgresMigrations",
    ),
    enabled: true,
  },
  {
    name: "predictive-maintenance",
    migrations: tryRequire(
      "../../modules/ai-intelligence/predictive-maintenance/infrastructure/persistence/migrations",
      "PredictiveMaintenancePostgresMigrations",
    ),
    enabled: true,
  },
  // Data Masking
  {
    name: "data-masking",
    migrations: tryRequire(
      "../../modules/data-masking/infrastructure/persistence/migrations",
      "DataMaskingMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - MySQL/MariaDB/Percona
  {
    name: "monitoring-db-mysql",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mysql/infrastructure/persistence/migrations/postgres",
      "DbMysqlPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - PostgreSQL
  {
    name: "monitoring-db-monitoring",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-postgresql/infrastructure/persistence/migrations/postgres",
      "DbMonitoringPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - ClickHouse
  {
    name: "monitoring-db-clickhouse",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-clickhouse/infrastructure/persistence/migrations/postgres",
      "DbMonitoringClickHousePostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - AWS DynamoDB
  {
    name: "monitoring-db-aws-dynamodb",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-dynamodb/infrastructure/persistence/migrations/postgres",
      "DbAwsDynamodbPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - AWS RDS Aurora
  {
    name: "monitoring-db-aws-rds-aurora",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-aurora/infrastructure/persistence/migrations/postgres",
      "DbAwsRdsAuroraPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - AWS RDS MySQL
  {
    name: "monitoring-db-aws-rds-mysql",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-mysql/infrastructure/persistence/migrations/postgres",
      "DbAwsRdsMysqlPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - CockroachDB
  {
    name: "monitoring-db-cockroachdb",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-cockroachdb/infrastructure/persistence/migrations/postgres",
      "DbCockroachdbPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - MongoDB Atlas
  {
    name: "monitoring-db-mongodb-atlas",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mongodb-atlas/infrastructure/persistence/migrations/postgres",
      "DbMongodbAtlasPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - MongoDB Community
  {
    name: "monitoring-db-mongodb-community",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mongodb-community/infrastructure/persistence/migrations/postgres",
      "DbMongodbCommunityPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - MSSQL
  {
    name: "monitoring-db-mssql",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-mssql/infrastructure/persistence/migrations/postgres",
      "DbMssqlPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - SQLite3
  {
    name: "monitoring-db-sqlite3",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-sqlite3/infrastructure/persistence/migrations/postgres",
      "DbSqlite3PostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - TimescaleDB
  {
    name: "monitoring-db-timescaledb",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-timescaledb/infrastructure/persistence/migrations/postgres",
      "DbTimescaledbPostgresMigrations",
    ),
    enabled: true,
  },
  // Database Monitoring - AWS RDS PostgreSQL
  {
    name: "monitoring-db-aws-rds-postgresql",
    migrations: tryRequire(
      "../../modules/monitoring/db-monitoring/db-aws-rds-postgresql/infrastructure/persistence/migrations/postgres",
      "DbAwsRdsPostgresqlPostgresMigrations",
    ),
    enabled: true,
  },
];

// ============================================================================
// Migration Collection
// ============================================================================

function collectMigrations(
  moduleFilter?: string[],
): (new () => MigrationInterface)[] {
  const allMigrations: (new () => MigrationInterface)[] = [];

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
// DataSource Configuration
// ============================================================================

function createDataSource(
  migrations: (new () => MigrationInterface)[],
): DataSource {
  return new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USERNAME || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "telemetryflow_db",
    migrations: migrations,
    migrationsTableName: "migrations",
    logging: process.env.DB_LOGGING === "true",
  });
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
PostgreSQL Modular Migration Runner

Usage:
  ts-node migration-runner.ts [options]

Options:
  --modules=<list>   Comma-separated list of modules to run (e.g., iam,auth)
  --revert           Revert the last executed migration
  --show             Show pending migrations without running them
  --help, -h         Show this help message

Available Modules:
${MODULES.map((m) => `  - ${m.name}`).join("\n")}

Examples:
  ts-node migration-runner.ts                    # Run all migrations
  ts-node migration-runner.ts --modules=iam      # Run only IAM migrations
  ts-node migration-runner.ts --show             # Show pending migrations
  ts-node migration-runner.ts --revert           # Revert last migration
`);
}

// ============================================================================
// Main Runner
// ============================================================================

async function runMigrations(options: CLIOptions): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║       PostgreSQL Modular Migrations - TelemetryFlow        ║");
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
  console.log(`   • Host:     ${process.env.POSTGRES_HOST || "localhost"}`);
  console.log(`   • Port:     ${process.env.POSTGRES_PORT || "5432"}`);
  console.log(
    `   • Database: ${process.env.POSTGRES_DB || "telemetryflow_db"}`,
  );
  if (options.modules) {
    console.log(`   • Modules:  ${options.modules.join(", ")}`);
  } else {
    console.log(`   • Modules:  all`);
  }
  console.log(`   • Found:    ${migrations.length} migration(s)`);
  console.log("");

  // Create DataSource
  const dataSource = createDataSource(migrations);

  try {
    await dataSource.initialize();
    console.log("✅ Database connection established");
    console.log("");

    if (options.show) {
      // Show pending migrations
      const pendingMigrations = await dataSource.showMigrations();
      if (!pendingMigrations) {
        console.log("ℹ️  No pending migrations");
      } else {
        console.log("📋 Pending migrations:");
        for (const migration of migrations) {
          console.log(`   • ${migration.name}`);
        }
      }
    } else if (options.revert) {
      // Revert last migration
      console.log("🔄 Reverting last migration...");
      await dataSource.undoLastMigration();
      console.log("✅ Migration reverted successfully!");
    } else {
      // Run migrations
      const pendingMigrations = await dataSource.showMigrations();

      if (!pendingMigrations) {
        console.log("ℹ️  No pending migrations");
      } else {
        console.log("🔄 Running migrations...");
        console.log("");
        await dataSource.runMigrations();
        console.log("");
        console.log("✅ All migrations completed successfully!");
      }
    }
  } catch (error) {
    console.error("");
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
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

runMigrations(options)
  .then(() => {
    console.log("");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
