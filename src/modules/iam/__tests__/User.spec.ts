import { User } from '../domain/aggregates/User';
import { UserId } from '../domain/value-objects/UserId';
import { Email } from '../domain/value-objects/Email';
import { UserCreatedEvent } from '../domain/events/UserCreated.event';

describe('User Aggregate', () => {
  describe('create()', () => {
    it('should create a new User with valid parameters', () => {
      // Arrange
      const email = Email.create('john.doe@example.com');
      const passwordHash = 'hashed_password_123';
      const firstName = 'John';
      const lastName = 'Doe';
      const tenantId = 'tenant-123';
      const organizationId = 'org-456';

      // Act
      const user = User.create(email, passwordHash, firstName, lastName, tenantId, organizationId);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.getId()).toBeInstanceOf(UserId);
      expect(user.getEmail()).toBe(email);
      expect(user.getPasswordHash()).toBe(passwordHash);
      expect(user.getFirstName()).toBe(firstName);
      expect(user.getLastName()).toBe(lastName);
      expect(user.getTenantId()).toBe(tenantId);
      expect(user.getOrganizationId()).toBe(organizationId);
      expect(user.getMfaEnabled()).toBe(false);
      expect(user.getMfaSecret()).toBeNull();
      expect(user.getForcePasswordChange()).toBe(false);
      expect(user.getPasswordChangedAt()).toBeNull();
      expect(user.getIsInitialPassword()).toBe(true);
      expect(user.getLastLoginAt()).toBeNull();
      expect(user.getIsActive()).toBe(true);
      expect(user.getEmailVerified()).toBe(false);
      expect(user.getDeletedAt()).toBeNull();
      expect(user.isDeleted()).toBe(false);
    });

    it('should create a User without tenantId and organizationId', () => {
      // Arrange
      const email = Email.create('jane.doe@example.com');
      const passwordHash = 'hashed_password_456';
      const firstName = 'Jane';
      const lastName = 'Doe';

      // Act
      const user = User.create(email, passwordHash, firstName, lastName);

      // Assert
      expect(user.getTenantId()).toBeNull();
      expect(user.getOrganizationId()).toBeNull();
    });

    it('should emit UserCreatedEvent when creating a user', () => {
      // Arrange
      const email = Email.create('test@example.com');
      const passwordHash = 'hashed_password';
      const firstName = 'Test';
      const lastName = 'User';

      // Act
      const user = User.create(email, passwordHash, firstName, lastName);

      // Assert
      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0]).toBeInstanceOf(UserCreatedEvent);
      const event = user.domainEvents[0] as UserCreatedEvent;
      expect(event.userId).toBe(user.getId().getValue());
      expect(event.email).toBe(email.getValue());
    });

    it('should set timestamps correctly on creation', () => {
      // Arrange
      const email = Email.create('time@example.com');
      const passwordHash = 'hashed_password';
      const firstName = 'Time';
      const lastName = 'Test';
      const beforeCreate = new Date();

      // Act
      const user = User.create(email, passwordHash, firstName, lastName);
      const afterCreate = new Date();

      // Assert
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
      expect(user.getCreatedAt().getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.getCreatedAt().getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a User from persisted data', () => {
      // Arrange
      const id = UserId.generate();
      const email = Email.create('reconstitute@example.com');
      const passwordHash = 'hashed_password';
      const firstName = 'John';
      const lastName = 'Doe';
      const mfaEnabled = true;
      const mfaSecret = 'MFA_SECRET_123';
      const forcePasswordChange = false;
      const passwordChangedAt = new Date('2024-01-15');
      const isInitialPassword = false;
      const tenantId = 'tenant-789';
      const organizationId = 'org-012';
      const lastLoginAt = new Date('2024-01-20');
      const isActive = true;
      const emailVerified = true;
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');
      const deletedAt = null;

      // Act
      const user = User.reconstitute(
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

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.getId()).toBe(id);
      expect(user.getEmail()).toBe(email);
      expect(user.getPasswordHash()).toBe(passwordHash);
      expect(user.getFirstName()).toBe(firstName);
      expect(user.getLastName()).toBe(lastName);
      expect(user.getMfaEnabled()).toBe(mfaEnabled);
      expect(user.getMfaSecret()).toBe(mfaSecret);
      expect(user.getForcePasswordChange()).toBe(forcePasswordChange);
      expect(user.getPasswordChangedAt()).toBe(passwordChangedAt);
      expect(user.getIsInitialPassword()).toBe(isInitialPassword);
      expect(user.getTenantId()).toBe(tenantId);
      expect(user.getOrganizationId()).toBe(organizationId);
      expect(user.getLastLoginAt()).toBe(lastLoginAt);
      expect(user.getIsActive()).toBe(isActive);
      expect(user.getEmailVerified()).toBe(emailVerified);
      expect(user.getCreatedAt()).toBe(createdAt);
      expect(user.getUpdatedAt()).toBe(updatedAt);
      expect(user.getDeletedAt()).toBe(deletedAt);
    });

    it('should not emit domain events when reconstituting', () => {
      // Arrange
      const id = UserId.generate();
      const email = Email.create('no-events@example.com');
      const passwordHash = 'hashed_password';
      const firstName = 'John';
      const lastName = 'Doe';

      // Act
      const user = User.reconstitute(
        id, email, passwordHash, firstName, lastName,
        false, null, false, null, true, null, null, null,
        true, false, new Date(), new Date(), null
      );

      // Assert
      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('changePassword()', () => {
    it('should change password and update related flags', () => {
      // Arrange
      const email = Email.create('password@example.com');
      const oldPasswordHash = 'old_hashed_password';
      const user = User.create(email, oldPasswordHash, 'John', 'Doe');
      const newPasswordHash = 'new_hashed_password';
      const beforeChange = new Date();

      // Act
      user.changePassword(newPasswordHash);
      const afterChange = new Date();

      // Assert
      expect(user.getPasswordHash()).toBe(newPasswordHash);
      expect(user.getPasswordChangedAt()).toBeInstanceOf(Date);
      expect(user.getPasswordChangedAt().getTime()).toBeGreaterThanOrEqual(beforeChange.getTime());
      expect(user.getPasswordChangedAt().getTime()).toBeLessThanOrEqual(afterChange.getTime());
      expect(user.getIsInitialPassword()).toBe(false);
      expect(user.getForcePasswordChange()).toBe(false);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const email = Email.create('timestamp@example.com');
      const user = User.create(email, 'old_password', 'John', 'Doe');
      const oldUpdatedAt = user.getUpdatedAt();

      // Wait a bit to ensure timestamp difference
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      user.changePassword('new_password');

      // Assert
      expect(user.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should clear forcePasswordChange flag', () => {
      // Arrange
      const email = Email.create('force@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      user.requirePasswordChange();
      expect(user.getForcePasswordChange()).toBe(true);

      // Act
      user.changePassword('new_password');

      // Assert
      expect(user.getForcePasswordChange()).toBe(false);
    });
  });

  describe('enableMFA()', () => {
    it('should enable MFA with provided secret', () => {
      // Arrange
      const email = Email.create('mfa@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      const mfaSecret = 'MFA_SECRET_XYZ';

      // Act
      user.enableMFA(mfaSecret);

      // Assert
      expect(user.getMfaEnabled()).toBe(true);
      expect(user.getMfaSecret()).toBe(mfaSecret);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const email = Email.create('mfa-time@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      const oldUpdatedAt = user.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      user.enableMFA('SECRET');

      // Assert
      expect(user.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('disableMFA()', () => {
    it('should disable MFA and clear secret', () => {
      // Arrange
      const email = Email.create('disable-mfa@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      user.enableMFA('MFA_SECRET');
      expect(user.getMfaEnabled()).toBe(true);

      // Act
      user.disableMFA();

      // Assert
      expect(user.getMfaEnabled()).toBe(false);
      expect(user.getMfaSecret()).toBeNull();
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const email = Email.create('disable-mfa-time@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      user.enableMFA('SECRET');
      const oldUpdatedAt = user.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      user.disableMFA();

      // Assert
      expect(user.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('updateLastLogin()', () => {
    it('should update lastLoginAt timestamp', () => {
      // Arrange
      const email = Email.create('login@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      expect(user.getLastLoginAt()).toBeNull();
      const beforeLogin = new Date();

      // Act
      user.updateLastLogin();
      const afterLogin = new Date();

      // Assert
      expect(user.getLastLoginAt()).toBeInstanceOf(Date);
      expect(user.getLastLoginAt().getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
      expect(user.getLastLoginAt().getTime()).toBeLessThanOrEqual(afterLogin.getTime());
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const email = Email.create('login-time@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      const oldUpdatedAt = user.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      user.updateLastLogin();

      // Assert
      expect(user.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('activate()', () => {
    it('should activate an inactive user', () => {
      // Arrange
      const email = Email.create('activate@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      user.deactivate();
      expect(user.getIsActive()).toBe(false);

      // Act
      user.activate();

      // Assert
      expect(user.getIsActive()).toBe(true);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const email = Email.create('activate-time@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      user.deactivate();
      const oldUpdatedAt = user.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      user.activate();

      // Assert
      expect(user.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active user', () => {
      // Arrange
      const email = Email.create('deactivate@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      expect(user.getIsActive()).toBe(true);

      // Act
      user.deactivate();

      // Assert
      expect(user.getIsActive()).toBe(false);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const email = Email.create('deactivate-time@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      const oldUpdatedAt = user.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      user.deactivate();

      // Assert
      expect(user.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('verifyEmail()', () => {
    it('should mark email as verified', () => {
      // Arrange
      const email = Email.create('verify@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      expect(user.getEmailVerified()).toBe(false);

      // Act
      user.verifyEmail();

      // Assert
      expect(user.getEmailVerified()).toBe(true);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const email = Email.create('verify-time@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      const oldUpdatedAt = user.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      user.verifyEmail();

      // Assert
      expect(user.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('requirePasswordChange()', () => {
    it('should set forcePasswordChange flag to true', () => {
      // Arrange
      const email = Email.create('require@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      expect(user.getForcePasswordChange()).toBe(false);

      // Act
      user.requirePasswordChange();

      // Assert
      expect(user.getForcePasswordChange()).toBe(true);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const email = Email.create('require-time@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      const oldUpdatedAt = user.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      user.requirePasswordChange();

      // Assert
      expect(user.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('delete()', () => {
    it('should soft delete the user by setting deletedAt', () => {
      // Arrange
      const email = Email.create('delete@example.com');
      const user = User.create(email, 'password', 'John', 'Doe');
      expect(user.getDeletedAt()).toBeNull();
      expect(user.isDeleted()).toBe(false);
      const beforeDelete = new Date();

      // Act
      user.delete();
      const afterDelete = new Date();

      // Assert
      expect(user.getDeletedAt()).toBeInstanceOf(Date);
      expect(user.getDeletedAt().getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
      expect(user.getDeletedAt().getTime()).toBeLessThanOrEqual(afterDelete.getTime());
      expect(user.isDeleted()).toBe(true);
    });
  });

  describe('Getters', () => {
    it('should return correct values from all getters', () => {
      // Arrange
      const id = UserId.generate();
      const email = Email.create('getters@example.com');
      const passwordHash = 'hashed_password';
      const firstName = 'John';
      const lastName = 'Doe';
      const mfaEnabled = true;
      const mfaSecret = 'MFA_SECRET';
      const forcePasswordChange = true;
      const passwordChangedAt = new Date();
      const isInitialPassword = false;
      const tenantId = 'tenant-123';
      const organizationId = 'org-456';
      const lastLoginAt = new Date();
      const isActive = true;
      const emailVerified = true;
      const createdAt = new Date();
      const updatedAt = new Date();
      const deletedAt = new Date();

      // Act
      const user = User.reconstitute(
        id, email, passwordHash, firstName, lastName,
        mfaEnabled, mfaSecret, forcePasswordChange, passwordChangedAt, isInitialPassword,
        tenantId, organizationId, lastLoginAt, isActive, emailVerified,
        createdAt, updatedAt, deletedAt
      );

      // Assert
      expect(user.getId()).toBe(id);
      expect(user.getEmail()).toBe(email);
      expect(user.getPasswordHash()).toBe(passwordHash);
      expect(user.getFirstName()).toBe(firstName);
      expect(user.getLastName()).toBe(lastName);
      expect(user.getMfaEnabled()).toBe(mfaEnabled);
      expect(user.getMfaSecret()).toBe(mfaSecret);
      expect(user.getForcePasswordChange()).toBe(forcePasswordChange);
      expect(user.getPasswordChangedAt()).toBe(passwordChangedAt);
      expect(user.getIsInitialPassword()).toBe(isInitialPassword);
      expect(user.getTenantId()).toBe(tenantId);
      expect(user.getOrganizationId()).toBe(organizationId);
      expect(user.getLastLoginAt()).toBe(lastLoginAt);
      expect(user.getIsActive()).toBe(isActive);
      expect(user.getEmailVerified()).toBe(emailVerified);
      expect(user.getCreatedAt()).toBe(createdAt);
      expect(user.getUpdatedAt()).toBe(updatedAt);
      expect(user.getDeletedAt()).toBe(deletedAt);
      expect(user.isDeleted()).toBe(true);
    });
  });
});
