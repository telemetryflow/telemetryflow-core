import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserPermissionRepository } from '../../domain/repositories/IUserPermissionRepository';
import { UserPermissionEntity } from './entities/UserPermission.entity';
import { UserId } from '../../domain/value-objects/UserId';
import { PermissionId } from '../../domain/value-objects/PermissionId';

@Injectable()
export class UserPermissionRepository implements IUserPermissionRepository {
  constructor(
    @InjectRepository(UserPermissionEntity)
    private readonly repository: Repository<UserPermissionEntity>,
  ) {}

  async assignPermission(userId: UserId, permissionId: PermissionId): Promise<void> {
    const exists = await this.hasPermission(userId, permissionId);
    if (!exists) {
      await this.repository.save({
        user_id: userId.getValue(),
        permission_id: permissionId.getValue(),
      });
    }
  }

  async revokePermission(userId: UserId, permissionId: PermissionId): Promise<void> {
    await this.repository.delete({
      user_id: userId.getValue(),
      permission_id: permissionId.getValue(),
    });
  }

  async getUserPermissions(userId: UserId): Promise<PermissionId[]> {
    const entities = await this.repository.find({
      where: { user_id: userId.getValue() },
    });
    return entities.map(e => PermissionId.create(e.permission_id));
  }

  async hasPermission(userId: UserId, permissionId: PermissionId): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        user_id: userId.getValue(),
        permission_id: permissionId.getValue(),
      },
    });
    return count > 0;
  }
}
