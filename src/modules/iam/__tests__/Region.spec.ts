import { Region } from '../domain/aggregates/Region';
import { RegionId } from '../domain/value-objects/RegionId';
import { RegionCreatedEvent } from '../domain/events/RegionCreated.event';
import { RegionUpdatedEvent } from '../domain/events/RegionUpdated.event';

describe('Region Aggregate', () => {
  describe('create()', () => {
    it('should create a new Region with valid parameters', () => {
      // Arrange
      const name = 'US East';
      const code = 'us-east-1';
      const description = 'United States East Coast region';

      // Act
      const region = Region.create(name, code, description);

      // Assert
      expect(region).toBeInstanceOf(Region);
      expect(region.getId()).toBeInstanceOf(RegionId);
      expect(region.getName()).toBe(name);
      expect(region.getCode()).toBe(code);
      expect(region.getDescription()).toBe(description);
      expect(region.getIsActive()).toBe(true);
      expect(region.getCreatedAt()).toBeInstanceOf(Date);
      expect(region.getUpdatedAt()).toBeInstanceOf(Date);
      expect(region.getDeletedAt()).toBeNull();
      expect(region.isDeleted()).toBe(false);
    });

    it('should emit RegionCreatedEvent when creating a region', () => {
      // Arrange
      const name = 'EU West';
      const code = 'eu-west-1';
      const description = 'Europe West region';

      // Act
      const region = Region.create(name, code, description);

      // Assert
      expect(region.domainEvents).toHaveLength(1);
      expect(region.domainEvents[0]).toBeInstanceOf(RegionCreatedEvent);
      const event = region.domainEvents[0] as RegionCreatedEvent;
      expect(event.regionId).toBe(region.getId().getValue());
      expect(event.name).toBe(name);
      expect(event.code).toBe(code);
    });

    it('should set timestamps correctly on creation', () => {
      // Arrange
      const name = 'Asia Pacific';
      const code = 'ap-south-1';
      const description = 'Asia Pacific South region';
      const beforeCreate = new Date();

      // Act
      const region = Region.create(name, code, description);
      const afterCreate = new Date();

      // Assert
      expect(region.getCreatedAt().getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(region.getCreatedAt().getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(region.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(region.getUpdatedAt().getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create region with isActive set to true by default', () => {
      // Arrange
      const name = 'Active Region';
      const code = 'active-1';
      const description = 'Active region description';

      // Act
      const region = Region.create(name, code, description);

      // Assert
      expect(region.getIsActive()).toBe(true);
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a Region from persisted data', () => {
      // Arrange
      const id = RegionId.create();
      const name = 'Reconstituted Region';
      const code = 'recon-1';
      const description = 'Reconstituted description';
      const isActive = true;
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');
      const deletedAt = null;

      // Act
      const region = Region.reconstitute(
        id,
        name,
        code,
        description,
        isActive,
        createdAt,
        updatedAt,
        deletedAt,
      );

      // Assert
      expect(region).toBeInstanceOf(Region);
      expect(region.getId()).toBe(id);
      expect(region.getName()).toBe(name);
      expect(region.getCode()).toBe(code);
      expect(region.getDescription()).toBe(description);
      expect(region.getIsActive()).toBe(isActive);
      expect(region.getCreatedAt()).toBe(createdAt);
      expect(region.getUpdatedAt()).toBe(updatedAt);
      expect(region.getDeletedAt()).toBe(deletedAt);
    });

    it('should reconstitute with deletedAt timestamp', () => {
      // Arrange
      const id = RegionId.create();
      const name = 'Deleted Region';
      const code = 'deleted-1';
      const description = 'Deleted region';
      const deletedAt = new Date('2024-02-01');

      // Act
      const region = Region.reconstitute(
        id, name, code, description, false,
        new Date(), new Date(), deletedAt
      );

      // Assert
      expect(region.getDeletedAt()).toBe(deletedAt);
      expect(region.isDeleted()).toBe(true);
    });

    it('should not emit domain events when reconstituting', () => {
      // Arrange
      const id = RegionId.create();
      const name = 'No Events Region';
      const code = 'no-events-1';
      const description = 'Region without events';

      // Act
      const region = Region.reconstitute(
        id, name, code, description, true,
        new Date(), new Date(), null
      );

      // Assert
      expect(region.domainEvents).toHaveLength(0);
    });

    it('should reconstitute an inactive region', () => {
      // Arrange
      const id = RegionId.create();
      const name = 'Inactive Region';
      const code = 'inactive-1';
      const description = 'Inactive region';

      // Act
      const region = Region.reconstitute(
        id, name, code, description, false,
        new Date(), new Date(), null
      );

      // Assert
      expect(region.getIsActive()).toBe(false);
    });
  });

  describe('update()', () => {
    it('should update region name', () => {
      // Arrange
      const region = Region.create('Old Name', 'code', 'Description');
      const newName = 'New Name';

      // Act
      region.update(newName);

      // Assert
      expect(region.getName()).toBe(newName);
    });

    it('should update region description', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Old description');
      const newDescription = 'New description';

      // Act
      region.update(undefined, newDescription);

      // Assert
      expect(region.getDescription()).toBe(newDescription);
    });

    it('should update both name and description', () => {
      // Arrange
      const region = Region.create('Old Name', 'code', 'Old description');
      const newName = 'New Name';
      const newDescription = 'New description';

      // Act
      region.update(newName, newDescription);

      // Assert
      expect(region.getName()).toBe(newName);
      expect(region.getDescription()).toBe(newDescription);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      const oldUpdatedAt = region.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      region.update('New Name');

      // Assert
      expect(region.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should emit RegionUpdatedEvent', () => {
      // Arrange
      const region = Region.create('Original Name', 'code', 'Description');
      region.clearEvents(); // Clear creation event
      const newName = 'Updated Name';
      const newDescription = 'Updated description';

      // Act
      region.update(newName, newDescription);

      // Assert
      expect(region.domainEvents).toHaveLength(1);
      expect(region.domainEvents[0]).toBeInstanceOf(RegionUpdatedEvent);
      const event = region.domainEvents[0] as RegionUpdatedEvent;
      expect(event.regionId).toBe(region.getId().getValue());
      expect(event.name).toBe(newName);
      expect(event.description).toBe(newDescription);
    });

    it('should preserve unchanged fields when only updating name', () => {
      // Arrange
      const originalName = 'Original Name';
      const originalDescription = 'Original description';
      const region = Region.create(originalName, 'code', originalDescription);

      // Act
      region.update('New Name');

      // Assert
      expect(region.getName()).toBe('New Name');
      expect(region.getDescription()).toBe(originalDescription);
    });

    it('should preserve unchanged fields when only updating description', () => {
      // Arrange
      const originalName = 'Original Name';
      const originalDescription = 'Original description';
      const region = Region.create(originalName, 'code', originalDescription);

      // Act
      region.update(undefined, 'New description');

      // Assert
      expect(region.getName()).toBe(originalName);
      expect(region.getDescription()).toBe('New description');
    });

    it('should not change values if update parameters are undefined', () => {
      // Arrange
      const originalName = 'Original Name';
      const originalDescription = 'Original description';
      const region = Region.create(originalName, 'code', originalDescription);

      // Act
      region.update();

      // Assert
      expect(region.getName()).toBe(originalName);
      expect(region.getDescription()).toBe(originalDescription);
    });
  });

  describe('activate()', () => {
    it('should activate an inactive region', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      region.deactivate();
      expect(region.getIsActive()).toBe(false);

      // Act
      region.activate();

      // Assert
      expect(region.getIsActive()).toBe(true);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      region.deactivate();
      const oldUpdatedAt = region.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      region.activate();

      // Assert
      expect(region.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should not change already active region', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      expect(region.getIsActive()).toBe(true);

      // Act
      region.activate();

      // Assert
      expect(region.getIsActive()).toBe(true);
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active region', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      expect(region.getIsActive()).toBe(true);

      // Act
      region.deactivate();

      // Assert
      expect(region.getIsActive()).toBe(false);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      const oldUpdatedAt = region.getUpdatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      region.deactivate();

      // Assert
      expect(region.getUpdatedAt().getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should not change already inactive region', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      region.deactivate();
      expect(region.getIsActive()).toBe(false);

      // Act
      region.deactivate();

      // Assert
      expect(region.getIsActive()).toBe(false);
    });
  });

  describe('delete()', () => {
    it('should soft delete the region by setting deletedAt', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      expect(region.getDeletedAt()).toBeNull();
      expect(region.isDeleted()).toBe(false);
      const beforeDelete = new Date();

      // Act
      region.delete();
      const afterDelete = new Date();

      // Assert
      expect(region.getDeletedAt()).toBeInstanceOf(Date);
      expect(region.getDeletedAt().getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
      expect(region.getDeletedAt().getTime()).toBeLessThanOrEqual(afterDelete.getTime());
      expect(region.isDeleted()).toBe(true);
    });

    it('should not prevent multiple delete calls', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');

      // Act
      region.delete();
      const firstDeletedAt = region.getDeletedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      region.delete();
      const secondDeletedAt = region.getDeletedAt();

      // Assert
      expect(secondDeletedAt.getTime()).toBeGreaterThan(firstDeletedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('Code immutability', () => {
    it('should not allow code to be changed after creation', () => {
      // Arrange
      const originalCode = 'original-1';
      const region = Region.create('Name', originalCode, 'Description');

      // Act
      region.update('New Name', 'New description');

      // Assert
      expect(region.getCode()).toBe(originalCode);
    });

    it('should maintain code through activate/deactivate cycle', () => {
      // Arrange
      const originalCode = 'stable-1';
      const region = Region.create('Name', originalCode, 'Description');

      // Act
      region.deactivate();
      region.activate();
      region.deactivate();

      // Assert
      expect(region.getCode()).toBe(originalCode);
    });
  });

  describe('Timestamps', () => {
    it('should maintain createdAt timestamp through updates', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');
      const originalCreatedAt = region.getCreatedAt();

      jest.useFakeTimers();
      jest.advanceTimersByTime(5000);

      // Act
      region.update('New Name', 'New description');
      region.activate();
      region.deactivate();

      // Assert
      expect(region.getCreatedAt()).toBe(originalCreatedAt);

      jest.useRealTimers();
    });

    it('should update updatedAt on any state change', () => {
      // Arrange
      const region = Region.create('Name', 'code', 'Description');

      jest.useFakeTimers();

      // Get initial timestamp
      const time1 = region.getUpdatedAt().getTime();

      // Act & Assert - update()
      jest.advanceTimersByTime(1000);
      region.update('New Name');
      const time2 = region.getUpdatedAt().getTime();
      expect(time2).toBeGreaterThan(time1);

      // Act & Assert - activate()
      jest.advanceTimersByTime(1000);
      region.activate();
      const time3 = region.getUpdatedAt().getTime();
      expect(time3).toBeGreaterThan(time2);

      // Act & Assert - deactivate()
      jest.advanceTimersByTime(1000);
      region.deactivate();
      const time4 = region.getUpdatedAt().getTime();
      expect(time4).toBeGreaterThan(time3);

      jest.useRealTimers();
    });
  });

  describe('Edge cases', () => {
    it('should handle region with very long name', () => {
      // Arrange
      const longName = 'R'.repeat(500);
      const code = 'long-1';
      const description = 'Long name region';

      // Act
      const region = Region.create(longName, code, description);

      // Assert
      expect(region.getName()).toBe(longName);
      expect(region.getName().length).toBe(500);
    });

    it('should handle special characters in name', () => {
      // Arrange
      const name = 'US-East & West (Combined) - Region #1';
      const code = 'special-1';
      const description = 'Special characters region';

      // Act
      const region = Region.create(name, code, description);

      // Assert
      expect(region.getName()).toBe(name);
    });

    it('should handle international characters in description', () => {
      // Arrange
      const name = 'Europe Region';
      const code = 'eu-1';
      const description = 'Région d\'Europe avec caractères spéciaux: München, Zürich, Kraków';

      // Act
      const region = Region.create(name, code, description);

      // Assert
      expect(region.getDescription()).toBe(description);
    });

    it('should handle empty description', () => {
      // Arrange
      const name = 'Region';
      const code = 'empty-desc';
      const description = '';

      // Act
      const region = Region.create(name, code, description);

      // Assert
      expect(region.getDescription()).toBe('');
    });

    it('should handle multi-line description', () => {
      // Arrange
      const name = 'Multi-line Region';
      const code = 'multi-1';
      const description = 'Line 1\nLine 2\nLine 3';

      // Act
      const region = Region.create(name, code, description);

      // Assert
      expect(region.getDescription()).toBe(description);
      expect(region.getDescription().split('\n')).toHaveLength(3);
    });
  });

  describe('Getters', () => {
    it('should return correct values from all getters', () => {
      // Arrange
      const id = RegionId.create();
      const name = 'Test Region';
      const code = 'test-1';
      const description = 'Test description';
      const isActive = true;
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');
      const deletedAt = null;

      // Act
      const region = Region.reconstitute(
        id, name, code, description, isActive, createdAt, updatedAt, deletedAt
      );

      // Assert
      expect(region.getId()).toBe(id);
      expect(region.getName()).toBe(name);
      expect(region.getCode()).toBe(code);
      expect(region.getDescription()).toBe(description);
      expect(region.getIsActive()).toBe(isActive);
      expect(region.getCreatedAt()).toBe(createdAt);
      expect(region.getUpdatedAt()).toBe(updatedAt);
      expect(region.getDeletedAt()).toBe(deletedAt);
      expect(region.isDeleted()).toBe(false);
    });
  });
});
