import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dbMonitoringClickhouseApi } from '@/api/db-monitoring-clickhouse';

vi.mock('@/config', () => ({
  config: { useMock: true },
}));

vi.mock('@/api/iam', () => ({
  iamClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('dbMonitoringClickhouseApi (mock mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstances', () => {
    it('should return mock instances with pagination', async () => {
      const result = await dbMonitoringClickhouseApi.getInstances();

      expect(result.instances).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should include required instance fields', async () => {
      const result = await dbMonitoringClickhouseApi.getInstances();
      const inst = result.instances[0];

      expect(inst).toHaveProperty('id');
      expect(inst).toHaveProperty('name');
      expect(inst).toHaveProperty('host');
      expect(inst).toHaveProperty('httpPort');
      expect(inst).toHaveProperty('nativePort');
      expect(inst).toHaveProperty('status');
      expect(inst).toHaveProperty('organizationId');
    });
  });

  describe('getInstanceById', () => {
    it('should return matching instance by id', async () => {
      const inst = await dbMonitoringClickhouseApi.getInstanceById('ch-inst-001');
      expect(inst.id).toBe('ch-inst-001');
      expect(inst.name).toBe('clickhouse-analytics-prod');
    });

    it('should return first instance for unknown id', async () => {
      const inst = await dbMonitoringClickhouseApi.getInstanceById('nonexistent');
      expect(inst).toBeTruthy();
    });
  });

  describe('createInstance', () => {
    it('should return new id', async () => {
      const result = await dbMonitoringClickhouseApi.createInstance({
        name: 'test',
        host: 'localhost',
      });
      expect(result.id).toMatch(/^ch-new-/);
    });
  });

  describe('updateInstance', () => {
    it('should return same id', async () => {
      const result = await dbMonitoringClickhouseApi.updateInstance('ch-inst-001', {
        name: 'updated',
      });
      expect(result.id).toBe('ch-inst-001');
    });
  });

  describe('getMetrics', () => {
    it('should return time series with instance id override', async () => {
      const result = await dbMonitoringClickhouseApi.getMetrics('ch-inst-002');
      expect(result.instance_id).toBe('ch-inst-002');
      expect(result.series).toHaveLength(2);
      expect(result.series[0].data).toHaveLength(60);
    });
  });

  describe('getQueries', () => {
    it('should return query fingerprints', async () => {
      const result = await dbMonitoringClickhouseApi.getQueries('ch-inst-001');
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('query_fingerprint');
      expect(result.data[0]).toHaveProperty('query_kind');
      expect(result.data[0]).toHaveProperty('total_count');
      expect(result.data[0]).toHaveProperty('avg_duration_ms');
    });
  });

  describe('getQueryFingerprint', () => {
    it('should return fingerprint detail with stats', async () => {
      const result = await dbMonitoringClickhouseApi.getQueryFingerprint('ch-inst-001', 'SELECT * FROM events');
      expect(result.fingerprint).toBe('SELECT * FROM events');
      expect(result.sample_queries).toHaveLength(1);
      expect(result.stats).toHaveProperty('total_count');
    });
  });

  describe('getTables', () => {
    it('should return table health data', async () => {
      const result = await dbMonitoringClickhouseApi.getTables('ch-inst-001');
      expect(result.tables).toHaveLength(2);
      expect(result.tables[0]).toHaveProperty('database');
      expect(result.tables[0]).toHaveProperty('table');
      expect(result.tables[0]).toHaveProperty('engine');
      expect(result.tables[0]).toHaveProperty('health');
    });
  });

  describe('getReplication', () => {
    it('should return replica status', async () => {
      const result = await dbMonitoringClickhouseApi.getReplication('ch-inst-001');
      expect(result.replicas).toHaveLength(2);
      expect(result.replicas[0]).toHaveProperty('is_leader');
      expect(result.replicas[0]).toHaveProperty('absolute_delay');
    });
  });

  describe('getCluster', () => {
    it('should return cluster topology with shards', async () => {
      const result = await dbMonitoringClickhouseApi.getCluster('ch-inst-001');
      expect(result.cluster_name).toBe('production');
      expect(result.shards).toHaveLength(2);
      expect(result.shards[0].replicas).toHaveLength(2);
    });
  });

  describe('getStorage', () => {
    it('should return disk and policy data', async () => {
      const result = await dbMonitoringClickhouseApi.getStorage('ch-inst-001');
      expect(result.disks).toHaveLength(1);
      expect(result.disks[0]).toHaveProperty('used_percent');
      expect(result.policies).toHaveLength(1);
      expect(result.table_compression).toHaveLength(1);
    });
  });

  describe('getDictionaries', () => {
    it('should return dictionary info', async () => {
      const result = await dbMonitoringClickhouseApi.getDictionaries('ch-inst-001');
      expect(result.dictionaries).toHaveLength(1);
      expect(result.dictionaries[0]).toHaveProperty('status');
      expect(result.dictionaries[0]).toHaveProperty('type');
    });
  });
});
