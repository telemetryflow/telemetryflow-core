import { UserId } from '../value-objects/UserId';
import { RoleId } from '../value-objects/RoleId';

export interface IUserRoleRepository {
  assignRole(userId: UserId, roleId: RoleId): Promise<void>;
  revokeRole(userId: UserId, roleId: RoleId): Promise<void>;
  getUserRoles(userId: UserId): Promise<RoleId[]>;
  findByUserId(userId: string): Promise<RoleId[]>; // Alias for compatibility
  getRoleUsers(roleId: RoleId): Promise<UserId[]>;
  hasRole(userId: UserId, roleId: RoleId): Promise<boolean>;
}
