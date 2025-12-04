import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export async function seedGroups(dataSource: DataSource): Promise<void> {
  const groupRepository = dataSource.getRepository('group_users');

  const groups = [
    { name: 'Administrators', description: 'System administrators group' },
    { name: 'Developers', description: 'Development team group' },
    { name: 'Operations', description: 'Operations team group' },
    { name: 'Support', description: 'Support team group' },
  ];

  for (const group of groups) {
    const existing = await groupRepository.findOne({ where: { name: group.name } });
    if (!existing) {
      await groupRepository.save({
        group_user_id: uuidv4(),
        ...group,
        isActive: true,
        tenant_id: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  console.log(`[IAM] ✓ Seeded ${groups.length} groups`);
}
