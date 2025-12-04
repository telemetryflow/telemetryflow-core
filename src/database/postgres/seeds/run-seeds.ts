import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedIAMRolesPermissions } from './1704240000001-seed-iam-roles-permissions';
import { seedAuthTestUsers } from './1704240000002-seed-auth-test-users';
import { seedGroups } from './1704240000003-seed-groups';

// Load environment variables
config();

async function runSeeds() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          PostgreSQL Seeds - TelemetryFlow Core             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Create DataSource connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USERNAME || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'telemetryflow_db',
    entities: [
      'src/modules/iam/infrastructure/persistence/entities/*.ts',
    ],
    synchronize: false,
    logging: false,
  });

  try {
    // Initialize connection
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connection established');
    console.log('');
    console.log('📋 Configuration:');
    console.log(`   • Host:     ${process.env.POSTGRES_HOST || 'localhost'}`);
    console.log(`   • Port:     ${process.env.POSTGRES_PORT || '5432'}`);
    console.log(`   • Database: ${process.env.POSTGRES_DB || 'telemetryflow_db'}`);
    console.log('');
    console.log('🌱 Running 3 seed files...');
    console.log('');

    // Run seed files in order
    console.log('[1/3] 📦 Seeding: IAM Roles & Permissions');
    await seedIAMRolesPermissions(dataSource);
    console.log('[1/3] ✅ Completed: IAM Roles & Permissions');
    console.log('');

    console.log('[2/3] 📦 Seeding: Auth Test Users');
    await seedAuthTestUsers(dataSource);
    console.log('[2/3] ✅ Completed: Auth Test Users');
    console.log('');

    console.log('[3/3] 📦 Seeding: Groups');
    await seedGroups(dataSource);
    console.log('[3/3] ✅ Completed: Groups');
    console.log('');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║    ✨ All PostgreSQL seeds completed successfully! ✨      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║               ❌ PostgreSQL Seeding Failed                 ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    // Close connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('');
      console.log('🔌 Database connection closed');
    }
  }
}

// Run seeds
runSeeds()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
