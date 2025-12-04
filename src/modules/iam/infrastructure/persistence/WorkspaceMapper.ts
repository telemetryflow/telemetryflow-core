import { Workspace } from '../../domain/aggregates/Workspace';
import { WorkspaceEntity } from './entities/Workspace.entity';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';

export class WorkspaceMapper {
  static toDomain(entity: WorkspaceEntity): Workspace {
    return Workspace.reconstitute(
      WorkspaceId.create(entity.workspace_id),
      entity.name,
      entity.code,
      OrganizationId.create(entity.organization_id),
      entity.description,
      entity.datasource_config,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toPersistence(workspace: Workspace): Partial<WorkspaceEntity> {
    return {
      workspace_id: workspace.id.getValue(),
      name: workspace.name,
      code: workspace.code,
      description: workspace.description,
      datasource_config: workspace.datasourceConfig,
      isActive: workspace.isActive,
      organization_id: workspace.organizationId.getValue(),
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
