import { DataSource } from 'typeorm';
import { GroupEntity } from '../../../modules/iam/infrastructure/persistence/entities/GroupEntity';
import { OrganizationEntity } from '../../../modules/iam/infrastructure/persistence/entities/Organization.entity';

export async function seedGroups(dataSource: DataSource): Promise<void> {
  console.log('👥 Seeding groups...');

  const groupRepo = dataSource.getRepository(GroupEntity);
  const organizationRepo = dataSource.getRepository(OrganizationEntity);

  // Check if seed data already exists
  const existingGroups = await groupRepo.count();
  if (existingGroups > 0) {
    console.log('   ⚠️  Groups already exist. Skipping...');
    return;
  }

  // Get default organization
  const defaultOrg = await organizationRepo.findOne({
    where: { code: 'DEVOPSCORNER' },
  });

  if (!defaultOrg) {
    console.error('   ❌ Default organization not found. Run IAM seed first!');
    throw new Error('Missing default organization');
  }

  // CREATE GROUPS
  const groups = [
    {
      name: 'Engineering',
      description: 'Engineering team members',
      organizationId: defaultOrg.organization_id,
    },
    {
      name: 'Operations',
      description: 'Operations and DevOps team',
      organizationId: defaultOrg.organization_id,
    },
    {
      name: 'Management',
      description: 'Management and leadership',
      organizationId: defaultOrg.organization_id,
    },
  ];

  for (const groupData of groups) {
    const group = groupRepo.create(groupData);
    await groupRepo.save(group);
    console.log(`   ✓ Created group: ${groupData.name}`);
  }

  console.log(`   ✅ Created ${groups.length} groups`);
}
