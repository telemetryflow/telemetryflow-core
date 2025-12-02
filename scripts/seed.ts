import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: ['src/modules/iam/infrastructure/persistence/entities/**/*.entity.ts'],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Starting database seeding...');
  
  await dataSource.initialize();
  console.log('✓ Connected to database');

  // Import and run IAM seed
  const { seedIAMData } = await import('./seed-iam');
  await seedIAMData(dataSource);

  await dataSource.destroy();
  console.log('✅ Seeding complete!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
