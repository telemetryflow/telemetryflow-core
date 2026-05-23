import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { ApiKeyEntity } from "../entities/ApiKey.entity";
import {
  ApiKey,
  ApiKeyId,
  IApiKeyRepository,
  ApiKeyFilter,
  FindByOrganizationOptions,
  PaginatedApiKeys,
} from "../../domain";

@Injectable()
export class ApiKeyRepository implements IApiKeyRepository {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly repository: Repository<ApiKeyEntity>,
  ) {}

  async findById(id: string): Promise<ApiKey | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const entity = await this.repository.findOne({
      where: { apiKeySecret: keyHash },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByName(
    name: string,
    organizationId: string,
  ): Promise<ApiKey | null> {
    const entity = await this.repository.findOne({
      where: { name, organizationId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    filter: ApiKeyFilter,
    page: number,
    limit: number,
  ): Promise<PaginatedApiKeys> {
    const queryBuilder = this.repository
      .createQueryBuilder("api_key")
      .where("api_key.organization_id = :organizationId", {
        organizationId: filter.organizationId,
      });

    if (filter.workspaceId) {
      queryBuilder.andWhere("api_key.workspace_id = :workspaceId", {
        workspaceId: filter.workspaceId,
      });
    }

    if (filter.isActive !== undefined) {
      queryBuilder.andWhere("api_key.is_active = :isActive", {
        isActive: filter.isActive,
      });
    }

    if (filter.name) {
      queryBuilder.andWhere("api_key.name ILIKE :name", {
        name: `%${filter.name}%`,
      });
    }

    if (filter.keyPrefix) {
      queryBuilder.andWhere("api_key.key_prefix = :keyPrefix", {
        keyPrefix: filter.keyPrefix,
      });
    }

    if (filter.createdBy) {
      queryBuilder.andWhere("api_key.created_by = :createdBy", {
        createdBy: filter.createdBy,
      });
    }

    const [entities, total] = await queryBuilder
      .orderBy("api_key.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      items: entities.map((entity) => this.toDomain(entity)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findByOrganization(
    organizationId: string,
    options: FindByOrganizationOptions = {},
  ): Promise<{ items: ApiKey[]; total: number }> {
    const { page = 1, pageSize = 20, isActive, keyType, search } = options;

    const queryBuilder = this.repository
      .createQueryBuilder("api_key")
      .where("api_key.organization_id = :organizationId", { organizationId });

    if (isActive !== undefined) {
      queryBuilder.andWhere("api_key.is_active = :isActive", { isActive });
    }

    if (keyType) {
      queryBuilder.andWhere("api_key.key_type = :keyType", { keyType });
    }

    if (search) {
      queryBuilder.andWhere(
        "(api_key.name ILIKE :search OR api_key.description ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    const [entities, total] = await queryBuilder
      .orderBy("api_key.created_at", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  async findActiveByPrefix(prefix: string): Promise<ApiKey[]> {
    const entities = await this.repository.find({
      where: {
        keyPrefix: prefix,
        isActive: true,
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(apiKey: ApiKey): Promise<void> {
    const entity = this.toEntity(apiKey);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateLastUsed(
    id: string,
    ip: string,
    usedAt: Date = new Date(),
  ): Promise<void> {
    await this.repository.update(id, {
      lastUsedAt: usedAt,
      lastUsedIp: ip,
      usageCount: () => "usage_count + 1",
    });
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return this.repository.count({ where: { organizationId } });
  }

  async existsByName(organizationId: string, name: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { organizationId, name },
    });
    return count > 0;
  }

  async findExpiringKeys(days: number): Promise<ApiKey[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const entities = await this.repository.find({
      where: {
        isActive: true,
        expiresAt: LessThan(futureDate),
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  private toDomain(entity: ApiKeyEntity): ApiKey {
    return ApiKey.reconstitute({
      id: ApiKeyId.fromString(entity.id),
      organizationId: entity.organizationId,
      workspaceId: entity.workspaceId ?? undefined,
      name: entity.name,
      description: entity.description ?? undefined,
      keyType: entity.keyType,
      apiKeyId: entity.apiKeyId ?? undefined,
      apiKeySecret: entity.apiKeySecret,
      keyPrefix: entity.keyPrefix,
      keyHint: entity.keyHint,
      encryptKey: entity.encryptKey ?? undefined,
      isSystem: entity.isSystem,
      permissions: entity.permissions,
      scopes: entity.scopes,
      rateLimit: entity.rateLimit ?? undefined,
      isActive: entity.isActive,
      expiresAt: entity.expiresAt ?? undefined,
      lastUsedAt: entity.lastUsedAt ?? undefined,
      lastUsedIp: entity.lastUsedIp ?? undefined,
      usageCount: Number(entity.usageCount),
      createdBy: entity.createdBy,
      revokedAt: entity.revokedAt ?? undefined,
      revokedBy: entity.revokedBy ?? undefined,
      revocationReason: entity.revocationReason ?? undefined,
      rotatedAt: entity.rotatedAt ?? undefined,
      rotatedBy: entity.rotatedBy ?? undefined,
      rotationCount: entity.rotationCount,
      metadata: entity.metadata ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(apiKey: ApiKey): ApiKeyEntity {
    const entity = new ApiKeyEntity();
    entity.id = apiKey.getId().getValue();
    entity.organizationId = apiKey.getOrganizationId();
    entity.workspaceId = apiKey.getWorkspaceId() ?? null;
    entity.name = apiKey.getName();
    entity.description = apiKey.getDescription() ?? null;
    entity.keyType = apiKey.getKeyType();
    entity.apiKeyId = apiKey.getApiKeyId() ?? null;
    entity.keyPrefix = apiKey.getKeyPrefix().getValue();
    entity.apiKeySecret = apiKey.getApiKeySecret();
    entity.keyHint = apiKey.getKeyHint();
    entity.encryptKey = apiKey.getEncryptKey() ?? null;
    entity.isSystem = apiKey.getIsSystem();
    entity.permissions = apiKey.getPermissions();
    entity.scopes = apiKey.getScopes();
    entity.rateLimit = apiKey.getRateLimit() ?? null;
    entity.isActive = apiKey.getIsActive();
    entity.expiresAt = apiKey.getExpiresAt() ?? null;
    entity.lastUsedAt = apiKey.getLastUsedAt() ?? null;
    entity.lastUsedIp = apiKey.getLastUsedIp() ?? null;
    entity.usageCount = apiKey.getUsageCount();
    entity.createdBy = apiKey.getCreatedBy();
    entity.revokedAt = apiKey.getRevokedAt() ?? null;
    entity.revokedBy = apiKey.getRevokedBy() ?? null;
    entity.revocationReason = apiKey.getRevocationReason() ?? null;
    entity.rotatedAt = apiKey.getRotatedAt() ?? null;
    entity.rotatedBy = apiKey.getRotatedBy() ?? null;
    entity.rotationCount = apiKey.getRotationCount();
    entity.metadata = apiKey.getMetadata() ?? null;
    entity.createdAt = apiKey.getCreatedAt();
    entity.updatedAt = apiKey.getUpdatedAt();
    return entity;
  }
}
