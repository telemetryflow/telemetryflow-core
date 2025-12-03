import { DataSource } from 'typeorm';

export async function seedGroups(dataSource: DataSource): Promise<void> {
  console.log('👥 Seeding groups...');

  // Check if groups already exist
  const existingGroups = await dataSource.query(`SELECT COUNT(*) as count FROM groups`);
  if (existingGroups[0].count > 0) {
    console.log('   ⚠️  Groups already exist. Skipping...');
    return;
  }

  // CREATE GROUPS with static UUIDs
  const groups = [
    {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      name: 'Engineering Team',
      description: 'Software engineering and development team',
      organizationId: '811a6697-169b-4b01-823a-066edae34b55', // TelemetryFlow
    },
    {
      id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
      name: 'DevOps Team',
      description: 'DevOps and infrastructure team',
      organizationId: '811a6697-169b-4b01-823a-066edae34b55', // TelemetryFlow
    },
    {
      id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
      name: 'Management Team',
      description: 'Management and leadership team',
      organizationId: '811a6697-169b-4b01-823a-066edae34b55', // TelemetryFlow
    },
    {
      id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
      name: 'Demo Users',
      description: 'Demo environment users',
      organizationId: '10756297-4ada-4c28-b0e0-644706b7c97d', // Demo
    },
  ];

  for (const group of groups) {
    await dataSource.query(`
      INSERT INTO groups (id, name, description, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [group.id, group.name, group.description, group.organizationId]);
    
    console.log(`   ✓ Created group: ${group.name}`);
  }

  console.log(`   ✅ Created ${groups.length} groups`);
}