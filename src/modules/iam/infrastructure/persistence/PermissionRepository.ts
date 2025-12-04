import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { Permission } from '../../domain/aggregates/Permission';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { PermissionEntity } from './entities/PermissionEntity';
import { PermissionMapper } from './PermissionMapper';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repository: Repository<PermissionEntity>,
  ) {}

  async save(permission: Permission): Promise<void> {
    const entity = PermissionMapper.toEntity(permission);
    await this.repository.save(entity);
  }

  async findById(id: PermissionId): Promise<Permission | null> {
    const entity = await this.repository.findOne({
      where: { id: id.getValue(), deletedAt: null },
    });
    return entity ? PermissionMapper.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<Permission | null> {
    const entity = await this.repository.findOne({
      where: { name, deletedAt: null },
    });
    return entity ? PermissionMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<Permission[]> {
    const entities = await this.repository.find({
      where: { deletedAt: null },
    });
    return entities.map(PermissionMapper.toDomain);
  }

  async delete(id: PermissionId): Promise<void> {
    await this.repository.softDelete(id.getValue());
  }
}
