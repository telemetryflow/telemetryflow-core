import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ITenantRepository } from "../../../domain/repositories/ITenantRepository";
import { Tenant } from "../../../domain/aggregates/Tenant";
import { TenantId } from "../../../domain/value-objects/TenantId";
import { WorkspaceId } from "../../../domain/value-objects/WorkspaceId";
import { TenantEntity } from "../entities/Tenant.entity";

@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repository: Repository<TenantEntity>,
  ) {}

  async findAll(workspaceId?: WorkspaceId): Promise<Tenant[]> {
    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId.getValue();
    }
    const entities = await this.repository.find({ where });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: TenantId): Promise<Tenant | null> {
    const entity = await this.repository.findOne({
      where: { tenantId: id.getValue() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Tenant | null> {
    const entity = await this.repository.findOne({
      where: { code },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(tenant: Tenant): Promise<void> {
    const entity = this.toPersistence(tenant);
    await this.repository.save(entity);
  }

  async delete(id: TenantId): Promise<void> {
    await this.repository.softDelete({ tenantId: id.getValue() });
  }

  private toDomain(entity: TenantEntity): Tenant {
    return Tenant.reconstitute(
      TenantId.create(entity.tenantId),
      entity.name,
      entity.code,
      entity.description || null,
      WorkspaceId.create(entity.workspaceId),
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt || null,
    );
  }

  private toPersistence(tenant: Tenant): Partial<TenantEntity> {
    return {
      tenantId: tenant.getId().getValue(),
      name: tenant.getName(),
      code: tenant.getCode(),
      description: tenant.getDescription() || undefined,
      workspaceId: tenant.getWorkspaceId().getValue(),
      isActive: tenant.getIsActive(),
    };
  }
}
