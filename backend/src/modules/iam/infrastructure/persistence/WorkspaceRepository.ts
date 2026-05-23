import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import { Workspace } from '../../domain/aggregates/Workspace';
import { WorkspaceEntity } from './entities/Workspace.entity';
import { WorkspaceMapper } from './WorkspaceMapper';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';

@Injectable()
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly repository: Repository<WorkspaceEntity>,
  ) {}

  async save(workspace: Workspace): Promise<void> {
    const entity = WorkspaceMapper.toPersistence(workspace);
    await this.repository.save(entity);
  }

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    const entity = await this.repository.findOne({
      where: { workspace_id: id.getValue(), deletedAt: IsNull() },
    });
    return entity ? WorkspaceMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Workspace | null> {
    const entity = await this.repository.findOne({
      where: { code, deletedAt: IsNull() },
    });
    return entity ? WorkspaceMapper.toDomain(entity) : null;
  }

  async findByOrganization(organizationId: OrganizationId): Promise<Workspace[]> {
    const entities = await this.repository.find({
      where: { organization_id: organizationId.getValue(), deletedAt: IsNull() },
    });
    return entities.map(WorkspaceMapper.toDomain);
  }

  async findAll(): Promise<Workspace[]> {
    const entities = await this.repository.find({
      where: { deletedAt: IsNull() },
    });
    return entities.map(WorkspaceMapper.toDomain);
  }

  async delete(id: WorkspaceId): Promise<void> {
    await this.repository.softDelete({ workspace_id: id.getValue() });
  }
}
