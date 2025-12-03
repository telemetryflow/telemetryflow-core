import { DataSource } from 'typeorm';
import { seedIAMRolesPermissions } from './001-iam-roles-permissions.seed';
import { seedGroups } from './002-groups.seed';

export const SEED_ORDER = [
  '001-iam-roles-permissions',
  '002-groups',
] as const;

/**
 * Run all seeds in order
 */
export async function runAllSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting 5-Tier RBAC seeding...\n');

  try {
    // 1. Complete IAM System (Regions, Orgs, Workspaces, Tenants, Permissions, Roles, Users)
    console.log('📋 [01/02]: Seeding complete IAM system...');
    await seedIAMRolesPermissions(dataSource);
    console.log('✅ Complete IAM system seeded\n');

    // 2. Groups
    console.log('👥 [02/02]: Seeding groups...');
    await seedGroups(dataSource);
    console.log('✅ Groups seeded\n');

    console.log('🎉 5-Tier RBAC seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

export {
  seedIAMRolesPermissions,
  seedGroups,
};
