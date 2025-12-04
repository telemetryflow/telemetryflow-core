import { Permission } from '../aggregates/Permission';
import { PermissionId } from '../value-objects/PermissionId';

export interface IPermissionRepository {
  save(permission: Permission): Promise<void>;
  findById(id: PermissionId): Promise<Permission | null>;
  findByName(name: string): Promise<Permission | null>;
  findAll(): Promise<Permission[]>;
  delete(id: PermissionId): Promise<void>;
}
