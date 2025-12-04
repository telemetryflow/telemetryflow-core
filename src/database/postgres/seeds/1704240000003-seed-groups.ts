import { DataSource } from 'typeorm';
import { Group } from '../../../modules/iam/infrastructure/persistence/entities/Group.entity';
import { OrganizationEntity } from '../../../modules/iam/infrastructure/persistence/entities/Organization.entity';

export async function seedGroups(dataSource: DataSource): Promise<void> {
  console.log('👥 Seeding groups...');

  const groupRepo = dataSource.getRepository(Group);
  const orgRepo = dataSource.getRepository(OrganizationEntity);

  // Check if groups already exist
  const existingGroups = await groupRepo.count();
  if (existingGroups > 0) {
    console.log('   ⚠️  Groups already exist. Skipping...');
    return;
  }

  // Get default organization
  const defaultOrg = await orgRepo.findOne({ where: { code: 'DEVOPSCORNER' } });
  if (!defaultOrg) {
    console.error('   ❌ Default organization not found. Run IAM seed first!');
    throw new Error('Missing default organization');
  }

  // CREATE GROUPS
  const groups = [
    {
      name: 'Engineering Team',
      description: 'Software engineering and development team',
      organizationId: defaultOrg.organization_id,
    },
    {
      name: 'DevOps Team',
      description: 'DevOps and infrastructure team',
      organizationId: defaultOrg.organization_id,
    },
    {
      name: 'Management Team',
      description: 'Management and leadership team',
      organizationId: defaultOrg.organization_id,
    },
    {
      name: 'Demo Users',
      description: 'Demo environment users',
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