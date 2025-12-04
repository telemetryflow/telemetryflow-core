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

async function runSeeds() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         ClickHouse Seeds - TelemetryFlow Core              ║');
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
    // Get all seed files
    const seedsDir = __dirname;
    const files = fs
      .readdirSync(seedsDir)
      .filter((f) => f.endsWith('.ts') && f !== 'run-seeds.ts' && f !== 'index.ts' && f !== 'README.md')
      .sort();

    console.log(`🌱 Found ${files.length} seed(s) to run`);
    console.log('');

    let counter = 1;
    for (const file of files) {
      const seedPath = path.join(seedsDir, file);
      console.log(`[${counter}/${files.length}] 📦 Seeding: ${file}`);

      // Import and run seed
      const seed = await import(seedPath);
      if (seed.seed) {
        await seed.seed(client, CLICKHOUSE_DATABASE);
      }

      console.log(`[${counter}/${files.length}] ✅ Completed: ${file}`);
      console.log('');
      counter++;
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     ✨ All ClickHouse seeds completed successfully! ✨     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runSeeds();
