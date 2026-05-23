import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IWorkspaceRepository } from "../../../domain/repositories/IWorkspaceRepository";
import { Workspace } from "../../../domain/aggregates/Workspace";
import { WorkspaceId } from "../../../domain/value-objects/WorkspaceId";
import { OrganizationId } from "../../../domain/value-objects/OrganizationId";
import { WorkspaceEntity } from "../entities/Workspace.entity";

@Injectable()
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly repository: Repository<WorkspaceEntity>,
  ) {}

  async findAll(organizationId?: OrganizationId): Promise<Workspace[]> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId.getValue();
    }
    const entities = await this.repository.find({ where });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    const entity = await this.repository.findOne({
      where: { workspaceId: id.getValue() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Workspace | null> {
    const entity = await this.repository.findOne({
      where: { code },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(workspace: Workspace): Promise<void> {
    const entity = this.toPersistence(workspace);
    await this.repository.save(entity);
  }

  async delete(id: WorkspaceId): Promise<void> {
    await this.repository.softDelete({ workspaceId: id.getValue() });
  }

  private toDomain(entity: WorkspaceEntity): Workspace {
    return Workspace.reconstitute(
      WorkspaceId.create(entity.workspaceId),
      entity.name,
      entity.code,
      entity.description || null,
      OrganizationId.create(entity.organizationId),
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt || null,
    );
  }

  private toPersistence(workspace: Workspace): Partial<WorkspaceEntity> {
    return {
      workspaceId: workspace.getId().getValue(),
      name: workspace.getName(),
      code: workspace.getCode(),
      description: workspace.getDescription() || undefined,
      organizationId: workspace.getOrganizationId().getValue(),
      isActive: workspace.getIsActive(),
    };
  }
}
