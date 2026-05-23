import { Tenant } from "../aggregates/Tenant";
import { TenantId } from "../value-objects/TenantId";
import { WorkspaceId } from "../value-objects/WorkspaceId";

export interface ITenantRepository {
  findAll(workspaceId?: WorkspaceId): Promise<Tenant[]>;
  findById(id: TenantId): Promise<Tenant | null>;
  findByCode(code: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
  delete(id: TenantId): Promise<void>;
}
