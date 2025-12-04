import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from '../presentation/controllers/AuditLog.controller';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let auditService: any;

  beforeEach(async () => {
    const mockAuditService = {
      findAll: jest.fn().mockResolvedValue([]),
      findByEntity: jest.fn().mockResolvedValue([]),
      findByUser: jest.fn().mockResolvedValue([]),
      findByAction: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: 'AuditService',
          useValue: mockAuditService,
        },
      ],
    })
      .overrideProvider('AuditService')
      .useValue(mockAuditService)
      .compile();

    controller = module.get<AuditLogController>(AuditLogController);
    auditService = mockAuditService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have auditService', () => {
    expect(auditService).toBeDefined();
  });
});
