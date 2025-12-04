import { AggregateRoot } from '../../../../shared/domain/base/AggregateRoot';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { UserCreatedEvent } from '../events/UserCreated.event';

export class User extends AggregateRoot<UserId> {
  private constructor(
    id: UserId,
    private email: Email,
    private passwordHash: string,
    private firstName: string,
    private lastName: string,
    private mfaEnabled: boolean,
    private mfaSecret: string | null,
    private forcePasswordChange: boolean,
    private passwordChangedAt: Date | null,
    private isInitialPassword: boolean,
    private tenantId: string | null,
    private organizationId: string | null,
    private lastLoginAt: Date | null,
    private isActive: boolean,
    private emailVerified: boolean,
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null = null,
  ) {
    super();
    this._id = id;
  }

  static create(
    email: Email,
    passwordHash: string,
    firstName: string,
    lastName: string,
    tenantId: string | null = null,
    organizationId: string | null = null,
  ): User {
    const id = UserId.generate();
    const user = new User(
      id,
      email,
      passwordHash,
      firstName,
      lastName,
      false, // mfaEnabled
      null, // mfaSecret
      false, // forcePasswordChange
      null, // passwordChangedAt
      true, // isInitialPassword
      tenantId,
      organizationId,
      null, // lastLoginAt
      true, // isActive
      false, // emailVerified
      new Date(),
      new Date(),
      null,
    );
    user.addDomainEvent(new UserCreatedEvent(id.getValue(), email.getValue()));
    return user;
  }

  static reconstitute(
    id: UserId,
    email: Email,
    passwordHash: string,
    firstName: string,
    lastName: string,
    mfaEnabled: boolean,
    mfaSecret: string | null,
    forcePasswordChange: boolean,
    passwordChangedAt: Date | null,
    isInitialPassword: boolean,
    tenantId: string | null,
    organizationId: string | null,
    lastLoginAt: Date | null,
    isActive: boolean,
    emailVerified: boolean,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): User {
    return new User(
      id,
      email,
      passwordHash,
      firstName,
      lastName,
      mfaEnabled,
      mfaSecret,
      forcePasswordChange,
      passwordChangedAt,
      isInitialPassword,
      tenantId,
      organizationId,
      lastLoginAt,
      isActive,
      emailVerified,
      createdAt,
      updatedAt,
      deletedAt,
    );
  }

  changePassword(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash;
    this.passwordChangedAt = new Date();
    this.isInitialPassword = false;
    this.forcePasswordChange = false;
    this.updatedAt = new Date();
  }

  enableMFA(secret: string): void {
    this.mfaEnabled = true;
    this.mfaSecret = secret;
    this.updatedAt = new Date();
  }

  disableMFA(): void {
    this.mfaEnabled = false;
    this.mfaSecret = null;
    this.updatedAt = new Date();
  }

  updateLastLogin(): void {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  verifyEmail(): void {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  requirePasswordChange(): void {
    this.forcePasswordChange = true;
    this.updatedAt = new Date();
  }

  updateFirstName(firstName: string): void {
    if (!firstName || firstName.trim().length === 0) {
      throw new Error('First name cannot be empty');
    }
    this.firstName = firstName.trim();
    this.updatedAt = new Date();
  }

  updateLastName(lastName: string): void {
    if (!lastName || lastName.trim().length === 0) {
      throw new Error('Last name cannot be empty');
    }
    this.lastName = lastName.trim();
    this.updatedAt = new Date();
  }

  updateProfile(firstName?: string, lastName?: string): void {
    if (firstName) {
      this.updateFirstName(firstName);
    }
    if (lastName) {
      this.updateLastName(lastName);
    }
  }

  delete(): void {
    this.deletedAt = new Date();
  }

  // Getters
  getId(): UserId { return this.id; }
  getEmail(): Email { return this.email; }
  getPasswordHash(): string { return this.passwordHash; }
  getFirstName(): string { return this.firstName; }
  getLastName(): string { return this.lastName; }
  getMfaEnabled(): boolean { return this.mfaEnabled; }
  getMfaSecret(): string | null { return this.mfaSecret; }
  getForcePasswordChange(): boolean { return this.forcePasswordChange; }
  getPasswordChangedAt(): Date | null { return this.passwordChangedAt; }
  getIsInitialPassword(): boolean { return this.isInitialPassword; }
  getTenantId(): string | null { return this.tenantId; }
  getOrganizationId(): string | null { return this.organizationId; }
  getLastLoginAt(): Date | null { return this.lastLoginAt; }
  getIsActive(): boolean { return this.isActive; }
  getEmailVerified(): boolean { return this.emailVerified; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getDeletedAt(): Date | null { return this.deletedAt; }
  isDeleted(): boolean { return this.deletedAt !== null; }
}
