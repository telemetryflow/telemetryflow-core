import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentsQueryBuilder } from '../infrastructure/query-builders/postgres/AgentsQueryBuilder';
import { AgentEntity } from '@/modules/monitoring/agent/infrastructure/persistence/entities/Agent.entity';

describe('AgentsQueryBuilder', () => {
  let builder: AgentsQueryBuilder;
  let repository: Repository<AgentEntity>;

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
        AgentsQueryBuilder,
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    builder = module.get<AgentsQueryBuilder>(AgentsQueryBuilder);
    repository = module.get<Repository<AgentEntity>>(getRepositoryToken(AgentEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Methods', () => {
    it('should apply name filter', () => {
      const result = builder.name('test-agent');
      expect(result).toBe(builder); // Fluent API
    });

    it('should apply type filter', () => {
      const result = builder.type('otel-collector');
      expect(result).toBe(builder);
    });

    it('should apply status filter', () => {
      const result = builder.status('active');
      expect(result).toBe(builder);
    });

    it('should apply host filter', () => {
      const result = builder.host('localhost');
      expect(result).toBe(builder);
    });

    it('should apply multiple filters via applyFilter', () => {
      const result = builder.applyFilter({
        name: 'test-agent',
        type: 'otel-collector',
        status: 'active',
        host: 'localhost',
      });
      expect(result).toBe(builder);
    });
  });

  describe('Build Method', () => {
    it('should build query with filters', () => {
      builder.name('test-agent').type('otel-collector');
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
          name: 'agent-1',
          type: 'otel-collector',
          status: 'active',
          host: 'localhost',
        },
      ];

      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await builder.execute();

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('Aggregation Methods', () => {
    it('should get count by status', async () => {
      const mockResult = [
        { status: 'active', count: '10' },
        { status: 'inactive', count: '5' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByStatus();

      expect(result).toEqual({
        active: 10,
        inactive: 5,
      });
    });

    it('should get count by type', async () => {
      const mockResult = [
        { type: 'otel-collector', count: '8' },
        { type: 'prometheus', count: '4' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByType();

      expect(result).toEqual({
        'otel-collector': 8,
        prometheus: 4,
      });
    });
  });

  describe('Fluent API Chaining', () => {
    it('should support method chaining', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      const result = await builder
        .name('test')
        .type('otel-collector')
        .status('active')
        .host('localhost')
        .limit(10)
        .offset(0)
        .execute();

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(0);
    });
  });
});
