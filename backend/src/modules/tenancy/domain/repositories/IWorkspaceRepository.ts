import { Workspace } from "../aggregates/Workspace";
import { WorkspaceId } from "../value-objects/WorkspaceId";
import { OrganizationId } from "../value-objects/OrganizationId";

export interface IWorkspaceRepository {
  findAll(organizationId?: OrganizationId): Promise<Workspace[]>;
  findById(id: WorkspaceId): Promise<Workspace | null>;
  findByCode(code: string): Promise<Workspace | null>;
  save(workspace: Workspace): Promise<void>;
  delete(id: WorkspaceId): Promise<void>;
}
