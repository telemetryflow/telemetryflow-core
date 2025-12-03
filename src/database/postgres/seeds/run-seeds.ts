import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { runAllSeeds } from './index';

// Load environment variables
config();

async function runSeeds() {
  console.log('🌱 Starting 5-Tier RBAC seeding...\n');

  // Create DataSource connection
  const isProduction = process.env.NODE_ENV === 'production' || !__filename.endsWith('.ts');
  const entityPattern = isProduction
    ? 'dist/modules/iam/infrastructure/persistence/entities/*.js'
    : 'src/modules/iam/infrastructure/persistence/entities/*.ts';

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USERNAME || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'telemetryflow_db',
    entities: [entityPattern],
    synchronize: false,
    logging: false,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run all seeds
    await runAllSeeds(dataSource);

  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  } finally {
    // Close connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run seeds
runSeeds()
  .then(() => {
    console.log('\n✨ 5-Tier RBAC seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding process failed:', error);
    process.exit(1);
  });
