import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedIAMRolesPermissions } from '../src/database/postgres/seeds/001-iam-roles-permissions.seed';
import { seedAuthTestUsers } from '../src/database/postgres/seeds/003-auth-test-users.seed';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USERNAME || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'telemetryflow_db',
  entities: ['src/modules/**/infrastructure/persistence/entities/**/*.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  synchronize: false,
  logging: false,
});

async function resetDatabase() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    console.log('🗑️  Dropping all tables...');
    await dataSource.dropDatabase();
    console.log('✅ All tables dropped\n');

    console.log('🔄 Running migrations...');
    await dataSource.runMigrations();
    console.log('✅ Migrations completed\n');

    console.log('🌱 Running seeds...');
    await seedIAMRolesPermissions(dataSource);
    await seedAuthTestUsers(dataSource);
    console.log('\n✅ Seeds completed\n');

    await dataSource.destroy();
    console.log('🔌 Database connection closed');
    console.log('\n✨ Database reset completed successfully!');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
