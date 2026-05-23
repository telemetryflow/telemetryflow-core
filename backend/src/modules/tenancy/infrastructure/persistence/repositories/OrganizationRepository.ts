import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IOrganizationRepository } from "../../../domain/repositories/IOrganizationRepository";
import { Organization } from "../../../domain/aggregates/Organization";
import { OrganizationId } from "../../../domain/value-objects/OrganizationId";
import { RegionId } from "../../../domain/value-objects/RegionId";
import { OrganizationEntity } from "../entities/Organization.entity";

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly repository: Repository<OrganizationEntity>,
  ) {}

  async findAll(regionId?: RegionId): Promise<Organization[]> {
    const where: any = {};
    if (regionId) {
      where.regionId = regionId.getValue();
    }
    const entities = await this.repository.find({ where });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: OrganizationId): Promise<Organization | null> {
    const entity = await this.repository.findOne({
      where: { organizationId: id.getValue() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Organization | null> {
    const entity = await this.repository.findOne({
      where: { code },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(organization: Organization): Promise<void> {
    const entity = this.toPersistence(organization);
    await this.repository.save(entity);
  }

  async delete(id: OrganizationId): Promise<void> {
    await this.repository.softDelete({ organizationId: id.getValue() });
  }

  private toDomain(entity: OrganizationEntity): Organization {
    return Organization.reconstitute(
      OrganizationId.create(entity.organizationId),
      entity.name,
      entity.code,
      entity.description || null,
      entity.domain || null,
      RegionId.create(entity.regionId),
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt || null,
    );
  }

  private toPersistence(
    organization: Organization,
  ): Partial<OrganizationEntity> {
    return {
      organizationId: organization.getId().getValue(),
      name: organization.getName(),
      code: organization.getCode(),
      description: organization.getDescription() || undefined,
      domain: organization.getDomain() || undefined,
      regionId: organization.getRegionId().getValue(),
      isActive: organization.getIsActive(),
    };
  }
}
