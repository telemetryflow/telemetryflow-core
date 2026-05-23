export enum UserRoleType {
  SUPER_ADMINISTRATOR = 'super_administrator',
  ADMINISTRATOR = 'administrator',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}

export class UserRole {
  private static readonly HIERARCHY: Record<UserRoleType, number> = {
    [UserRoleType.SUPER_ADMINISTRATOR]: 4,
    [UserRoleType.ADMINISTRATOR]: 3,
    [UserRoleType.DEVELOPER]: 2,
    [UserRoleType.VIEWER]: 1,
  };

  private constructor(private readonly value: UserRoleType) {}

  static create(role: UserRoleType): UserRole {
    return new UserRole(role);
  }

  static fromString(role: string): UserRole {
    const roleType = Object.values(UserRoleType).find(r => r === role);
    if (!roleType) {
      throw new Error(`Invalid role: ${role}`);
    }
    return new UserRole(roleType);
  }

  getValue(): UserRoleType {
    return this.value;
  }

  isSuperAdministrator(): boolean {
    return this.value === UserRoleType.SUPER_ADMINISTRATOR;
  }

  isAdministrator(): boolean {
    return this.value === UserRoleType.ADMINISTRATOR;
  }

  isDeveloper(): boolean {
    return this.value === UserRoleType.DEVELOPER;
  }

  isViewer(): boolean {
    return this.value === UserRoleType.VIEWER;
  }

  canManageAllPlatform(): boolean {
    return this.isSuperAdministrator();
  }

  canManageOrganization(): boolean {
    return this.isSuperAdministrator() || this.isAdministrator();
  }

  canCreate(): boolean {
    return !this.isViewer();
  }

  canUpdate(): boolean {
    return !this.isViewer();
  }

  canDelete(): boolean {
    return this.isSuperAdministrator() || this.isAdministrator();
  }

  canRead(): boolean {
    return true; // All roles can read
  }

  hasHigherOrEqualPrivilege(other: UserRole): boolean {
    return UserRole.HIERARCHY[this.value] >= UserRole.HIERARCHY[other.value];
  }

  toString(): string {
    return this.value;
  }
}
