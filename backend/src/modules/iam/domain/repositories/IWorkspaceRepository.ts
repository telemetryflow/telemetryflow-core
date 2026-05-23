import { Workspace } from '../aggregates/Workspace';
import { WorkspaceId } from '../value-objects/WorkspaceId';
import { OrganizationId } from '../value-objects/OrganizationId';

export interface IWorkspaceRepository {
  save(workspace: Workspace): Promise<void>;
  findById(id: WorkspaceId): Promise<Workspace | null>;
  findByCode(code: string): Promise<Workspace | null>;
  findByOrganization(organizationId: OrganizationId): Promise<Workspace[]>;
  findAll(): Promise<Workspace[]>;
  delete(id: WorkspaceId): Promise<void>;
}
