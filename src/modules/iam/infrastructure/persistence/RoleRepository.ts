import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { Role } from '../../domain/aggregates/Role';
import { RoleId } from '../../domain/value-objects/RoleId';
import { TenantId } from '../../domain/value-objects/TenantId';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { RoleEntity } from './entities/RoleEntity';
import { PermissionEntity } from './entities/PermissionEntity';
import { RoleMapper } from './RoleMapper';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepo: Repository<PermissionEntity>,
  ) {}

  async save(role: Role): Promise<void> {
    const entity = RoleMapper.toEntity(role);
    
    // Load permission entities
    const permissionIds = role.getPermissions().map(p => p.getValue());
    if (permissionIds.length > 0) {
      entity.permissions = await this.permissionRepo.findByIds(permissionIds);
    }
    
    await this.roleRepo.save(entity);
  }

  async findById(id: RoleId): Promise<Role | null> {
    const entity = await this.roleRepo.findOne({
      where: { id: id.getValue() },
      relations: ['permissions'],
    });
    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findByName(name: string, tenantId?: TenantId): Promise<Role | null> {
    const where: any = { name };
    if (tenantId) {
      where.tenantId = tenantId.getValue();
    }
    
    const entity = await this.roleRepo.findOne({
      where,
      relations: ['permissions'],
    });
    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findAll(tenantId?: TenantId, includeSystem = false): Promise<Role[]> {
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId.getValue();
    }
    if (!includeSystem) {
      where.isSystem = false;
    }

    const entities = await this.roleRepo.find({
      where,
      relations: ['permissions'],
    });
    return entities.map(e => RoleMapper.toDomain(e));
  }

  async existsByName(name: string, tenantId?: TenantId): Promise<boolean> {
    const where: any = { name };
    if (tenantId) {
      where.tenantId = tenantId.getValue();
    }
    const count = await this.roleRepo.count({ where });
    return count > 0;
  }

  async delete(id: RoleId): Promise<void> {
    await this.roleRepo.softDelete(id.getValue());
  }
}
