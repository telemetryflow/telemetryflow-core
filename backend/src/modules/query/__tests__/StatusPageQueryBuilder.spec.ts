import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusPageQueryBuilder } from '../infrastructure/query-builders/postgres/StatusPageQueryBuilder';
import { StatusPageEntity } from '@/modules/monitoring/status-page/infrastructure/persistence/entities/StatusPage.entity';

describe('StatusPageQueryBuilder', () => {
  let builder: StatusPageQueryBuilder;
  let repository: Repository<StatusPageEntity>;

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
        StatusPageQueryBuilder,
        {
          provide: getRepositoryToken(StatusPageEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    builder = module.get<StatusPageQueryBuilder>(StatusPageQueryBuilder);
    repository = module.get<Repository<StatusPageEntity>>(getRepositoryToken(StatusPageEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Methods', () => {
    it('should apply title filter', () => {
      const result = builder.title('API Status');
      expect(result).toBe(builder);
    });

    it('should apply slug filter', () => {
      const result = builder.slug('api-status');
      expect(result).toBe(builder);
    });

    it('should apply isPublic filter', () => {
      const result = builder.isPublic(true);
      expect(result).toBe(builder);
    });

    it('should apply multiple filters via applyFilter', () => {
      const result = builder.applyFilter({
        title: 'API Status',
        slug: 'api-status',
        isPublic: true,
      });
      expect(result).toBe(builder);
    });
  });

  describe('Build Method', () => {
    it('should build query with filters', () => {
      builder.title('API Status').isPublic(true);
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
          title: 'API Status',
          slug: 'api-status',
          isPublic: true,
        },
      ];

      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await builder.execute();

      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
    });
  });

  describe('Aggregation Methods', () => {
    it('should get count by visibility', async () => {
      const mockResult = [
        { is_public: true, count: '10' },
        { is_public: false, count: '5' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByVisibility();

      expect(result).toEqual({
        public: 10,
        private: 5,
      });
    });

    it('should get total active incidents', async () => {
      const mockResult = { total: '8' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getTotalActiveIncidents();

      expect(result).toBe(8);
    });

    it('should get total subscribers', async () => {
      const mockResult = { total: '1250' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getTotalSubscribers();

      expect(result).toBe(1250);
    });

    it('should handle null totals', async () => {
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(null);

      const incidents = await builder.getTotalActiveIncidents();
      const subscribers = await builder.getTotalSubscribers();

      expect(incidents).toBe(0);
      expect(subscribers).toBe(0);
    });
  });

  describe('Fluent API Chaining', () => {
    it('should support method chaining', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      const result = await builder
        .title('test')
        .slug('test-slug')
        .isPublic(true)
        .limit(10)
        .execute();

      expect(result.data).toEqual(mockData);
    });
  });
});
