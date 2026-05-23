import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { StatsAggregationService } from '../application/services/StatsAggregationService';
import { QueryBuilderService } from '../application/services/QueryBuilderService';
import { TenantContext } from '../domain/value-objects/TenantContext';
import { TimeRange } from '../domain/value-objects/TimeRange';

describe('StatsAggregationService', () => {
  let service: StatsAggregationService;
  let queryBuilderService: QueryBuilderService;
  let dataSource: DataSource;

  const mockQueryBuilderService = {
    metrics: jest.fn(() => ({
      tenantContext: jest.fn().mockReturnThis(),
      timeRange: jest.fn().mockReturnThis(),
      metricName: jest.fn().mockReturnThis(),
      serviceName: jest.fn().mockReturnThis(),
      aggregate: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ data: [{ total: 100 }] }),
    })),
    logs: jest.fn(() => ({
      tenantContext: jest.fn().mockReturnThis(),
      timeRange: jest.fn().mockReturnThis(),
      serviceName: jest.fn().mockReturnThis(),
      severityText: jest.fn().mockReturnThis(),
      aggregate: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ data: [{ total: 50 }] }),
    })),
    traces: jest.fn(() => ({
      tenantContext: jest.fn().mockReturnThis(),
      timeRange: jest.fn().mockReturnThis(),
      serviceName: jest.fn().mockReturnThis(),
      hasError: jest.fn().mockReturnThis(),
      aggregate: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ data: [{ total: 75 }] }),
    })),
  };

  const mockDataSource = {
    query: jest.fn().mockResolvedValue([{ total: '10' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsAggregationService,
        {
          provide: QueryBuilderService,
          useValue: mockQueryBuilderService,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StatsAggregationService>(StatsAggregationService);
    queryBuilderService = module.get<QueryBuilderService>(QueryBuilderService);
    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getModuleStats', () => {
    const tenantContext = TenantContext.create({
      organizationId: 'org-123',
      workspaceId: 'ws-456',
    });
    const timeRange = TimeRange.lastHours(24);

    it('should get agent statistics', async () => {
      const result = await service.getModuleStats({
        moduleType: 'agents',
        tenantContext,
        timeRange,
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.timeRange).toBeDefined();
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should get uptime statistics', async () => {
      const result = await service.getModuleStats({
        moduleType: 'uptime',
        tenantContext,
        timeRange,
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.customMetrics).toBeDefined();
    });

    it('should get status page statistics', async () => {
      const result = await service.getModuleStats({
        moduleType: 'status-page',
        tenantContext,
        timeRange,
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.customMetrics).toBeDefined();
    });

    it('should get service map statistics', async () => {
      const result = await service.getModuleStats({
        moduleType: 'service-map',
        tenantContext,
        timeRange,
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.byStatus).toBeDefined();
    });

    it('should get network map statistics', async () => {
      const result = await service.getModuleStats({
        moduleType: 'network-map',
        tenantContext,
        timeRange,
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.byStatus).toBeDefined();
    });

    it('should get kubernetes statistics', async () => {
      const result = await service.getModuleStats({
        moduleType: 'kubernetes',
        tenantContext,
        timeRange,
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.customMetrics).toBeDefined();
    });

    it('should get VM statistics', async () => {
      const result = await service.getModuleStats({
        moduleType: 'vm',
        tenantContext,
        timeRange,
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.byStatus).toBeDefined();
    });

    it('should include trend comparison when requested', async () => {
      const result = await service.getModuleStats({
        moduleType: 'agents',
        tenantContext,
        timeRange,
        compareWithPrevious: true,
      });

      expect(result.totalTrend).toBeDefined();
    });

    it('should throw error for unsupported module type', async () => {
      await expect(
        service.getModuleStats({
          moduleType: 'invalid' as any,
          tenantContext,
          timeRange,
        }),
      ).rejects.toThrow('Unsupported module type');
    });
  });

  describe('getSignalStats', () => {
    const tenantContext = TenantContext.create({
      organizationId: 'org-123',
    });
    const timeRange = TimeRange.lastHours(1);

    it('should get metrics statistics', async () => {
      const result = await service.getSignalStats({
        signalType: 'metrics',
        tenantContext,
        timeRange,
        metricName: 'http_requests_total',
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBe(100);
      expect(mockQueryBuilderService.metrics).toHaveBeenCalled();
    });

    it('should get logs statistics', async () => {
      const result = await service.getSignalStats({
        signalType: 'logs',
        tenantContext,
        timeRange,
        serviceName: 'api-service',
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBe(50);
      expect(mockQueryBuilderService.logs).toHaveBeenCalled();
    });

    it('should get traces statistics', async () => {
      const result = await service.getSignalStats({
        signalType: 'traces',
        tenantContext,
        timeRange,
        serviceName: 'api-service',
        compareWithPrevious: false,
      });

      expect(result).toBeDefined();
      expect(result.total).toBe(75);
      expect(mockQueryBuilderService.traces).toHaveBeenCalled();
    });

    it('should throw error for unsupported signal type', async () => {
      await expect(
        service.getSignalStats({
          signalType: 'invalid' as any,
          tenantContext,
          timeRange,
        }),
      ).rejects.toThrow('Unsupported signal type');
    });
  });

  describe('Tenant Isolation', () => {
    it('should include organization_id in query', async () => {
      const tenantContext = TenantContext.create({
        organizationId: 'org-123',
      });
      const timeRange = TimeRange.lastHours(24);

      await service.getModuleStats({
        moduleType: 'agents',
        tenantContext,
        timeRange,
      });

      const queryCall = mockDataSource.query.mock.calls[0];
      expect(queryCall[0]).toContain('organization_id');
      expect(queryCall[1]).toContain('org-123');
    });

    it('should include workspace_id when provided', async () => {
      const tenantContext = TenantContext.create({
        organizationId: 'org-123',
        workspaceId: 'ws-456',
      });
      const timeRange = TimeRange.lastHours(24);

      await service.getModuleStats({
        moduleType: 'agents',
        tenantContext,
        timeRange,
      });

      const queryCall = mockDataSource.query.mock.calls[0];
      expect(queryCall[0]).toContain('workspace_id');
      expect(queryCall[1]).toContain('ws-456');
    });
  });

  describe('Time Range Filtering', () => {
    it('should apply time range to queries', async () => {
      const tenantContext = TenantContext.create({
        organizationId: 'org-123',
      });
      const timeRange = TimeRange.lastHours(24);

      await service.getModuleStats({
        moduleType: 'agents',
        tenantContext,
        timeRange,
      });

      const queryCall = mockDataSource.query.mock.calls[0];
      expect(queryCall[1]).toContain(timeRange.getFrom());
      expect(queryCall[1]).toContain(timeRange.getTo());
    });
  });
});
