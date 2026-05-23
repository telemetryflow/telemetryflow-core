import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KubernetesQueryBuilder } from '../infrastructure/query-builders/postgres/KubernetesQueryBuilder';
import { KubernetesPodEntity } from '@/modules/monitoring/kubernetes/infrastructure/persistence/entities/KubernetesPod.entity';

describe('KubernetesQueryBuilder', () => {
  let builder: KubernetesQueryBuilder;
  let repository: Repository<KubernetesPodEntity>;

  const mockRepository = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
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
        KubernetesQueryBuilder,
        {
          provide: getRepositoryToken(KubernetesPodEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    builder = module.get<KubernetesQueryBuilder>(KubernetesQueryBuilder);
    repository = module.get<Repository<KubernetesPodEntity>>(getRepositoryToken(KubernetesPodEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Methods', () => {
    it('should apply clusterId filter', () => {
      const result = builder.clusterId('cluster-123');
      expect(result).toBe(builder);
    });

    it('should apply clusterName filter', () => {
      const result = builder.clusterName('prod-cluster');
      expect(result).toBe(builder);
    });

    it('should apply namespace filter', () => {
      const result = builder.namespace('production');
      expect(result).toBe(builder);
    });

    it('should apply podName filter', () => {
      const result = builder.podName('api-pod-1');
      expect(result).toBe(builder);
    });

    it('should apply phase filter', () => {
      const result = builder.phase('Running');
      expect(result).toBe(builder);
    });

    it('should apply nodeName filter', () => {
      const result = builder.nodeName('node-1');
      expect(result).toBe(builder);
    });

    it('should apply multiple filters via applyFilter', () => {
      const result = builder.applyFilter({
        clusterId: 'cluster-123',
        clusterName: 'prod-cluster',
        namespace: 'production',
        podName: 'api-pod',
        phase: 'Running',
        nodeName: 'node-1',
        phases: ['Running', 'Pending'],
      });
      expect(result).toBe(builder);
    });
  });

  describe('Build Method', () => {
    it('should build query with filters', () => {
      builder.clusterId('cluster-123').namespace('production').phase('Running');
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
          clusterId: 'cluster-123',
          namespace: 'production',
          name: 'api-pod-1',
          phase: 'Running',
        },
      ];

      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await builder.execute();

      expect(result.data).toBeDefined();
      expect(result.total).toBe(1);
    });
  });

  describe('Aggregation Methods', () => {
    it('should get count by phase', async () => {
      const mockResult = [
        { phase: 'Running', count: '120' },
        { phase: 'Pending', count: '5' },
        { phase: 'Failed', count: '2' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByPhase();

      expect(result).toEqual({
        Running: 120,
        Pending: 5,
        Failed: 2,
      });
    });

    it('should get count by namespace', async () => {
      const mockResult = [
        { namespace: 'production', count: '80' },
        { namespace: 'staging', count: '30' },
        { namespace: 'development', count: '17' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByNamespace();

      expect(result).toEqual({
        production: 80,
        staging: 30,
        development: 17,
      });
    });

    it('should get count by cluster', async () => {
      const mockResult = [
        { cluster_id: 'cluster-1', count: '100' },
        { cluster_id: 'cluster-2', count: '27' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByCluster();

      expect(result).toEqual({
        'cluster-1': 100,
        'cluster-2': 27,
      });
    });

    it('should get count by node', async () => {
      const mockResult = [
        { node_name: 'node-1', count: '45' },
        { node_name: 'node-2', count: '40' },
        { node_name: 'node-3', count: '42' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByNode();

      expect(result).toEqual({
        'node-1': 45,
        'node-2': 40,
        'node-3': 42,
      });
    });

    it('should get total restarts', async () => {
      const mockResult = { total: '45' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getTotalRestarts();

      expect(result).toBe(45);
    });

    it('should get pods with high restarts', async () => {
      const mockData = [
        {
          id: '1',
          name: 'problematic-pod-1',
          restartCount: 15,
        },
        {
          id: '2',
          name: 'problematic-pod-2',
          restartCount: 10,
        },
      ];

      mockRepository.createQueryBuilder().getMany.mockResolvedValue(mockData);

      const result = await builder.getPodsWithHighRestarts(5);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });

    it('should handle null total restarts', async () => {
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(null);

      const result = await builder.getTotalRestarts();

      expect(result).toBe(0);
    });
  });

  describe('Fluent API Chaining', () => {
    it('should support method chaining', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      const result = await builder
        .clusterId('cluster-123')
        .namespace('production')
        .phase('Running')
        .nodeName('node-1')
        .limit(50)
        .execute();

      expect(result.data).toEqual(mockData);
    });
  });
});
