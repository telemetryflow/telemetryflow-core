import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UptimeQueryBuilder } from '../infrastructure/query-builders/postgres/UptimeQueryBuilder';
import { MonitorEntity } from '@/modules/monitoring/uptime/infrastructure/persistence/entities/Monitor.entity';

describe('UptimeQueryBuilder', () => {
  let builder: UptimeQueryBuilder;
  let repository: Repository<MonitorEntity>;

  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue(null),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UptimeQueryBuilder,
        {
          provide: getRepositoryToken(MonitorEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    builder = module.get<UptimeQueryBuilder>(UptimeQueryBuilder);
    repository = module.get<Repository<MonitorEntity>>(getRepositoryToken(MonitorEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Methods', () => {
    it('should apply name filter', () => {
      const result = builder.name('api-monitor');
      expect(result).toBe(builder);
    });

    it('should apply type filter', () => {
      const result = builder.type('http');
      expect(result).toBe(builder);
    });

    it('should apply status filter', () => {
      const result = builder.status('up');
      expect(result).toBe(builder);
    });

    it('should apply url filter', () => {
      const result = builder.url('https://api.telemetryflow.id');
      expect(result).toBe(builder);
    });

    it('should apply host filter', () => {
      const result = builder.host('api.telemetryflow.id');
      expect(result).toBe(builder);
    });

    it('should apply isActive filter', () => {
      const result = builder.isActive(true);
      expect(result).toBe(builder);
    });

    it('should apply isPaused filter', () => {
      const result = builder.isPaused(false);
      expect(result).toBe(builder);
    });

    it('should apply groupId filter', () => {
      const result = builder.groupId('group-123');
      expect(result).toBe(builder);
    });

    it('should apply multiple filters via applyFilter', () => {
      const result = builder.applyFilter({
        name: 'api-monitor',
        type: 'http',
        status: 'up',
        url: 'https://api.telemetryflow.id',
        isActive: true,
        isPaused: false,
      });
      expect(result).toBe(builder);
    });

    it('should apply types array filter', () => {
      const result = builder.applyFilter({
        types: ['http', 'tcp', 'dns'],
      });
      expect(result).toBe(builder);
    });

    it('should apply statuses array filter', () => {
      const result = builder.applyFilter({
        statuses: ['up', 'down', 'degraded'],
      });
      expect(result).toBe(builder);
    });
  });

  describe('Build Method', () => {
    it('should build query with filters', () => {
      builder.name('api-monitor').type('http').status('up');
      const { sql, params } = builder.build();

      expect(sql).toBeDefined();
      expect(params).toBeDefined();
    });

    it('should build query with multiple filter types', () => {
      builder
        .name('test')
        .type('http')
        .isActive(true)
        .isPaused(false);

      const { sql, params } = builder.build();
      expect(sql).toBeDefined();
      expect(params).toBeDefined();
    });
  });

  describe('Execute Method', () => {
    it('should execute query and return results', async () => {
      const mockData = [
        {
          id: '1',
          name: 'monitor-1',
          type: 'http',
          status: 'up',
          url: 'https://api.telemetryflow.id',
        },
      ];

      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await builder.execute();

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([[], 0]);

      const result = await builder.execute();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('Aggregation Methods', () => {
    it('should get count by status', async () => {
      const mockResult = [
        { status: 'up', count: '45' },
        { status: 'down', count: '3' },
        { status: 'degraded', count: '2' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByStatus();

      expect(result).toEqual({
        up: 45,
        down: 3,
        degraded: 2,
      });
    });

    it('should get count by type', async () => {
      const mockResult = [
        { type: 'http', count: '30' },
        { type: 'tcp', count: '15' },
        { type: 'dns', count: '5' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByType();

      expect(result).toEqual({
        http: 30,
        tcp: 15,
        dns: 5,
      });
    });

    it('should get average uptime', async () => {
      const mockResult = { avg_uptime: '99.5' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getAverageUptime();

      expect(result).toBe(99.5);
    });

    it('should get average response time', async () => {
      const mockResult = { avg_response_time: '125.5' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getAverageResponseTime();

      expect(result).toBe(125.5);
    });

    it('should handle null average uptime', async () => {
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(null);

      const result = await builder.getAverageUptime();

      expect(result).toBe(0);
    });

    it('should handle null average response time', async () => {
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(null);

      const result = await builder.getAverageResponseTime();

      expect(result).toBe(0);
    });
  });

  describe('Fluent API Chaining', () => {
    it('should support method chaining', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      const result = await builder
        .name('test')
        .type('http')
        .status('up')
        .url('https://telemetryflow.id')
        .isActive(true)
        .limit(10)
        .offset(0)
        .execute();

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(0);
    });

    it('should support complex filter combinations', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      const result = await builder
        .applyFilter({
          name: 'api',
          types: ['http', 'tcp'],
          statuses: ['up', 'degraded'],
          isActive: true,
          isPaused: false,
        })
        .limit(50)
        .execute();

      expect(result.data).toEqual(mockData);
    });
  });

  describe('Pagination', () => {
    it('should apply limit', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      await builder.limit(25).execute();

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.take).toHaveBeenCalledWith(25);
    });

    it('should apply offset', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      await builder.offset(50).execute();

      const queryBuilder = mockRepository.createQueryBuilder();
      expect(queryBuilder.skip).toHaveBeenCalledWith(50);
    });
  });
});
