import { DataSource } from 'typeorm';
import { OrganizationEntity } from '../entities/Organization.entity';

export async function seedOrganizations(dataSource: DataSource): Promise<void> {
  const organizationRepository = dataSource.getRepository(OrganizationEntity);

  // Get region IDs (assuming regions are already seeded)
  const regionRepository = dataSource.getRepository('RegionEntity');
  const usEast1 = await regionRepository.findOne({ where: { code: 'us-east-1' } });
  const apSoutheast3 = await regionRepository.findOne({ where: { code: 'ap-southeast-3' } });

  const organizations = [
    {
      name: 'DevOpsCorner Indonesia',
      code: 'org-devopscorner',
      description: 'Main organization for DevOpsCorner Indonesia',
      domain: 'devopscorner.id',
      is_active: true,
      region_id: apSoutheast3?.region_id,
    },
    {
      name: 'TelemetryFlow',
      code: 'org-telemetryflow',
      description: 'TelemetryFlow organization',
      domain: 'telemetryflow.id',
      is_active: true,
      region_id: usEast1?.region_id,
    },
    {
      name: 'Demo Organization',
      code: 'org-demo',
      description: 'Demo organization (auto-cleanup every 6 hours)',
      domain: 'demo.telemetryflow.id',
      is_active: true,
      region_id: apSoutheast3?.region_id,
    },
  ];

  for (const org of organizations) {
    const exists = await organizationRepository.findOne({ where: { code: org.code } });
    if (!exists) {
      await organizationRepository.save(org);
      console.log(`[IAM] ✓ Created organization: ${org.name}`);
    }
  }

  console.log('[IAM] ✓ Organizations seeded successfully');
}
