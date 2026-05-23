import { Organization } from '../domain/aggregates/Organization';
import { RegionId } from '../domain/value-objects/RegionId';

describe('Organization Aggregate', () => {
  describe('create', () => {
    it('should create an organization with valid data', () => {
      const regionId = RegionId.create();
      const org = Organization.create('DevOpsCorner', 'DEVOPS', regionId);

      expect(org).toBeDefined();
      expect(org.name).toBe('DevOpsCorner');
      expect(org.code).toBe('DEVOPS');
    });
  });

  describe('update', () => {
    it('should update organization name', () => {
      const regionId = RegionId.create();
      const org = Organization.create('Old Name', 'CODE', regionId);

      org.update('New Name');

      expect(org.name).toBe('New Name');
    });

    it('should update with description and domain', () => {
      const regionId = RegionId.create();
      const org = Organization.create('Org', 'CODE', regionId);

      org.update('New Name', 'New Description', 'new.com');

      expect(org.name).toBe('New Name');
      expect(org.description).toBe('New Description');
      expect(org.domain).toBe('new.com');
    });
  });

  describe('activate', () => {
    it('should activate an inactive organization', () => {
      const regionId = RegionId.create();
      const org = Organization.create('Org', 'CODE', regionId);
      org.deactivate();

      org.activate();

      expect(org.isActive).toBe(true);
    });

    it('should not change already active organization', () => {
      const regionId = RegionId.create();
      const org = Organization.create('Org', 'CODE', regionId);

      org.activate();

      expect(org.isActive).toBe(true);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active organization', () => {
      const regionId = RegionId.create();
      const org = Organization.create('Org', 'CODE', regionId);

      org.deactivate();

      expect(org.isActive).toBe(false);
    });

    it('should not change already inactive organization', () => {
      const regionId = RegionId.create();
      const org = Organization.create('Org', 'CODE', regionId);
      org.deactivate();

      org.deactivate();

      expect(org.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should emit OrganizationDeletedEvent', () => {
      const regionId = RegionId.create();
      const org = Organization.create('Org', 'CODE', regionId);

      org.delete();

      const events = org.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Region relationship', () => {
    it('should maintain region assignment', () => {
      const regionId = RegionId.create();
      const org = Organization.create('Org', 'CODE', regionId);

      expect(org.regionId).toBe(regionId);
    });
  });
});
