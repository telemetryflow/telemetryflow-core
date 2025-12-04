import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';
import { Organization } from '../../domain/aggregates/Organization';
import { OrganizationEntity } from './entities/Organization.entity';
import { OrganizationMapper } from './OrganizationMapper';
import { OrganizationId } from '../../domain/value-objects/OrganizationId';
import { RegionId } from '../../domain/value-objects/RegionId';

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly repository: Repository<OrganizationEntity>,
  ) {}

  async save(organization: Organization): Promise<void> {
    const entity = OrganizationMapper.toPersistence(organization);
    await this.repository.save(entity);
  }

  async findById(id: OrganizationId): Promise<Organization | null> {
    const entity = await this.repository.findOne({
      where: { organization_id: id.getValue(), deleted_at: null },
    });
    return entity ? OrganizationMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Organization | null> {
    const entity = await this.repository.findOne({
      where: { code, deleted_at: null },
    });
    return entity ? OrganizationMapper.toDomain(entity) : null;
  }

  async findByRegion(regionId: RegionId): Promise<Organization[]> {
    const entities = await this.repository.find({
      where: { region_id: regionId.getValue(), deleted_at: null },
    });
    return entities.map(OrganizationMapper.toDomain);
  }

  async findAll(): Promise<Organization[]> {
    const entities = await this.repository.find({
      where: { deleted_at: null },
    });
    return entities.map(OrganizationMapper.toDomain);
  }

  async delete(id: OrganizationId): Promise<void> {
    await this.repository.softDelete({ organization_id: id.getValue() });
  }
}
