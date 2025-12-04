import { User } from '../../domain/aggregates/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { UserEntity } from './entities/User.entity';

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    const id = UserId.create(entity.id);
    const email = Email.create(entity.email);

    return User.reconstitute(
      id,
      email,
      entity.password,
      entity.firstName,
      entity.lastName,
      entity.mfa_enabled,
      entity.mfa_secret,
      entity.force_password_change,
      entity.passwordChangedAt,
      false, // isInitialPassword - would need to be tracked if important
      entity.tenant_id,
      entity.organization_id,
      entity.lastLoginAt,
      entity.isActive,
      entity.emailVerified,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.getId().value;
    entity.email = user.getEmail().value;
    entity.password = user.getPasswordHash();
    entity.firstName = user.getFirstName();
    entity.lastName = user.getLastName();
    entity.mfa_enabled = user.getMfaEnabled();
    entity.mfa_secret = user.getMfaSecret();
    entity.isActive = user.getIsActive();
    entity.emailVerified = user.getEmailVerified();
    entity.createdAt = user.getCreatedAt();
    entity.updatedAt = user.getUpdatedAt();
    entity.deletedAt = user.getDeletedAt();
    entity.tenant_id = user.getTenantId();
    entity.organization_id = user.getOrganizationId();
    entity.lastLoginAt = user.getLastLoginAt();
    entity.passwordChangedAt = user.getPasswordChangedAt();
    entity.force_password_change = user.getForcePasswordChange();
    return entity;
  }
}
