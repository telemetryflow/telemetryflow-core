import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from '../presentation/controllers/AuditLog.controller';
import { AuditService } from '../../audit/audit.service';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let auditService: AuditService;

  beforeEach(async () => {
    const mockAuditService = {
      query: jest.fn().mockResolvedValue([]),
      getById: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      getStatistics: jest.fn().mockResolvedValue({}),
      export: jest.fn().mockResolvedValue(''),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have auditService', () => {
    expect(auditService).toBeDefined();
  });

  describe('list', () => {
    it('should call auditService.query with correct parameters', async () => {
      await controller.list(10, 0, 'user-123', 'CREATE');
      
      expect(auditService.query).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        userId: 'user-123',
        action: 'CREATE',
      });
    });

    it('should use default values when parameters are not provided', async () => {
      await controller.list();
      
      expect(auditService.query).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        userId: undefined,
        action: undefined,
      });
    });
  });

  describe('get', () => {
    it('should call auditService.getById with correct id', async () => {
      const id = 'audit-123';
      await controller.get(id);
      
      expect(auditService.getById).toHaveBeenCalledWith(id);
    });
  });

  describe('count', () => {
    it('should call auditService.count', async () => {
      await controller.count();
      
      expect(auditService.count).toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should call auditService.getStatistics', async () => {
      await controller.statistics();
      
      expect(auditService.getStatistics).toHaveBeenCalled();
    });
  });

  describe('export', () => {
    it('should call auditService.export with correct format', async () => {
      const format = 'csv';
      await controller.export(format);
      
      expect(auditService.export).toHaveBeenCalledWith(format);
    });
  });
});
