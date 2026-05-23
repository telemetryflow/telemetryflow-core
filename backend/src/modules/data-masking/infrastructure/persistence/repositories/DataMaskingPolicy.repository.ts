import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, IsNull } from "typeorm";
import { DataMaskingPolicyEntity } from "../entities/DataMaskingPolicy.entity";
import { DataMaskingPolicy } from "../../../domain/aggregates/DataMaskingPolicy";
import {
  IDataMaskingPolicyRepository,
  ListPoliciesOptions,
  ListPoliciesResult,
} from "../../../domain/repositories/IDataMaskingPolicyRepository";

@Injectable()
export class DataMaskingPolicyRepository implements IDataMaskingPolicyRepository {
  constructor(
    @InjectRepository(DataMaskingPolicyEntity)
    private readonly repo: Repository<DataMaskingPolicyEntity>,
  ) {}

  async findById(id: string): Promise<DataMaskingPolicy | null> {
    const entity = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOrganization(
    organizationId: string,
    enabled?: boolean,
  ): Promise<DataMaskingPolicy[]> {
    const where: any = { organizationId, deletedAt: IsNull() };
    if (enabled !== undefined) where.enabled = enabled;
    const entities = await this.repo.find({
      where,
      order: { createdAt: "ASC" },
    });
    return entities.map(this.toDomain);
  }

  async list(options: ListPoliciesOptions): Promise<ListPoliciesResult> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;

    const where: any = {
      organizationId: options.organizationId,
      deletedAt: IsNull(),
    };
    if (options.workspaceId) where.workspaceId = options.workspaceId;
    if (options.enabled !== undefined) where.enabled = options.enabled;
    if (options.search) where.name = Like(`%${options.search}%`);

    const [entities, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: entities.map(this.toDomain),
      total,
      page,
      pageSize,
    };
  }

  async save(policy: DataMaskingPolicy): Promise<DataMaskingPolicy> {
    const entity = this.toEntity(policy);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  private toDomain(entity: DataMaskingPolicyEntity): DataMaskingPolicy {
    return new DataMaskingPolicy({
      id: entity.id,
      organizationId: entity.organizationId,
      workspaceId: entity.workspaceId ?? undefined,
      name: entity.name,
      description: entity.description ?? undefined,
      enabled: entity.enabled,
      rules: entity.rules ?? [],
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(policy: DataMaskingPolicy): DataMaskingPolicyEntity {
    const entity = new DataMaskingPolicyEntity();
    entity.id = policy.id;
    entity.organizationId = policy.organizationId;
    entity.workspaceId = policy.workspaceId ?? null;
    entity.name = policy.name;
    entity.description = policy.description ?? null;
    entity.enabled = policy.enabled;
    entity.rules = policy.rules.map((r) => r.toJSON());
    entity.createdBy = policy.createdBy;
    entity.updatedBy = policy.updatedBy ?? null;
    entity.createdAt = policy.createdAt;
    entity.updatedAt = policy.updatedAt;
    return entity;
  }
}
