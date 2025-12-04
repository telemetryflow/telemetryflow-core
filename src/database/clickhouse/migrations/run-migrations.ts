import { createClient } from '@clickhouse/client';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

config();

const CLICKHOUSE_HOST = process.env.CLICKHOUSE_HOST || 'localhost';
const CLICKHOUSE_PORT = process.env.CLICKHOUSE_PORT || '8123';
const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DB || 'telemetry';
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || 'default';
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || '';

async function runMigrations() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       ClickHouse Migrations - TelemetryFlow Core           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📋 Configuration:');
  console.log(`   • Host: ${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}`);
  console.log(`   • Database: ${CLICKHOUSE_DATABASE}`);
  console.log(`   • User: ${CLICKHOUSE_USER}`);
  console.log('');

  // Create ClickHouse client
  const client = createClient({
    url: `http://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}`,
    username: CLICKHOUSE_USER,
    password: CLICKHOUSE_PASSWORD,
  });

  try {
    // Get all migration files
    const migrationsDir = __dirname;
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.ts') && f !== 'run-migrations.ts' && f !== 'index.ts')
      .sort();

    console.log(`🔄 Found ${files.length} migration(s) to run`);
    console.log('');

    let counter = 1;
    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      console.log(`[${counter}/${files.length}] 📝 Running: ${file}`);

      // Import and run migration
      const migration = await import(migrationPath);
      if (migration.up) {
        await migration.up(client, CLICKHOUSE_DATABASE);
      }

      console.log(`[${counter}/${files.length}] ✅ Completed: ${file}`);
      console.log('');
      counter++;
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✨ All ClickHouse migrations completed successfully! ✨  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runMigrations();
