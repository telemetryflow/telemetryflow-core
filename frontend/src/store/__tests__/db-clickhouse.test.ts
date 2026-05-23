import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { dbMonitoringClickhouseApi } from '@/api/db-monitoring-clickhouse';
import { useDbClickhouseStore } from '../db-monitoring-clickhouse';

vi.mock('@/api/db-monitoring-clickhouse', () => ({
  dbMonitoringClickhouseApi: {
    getInstances: vi.fn(),
    getInstanceById: vi.fn(),
    createInstance: vi.fn(),
    updateInstance: vi.fn(),
    deleteInstance: vi.fn(),
    getMetrics: vi.fn(),
    getQueries: vi.fn(),
    getQueryFingerprint: vi.fn(),
    getTables: vi.fn(),
    getTableParts: vi.fn(),
    getReplication: vi.fn(),
    getCluster: vi.fn(),
    getStorage: vi.fn(),
    getDictionaries: vi.fn(),
  },
}));

const mockedApi = vi.mocked(dbMonitoringClickhouseApi);

describe('useDbClickhouseStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // ─── Instance CRUD ────────────────────────────────────────────────────────────

  describe('fetchInstances', () => {
    it('should populate instances and pagination', async () => {
      mockedApi.getInstances.mockResolvedValue({
        instances: [
          { id: 'ch-1', name: 'prod', status: 'healthy' },
          { id: 'ch-2', name: 'staging', status: 'degraded' },
        ] as any,
        total: 2,
        page: 1,
        totalPages: 1,
      });

      const store = useDbClickhouseStore();
      await store.fetchInstances({ page: 1, limit: 20 });

      expect(store.instances).toHaveLength(2);
      expect(store.total).toBe(2);
      expect(store.currentPage).toBe(1);
      expect(store.loadingInstances).toBe(false);
    });

    it('should clear loading on error', async () => {
      mockedApi.getInstances.mockRejectedValue(new Error('fail'));

      const store = useDbClickhouseStore();
      await expect(store.fetchInstances()).rejects.toThrow('fail');
      expect(store.loadingInstances).toBe(false);
    });
  });

  describe('fetchInstanceById', () => {
    it('should set selectedInstance', async () => {
      mockedApi.getInstanceById.mockResolvedValue({ id: 'ch-1', name: 'prod' } as any);

      const store = useDbClickhouseStore();
      const result = await store.fetchInstanceById('ch-1');

      expect(store.selectedInstance?.id).toBe('ch-1');
      expect(result.id).toBe('ch-1');
    });
  });

  describe('createInstance', () => {
    it('should return new instance id', async () => {
      mockedApi.createInstance.mockResolvedValue({ id: 'ch-new' });

      const store = useDbClickhouseStore();
      const result = await store.createInstance({ name: 'new', host: 'h' });

      expect(result.id).toBe('ch-new');
      expect(store.submitting).toBe(false);
    });
  });

  describe('updateInstance', () => {
    it('should refresh selectedInstance if it matches', async () => {
      const store = useDbClickhouseStore();
      store.selectedInstance = { id: 'ch-1', name: 'old' } as any;

      mockedApi.updateInstance.mockResolvedValue({ id: 'ch-1' });
      mockedApi.getInstanceById.mockResolvedValue({ id: 'ch-1', name: 'updated' } as any);

      await store.updateInstance('ch-1', { name: 'updated' } as any);

      expect(mockedApi.getInstanceById).toHaveBeenCalledWith('ch-1');
      expect(store.selectedInstance?.name).toBe('updated');
    });

    it('should not refresh selectedInstance if different id', async () => {
      const store = useDbClickhouseStore();
      store.selectedInstance = { id: 'ch-2', name: 'other' } as any;

      mockedApi.updateInstance.mockResolvedValue({ id: 'ch-1' });

      await store.updateInstance('ch-1', { name: 'updated' } as any);

      expect(mockedApi.getInstanceById).not.toHaveBeenCalled();
    });
  });

  describe('deleteInstance', () => {
    it('should remove instance from list and clear selected', async () => {
      const store = useDbClickhouseStore();
      store.instances = [{ id: 'ch-1' }, { id: 'ch-2' }] as any;
      store.selectedInstance = { id: 'ch-1' } as any;

      mockedApi.deleteInstance.mockResolvedValue(undefined);
      await store.deleteInstance('ch-1');

      expect(store.instances).toHaveLength(1);
      expect(store.instances[0].id).toBe('ch-2');
      expect(store.selectedInstance).toBeNull();
    });

    it('should not clear selected if different id deleted', async () => {
      const store = useDbClickhouseStore();
      store.instances = [{ id: 'ch-1' }, { id: 'ch-2' }] as any;
      store.selectedInstance = { id: 'ch-2' } as any;

      mockedApi.deleteInstance.mockResolvedValue(undefined);
      await store.deleteInstance('ch-1');

      expect(store.selectedInstance?.id).toBe('ch-2');
    });
  });

  // ─── Data fetching ────────────────────────────────────────────────────────────

  describe('fetchMetrics', () => {
    it('should populate metrics ref', async () => {
      const mockResponse = { instance_id: 'ch-1', series: [] } as any;
      mockedApi.getMetrics.mockResolvedValue(mockResponse);

      const store = useDbClickhouseStore();
      const result = await store.fetchMetrics('ch-1', { from: '2025-01-01', to: '2025-01-02', step: '1m' });

      expect(store.metrics?.instance_id).toBe('ch-1');
      expect(result.series).toEqual([]);
      expect(store.loadingMetrics).toBe(false);
    });
  });

  describe('fetchQueries', () => {
    it('should populate queries ref', async () => {
      const mockResponse = { data: [], total: 0 } as any;
      mockedApi.getQueries.mockResolvedValue(mockResponse);

      const store = useDbClickhouseStore();
      await store.fetchQueries('ch-1');

      expect(store.queries?.total).toBe(0);
    });
  });

  describe('fetchTables', () => {
    it('should populate tables ref', async () => {
      mockedApi.getTables.mockResolvedValue({ tables: [{ table: 'events' }] } as any);

      const store = useDbClickhouseStore();
      await store.fetchTables('ch-1');

      expect(store.tables?.tables).toHaveLength(1);
    });
  });

  describe('fetchReplication', () => {
    it('should populate replication ref', async () => {
      mockedApi.getReplication.mockResolvedValue({ replicas: [] } as any);

      const store = useDbClickhouseStore();
      await store.fetchReplication('ch-1');

      expect(store.replication).toBeTruthy();
    });
  });

  describe('fetchCluster', () => {
    it('should populate cluster ref', async () => {
      mockedApi.getCluster.mockResolvedValue({ cluster_name: 'prod', shards: [] } as any);

      const store = useDbClickhouseStore();
      await store.fetchCluster('ch-1');

      expect(store.cluster?.cluster_name).toBe('prod');
    });
  });

  describe('fetchStorage', () => {
    it('should populate storage ref', async () => {
      mockedApi.getStorage.mockResolvedValue({ disks: [], policies: [] } as any);

      const store = useDbClickhouseStore();
      await store.fetchStorage('ch-1');

      expect(store.storage).toBeTruthy();
    });
  });

  describe('fetchDictionaries', () => {
    it('should populate dictionaries ref', async () => {
      mockedApi.getDictionaries.mockResolvedValue({ dictionaries: [] } as any);

      const store = useDbClickhouseStore();
      await store.fetchDictionaries('ch-1');

      expect(store.dictionaries).toBeTruthy();
    });
  });

  // ─── Computed properties ──────────────────────────────────────────────────────

  describe('status counts', () => {
    it('should compute healthy/degraded/unreachable counts', () => {
      const store = useDbClickhouseStore();
      store.instances = [
        { id: '1', status: 'healthy' },
        { id: '2', status: 'healthy' },
        { id: '3', status: 'degraded' },
        { id: '4', status: 'unreachable' },
      ] as any;

      expect(store.healthyCount).toBe(2);
      expect(store.degradedCount).toBe(1);
      expect(store.unreachableCount).toBe(1);
    });
  });

  // ─── Time range helpers ───────────────────────────────────────────────────────

  describe('setTimeRange', () => {
    it('should set step to 1m for short ranges', () => {
      const store = useDbClickhouseStore();
      store.setTimeRange('1h');
      expect(store.step).toBe('1m');

      store.setTimeRange('6h');
      expect(store.step).toBe('1m');
    });

    it('should set step to 1h for medium ranges', () => {
      const store = useDbClickhouseStore();
      store.setTimeRange('24h');
      expect(store.step).toBe('1h');

      store.setTimeRange('7d');
      expect(store.step).toBe('1h');
    });

    it('should set step to 1d for long ranges', () => {
      const store = useDbClickhouseStore();
      store.setTimeRange('30d');
      expect(store.step).toBe('1d');
    });
  });

  describe('getTimeRangeDates', () => {
    it('should return correct date range for 1h', () => {
      const store = useDbClickhouseStore();
      store.setTimeRange('1h');

      const { from, to } = store.getTimeRangeDates();
      const fromMs = new Date(from).getTime();
      const toMs = new Date(to).getTime();
      const diff = toMs - fromMs;

      expect(diff).toBeGreaterThanOrEqual(3599000);
      expect(diff).toBeLessThanOrEqual(3601000);
    });
  });

  // ─── Auto-refresh ─────────────────────────────────────────────────────────────

  describe('setRefreshInterval', () => {
    it('should set up interval and auto-refresh metrics', async () => {
      vi.useFakeTimers();

      const store = useDbClickhouseStore();
      store.selectedInstance = { id: 'ch-1' } as any;
      store.setTimeRange('1h');

      mockedApi.getMetrics.mockResolvedValue({ instance_id: 'ch-1', series: [] } as any);

      store.setRefreshInterval(5000);

      vi.advanceTimersByTime(5000);
      expect(mockedApi.getMetrics).toHaveBeenCalledTimes(1);

      store.setRefreshInterval(0);
      vi.advanceTimersByTime(10000);
      expect(mockedApi.getMetrics).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
