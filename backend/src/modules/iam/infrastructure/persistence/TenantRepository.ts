import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { Tenant } from '../../domain/aggregates/Tenant';
import { TenantEntity } from './entities/Tenant.entity';
import { TenantMapper } from './TenantMapper';
import { TenantId } from '../../domain/value-objects/TenantId';
import { WorkspaceId } from '../../domain/value-objects/WorkspaceId';

@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repository: Repository<TenantEntity>,
  ) {}

  async save(tenant: Tenant): Promise<void> {
    const entity = TenantMapper.toPersistence(tenant);
    await this.repository.save(entity);
  }

  async findById(id: TenantId): Promise<Tenant | null> {
    const entity = await this.repository.findOne({
      where: { tenant_id: id.getValue(), deletedAt: IsNull() },
    });
    return entity ? TenantMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Tenant | null> {
    const entity = await this.repository.findOne({
      where: { code, deletedAt: IsNull() },
    });
    return entity ? TenantMapper.toDomain(entity) : null;
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Tenant[]> {
    const entities = await this.repository.find({
      where: { workspace_id: workspaceId.getValue(), deletedAt: IsNull() },
    });
    return entities.map(TenantMapper.toDomain);
  }

  async findAll(): Promise<Tenant[]> {
    const entities = await this.repository.find({
      where: { deletedAt: IsNull() },
    });
    return entities.map(TenantMapper.toDomain);
  }

  async delete(id: TenantId): Promise<void> {
    await this.repository.softDelete({ tenant_id: id.getValue() });
  }
}
