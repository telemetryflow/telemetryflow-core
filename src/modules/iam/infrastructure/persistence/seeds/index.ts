import { IAMDataSource } from '../data-source';
import { seedIAM } from './iam.seed';

async function runSeeds() {
  try {
    await IAMDataSource.initialize();
    console.log('[IAM] Database connected');

    await seedIAM(IAMDataSource);

    await IAMDataSource.destroy();
    console.log('[IAM] ✓ Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error(`[IAM] ✗ Seeding failed: ${error.message}`);
    process.exit(1);
  }
}

runSeeds();
