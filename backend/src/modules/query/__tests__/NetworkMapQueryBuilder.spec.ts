import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NetworkMapQueryBuilder } from '../infrastructure/query-builders/postgres/NetworkMapQueryBuilder';
import { NetworkNodeEntity } from '@/modules/monitoring/network-map/infrastructure/persistence/entities/NetworkNode.entity';

describe('NetworkMapQueryBuilder', () => {
  let builder: NetworkMapQueryBuilder;
  let repository: Repository<NetworkNodeEntity>;

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
        NetworkMapQueryBuilder,
        {
          provide: getRepositoryToken(NetworkNodeEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    builder = module.get<NetworkMapQueryBuilder>(NetworkMapQueryBuilder);
    repository = module.get<Repository<NetworkNodeEntity>>(getRepositoryToken(NetworkNodeEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Methods', () => {
    it('should apply name filter', () => {
      const result = builder.name('node-1');
      expect(result).toBe(builder);
    });

    it('should apply type filter', () => {
      const result = builder.type('server');
      expect(result).toBe(builder);
    });

    it('should apply status filter', () => {
      const result = builder.status('active');
      expect(result).toBe(builder);
    });

    it('should apply ipAddress filter', () => {
      const result = builder.ipAddress('192.168.1.1');
      expect(result).toBe(builder);
    });

    it('should apply hostname filter', () => {
      const result = builder.hostname('server-01');
      expect(result).toBe(builder);
    });

    it('should apply cluster filter', () => {
      const result = builder.cluster('prod-cluster');
      expect(result).toBe(builder);
    });

    it('should apply namespace filter', () => {
      const result = builder.namespace('production');
      expect(result).toBe(builder);
    });

    it('should apply region filter', () => {
      const result = builder.region('us-east-1');
      expect(result).toBe(builder);
    });

    it('should apply multiple filters via applyFilter', () => {
      const result = builder.applyFilter({
        name: 'node-1',
        type: 'server',
        status: 'active',
        ipAddress: '192.168.1.1',
        cluster: 'prod-cluster',
        region: 'us-east-1',
        types: ['server', 'router'],
        statuses: ['active', 'inactive'],
      });
      expect(result).toBe(builder);
    });
  });

  describe('Build Method', () => {
    it('should build query with filters', () => {
      builder.name('node-1').type('server').status('active');
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
          name: 'node-1',
          type: 'server',
          status: 'active',
          ipAddress: '192.168.1.1',
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
        { status: 'active', count: '80' },
        { status: 'inactive', count: '15' },
        { status: 'degraded', count: '5' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByStatus();

      expect(result).toEqual({
        active: 80,
        inactive: 15,
        degraded: 5,
      });
    });

    it('should get count by type', async () => {
      const mockResult = [
        { type: 'server', count: '50' },
        { type: 'router', count: '30' },
        { type: 'switch', count: '20' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByType();

      expect(result).toEqual({
        server: 50,
        router: 30,
        switch: 20,
      });
    });

    it('should get count by cluster', async () => {
      const mockResult = [
        { cluster: 'prod-cluster', count: '60' },
        { cluster: 'staging-cluster', count: '25' },
        { cluster: 'dev-cluster', count: '15' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByCluster();

      expect(result).toEqual({
        'prod-cluster': 60,
        'staging-cluster': 25,
        'dev-cluster': 15,
      });
    });

    it('should get count by region', async () => {
      const mockResult = [
        { region: 'us-east-1', count: '45' },
        { region: 'us-west-2', count: '35' },
        { region: 'eu-west-1', count: '20' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByRegion();

      expect(result).toEqual({
        'us-east-1': 45,
        'us-west-2': 35,
        'eu-west-1': 20,
      });
    });

    it('should get total connections', async () => {
      const mockResult = { total: '500' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getTotalConnections();

      expect(result).toBe(500);
    });

    it('should handle null total connections', async () => {
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(null);

      const result = await builder.getTotalConnections();

      expect(result).toBe(0);
    });
  });

  describe('Fluent API Chaining', () => {
    it('should support method chaining', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      const result = await builder
        .name('test')
        .type('server')
        .status('active')
        .cluster('prod')
        .region('us-east-1')
        .limit(30)
        .execute();

      expect(result.data).toEqual(mockData);
    });
  });
});
