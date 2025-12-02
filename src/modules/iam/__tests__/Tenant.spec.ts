import { Tenant } from '../domain/aggregates/Tenant';
import { TenantId } from '../domain/value-objects/TenantId';
import { WorkspaceId } from '../domain/value-objects/WorkspaceId';
import { TenantCreatedEvent } from '../domain/events/TenantCreated.event';
import { TenantUpdatedEvent } from '../domain/events/TenantUpdated.event';
import { TenantDeletedEvent } from '../domain/events/TenantDeleted.event';

describe('Tenant Aggregate', () => {
  describe('create()', () => {
    it('should create a new Tenant with all parameters', () => {
      // Arrange
      const name = 'Acme Corporation';
      const code = 'acme';
      const workspaceId = WorkspaceId.create();
      const domain = 'acme.example.com';

      // Act
      const tenant = Tenant.create(name, code, workspaceId, domain);

      // Assert
      expect(tenant).toBeInstanceOf(Tenant);
      expect(tenant.getId()).toBeInstanceOf(TenantId);
      expect(tenant.getName()).toBe(name);
      expect(tenant.getCode()).toBe(code);
      expect(tenant.getWorkspaceId()).toBe(workspaceId);
      expect(tenant.getDomain()).toBe(domain);
      expect(tenant.getIsActive()).toBe(true);
      expect(tenant.getCreatedAt()).toBeInstanceOf(Date);
      expect(tenant.getUpdatedAt()).toBeInstanceOf(Date);
      expect(tenant.getDeletedAt()).toBeNull();
      expect(tenant.isDeleted()).toBe(false);
    });

    it('should create a Tenant without domain', () => {
      // Arrange
      const name = 'Test Corp';
      const code = 'test';
      const workspaceId = WorkspaceId.create();

      // Act
      const tenant = Tenant.create(name, code, workspaceId);

      // Assert
      expect(tenant.getName()).toBe(name);
      expect(tenant.getCode()).toBe(code);
      expect(tenant.getDomain()).toBeUndefined();
    });

    it('should emit TenantCreatedEvent when creating a tenant', () => {
      // Arrange
      const name = 'Event Test Tenant';
      const code = 'event-test';
      const workspaceId = WorkspaceId.create();

      // Act
      const tenant = Tenant.create(name, code, workspaceId);

      // Assert
      expect(tenant.domainEvents).toHaveLength(1);
      expect(tenant.domainEvents[0]).toBeInstanceOf(TenantCreatedEvent);
      const event = tenant.domainEvents[0] as TenantCreatedEvent;
      expect(event.tenantId).toBe(tenant.getId().getValue());
      expect(event.name).toBe(name);
      expect(event.code).toBe(code);
      expect(event.workspaceId).toBe(workspaceId.getValue());
    });

    it('should set timestamps correctly on creation', () => {
      // Arrange
      const name = 'Time Test';
      const code = 'time';
      const workspaceId = WorkspaceId.create();
      const beforeCreate = new Date();

      // Act
      const tenant = Tenant.create(name, code, workspaceId);
      const afterCreate = new Date();

      // Assert
      expect(tenant.getCreatedAt().getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(tenant.getCreatedAt().getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(tenant.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(tenant.getUpdatedAt().getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create tenant with isActive set to true by default', () => {
      // Arrange
      const name = 'Active Tenant';
      const code = 'active';
      const workspaceId = WorkspaceId.create();

      // Act
      const tenant = Tenant.create(name, code, workspaceId);

      // Assert
      expect(tenant.getIsActive()).toBe(true);
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a Tenant from persisted data', () => {
      // Arrange
      const id = TenantId.create();
      const name = 'Reconstituted Tenant';
      const code = 'recon';
      const workspaceId = WorkspaceId.create();
      const domain = 'recon.example.com';
      const isActive = true;
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');
      const deletedAt = null;

      // Act
      const tenant = Tenant.reconstitute(
        id,
        name,
        code,
        workspaceId,
        domain,
        isActive,
        createdAt,
        updatedAt,
        deletedAt,
      );

      // Assert
      expect(tenant).toBeInstanceOf(Tenant);
      expect(tenant.getId()).toBe(id);
      expect(tenant.getName()).toBe(name);
      expect(tenant.getCode()).toBe(code);
      expect(tenant.getWorkspaceId()).toBe(workspaceId);
      expect(tenant.getDomain()).toBe(domain);
      expect(tenant.getIsActive()).toBe(isActive);
      expect(tenant.getCreatedAt()).toBe(createdAt);
      expect(tenant.getUpdatedAt()).toBe(updatedAt);
      expect(tenant.getDeletedAt()).toBe(deletedAt);
    });

    it('should reconstitute with deletedAt timestamp', () => {
      // Arrange
      const id = TenantId.create();
      const name = 'Deleted Tenant';
      const code = 'deleted';
      const workspaceId = WorkspaceId.create();
      const deletedAt = new Date('2024-02-01');

      // Act
      const tenant = Tenant.reconstitute(
        id, name, code, workspaceId, undefined, false,
        new Date(), new Date(), deletedAt
      );

      // Assert
      expect(tenant.getDeletedAt()).toBe(deletedAt);
      expect(tenant.isDeleted()).toBe(true);
    });

    it('should not emit domain events when reconstituting', () => {
      // Arrange
      const id = TenantId.create();
      const name = 'No Events Tenant';
      const code = 'no-events';
      const workspaceId = WorkspaceId.create();

      // Act
      const tenant = Tenant.reconstitute(
        id, name, code, workspaceId, undefined, true,
        new Date(), new Date(), null
      );

      // Assert
      expect(tenant.domainEvents).toHaveLength(0);
    });
  });

  describe('update()', () => {
    it('should update tenant name', () => {
      // Arrange
      const tenant = Tenant.create('Old Name', 'code', WorkspaceId.create());
      const newName = 'New Name';

      // Act
      tenant.update(newName);

      // Assert
      expect(tenant.getName()).toBe(newName);
    });

    it('should update tenant domain', () => {
      // Arrange
      const tenant = Tenant.create('Tenant', 'code', WorkspaceId.create(), 'old.domain.com');
      const newDomain = 'new.domain.com';

      // Act
      tenant.update(undefined, newDomain);

      // Assert
      expect(tenant.getDomain()).toBe(newDomain);
    });

    it('should update both name and domain', () => {
      // Arrange
      const tenant = Tenant.create('Old Name', 'code', WorkspaceId.create(), 'old.domain.com');
      const newName = 'New Name';
      const newDomain = 'new.domain.com';

      // Act
      tenant.update(newName, newDomain);

      // Assert
      expect(tenant.getName()).toBe(newName);
      expect(tenant.getDomain()).toBe(newDomain);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const tenant = Tenant.create('Tenant', 'code', WorkspaceId.create());
      const oldUpdatedAt = tenant.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      tenant.update('New Name');

      // Assert
      expect(tenant.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should emit TenantUpdatedEvent', () => {
      // Arrange
      const tenant = Tenant.create('Original Name', 'code', WorkspaceId.create());
      tenant.clearEvents(); // Clear creation event
      const newName = 'Updated Name';

      // Act
      tenant.update(newName);

      // Assert
      expect(tenant.domainEvents).toHaveLength(1);
      expect(tenant.domainEvents[0]).toBeInstanceOf(TenantUpdatedEvent);
      const event = tenant.domainEvents[0] as TenantUpdatedEvent;
      expect(event.tenantId).toBe(tenant.getId().getValue());
      expect(event.name).toBe(newName);
    });

    it('should not change values if update parameters are undefined', () => {
      // Arrange
      const originalName = 'Original';
      const originalDomain = 'original.com';
      const tenant = Tenant.create(originalName, 'code', WorkspaceId.create(), originalDomain);

      // Act
      tenant.update();

      // Assert - name and domain should remain unchanged
      expect(tenant.getName()).toBe(originalName);
      expect(tenant.getDomain()).toBe(originalDomain);
    });
  });

  describe('activate()', () => {
    it('should activate an inactive tenant', () => {
      // Arrange
      const tenant = Tenant.create('Tenant', 'code', WorkspaceId.create());
      tenant.deactivate();
      expect(tenant.getIsActive()).toBe(false);

      // Act
      tenant.activate();

      // Assert
      expect(tenant.getIsActive()).toBe(true);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const tenant = Tenant.create('Tenant', 'code', WorkspaceId.create());
      tenant.deactivate();
      const oldUpdatedAt = tenant.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      tenant.activate();

      // Assert
      expect(tenant.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active tenant', () => {
      // Arrange
      const tenant = Tenant.create('Tenant', 'code', WorkspaceId.create());
      expect(tenant.getIsActive()).toBe(true);

      // Act
      tenant.deactivate();

      // Assert
      expect(tenant.getIsActive()).toBe(false);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const tenant = Tenant.create('Tenant', 'code', WorkspaceId.create());
      const oldUpdatedAt = tenant.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      tenant.deactivate();

      // Assert
      expect(tenant.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('delete()', () => {
    it('should soft delete the tenant by setting deletedAt', () => {
      // Arrange
      const tenant = Tenant.create('Tenant', 'code', WorkspaceId.create());
      expect(tenant.getDeletedAt()).toBeNull();
      expect(tenant.isDeleted()).toBe(false);
      const beforeDelete = new Date();

      // Act
      tenant.delete();
      const afterDelete = new Date();

      // Assert
      expect(tenant.getDeletedAt()).toBeInstanceOf(Date);
      expect(tenant.getDeletedAt().getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
      expect(tenant.getDeletedAt().getTime()).toBeLessThanOrEqual(afterDelete.getTime());
      expect(tenant.isDeleted()).toBe(true);
    });

    it('should emit TenantDeletedEvent', () => {
      // Arrange
      const tenant = Tenant.create('Tenant to Delete', 'code', WorkspaceId.create());
      tenant.clearEvents(); // Clear creation event

      // Act
      tenant.delete();

      // Assert
      expect(tenant.domainEvents).toHaveLength(1);
      expect(tenant.domainEvents[0]).toBeInstanceOf(TenantDeletedEvent);
      const event = tenant.domainEvents[0] as TenantDeletedEvent;
      expect(event.tenantId).toBe(tenant.getId().getValue());
      expect(event.name).toBe('Tenant to Delete');
    });
  });

  describe('Multi-tenancy validation', () => {
    it('should maintain workspace isolation', () => {
      // Arrange
      const workspaceId1 = WorkspaceId.create();
      const workspaceId2 = WorkspaceId.create();

      // Act
      const tenant1 = Tenant.create('Tenant 1', 'tenant1', workspaceId1);
      const tenant2 = Tenant.create('Tenant 2', 'tenant2', workspaceId2);

      // Assert - Tenants in different workspaces should have different workspace IDs
      expect(tenant1.getWorkspaceId().getValue()).not.toBe(tenant2.getWorkspaceId().getValue());
    });

    it('should preserve workspace assignment throughout lifecycle', () => {
      // Arrange
      const workspaceId = WorkspaceId.create();
      const tenant = Tenant.create('Tenant', 'code', workspaceId);
      const originalWorkspaceId = tenant.getWorkspaceId().getValue();

      // Act - Perform various operations
      tenant.update('New Name', 'new.domain.com');
      tenant.deactivate();
      tenant.activate();

      // Assert - Workspace ID should remain unchanged
      expect(tenant.getWorkspaceId().getValue()).toBe(originalWorkspaceId);
    });
  });

  describe('Getters', () => {
    it('should return correct values from all getters', () => {
      // Arrange
      const id = TenantId.create();
      const name = 'Test Tenant';
      const code = 'test';
      const workspaceId = WorkspaceId.create();
      const domain = 'test.com';
      const isActive = true;
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');
      const deletedAt = null;

      // Act
      const tenant = Tenant.reconstitute(
        id, name, code, workspaceId, domain, isActive, createdAt, updatedAt, deletedAt
      );

      // Assert
      expect(tenant.getId()).toBe(id);
      expect(tenant.getName()).toBe(name);
      expect(tenant.getCode()).toBe(code);
      expect(tenant.getWorkspaceId()).toBe(workspaceId);
      expect(tenant.getDomain()).toBe(domain);
      expect(tenant.getIsActive()).toBe(isActive);
      expect(tenant.getCreatedAt()).toBe(createdAt);
      expect(tenant.getUpdatedAt()).toBe(updatedAt);
      expect(tenant.getDeletedAt()).toBe(deletedAt);
      expect(tenant.isDeleted()).toBe(false);
    });
  });
});
