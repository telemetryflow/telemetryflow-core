import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { Role } from '../../domain/aggregates/Role';
import { RoleId } from '../../domain/value-objects/RoleId';
import { TenantId } from '../../domain/value-objects/TenantId';
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
    });
    
    if (!entity) return null;
    
    // Manually load permissions
    const rolePermissions = await this.roleRepo.query(
      'SELECT p.* FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1',
      [entity.id]
    );
    entity.permissions = rolePermissions;
    
    return RoleMapper.toDomain(entity);
  }

  async findByName(name: string, tenantId?: TenantId): Promise<Role | null> {
    const where: any = { name };
    if (tenantId) {
      where.tenantId = tenantId.getValue();
    }
    
    const entity = await this.roleRepo.findOne({
      where,
    });
    return entity ? RoleMapper.toDomain(entity) : null;
  }

  async findAll(tenantId?: TenantId, includeSystem = false): Promise<Role[]> {
    let query = 'SELECT * FROM roles WHERE 1=1';
    const params: any[] = [];
    
    if (tenantId) {
      params.push(tenantId.getValue());
      query += ` AND tenant_id = $${params.length}`;
    }
    if (!includeSystem) {
      query += ' AND is_system = FALSE';
    }

    const entities = await this.roleRepo.query(query, params);
    
    // Manually load permissions for each role
    for (const entity of entities) {
      const rolePermissions = await this.roleRepo.query(
        'SELECT p.* FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1',
        [entity.id]
      );
      entity.permissions = rolePermissions;
    }
    
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
