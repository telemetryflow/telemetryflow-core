import { Role } from '../aggregates/Role';
import { RoleId } from '../value-objects/RoleId';
import { TenantId } from '../value-objects/TenantId';

export interface IRoleRepository {
  save(role: Role): Promise<void>;
  findById(id: RoleId): Promise<Role | null>;
  findByName(name: string, tenantId?: TenantId): Promise<Role | null>;
  findAll(tenantId?: TenantId, includeSystem?: boolean): Promise<Role[]>;
  existsByName(name: string, tenantId?: TenantId): Promise<boolean>;
  delete(id: RoleId): Promise<void>;
}
