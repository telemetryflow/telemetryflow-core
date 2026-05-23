import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VMQueryBuilder } from '../infrastructure/query-builders/postgres/VMQueryBuilder';
import { VirtualMachineEntity } from '@/modules/monitoring/vm/infrastructure/persistence/entities/VirtualMachine.entity';

describe('VMQueryBuilder', () => {
  let builder: VMQueryBuilder;
  let repository: Repository<VirtualMachineEntity>;

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
        VMQueryBuilder,
        {
          provide: getRepositoryToken(VirtualMachineEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    builder = module.get<VMQueryBuilder>(VMQueryBuilder);
    repository = module.get<Repository<VirtualMachineEntity>>(getRepositoryToken(VirtualMachineEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Methods', () => {
    it('should apply name filter', () => {
      const result = builder.name('vm-1');
      expect(result).toBe(builder);
    });

    it('should apply hostname filter', () => {
      const result = builder.hostname('vm-host-1');
      expect(result).toBe(builder);
    });

    it('should apply provider filter', () => {
      const result = builder.provider('aws');
      expect(result).toBe(builder);
    });

    it('should apply status filter', () => {
      const result = builder.status('running');
      expect(result).toBe(builder);
    });

    it('should apply osType filter', () => {
      const result = builder.osType('linux');
      expect(result).toBe(builder);
    });

    it('should apply region filter', () => {
      const result = builder.region('us-east-1');
      expect(result).toBe(builder);
    });

    it('should apply instanceType filter', () => {
      const result = builder.instanceType('t3.medium');
      expect(result).toBe(builder);
    });

    it('should apply multiple filters via applyFilter', () => {
      const result = builder.applyFilter({
        name: 'vm-1',
        hostname: 'vm-host-1',
        provider: 'aws',
        status: 'running',
        osType: 'linux',
        region: 'us-east-1',
        instanceType: 't3.medium',
        providers: ['aws', 'azure', 'gcp'],
        statuses: ['running', 'stopped'],
        osTypes: ['linux', 'windows'],
      });
      expect(result).toBe(builder);
    });
  });

  describe('Build Method', () => {
    it('should build query with filters', () => {
      builder.name('vm-1').provider('aws').status('running');
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
          name: 'vm-1',
          provider: 'aws',
          status: 'running',
          region: 'us-east-1',
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
        { status: 'running', count: '75' },
        { status: 'stopped', count: '20' },
        { status: 'terminated', count: '5' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByStatus();

      expect(result).toEqual({
        running: 75,
        stopped: 20,
        terminated: 5,
      });
    });

    it('should get count by provider', async () => {
      const mockResult = [
        { provider: 'aws', count: '50' },
        { provider: 'azure', count: '30' },
        { provider: 'gcp', count: '20' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByProvider();

      expect(result).toEqual({
        aws: 50,
        azure: 30,
        gcp: 20,
      });
    });

    it('should get count by region', async () => {
      const mockResult = [
        { region: 'us-east-1', count: '40' },
        { region: 'us-west-2', count: '35' },
        { region: 'eu-west-1', count: '25' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByRegion();

      expect(result).toEqual({
        'us-east-1': 40,
        'us-west-2': 35,
        'eu-west-1': 25,
      });
    });

    it('should get count by OS type', async () => {
      const mockResult = [
        { os_type: 'linux', count: '70' },
        { os_type: 'windows', count: '30' },
      ];

      mockRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockResult);

      const result = await builder.getCountByOSType();

      expect(result).toEqual({
        linux: 70,
        windows: 30,
      });
    });

    it('should get total CPU cores', async () => {
      const mockResult = { total: '320' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getTotalCPUCores();

      expect(result).toBe(320);
    });

    it('should get total memory MB', async () => {
      const mockResult = { total: '819200' };

      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockResult);

      const result = await builder.getTotalMemoryMB();

      expect(result).toBe(819200);
    });

    it('should handle null totals', async () => {
      mockRepository.createQueryBuilder().getRawOne.mockResolvedValue(null);

      const cpu = await builder.getTotalCPUCores();
      const memory = await builder.getTotalMemoryMB();

      expect(cpu).toBe(0);
      expect(memory).toBe(0);
    });
  });

  describe('Fluent API Chaining', () => {
    it('should support method chaining', async () => {
      const mockData = [];
      mockRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, 0]);

      const result = await builder
        .name('test')
        .provider('aws')
        .status('running')
        .region('us-east-1')
        .osType('linux')
        .limit(40)
        .execute();

      expect(result.data).toEqual(mockData);
    });
  });
});
