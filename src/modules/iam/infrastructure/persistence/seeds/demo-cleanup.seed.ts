import { DataSource } from 'typeorm';

/**
 * Demo Environment Auto-Cleanup Service
 * Automatically cleans and reseeds demo data every 6 hours
 */
export async function cleanupDemoEnvironment(dataSource: DataSource): Promise<void> {
  console.log('[IAM] Starting demo environment cleanup...');

  const demoOrgCode = 'org-demo';
  const demoWorkspaceCode = 'ws-demo';
  const demoTenantCode = 'tn-demo';

  // Get demo organization
  const orgRepo = dataSource.getRepository('organizations');
  const demoOrg = await orgRepo.findOne({ where: { code: demoOrgCode } });

  if (!demoOrg) {
    console.log('[IAM] Demo organization not found, skipping cleanup');
    return;
  }

  // Delete demo data in correct order (respecting foreign keys)
  await dataSource.query('DELETE FROM user_roles WHERE tenant_id IN (SELECT tenant_id FROM tenants WHERE code = $1)', [demoTenantCode]);
  await dataSource.query('DELETE FROM users WHERE organization_id = $1', [demoOrg.organization_id]);
  await dataSource.query('DELETE FROM audit_logs WHERE tenant_id IN (SELECT tenant_id FROM tenants WHERE code = $1)', [demoTenantCode]);
  await dataSource.query('DELETE FROM dashboards WHERE tenant_id IN (SELECT tenant_id FROM tenants WHERE code = $1)', [demoTenantCode]);
  await dataSource.query('DELETE FROM alert_rules WHERE tenant_id IN (SELECT tenant_id FROM tenants WHERE code = $1)', [demoTenantCode]);

  console.log('[IAM] ✓ Demo environment cleaned successfully');
}

/**
 * Reseed demo data after cleanup
 */
export async function reseedDemoEnvironment(dataSource: DataSource): Promise<void> {
  console.log('[IAM] Reseeding demo environment...');

  // Import and run seed functions
  const { seedUsers } = await import('./users.seed');
  await seedUsers(dataSource);

  console.log('[IAM] ✓ Demo environment reseeded successfully');
}

/**
 * Schedule demo cleanup every 6 hours
 */
export function scheduleDemoCleanup(dataSource: DataSource): NodeJS.Timeout {
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  return setInterval(async () => {
    try {
      await cleanupDemoEnvironment(dataSource);
      await reseedDemoEnvironment(dataSource);
      console.log(`[IAM] ✓ Demo cleanup completed at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`[IAM] ✗ Demo cleanup failed: ${error.message}`);
    }
  }, SIX_HOURS);
}
