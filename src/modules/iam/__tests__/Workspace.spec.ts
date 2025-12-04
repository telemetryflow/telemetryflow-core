import { Workspace } from '../domain/aggregates/Workspace';
import { OrganizationId } from '../domain/value-objects/OrganizationId';

describe('Workspace Aggregate', () => {
  describe('create', () => {
    it('should create a workspace with valid data', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Production', 'PROD', orgId);

      expect(workspace).toBeDefined();
      expect(workspace.name).toBe('Production');
      expect(workspace.code).toBe('PROD');
    });
  });

  describe('update', () => {
    it('should update workspace name', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Old Name', 'CODE', orgId);

      workspace.update('New Name');

      expect(workspace.name).toBe('New Name');
    });

    it('should update with description', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);

      workspace.update('New Name', 'New Description');

      expect(workspace.name).toBe('New Name');
      expect(workspace.description).toBe('New Description');
    });
  });

  describe('activate', () => {
    it('should activate an inactive workspace', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);
      workspace.deactivate();

      workspace.activate();

      expect(workspace.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active workspace', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);

      workspace.deactivate();

      expect(workspace.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should emit WorkspaceDeletedEvent', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);

      workspace.delete();

      const events = workspace.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Event management', () => {
    it('should clear events after commit', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);

      workspace.clearEvents();

      expect(workspace.getEvents()).toHaveLength(0);
    });

    it('should accumulate events', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);

      const events1 = workspace.getUncommittedEvents();
      workspace.update('New Name');
      const events2 = workspace.getUncommittedEvents();

      expect(events2.length).toBeGreaterThanOrEqual(events1.length);
    });
  });

  describe('Organization relationship', () => {
    it('should maintain organization assignment', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);

      expect(workspace.organizationId).toBe(orgId);
    });

    it('should preserve organization assignment through updates', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);

      workspace.update('New Name');

      expect(workspace.organizationId).toBe(orgId);
    });

    it('should support multiple workspaces in the same organization', () => {
      const orgId = OrganizationId.create();
      const workspace1 = Workspace.create('Workspace 1', 'WS1', orgId);
      const workspace2 = Workspace.create('Workspace 2', 'WS2', orgId);

      expect(workspace1.organizationId).toBe(orgId);
      expect(workspace2.organizationId).toBe(orgId);
    });
  });

  describe('Code immutability', () => {
    it('should not allow code to be changed after creation', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'ORIGINAL', orgId);

      workspace.update('New Name');

      expect(workspace.code).toBe('ORIGINAL');
    });
  });

  describe('Datasource configuration', () => {
    it('should handle empty datasource config', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);

      expect(workspace.datasourceConfig).toBeUndefined();
    });

    it('should completely replace datasource config on update', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);
      const config = { host: 'localhost', port: 5432 };

      workspace.update('Workspace', undefined, config);

      expect(workspace.datasourceConfig).toEqual(config);
    });

    it('should handle nested objects in datasource config', () => {
      const orgId = OrganizationId.create();
      const workspace = Workspace.create('Workspace', 'CODE', orgId);
      const config = { db: { host: 'localhost', credentials: { user: 'admin' } } };

      workspace.update('Workspace', undefined, config);

      expect(workspace.datasourceConfig).toEqual(config);
    });
  });
});
