import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { UserEntity } from '../../../modules/iam/infrastructure/persistence/entities/User.entity';
import { RoleEntity } from '../../../modules/iam/infrastructure/persistence/entities/RoleEntity';
import { TenantEntity } from '../../../modules/iam/infrastructure/persistence/entities/Tenant.entity';

const DEFAULT_PASSWORD = 'TelemetryFlow@2024';

export async function seedAuthTestUsers(dataSource: DataSource): Promise<void> {
  console.log('👤 Seeding auth test users...');

  const userRepo = dataSource.getRepository(UserEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);
  const tenantRepo = dataSource.getRepository(TenantEntity);

  // Check if seed data already exists
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('   ⚠️  Auth test users already exist. Skipping...');
    return;
  }

  // Get default tenant
  const defaultTenant = await tenantRepo.findOne({
    where: { code: 'DEVOPSCORNER' },
  });

  if (!defaultTenant) {
    console.error('   ❌ Default tenant not found. Run IAM seed first!');
    throw new Error('Missing default tenant');
  }

  // Get 5-tier roles
  const superAdminRole = await roleRepo.findOne({ where: { name: 'Super Administrator' } });
  const administratorRole = await roleRepo.findOne({ where: { name: 'Administrator' } });
  const developerRole = await roleRepo.findOne({ where: { name: 'Developer' } });
  const viewerRole = await roleRepo.findOne({ where: { name: 'Viewer' } });
  const demoRole = await roleRepo.findOne({ where: { name: 'Demo' } });

  if (!superAdminRole || !administratorRole || !developerRole || !viewerRole || !demoRole) {
    console.error('   ❌ Roles not found. Run IAM seed first!');
    throw new Error('Missing 5-tier roles');
  }

  // Hash the default password
  const hashedPassword = await argon2.hash(DEFAULT_PASSWORD);

  // CREATE 5-TIER USERS
  const testUsers = [
    {
      email: 'superadmin.telemetryflow@telemetryflow.id',
      firstName: 'Super',
      lastName: 'Administrator',
      password: hashedPassword,
      isActive: true,
      tenant_id: defaultTenant.tenant_id,
    },
    {
      email: 'administrator.telemetryflow@telemetryflow.id',
      firstName: 'Administrator',
      lastName: 'TelemetryFlow',
      password: hashedPassword,
      isActive: true,
      tenant_id: defaultTenant.tenant_id,
    },
    {
      email: 'developer.telemetryflow@telemetryflow.id',
      firstName: 'Developer',
      lastName: 'TelemetryFlow',
      password: hashedPassword,
      isActive: true,
      tenant_id: defaultTenant.tenant_id,
    },
    {
      email: 'viewer.telemetryflow@telemetryflow.id',
      firstName: 'Viewer',
      lastName: 'TelemetryFlow',
      password: hashedPassword,
      isActive: true,
      tenant_id: defaultTenant.tenant_id,
    },
    {
      email: 'demo.telemetryflow@telemetryflow.id',
      firstName: 'Demo',
      lastName: 'TelemetryFlow',
      password: hashedPassword,
      isActive: true,
      tenant_id: defaultTenant.tenant_id,
    },
  ];

  for (const userData of testUsers) {
    const user = userRepo.create(userData);
    await userRepo.save(user);
    console.log(`   ✓ Created user: ${userData.email}`);
  }

  console.log(`   ✓ Created ${testUsers.length} test users`);
  console.log(`   🔑 Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log('   ⚠️  SECURITY WARNING: Change these passwords in production!');
}
