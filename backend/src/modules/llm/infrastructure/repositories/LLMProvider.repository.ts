/**
 * LLMProvider Repository Implementation
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ILLMProviderRepository,
  FindLLMProvidersOptions,
  FindLLMProvidersResult,
} from "../../domain/repositories/ILLMProviderRepository";
import { LLMProvider } from "../../domain/aggregates/LLMProvider";
import {
  LLMProviderId,
  ProviderType,
  ModelConfig,
  EncryptedApiKey,
} from "../../domain/value-objects";
import { LLMProviderEntity } from "../entities/LLMProvider.entity";

@Injectable()
export class LLMProviderRepository implements ILLMProviderRepository {
  constructor(
    @InjectRepository(LLMProviderEntity)
    private readonly repository: Repository<LLMProviderEntity>,
  ) {}

  async findById(id: string): Promise<LLMProvider | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByOrganization(
    organizationId: string,
    options: FindLLMProvidersOptions = {},
  ): Promise<FindLLMProvidersResult> {
    const { page = 1, pageSize = 20, providerType, isActive, search } = options;

    const queryBuilder = this.repository
      .createQueryBuilder("provider")
      .where("provider.organization_id = :organizationId", { organizationId });

    if (providerType) {
      queryBuilder.andWhere("provider.provider_type = :providerType", {
        providerType,
      });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere("provider.is_active = :isActive", { isActive });
    }

    if (search) {
      queryBuilder.andWhere("provider.name ILIKE :search", {
        search: `%${search}%`,
      });
    }

    queryBuilder
      .orderBy("provider.is_default", "DESC")
      .addOrderBy("provider.created_at", "DESC");

    const total = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    const entities = await queryBuilder.getMany();

    return {
      items: entities.map((e) => this.toDomain(e)),
      total,
    };
  }

  async findDefaultByOrganization(
    organizationId: string,
  ): Promise<LLMProvider | null> {
    const entity = await this.repository.findOne({
      where: {
        organizationId,
        isDefault: true,
        isActive: true,
      },
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<LLMProvider | null> {
    const entity = await this.repository.findOne({
      where: { organizationId, name },
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async save(provider: LLMProvider): Promise<void> {
    const entity = this.toEntity(provider);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async existsByName(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.repository
      .createQueryBuilder("provider")
      .where("provider.organization_id = :organizationId", { organizationId })
      .andWhere("provider.name = :name", { name });

    if (excludeId) {
      queryBuilder.andWhere("provider.id != :excludeId", { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  async clearDefaultForOrganization(
    organizationId: string,
    excludeId?: string,
  ): Promise<void> {
    const queryBuilder = this.repository
      .createQueryBuilder()
      .update(LLMProviderEntity)
      .set({ isDefault: false })
      .where("organization_id = :organizationId", { organizationId });

    if (excludeId) {
      queryBuilder.andWhere("id != :excludeId", { excludeId });
    }

    await queryBuilder.execute();
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return this.repository.count({ where: { organizationId } });
  }

  private toDomain(entity: LLMProviderEntity): LLMProvider {
    return LLMProvider.reconstitute({
      id: LLMProviderId.create(entity.id),
      organizationId: entity.organizationId,
      name: entity.name,
      providerType: ProviderType.fromString(entity.providerType),
      encryptedApiKey: EncryptedApiKey.create(
        entity.encryptedApiKey,
        entity.apiKeyHint,
      ),
      baseUrl: entity.baseUrl || undefined,
      modelId: entity.modelId,
      modelConfig: ModelConfig.fromJSON(entity.modelConfig),
      isDefault: entity.isDefault,
      isActive: entity.isActive,
      lastUsedAt: entity.lastUsedAt || undefined,
      usageCount: Number(entity.usageCount),
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(provider: LLMProvider): LLMProviderEntity {
    const entity = new LLMProviderEntity();
    entity.id = provider.getId();
    entity.organizationId = provider.getOrganizationId();
    entity.name = provider.getName();
    entity.providerType = provider.getProviderType().toString();
    entity.encryptedApiKey = provider.getEncryptedApiKey().getValue();
    entity.apiKeyHint = provider.getEncryptedApiKey().getHint();
    entity.baseUrl = provider.getBaseUrl() || null;
    entity.modelId = provider.getModelId();
    entity.modelConfig = provider.getModelConfig().toJSON() as unknown as Record<string, unknown>;
    entity.isDefault = provider.isDefault();
    entity.isActive = provider.isActive();
    entity.lastUsedAt = provider.getLastUsedAt() || null;
    entity.usageCount = provider.getUsageCount();
    entity.createdBy = provider.getCreatedBy();
    entity.createdAt = provider.getCreatedAt();
    entity.updatedAt = provider.getUpdatedAt();
    return entity;
  }
}
