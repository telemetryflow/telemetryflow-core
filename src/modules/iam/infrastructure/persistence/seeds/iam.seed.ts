import { DataSource } from 'typeorm';
import { seedRegions } from './regions.seed';
import { seedOrganizations } from './organizations.seed';
import { seedPermissions } from './permissions.seed';
import { seedRoles } from './roles.seed';
import { seedGroups } from './groups.seed';
import { seedUsers } from './users.seed';
import { workspacesSeed } from './workspaces.seed';
import { tenantsSeed } from './tenants.seed';

export async function seedIAM(dataSource: DataSource): Promise<void> {
  console.log('[IAM] Starting seed...');

  await seedRegions(dataSource);
  await seedOrganizations(dataSource);

  const workspaceRepo = dataSource.getRepository('workspaces');
  for (const ws of workspacesSeed) {
    const exists = await workspaceRepo.findOne({ where: { code: ws.code } });
    if (!exists) {
      await workspaceRepo.save(ws);
      console.log(`[IAM] ✓ Created workspace: ${ws.name}`);
    }
  }

  const tenantRepo = dataSource.getRepository('tenants');
  for (const tn of tenantsSeed) {
    const exists = await tenantRepo.findOne({ where: { code: tn.code } });
    if (!exists) {
      await tenantRepo.save(tn);
      console.log(`[IAM] ✓ Created tenant: ${tn.name}`);
    }
  }

  await seedPermissions(dataSource);
  await seedRoles(dataSource);
  await seedGroups(dataSource);
  await seedUsers(dataSource);

  console.log('[IAM] ✓ Seed completed');
}
