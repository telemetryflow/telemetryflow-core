import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedIAMRolesPermissions } from './001-iam-roles-permissions.seed';
import { seedAuthTestUsers } from './002-auth-test-users.seed';
import { seedGroups } from './003-groups.seed';

// Load environment variables
config();

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

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
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run seed files in order
    console.log('📦 [01/03]: IAM Roles & Permissions...');
    await seedIAMRolesPermissions(dataSource);
    console.log('');

    console.log('📦 [02/03]: Auth Test Users...');
    await seedAuthTestUsers(dataSource);
    console.log('');

    console.log('📦 [03/03]: Groups...');
    await seedGroups(dataSource);
    console.log('');

    console.log('✅ All seeds completed successfully!\n');
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
    console.log('\n✨ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding process failed:', error);
    process.exit(1);
  });
