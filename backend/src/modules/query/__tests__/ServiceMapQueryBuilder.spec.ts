import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceMapQueryBuilder } from '../infrastructure/query-builders/postgres/ServiceMapQueryBuilder';
import { ServiceEntity } from '@/modules/monitoring/service-map/infrastructure/persistence/entities/Service.entity';

describe('ServiceMapQueryBuilder', () => {
  let builder: ServiceMapQueryBuilder;
  let repository: Repository<ServiceEntity>;

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
        ServiceMapQueryBuilder,
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    builder = module.get<ServiceMapQueryBuilder>(ServiceMapQueryBuilder);
    repository = module.get<Repository<ServiceEntity>>(getRepositoryToken(ServiceEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Methods', () => {
    it('should apply name filter', () => {
      const result = builder.name('api-service');
      expect(result).toBe(builder);
    });

    it('should apply type filter', () => {
      const result = builder.type('http');
      expect(result).toBe(builder);
    });

    it('should apply status filter', () => {
      const result = builder.status('healthy');
      expect(result).toBe(builder);
    });

    it('should apply namespace filter', () => {
      const result = builder.namespace('production');
      expect(result).toBe(builder);
    });

    it('should apply environment filter', () => {
      const result = builder.environment('prod');
      expect(result).toBe(builder);
    });

    it('should apply multiple filters via applyFilter', () => {
      const result = builder.applyFilter({
        name: 'api-service',
        type: 'http',
        status: 'healthy',
        namespace: 'production',
        environment: 'prod',
        types: ['http', 'grpc'],
        statuses: ['healthy', 'degraded'],
      });
      expect(result).toBe(builder);
    });
  });

  describe('Build Method', () => {
    it('should build query with filters', () => {
      builder.name('api-service').type('http').status('healthy');
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
          name: 'api-service',
          type: 'http',
          status: 'healthy',
          namespace: 'production',
        },
      ];

      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await builder.execute();

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
    });
  });

  describe('Aggregation Methods', () => {
    it('should get count by status', async () => {
      const mockResult = [
        { status: 'healthy', count: '50' },
        { status: 'degraded', count: '8' },
        { status: 'critical', count: '2' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByStatus();

      expect(result).toEqual({
        healthy: 50,
        degraded: 8,
        critical: 2,
      });
    });

    it('should get count by type', async () => {
      const mockResult = [
        { type: 'http', count: '30' },
        { type: 'grpc', count: '20' },
        { type: 'database', count: '10' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByType();

      expect(result).toEqual({
        http: 30,
        grpc: 20,
        database: 10,
      });
    });

    it('should get count by environment', async () => {
      const mockResult = [
        { environment: 'production', count: '40' },
        { environment: 'staging', count: '15' },
        { environment: 'development', count: '5' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByEnvironment();

      expect(result).toEqual({
        production: 40,
        staging: 15,
        development: 5,
      });
    });

    it('should get average health score', async () => {
      const mockResult = { avg_health: '95.5' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getAverageHealthScore();

      expect(result).toBe(95.5);
    });

    it('should get total dependencies', async () => {
      const mockResult = { total: '150' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getTotalDependencies();

      expect(result).toBe(150);
    });

    it('should handle null values', async () => {
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(null);

      const health = await builder.getAverageHealthScore();
      const deps = await builder.getTotalDependencies();

      expect(health).toBe(0);
      expect(deps).toBe(0);
    });
  });

  describe('Fluent API Chaining', () => {
    it('should support method chaining', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      const result = await builder
        .name('test')
        .type('http')
        .status('healthy')
        .namespace('prod')
        .environment('production')
        .limit(20)
        .execute();

      expect(result.data).toEqual(mockData);
    });
  });
});
