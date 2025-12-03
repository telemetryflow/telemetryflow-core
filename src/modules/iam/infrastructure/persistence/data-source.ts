import { DataSource } from 'typeorm';
import { UserEntity } from './entities/User.entity';
import { RoleEntity } from './entities/RoleEntity';
import { TenantEntity } from './entities/Tenant.entity';
import { OrganizationEntity } from './entities/Organization.entity';
import { WorkspaceEntity } from './entities/Workspace.entity';
import { RegionEntity } from './entities/Region.entity';
import { UserRoleEntity } from './entities/UserRole.entity';
import { AuditLogEntity } from './entities/AuditLog.entity';

export const IAMDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'telemetryflow',
  entities: [UserEntity, RoleEntity, TenantEntity, OrganizationEntity, WorkspaceEntity, RegionEntity, UserRoleEntity, AuditLogEntity],
  migrations: ['./migrations/*.ts'],
  synchronize: false,
});
