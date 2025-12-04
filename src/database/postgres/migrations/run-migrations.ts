import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function runMigrations() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       PostgreSQL Migrations - TelemetryFlow Core           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USERNAME || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'telemetryflow_db',
    migrations: ['src/database/postgres/migrations/[0-9]*.ts'],
    migrationsTableName: 'migrations',
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const pendingMigrations = await dataSource.showMigrations();

    if (!pendingMigrations) {
      console.log('ℹ️  No pending migrations\n');
    } else {
      console.log('🔄 Running migrations...\n');
      await dataSource.runMigrations();
      console.log('✅ All migrations completed successfully!\n');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runMigrations();
