import { Organization } from '../domain/aggregates/Organization';
import { OrganizationId } from '../domain/value-objects/OrganizationId';
import { RegionId } from '../domain/value-objects/RegionId';
import { OrganizationCreatedEvent } from '../domain/events/OrganizationCreated.event';
import { OrganizationUpdatedEvent } from '../domain/events/OrganizationUpdated.event';
import { OrganizationDeletedEvent } from '../domain/events/OrganizationDeleted.event';

describe('Organization Aggregate', () => {
  describe('create()', () => {
    it('should create a new Organization with all parameters', () => {
      // Arrange
      const name = 'Acme Corporation';
      const code = 'ACME';
      const regionId = RegionId.create();
      const description = 'Leading tech company';
      const domain = 'acme.com';

      // Act
      const org = Organization.create(name, code, regionId, description, domain);

      // Assert
      expect(org).toBeInstanceOf(Organization);
      expect(org.id).toBeInstanceOf(OrganizationId);
      expect(org.name).toBe(name);
      expect(org.code).toBe(code);
      expect(org.regionId).toBe(regionId);
      expect(org.description).toBe(description);
      expect(org.domain).toBe(domain);
      expect(org.isActive).toBe(true);
    });

    it('should create an Organization with minimal parameters', () => {
      // Arrange
      const name = 'Minimal Corp';
      const code = 'MIN';
      const regionId = RegionId.create();

      // Act
      const org = Organization.create(name, code, regionId);

      // Assert
      expect(org.name).toBe(name);
      expect(org.code).toBe(code);
      expect(org.regionId).toBe(regionId);
      expect(org.description).toBeNull();
      expect(org.domain).toBeNull();
    });

    it('should emit OrganizationCreatedEvent when creating an organization', () => {
      // Arrange
      const name = 'Event Test Org';
      const code = 'EVENT';
      const regionId = RegionId.create();

      // Act
      const org = Organization.create(name, code, regionId);

      // Assert
      expect(org.domainEvents).toHaveLength(1);
      expect(org.domainEvents[0]).toBeInstanceOf(OrganizationCreatedEvent);
      const event = org.domainEvents[0] as OrganizationCreatedEvent;
      expect(event.organizationId).toBe(org.id.getValue());
      expect(event.name).toBe(name);
      expect(event.code).toBe(code);
      expect(event.regionId).toBe(regionId.getValue());
    });

    it('should set isActive to true by default', () => {
      // Arrange
      const name = 'Active Org';
      const code = 'ACTIVE';
      const regionId = RegionId.create();

      // Act
      const org = Organization.create(name, code, regionId);

      // Assert
      expect(org.isActive).toBe(true);
    });

    it('should convert empty strings to null for optional fields', () => {
      // Arrange
      const name = 'Test Org';
      const code = 'TEST';
      const regionId = RegionId.create();

      // Act
      const org = Organization.create(name, code, regionId, '', '');

      // Assert
      expect(org.description).toBeNull();
      expect(org.domain).toBeNull();
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute an Organization from persisted data', () => {
      // Arrange
      const id = OrganizationId.create();
      const name = 'Reconstituted Org';
      const code = 'RECON';
      const description = 'Test description';
      const domain = 'recon.example.com';
      const isActive = true;
      const regionId = RegionId.create();

      // Act
      const org = Organization.reconstitute(id, name, code, description, domain, isActive, regionId);

      // Assert
      expect(org).toBeInstanceOf(Organization);
      expect(org.id).toBe(id);
      expect(org.name).toBe(name);
      expect(org.code).toBe(code);
      expect(org.description).toBe(description);
      expect(org.domain).toBe(domain);
      expect(org.isActive).toBe(isActive);
      expect(org.regionId).toBe(regionId);
    });

    it('should reconstitute with null optional fields', () => {
      // Arrange
      const id = OrganizationId.create();
      const name = 'Minimal Org';
      const code = 'MIN';
      const regionId = RegionId.create();

      // Act
      const org = Organization.reconstitute(id, name, code, null, null, true, regionId);

      // Assert
      expect(org.description).toBeNull();
      expect(org.domain).toBeNull();
    });

    it('should not emit domain events when reconstituting', () => {
      // Arrange
      const id = OrganizationId.create();
      const name = 'No Events Org';
      const code = 'NO-EVENTS';
      const regionId = RegionId.create();

      // Act
      const org = Organization.reconstitute(id, name, code, null, null, true, regionId);

      // Assert
      expect(org.domainEvents).toHaveLength(0);
    });

    it('should reconstitute an inactive organization', () => {
      // Arrange
      const id = OrganizationId.create();
      const name = 'Inactive Org';
      const code = 'INACTIVE';
      const regionId = RegionId.create();

      // Act
      const org = Organization.reconstitute(id, name, code, null, null, false, regionId);

      // Assert
      expect(org.isActive).toBe(false);
    });
  });

  describe('update()', () => {
    it('should update organization name', () => {
      // Arrange
      const org = Organization.create('Old Name', 'CODE', RegionId.create());
      const newName = 'New Name';

      // Act
      org.update(newName);

      // Assert
      expect(org.name).toBe(newName);
    });

    it('should update organization description', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create(), 'Old description');
      const newDescription = 'New description';

      // Act
      org.update('Org', newDescription);

      // Assert
      expect(org.description).toBe(newDescription);
    });

    it('should update organization domain', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create(), '', 'old.com');
      const newDomain = 'new.com';

      // Act
      org.update('Org', undefined, newDomain);

      // Assert
      expect(org.domain).toBe(newDomain);
    });

    it('should update all modifiable fields', () => {
      // Arrange
      const org = Organization.create('Old Name', 'CODE', RegionId.create());
      const newName = 'New Name';
      const newDescription = 'New description';
      const newDomain = 'new.com';

      // Act
      org.update(newName, newDescription, newDomain);

      // Assert
      expect(org.name).toBe(newName);
      expect(org.description).toBe(newDescription);
      expect(org.domain).toBe(newDomain);
    });

    it('should emit OrganizationUpdatedEvent', () => {
      // Arrange
      const org = Organization.create('Original Name', 'CODE', RegionId.create());
      org.clearEvents(); // Clear creation event
      const newName = 'Updated Name';

      // Act
      org.update(newName);

      // Assert
      expect(org.domainEvents).toHaveLength(1);
      expect(org.domainEvents[0]).toBeInstanceOf(OrganizationUpdatedEvent);
      const event = org.domainEvents[0] as OrganizationUpdatedEvent;
      expect(event.organizationId).toBe(org.id.getValue());
      expect(event.name).toBe(newName);
    });

    it('should convert empty strings to null for optional fields', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create(), 'Description', 'domain.com');

      // Act
      org.update('Org', '', '');

      // Assert
      expect(org.description).toBeNull();
      expect(org.domain).toBeNull();
    });

    it('should preserve undefined optional fields', () => {
      // Arrange
      const originalDescription = 'Original description';
      const originalDomain = 'original.com';
      const org = Organization.create('Org', 'CODE', RegionId.create(), originalDescription, originalDomain);

      // Act
      org.update('New Name');

      // Assert
      expect(org.description).toBe(originalDescription);
      expect(org.domain).toBe(originalDomain);
    });
  });

  describe('activate()', () => {
    it('should activate an inactive organization', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create());
      org.deactivate();
      expect(org.isActive).toBe(false);

      // Act
      org.activate();

      // Assert
      expect(org.isActive).toBe(true);
    });

    it('should not change already active organization', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create());
      expect(org.isActive).toBe(true);

      // Act
      org.activate();

      // Assert
      expect(org.isActive).toBe(true);
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active organization', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create());
      expect(org.isActive).toBe(true);

      // Act
      org.deactivate();

      // Assert
      expect(org.isActive).toBe(false);
    });

    it('should not change already inactive organization', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create());
      org.deactivate();
      expect(org.isActive).toBe(false);

      // Act
      org.deactivate();

      // Assert
      expect(org.isActive).toBe(false);
    });
  });

  describe('delete()', () => {
    it('should emit OrganizationDeletedEvent', () => {
      // Arrange
      const org = Organization.create('Org to Delete', 'CODE', RegionId.create());
      org.clearEvents(); // Clear creation event

      // Act
      org.delete();

      // Assert
      expect(org.domainEvents).toHaveLength(1);
      expect(org.domainEvents[0]).toBeInstanceOf(OrganizationDeletedEvent);
      const event = org.domainEvents[0] as OrganizationDeletedEvent;
      expect(event.organizationId).toBe(org.id.getValue());
    });
  });

  describe('Region relationship', () => {
    it('should maintain region assignment', () => {
      // Arrange
      const regionId = RegionId.create();

      // Act
      const org = Organization.create('Org', 'CODE', regionId);

      // Assert
      expect(org.regionId).toBe(regionId);
      expect(org.regionId.getValue()).toBe(regionId.getValue());
    });

    it('should preserve region assignment through updates', () => {
      // Arrange
      const regionId = RegionId.create();
      const org = Organization.create('Org', 'CODE', regionId);
      const originalRegionId = org.regionId.getValue();

      // Act - Perform various operations
      org.update('New Name', 'New description', 'new.com');
      org.deactivate();
      org.activate();

      // Assert - Region should remain unchanged
      expect(org.regionId.getValue()).toBe(originalRegionId);
    });

    it('should support different organizations in the same region', () => {
      // Arrange
      const regionId = RegionId.create();

      // Act
      const org1 = Organization.create('Org 1', 'ORG1', regionId);
      const org2 = Organization.create('Org 2', 'ORG2', regionId);

      // Assert
      expect(org1.regionId.getValue()).toBe(org2.regionId.getValue());
      expect(org1.id.getValue()).not.toBe(org2.id.getValue());
    });
  });

  describe('Code immutability', () => {
    it('should not allow code to be changed after creation', () => {
      // Arrange
      const originalCode = 'ORIGINAL';
      const org = Organization.create('Org', originalCode, RegionId.create());

      // Act
      org.update('New Name', 'New description', 'new.com');

      // Assert - Code should remain unchanged
      expect(org.code).toBe(originalCode);
    });
  });

  describe('Domain events', () => {
    it('should accumulate multiple events', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create());

      // Act
      org.update('New Name');
      org.delete();

      // Assert - Should have create, update, and delete events
      expect(org.domainEvents.length).toBe(3);
      expect(org.domainEvents[0]).toBeInstanceOf(OrganizationCreatedEvent);
      expect(org.domainEvents[1]).toBeInstanceOf(OrganizationUpdatedEvent);
      expect(org.domainEvents[2]).toBeInstanceOf(OrganizationDeletedEvent);
    });

    it('should be clearable', () => {
      // Arrange
      const org = Organization.create('Org', 'CODE', RegionId.create());
      expect(org.domainEvents).toHaveLength(1);

      // Act
      org.clearEvents();

      // Assert
      expect(org.domainEvents).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle organization with very long name', () => {
      // Arrange
      const longName = 'A'.repeat(500);
      const code = 'LONG';
      const regionId = RegionId.create();

      // Act
      const org = Organization.create(longName, code, regionId);

      // Assert
      expect(org.name).toBe(longName);
      expect(org.name.length).toBe(500);
    });

    it('should handle special characters in name', () => {
      // Arrange
      const name = 'Org & Company (Ltd.) - Division #1';
      const code = 'SPECIAL';
      const regionId = RegionId.create();

      // Act
      const org = Organization.create(name, code, regionId);

      // Assert
      expect(org.name).toBe(name);
    });

    it('should handle domain with international characters', () => {
      // Arrange
      const name = 'International Org';
      const code = 'INTL';
      const regionId = RegionId.create();
      const domain = 'münchen.de';

      // Act
      const org = Organization.create(name, code, regionId, undefined, domain);

      // Assert
      expect(org.domain).toBe(domain);
    });
  });
});
