import { DataSource } from 'typeorm';
import { seedIAMRolesPermissions } from './001-iam-roles-permissions.seed';
import { seedAuthTestUsers } from './003-auth-test-users.seed';
import { seedGroups } from './004-groups.seed';

export const SEED_ORDER = [
  '001-iam-roles-permissions',
  '003-auth-test-users',
  '004-groups',
] as const;

/**
 * Run all seeds in order
 */
export async function runAllSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. IAM Roles & Permissions (5-tier RBAC)
    console.log('📋 [01/03]: Seeding IAM roles & permissions...');
    await seedIAMRolesPermissions(dataSource);
    console.log('✅ IAM roles & permissions seeded\n');

    // 2. Test Users (Super Admin, Admin, Developer, Viewer, Demo)
    console.log('👥 [02/03]: Seeding test users...');
    await seedAuthTestUsers(dataSource);
    console.log('✅ Test users seeded\n');

    // 3. Groups
    console.log('👥 [03/03]: Seeding groups...');
    await seedGroups(dataSource);
    console.log('✅ Groups seeded\n');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

export {
  seedIAMRolesPermissions,
  seedAuthTestUsers,
  seedGroups,
};
