import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository('users');
  const roleRepo = dataSource.getRepository('roles');
  const userRoleRepo = dataSource.getRepository('user_roles');
  const orgRepo = dataSource.getRepository('organizations');
  const tenantRepo = dataSource.getRepository('tenants');

  // Get roles
  const superAdminRole = await roleRepo.findOne({ where: { name: 'super_administrator' } });
  const adminRole = await roleRepo.findOne({ where: { name: 'administrator' } });
  const developerRole = await roleRepo.findOne({ where: { name: 'developer' } });
  const viewerRole = await roleRepo.findOne({ where: { name: 'viewer' } });
  const demoRole = await roleRepo.findOne({ where: { name: 'demo' } });

  // Get organizations
  const telemetryflowOrg = await orgRepo.findOne({ where: { code: 'org-telemetryflow' } });
  const demoOrg = await orgRepo.findOne({ where: { code: 'org-demo' } });

  // Get tenants
  const telemetryflowTenant = await tenantRepo.findOne({ where: { code: 'tn-telemetryflow' } });
  const demoTenant = await tenantRepo.findOne({ where: { code: 'tn-demo' } });

  const users = [
    {
      id: uuidv4(),
      email: 'superadmin.telemetryflow@telemetryflow.id',
      password_hash: await bcrypt.hash('SuperAdmin@123456', 10),
      first_name: 'Super',
      last_name: 'Administrator',
      is_active: true,
      email_verified: true,
      role: superAdminRole,
      organization_id: null,
      tenant_id: null,
    },
    {
      id: uuidv4(),
      email: 'administrator.telemetryflow@telemetryflow.id',
      password_hash: await bcrypt.hash('Admin@123456', 10),
      first_name: 'Administrator',
      last_name: 'TelemetryFlow',
      is_active: true,
      email_verified: true,
      role: adminRole,
      organization_id: telemetryflowOrg?.organization_id,
      tenant_id: telemetryflowTenant?.tenant_id,
    },
    {
      id: uuidv4(),
      email: 'developer.telemetryflow@telemetryflow.id',
      password_hash: await bcrypt.hash('Developer@123456', 10),
      first_name: 'Developer',
      last_name: 'TelemetryFlow',
      is_active: true,
      email_verified: true,
      role: developerRole,
      organization_id: telemetryflowOrg?.organization_id,
      tenant_id: telemetryflowTenant?.tenant_id,
    },
    {
      id: uuidv4(),
      email: 'viewer.telemetryflow@telemetryflow.id',
      password_hash: await bcrypt.hash('Viewer@123456', 10),
      first_name: 'Viewer',
      last_name: 'TelemetryFlow',
      is_active: true,
      email_verified: true,
      role: viewerRole,
      organization_id: telemetryflowOrg?.organization_id,
      tenant_id: telemetryflowTenant?.tenant_id,
    },
    {
      id: uuidv4(),
      email: 'demo.telemetryflow@telemetryflow.id',
      password_hash: await bcrypt.hash('Demo@123456', 10),
      first_name: 'Demo',
      last_name: 'TelemetryFlow',
      is_active: true,
      email_verified: true,
      role: demoRole,
      organization_id: demoOrg?.organization_id,
      tenant_id: demoTenant?.tenant_id,
    },
  ];

  for (const userData of users) {
    const existing = await userRepo.findOne({ where: { email: userData.email } });
    if (!existing) {
      const user = await userRepo.save({
        id: userData.id,
        email: userData.email,
        password_hash: userData.password_hash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_active: userData.is_active,
        email_verified: userData.email_verified,
        organization_id: userData.organization_id,
        tenant_id: userData.tenant_id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (userData.role) {
        await userRoleRepo.save({
          user_id: user.id,
          role_id: userData.role.id,
          tenant_id: userData.tenant_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`[IAM] ✓ Created user: ${userData.email}`);
    }
  }

  console.log('[IAM] ✓ Seeded 5 users with roles');
}
