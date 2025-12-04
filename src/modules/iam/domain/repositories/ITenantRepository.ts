import { Tenant } from '../aggregates/Tenant';
import { TenantId } from '../value-objects/TenantId';
import { WorkspaceId } from '../value-objects/WorkspaceId';

export interface ITenantRepository {
  save(tenant: Tenant): Promise<void>;
  findById(id: TenantId): Promise<Tenant | null>;
  findByCode(code: string): Promise<Tenant | null>;
  findByWorkspace(workspaceId: WorkspaceId): Promise<Tenant[]>;
  findAll(): Promise<Tenant[]>;
  delete(id: TenantId): Promise<void>;
}
