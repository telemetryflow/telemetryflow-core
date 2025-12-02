import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export async function seedRegions(dataSource: DataSource): Promise<void> {
  const regionRepository = dataSource.getRepository('regions');

  const regions = [
    { name: 'US East (N. Virginia)', code: 'us-east-1', description: 'US East region' },
    { name: 'US East (Ohio)', code: 'us-east-2', description: 'US East region' },
    { name: 'US West (N. California)', code: 'us-west-1', description: 'US West region' },
    { name: 'US West (Oregon)', code: 'us-west-2', description: 'US West region' },
    { name: 'Asia Pacific (Singapore)', code: 'ap-southeast-1', description: 'Asia Pacific region' },
    { name: 'Asia Pacific (Sydney)', code: 'ap-southeast-2', description: 'Asia Pacific region' },
    { name: 'Asia Pacific (Jakarta)', code: 'ap-southeast-3', description: 'Asia Pacific region' },
    { name: 'Asia Pacific (Tokyo)', code: 'ap-northeast-1', description: 'Asia Pacific region' },
    { name: 'Europe (Ireland)', code: 'eu-west-1', description: 'Europe region' },
    { name: 'Europe (Frankfurt)', code: 'eu-central-1', description: 'Europe region' },
    { name: 'Europe (London)', code: 'eu-west-2', description: 'Europe region' },
  ];

  for (const region of regions) {
    const existing = await regionRepository.findOne({ where: { code: region.code } });
    if (!existing) {
      await regionRepository.save({
        region_id: uuidv4(),
        ...region,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  console.log(`[IAM] ✓ Seeded ${regions.length} regions`);
}
