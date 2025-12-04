import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRegionRepository } from '../../domain/repositories/IRegionRepository';
import { Region } from '../../domain/aggregates/Region';
import { RegionId } from '../../domain/value-objects/RegionId';
import { RegionEntity } from './entities/RegionEntity';
import { RegionMapper } from './RegionMapper';

@Injectable()
export class RegionRepository implements IRegionRepository {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly repository: Repository<RegionEntity>,
  ) {}

  async save(region: Region): Promise<void> {
    const entity = RegionMapper.toEntity(region);
    await this.repository.save(entity);
  }

  async findById(id: RegionId): Promise<Region | null> {
    const entity = await this.repository.findOne({
      where: { id: id.getValue() },
    });
    return entity ? RegionMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<Region | null> {
    const entity = await this.repository.findOne({
      where: { code },
    });
    return entity ? RegionMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Region[]> {
    const entities = await this.repository.find();
    return entities.map(RegionMapper.toDomain);
  }

  async delete(id: RegionId): Promise<void> {
    await this.repository.delete(id.getValue());
  }
}
