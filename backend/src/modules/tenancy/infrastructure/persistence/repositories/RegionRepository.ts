import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IRegionRepository } from "../../../domain/repositories/IRegionRepository";
import { Region } from "../../../domain/aggregates/Region";
import { RegionId } from "../../../domain/value-objects/RegionId";
import { RegionEntity } from "../entities/Region.entity";

@Injectable()
export class RegionRepository implements IRegionRepository {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly repository: Repository<RegionEntity>,
  ) {}

  async findAll(): Promise<Region[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: RegionId): Promise<Region | null> {
    const entity = await this.repository.findOne({
      where: { id: id.getValue() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Region | null> {
    const entity = await this.repository.findOne({
      where: { code },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(region: Region): Promise<void> {
    const entity = this.toPersistence(region);
    await this.repository.save(entity);
  }

  async delete(id: RegionId): Promise<void> {
    await this.repository.softDelete(id.getValue());
  }

  private toDomain(entity: RegionEntity): Region {
    return Region.reconstitute(
      RegionId.create(entity.id),
      entity.name,
      entity.code,
      entity.description || "",
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt || null,
    );
  }

  private toPersistence(region: Region): Partial<RegionEntity> {
    return {
      id: region.getId().getValue(),
      name: region.getName(),
      code: region.getCode(),
      description: region.getDescription(),
      isActive: region.getIsActive(),
    };
  }
}
