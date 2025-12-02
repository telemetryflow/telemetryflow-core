import { AggregateRoot } from '../../../../shared/domain/base/AggregateRoot';
import { RoleId } from '../value-objects/RoleId';
import { PermissionId } from '../value-objects/PermissionId';
import { TenantId } from '../value-objects/TenantId';
import { RoleCreatedEvent } from '../events/RoleCreated.event';
import { RoleUpdatedEvent } from '../events/RoleUpdated.event';
import { PermissionAssignedEvent } from '../events/PermissionAssigned.event';
import { PermissionRemovedEvent } from '../events/PermissionRemoved.event';

export class Role extends AggregateRoot<RoleId> {
  private constructor(
    id: RoleId,
    private name: string,
    private description: string,
    private permissions: PermissionId[],
    private tenantId: TenantId | null,
    private isSystem: boolean,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {
    super();
    this._id = id;
  }

  static create(
    name: string,
    description: string,
    permissions: PermissionId[] = [],
    tenantId: TenantId | null = null,
  ): Role {
    const role = new Role(
      RoleId.create(),
      name,
      description,
      permissions,
      tenantId,
      false,
      new Date(),
      new Date(),
      null,
    );
    role.addDomainEvent(new RoleCreatedEvent(role.id.getValue(), name));
    return role;
  }

  static reconstitute(
    id: RoleId,
    name: string,
    description: string,
    permissions: PermissionId[],
    tenantId: TenantId | null,
    isSystem: boolean,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Role {
    return new Role(id, name, description, permissions, tenantId, isSystem, createdAt, updatedAt, deletedAt);
  }

  update(name?: string, description?: string): void {
    if (this.isSystem) {
      throw new Error('Cannot update system role');
    }
    if (name) this.name = name;
    if (description) this.description = description;
    this.updatedAt = new Date();
    this.addDomainEvent(new RoleUpdatedEvent(this.id.getValue(), name, description));
  }

  addPermission(permissionId: PermissionId): void {
    if (this.hasPermission(permissionId)) {
      throw new Error('Permission already assigned to role');
    }
    this.permissions.push(permissionId);
    this.updatedAt = new Date();
    this.addDomainEvent(new PermissionAssignedEvent(this.id.getValue(), permissionId.getValue()));
  }

  removePermission(permissionId: PermissionId): void {
    if (!this.hasPermission(permissionId)) {
      throw new Error('Permission not assigned to role');
    }
    this.permissions = this.permissions.filter(p => !p.equals(permissionId));
    this.updatedAt = new Date();
    this.addDomainEvent(new PermissionRemovedEvent(this.id.getValue(), permissionId.getValue()));
  }

  hasPermission(permissionId: PermissionId): boolean {
    return this.permissions.some(p => p.equals(permissionId));
  }

  delete(): void {
    if (this.isSystem) {
      throw new Error('Cannot delete system role');
    }
    this.deletedAt = new Date();
  }

  // Getters
  getId(): RoleId { return this.id; }
  getName(): string { return this.name; }
  getDescription(): string { return this.description; }
  getPermissions(): PermissionId[] { return [...this.permissions]; }
  getTenantId(): TenantId | null { return this.tenantId; }
  getIsSystem(): boolean { return this.isSystem; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getDeletedAt(): Date | null { return this.deletedAt; }
  isDeleted(): boolean { return this.deletedAt !== null; }
}
