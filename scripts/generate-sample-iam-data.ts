import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';
import { UserEntity } from '../src/modules/iam/infrastructure/persistence/entities/User.entity';
import { RoleEntity } from '../src/modules/iam/infrastructure/persistence/entities/Role.entity';
import { PermissionEntity } from '../src/modules/iam/infrastructure/persistence/entities/PermissionEntity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: ['src/modules/iam/infrastructure/persistence/entities/**/*.entity.ts'],
  synchronize: false,
});

async function generateSampleData(count: number) {
  await dataSource.initialize();
  console.log('✓ Connected to database');

  const userRepo = dataSource.getRepository(UserEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);
  const permissionRepo = dataSource.getRepository(PermissionEntity);

  // Get existing tenant
  const existingUser = await userRepo.findOne({ where: {} });
  if (!existingUser) {
    console.log('⚠️  No existing data. Run seed first.');
    return;
  }

  const tenantId = existingUser.tenantId;
  const hashedPassword = await argon2.hash('Password123!');

  // Generate users
  for (let i = 1; i <= count; i++) {
    const user = userRepo.create({
      email: `user${i}@example.com`,
      username: `user${i}`,
      password: hashedPassword,
      firstName: `User`,
      lastName: `${i}`,
      tenantId,
      isActive: true,
    });
    await userRepo.save(user);
  }

  console.log(`✓ Generated ${count} users`);

  // Generate roles
  for (let i = 1; i <= Math.ceil(count / 3); i++) {
    const role = roleRepo.create({
      name: `sample_role_${i}`,
      description: `Sample role ${i}`,
      tenantId,
    });
    await roleRepo.save(role);
  }

  console.log(`✓ Generated ${Math.ceil(count / 3)} roles`);

  // Generate permissions
  for (let i = 1; i <= Math.ceil(count / 2); i++) {
    const permission = permissionRepo.create({
      name: `sample:permission:${i}`,
      description: `Sample permission ${i}`,
      resource: 'sample',
      action: `action${i}`,
      tenantId,
    });
    await permissionRepo.save(permission);
  }

  console.log(`✓ Generated ${Math.ceil(count / 2)} permissions`);

  await dataSource.destroy();
}

const count = parseInt(process.argv.find(arg => arg.startsWith('--count'))?.split('=')[1] || '10');
generateSampleData(count).catch(console.error);
