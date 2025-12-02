import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleId } from '../../domain/value-objects/RoleId';
import { UserRoleEntity } from './entities/UserRole.entity';

@Injectable()
export class UserRoleRepository implements IUserRoleRepository {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly repository: Repository<UserRoleEntity>,
  ) {}

  async assignRole(userId: UserId, roleId: RoleId): Promise<void> {
    await this.repository.save({
      user_id: userId.getValue(),
      role_id: roleId.getValue(),
    });
  }

  async revokeRole(userId: UserId, roleId: RoleId): Promise<void> {
    await this.repository.delete({
      user_id: userId.getValue(),
      role_id: roleId.getValue(),
    });
  }

  async getUserRoles(userId: UserId): Promise<RoleId[]> {
    const userRoles = await this.repository.find({
      where: { user_id: userId.getValue() },
    });
    return userRoles.map(ur => RoleId.create(ur.role_id));
  }

  async getRoleUsers(roleId: RoleId): Promise<UserId[]> {
    const userRoles = await this.repository.find({
      where: { role_id: roleId.getValue() },
    });
    return userRoles.map(ur => UserId.create(ur.user_id));
  }

  async hasRole(userId: UserId, roleId: RoleId): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        user_id: userId.getValue(),
        role_id: roleId.getValue(),
      },
    });
    return count > 0;
  }

  async findByUserId(userId: string): Promise<RoleId[]> {
    const userRoles = await this.repository.find({
      where: { user_id: userId },
    });
    return userRoles.map(ur => RoleId.create(ur.role_id));
  }
}
