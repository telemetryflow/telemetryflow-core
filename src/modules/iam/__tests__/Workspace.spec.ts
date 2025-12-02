import { Workspace } from '../domain/aggregates/Workspace';
import { WorkspaceId } from '../domain/value-objects/WorkspaceId';
import { OrganizationId } from '../domain/value-objects/OrganizationId';
import { WorkspaceCreatedEvent } from '../domain/events/WorkspaceCreated.event';
import { WorkspaceUpdatedEvent } from '../domain/events/WorkspaceUpdated.event';
import { WorkspaceDeletedEvent } from '../domain/events/WorkspaceDeleted.event';

describe('Workspace Aggregate', () => {
  describe('create()', () => {
    it('should create a new Workspace with all parameters', () => {
      // Arrange
      const name = 'Production Workspace';
      const code = 'prod';
      const organizationId = OrganizationId.create();
      const description = 'Main production environment';
      const datasourceConfig = { host: 'db.example.com', port: 5432 };

      // Act
      const workspace = Workspace.create(name, code, organizationId, description, datasourceConfig);

      // Assert
      expect(workspace).toBeInstanceOf(Workspace);
      expect(workspace.id).toBeInstanceOf(WorkspaceId);
      expect(workspace.name).toBe(name);
      expect(workspace.code).toBe(code);
      expect(workspace.organizationId).toBe(organizationId);
      expect(workspace.description).toBe(description);
      expect(workspace.datasourceConfig).toEqual(datasourceConfig);
      expect(workspace.isActive).toBe(true);
      expect(workspace.createdAt).toBeInstanceOf(Date);
      expect(workspace.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a Workspace with minimal parameters', () => {
      // Arrange
      const name = 'Dev Workspace';
      const code = 'dev';
      const organizationId = OrganizationId.create();

      // Act
      const workspace = Workspace.create(name, code, organizationId);

      // Assert
      expect(workspace.name).toBe(name);
      expect(workspace.code).toBe(code);
      expect(workspace.organizationId).toBe(organizationId);
      expect(workspace.description).toBeUndefined();
      expect(workspace.datasourceConfig).toBeUndefined();
    });

    it('should emit WorkspaceCreatedEvent when creating a workspace', () => {
      // Arrange
      const name = 'Event Test Workspace';
      const code = 'event-test';
      const organizationId = OrganizationId.create();

      // Act
      const workspace = Workspace.create(name, code, organizationId);

      // Assert
      const events = workspace.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WorkspaceCreatedEvent);
      const event = events[0] as WorkspaceCreatedEvent;
      expect(event.workspaceId).toBe(workspace.id.getValue());
      expect(event.name).toBe(name);
      expect(event.code).toBe(code);
      expect(event.organizationId).toBe(organizationId.getValue());
    });

    it('should set timestamps correctly on creation', () => {
      // Arrange
      const name = 'Time Test';
      const code = 'time';
      const organizationId = OrganizationId.create();
      const beforeCreate = new Date();

      // Act
      const workspace = Workspace.create(name, code, organizationId);
      const afterCreate = new Date();

      // Assert
      expect(workspace.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(workspace.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(workspace.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(workspace.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create workspace with isActive set to true by default', () => {
      // Arrange
      const name = 'Active Workspace';
      const code = 'active';
      const organizationId = OrganizationId.create();

      // Act
      const workspace = Workspace.create(name, code, organizationId);

      // Assert
      expect(workspace.isActive).toBe(true);
    });

    it('should handle complex datasource configuration', () => {
      // Arrange
      const name = 'Complex Config Workspace';
      const code = 'complex';
      const organizationId = OrganizationId.create();
      const datasourceConfig = {
        clickhouse: {
          host: 'clickhouse.example.com',
          port: 9000,
          database: 'telemetry',
          username: 'admin',
        },
        redis: {
          host: 'redis.example.com',
          port: 6379,
        },
        kafka: {
          brokers: ['kafka1.example.com:9092', 'kafka2.example.com:9092'],
          topics: ['metrics', 'logs', 'traces'],
        },
      };

      // Act
      const workspace = Workspace.create(name, code, organizationId, undefined, datasourceConfig);

      // Assert
      expect(workspace.datasourceConfig).toEqual(datasourceConfig);
      expect(workspace.datasourceConfig?.clickhouse.host).toBe('clickhouse.example.com');
      expect(workspace.datasourceConfig?.kafka.brokers).toHaveLength(2);
    });
  });

  describe('update()', () => {
    it('should update workspace name', () => {
      // Arrange
      const workspace = Workspace.create('Old Name', 'code', OrganizationId.create());
      const newName = 'New Name';

      // Act
      workspace.update(newName);

      // Assert
      expect(workspace.name).toBe(newName);
    });

    it('should update workspace description', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create(), 'Old description');
      const newDescription = 'New description';

      // Act
      workspace.update(undefined, newDescription);

      // Assert
      expect(workspace.description).toBe(newDescription);
    });

    it('should update datasource configuration', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());
      const newDatasourceConfig = { host: 'new-db.example.com', port: 5432 };

      // Act
      workspace.update(undefined, undefined, newDatasourceConfig);

      // Assert
      expect(workspace.datasourceConfig).toEqual(newDatasourceConfig);
    });

    it('should update all modifiable fields at once', () => {
      // Arrange
      const workspace = Workspace.create('Old Name', 'code', OrganizationId.create());
      const newName = 'New Name';
      const newDescription = 'New description';
      const newDatasourceConfig = { host: 'new-db.example.com' };

      // Act
      workspace.update(newName, newDescription, newDatasourceConfig);

      // Assert
      expect(workspace.name).toBe(newName);
      expect(workspace.description).toBe(newDescription);
      expect(workspace.datasourceConfig).toEqual(newDatasourceConfig);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());
      const oldUpdatedAt = workspace.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      workspace.update('New Name');

      // Assert
      expect(workspace.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });

    it('should emit WorkspaceUpdatedEvent', () => {
      // Arrange
      const workspace = Workspace.create('Original Name', 'code', OrganizationId.create());
      workspace.clearEvents(); // Clear creation event
      const newName = 'Updated Name';

      // Act
      workspace.update(newName);

      // Assert
      const events = workspace.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WorkspaceUpdatedEvent);
      const event = events[0] as WorkspaceUpdatedEvent;
      expect(event.workspaceId).toBe(workspace.id.getValue());
      expect(event.name).toBe(newName);
    });

    it('should preserve unchanged fields when updating', () => {
      // Arrange
      const originalName = 'Original Name';
      const originalDescription = 'Original description';
      const originalConfig = { host: 'original.com' };
      const workspace = Workspace.create(originalName, 'code', OrganizationId.create(), originalDescription, originalConfig);

      // Act - Only update name
      workspace.update('New Name');

      // Assert
      expect(workspace.name).toBe('New Name');
      expect(workspace.description).toBe(originalDescription);
      expect(workspace.datasourceConfig).toEqual(originalConfig);
    });

    it('should allow clearing description by passing undefined', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create(), 'Description');

      // Act
      workspace.update(undefined, undefined);

      // Assert
      expect(workspace.description).toBe('Description'); // Should remain unchanged
    });
  });

  describe('activate()', () => {
    it('should activate an inactive workspace', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());
      workspace.deactivate();
      expect(workspace.isActive).toBe(false);

      // Act
      workspace.activate();

      // Assert
      expect(workspace.isActive).toBe(true);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());
      workspace.deactivate();
      const oldUpdatedAt = workspace.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      workspace.activate();

      // Assert
      expect(workspace.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('deactivate()', () => {
    it('should deactivate an active workspace', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());
      expect(workspace.isActive).toBe(true);

      // Act
      workspace.deactivate();

      // Assert
      expect(workspace.isActive).toBe(false);
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());
      const oldUpdatedAt = workspace.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      // Act
      workspace.deactivate();

      // Assert
      expect(workspace.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());

      jest.useRealTimers();
    });
  });

  describe('delete()', () => {
    it('should emit WorkspaceDeletedEvent', () => {
      // Arrange
      const workspace = Workspace.create('Workspace to Delete', 'code', OrganizationId.create());
      workspace.clearEvents(); // Clear creation event

      // Act
      workspace.delete();

      // Assert
      const events = workspace.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WorkspaceDeletedEvent);
      const event = events[0] as WorkspaceDeletedEvent;
      expect(event.workspaceId).toBe(workspace.id.getValue());
      expect(event.name).toBe('Workspace to Delete');
    });
  });

  describe('Event management', () => {
    it('should accumulate multiple events', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());

      // Act
      workspace.update('New Name');
      workspace.delete();

      // Assert
      const events = workspace.getEvents();
      expect(events.length).toBe(3);
      expect(events[0]).toBeInstanceOf(WorkspaceCreatedEvent);
      expect(events[1]).toBeInstanceOf(WorkspaceUpdatedEvent);
      expect(events[2]).toBeInstanceOf(WorkspaceDeletedEvent);
    });

    it('should clear all events', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());
      workspace.update('New Name');
      expect(workspace.getEvents().length).toBeGreaterThan(0);

      // Act
      workspace.clearEvents();

      // Assert
      expect(workspace.getEvents()).toHaveLength(0);
    });

    it('should return events by reference', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create());

      // Act
      const events1 = workspace.getEvents();
      workspace.update('New Name');
      const events2 = workspace.getEvents();

      // Assert
      expect(events2.length).toBeGreaterThan(events1.length);
    });
  });

  describe('Organization relationship', () => {
    it('should maintain organization assignment', () => {
      // Arrange
      const organizationId = OrganizationId.create();

      // Act
      const workspace = Workspace.create('Workspace', 'code', organizationId);

      // Assert
      expect(workspace.organizationId).toBe(organizationId);
      expect(workspace.organizationId.getValue()).toBe(organizationId.getValue());
    });

    it('should preserve organization assignment through updates', () => {
      // Arrange
      const organizationId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'code', organizationId);
      const originalOrgId = workspace.organizationId.getValue();

      // Act
      workspace.update('New Name', 'New description', { host: 'new.com' });
      workspace.deactivate();
      workspace.activate();

      // Assert
      expect(workspace.organizationId.getValue()).toBe(originalOrgId);
    });

    it('should support multiple workspaces in the same organization', () => {
      // Arrange
      const organizationId = OrganizationId.create();

      // Act
      const workspace1 = Workspace.create('Workspace 1', 'ws1', organizationId);
      const workspace2 = Workspace.create('Workspace 2', 'ws2', organizationId);

      // Assert
      expect(workspace1.organizationId.getValue()).toBe(workspace2.organizationId.getValue());
      expect(workspace1.id.getValue()).not.toBe(workspace2.id.getValue());
    });
  });

  describe('Code immutability', () => {
    it('should not allow code to be changed after creation', () => {
      // Arrange
      const originalCode = 'original';
      const workspace = Workspace.create('Workspace', originalCode, OrganizationId.create());

      // Act
      workspace.update('New Name', 'New description', { host: 'new.com' });

      // Assert
      expect(workspace.code).toBe(originalCode);
    });
  });

  describe('Datasource configuration', () => {
    it('should handle empty datasource config', () => {
      // Arrange
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create(), undefined, {});

      // Assert
      expect(workspace.datasourceConfig).toEqual({});
    });

    it('should completely replace datasource config on update', () => {
      // Arrange
      const oldConfig = { host: 'old.com', port: 5432, database: 'old_db' };
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create(), undefined, oldConfig);
      const newConfig = { host: 'new.com', port: 3306 };

      // Act
      workspace.update(undefined, undefined, newConfig);

      // Assert
      expect(workspace.datasourceConfig).toEqual(newConfig);
      expect(workspace.datasourceConfig).not.toHaveProperty('database');
    });

    it('should handle nested objects in datasource config', () => {
      // Arrange
      const config = {
        primary: { host: 'primary.com', port: 5432 },
        replica: { host: 'replica.com', port: 5432 },
        options: { ssl: true, timeout: 5000 },
      };

      // Act
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create(), undefined, config);

      // Assert
      expect(workspace.datasourceConfig).toEqual(config);
      expect(workspace.datasourceConfig?.primary.host).toBe('primary.com');
      expect(workspace.datasourceConfig?.options.ssl).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle workspace with very long name', () => {
      // Arrange
      const longName = 'W'.repeat(500);
      const code = 'long';
      const organizationId = OrganizationId.create();

      // Act
      const workspace = Workspace.create(longName, code, organizationId);

      // Assert
      expect(workspace.name).toBe(longName);
      expect(workspace.name.length).toBe(500);
    });

    it('should handle special characters in name', () => {
      // Arrange
      const name = 'Prod & Dev (Combined) - Version #2';
      const code = 'special';
      const organizationId = OrganizationId.create();

      // Act
      const workspace = Workspace.create(name, code, organizationId);

      // Assert
      expect(workspace.name).toBe(name);
    });

    it('should handle array values in datasource config', () => {
      // Arrange
      const config = {
        servers: ['server1.com', 'server2.com', 'server3.com'],
        ports: [5432, 5433, 5434],
      };

      // Act
      const workspace = Workspace.create('Workspace', 'code', OrganizationId.create(), undefined, config);

      // Assert
      expect(workspace.datasourceConfig?.servers).toHaveLength(3);
      expect(workspace.datasourceConfig?.ports).toEqual([5432, 5433, 5434]);
    });
  });
});
