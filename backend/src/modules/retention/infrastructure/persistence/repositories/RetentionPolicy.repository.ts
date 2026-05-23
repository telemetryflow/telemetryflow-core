import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetentionPolicy, DataType } from '../../../domain/aggregates/RetentionPolicy';
import { IRetentionPolicyRepository } from '../../../domain/repositories/IRetentionPolicyRepository';
import { RetentionPolicyEntity } from '../entities/RetentionPolicy.entity';
import { RetentionPolicyMapper } from '../RetentionPolicy.mapper';

@Injectable()
export class RetentionPolicyRepository implements IRetentionPolicyRepository {
  constructor(
    @InjectRepository(RetentionPolicyEntity)
    private readonly repository: Repository<RetentionPolicyEntity>,
  ) {}

  async save(policy: RetentionPolicy): Promise<void> {
    const entity = RetentionPolicyMapper.toPersistence(policy);
    await this.repository.save(entity as RetentionPolicyEntity);
  }

  async findById(id: string): Promise<RetentionPolicy | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? RetentionPolicyMapper.toDomain(entity) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<RetentionPolicy[]> {
    const entities = await this.repository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(RetentionPolicyMapper.toDomain);
  }

  async findByDataType(dataType: DataType, organizationId?: string): Promise<RetentionPolicy[]> {
    const where: any = { dataType };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    const entities = await this.repository.find({
      where,
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    return entities.map(RetentionPolicyMapper.toDomain);
  }

  async findDefaultPolicies(): Promise<RetentionPolicy[]> {
    const entities = await this.repository.find({
      where: { isDefault: true },
      order: { dataType: 'ASC' },
    });
    return entities.map(RetentionPolicyMapper.toDomain);
  }

  async findActivePolicies(): Promise<RetentionPolicy[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { organizationId: 'ASC', dataType: 'ASC' },
    });
    return entities.map(RetentionPolicyMapper.toDomain);
  }

  async findAll(organizationId?: string): Promise<RetentionPolicy[]> {
    const queryBuilder = this.repository.createQueryBuilder('policy');

    if (organizationId) {
      queryBuilder.where('policy.organization_id = :organizationId OR policy.organization_id IS NULL', {
        organizationId,
      });
    }

    queryBuilder.orderBy('policy.is_default', 'DESC').addOrderBy('policy.created_at', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map(RetentionPolicyMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async existsByNameAndOrganization(name: string, organizationId?: string): Promise<boolean> {
    const where: any = { name };
    if (organizationId) {
      where.organizationId = organizationId;
    } else {
      where.organizationId = null;
    }
    const count = await this.repository.count({ where });
    return count > 0;
  }
}
