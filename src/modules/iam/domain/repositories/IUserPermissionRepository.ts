import { UserId } from '../value-objects/UserId';
import { PermissionId } from '../value-objects/PermissionId';

export interface IUserPermissionRepository {
  assignPermission(userId: UserId, permissionId: PermissionId): Promise<void>;
  revokePermission(userId: UserId, permissionId: PermissionId): Promise<void>;
  getUserPermissions(userId: UserId): Promise<PermissionId[]>;
  hasPermission(userId: UserId, permissionId: PermissionId): Promise<boolean>;
}
