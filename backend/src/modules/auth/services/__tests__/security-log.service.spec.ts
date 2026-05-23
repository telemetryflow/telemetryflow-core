import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SecurityLogService } from "../security-log.service";
import {
  SecurityLogEntity,
  SecurityEventType,
} from "../../infrastructure/persistence/entities/SecurityLog.entity";

describe("SecurityLogService", () => {
  let service: SecurityLogService;
  let repository: Repository<SecurityLogEntity>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityLogService,
        {
          provide: getRepositoryToken(SecurityLogEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityLogService>(SecurityLogService);
    repository = module.get<Repository<SecurityLogEntity>>(
      getRepositoryToken(SecurityLogEntity),
    );

    jest.clearAllMocks();
  });

  describe("logEvent", () => {
    it("should log a security event successfully", async () => {
      const mockLogEntry = {
        id: "test-id",
        user_id: "user-123",
        event_type: SecurityEventType.LOGIN_SUCCESS,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        success: true,
        error_message: null,
        metadata: { test: "data" },
        created_at: new Date(),
      };

      mockRepository.create.mockReturnValue(mockLogEntry);
      mockRepository.save.mockResolvedValue(mockLogEntry);

      const result = await service.logEvent({
        userId: "user-123",
        eventType: SecurityEventType.LOGIN_SUCCESS,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        success: true,
        metadata: { test: "data" },
      });

      expect(mockRepository.create).toHaveBeenCalledWith({
        user_id: "user-123",
        event_type: SecurityEventType.LOGIN_SUCCESS,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        success: true,
        error_message: null,
        metadata: { test: "data" },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockLogEntry);
      expect(result).toEqual(mockLogEntry);
    });
  });

  describe("logLoginSuccess", () => {
    it("should log successful login", async () => {
      const mockLogEntry = {
        id: "test-id",
        user_id: "user-123",
        event_type: SecurityEventType.LOGIN_SUCCESS,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        success: true,
        error_message: null,
        metadata: { deviceId: "device-123" },
        created_at: new Date(),
      };

      mockRepository.create.mockReturnValue(mockLogEntry);
      mockRepository.save.mockResolvedValue(mockLogEntry);

      await service.logLoginSuccess("user-123", "192.168.1.1", "Mozilla/5.0", {
        deviceId: "device-123",
      });

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("logLoginFailure", () => {
    it("should log failed login", async () => {
      const mockLogEntry = {
        id: "test-id",
        user_id: "user-123",
        event_type: SecurityEventType.LOGIN_FAILURE,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        success: false,
        error_message: "Invalid password",
        metadata: null,
        created_at: new Date(),
      };

      mockRepository.create.mockReturnValue(mockLogEntry);
      mockRepository.save.mockResolvedValue(mockLogEntry);

      await service.logLoginFailure(
        "user-123",
        "192.168.1.1",
        "Mozilla/5.0",
        "Invalid password",
      );

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("IP Blacklist", () => {
    it("should check if IP is blacklisted", () => {
      expect(service.isBlacklisted("192.0.2.1")).toBe(true);
      expect(service.isBlacklisted("192.168.1.1")).toBe(false);
    });

    it("should get blacklist entry", () => {
      const entry = service.getBlacklistEntry("192.0.2.1");
      expect(entry).toBeDefined();
      expect(entry?.ipAddress).toBe("192.0.2.1");
      expect(entry?.reason).toContain("TEST-NET-1");
    });

    it("should add IP to blacklist", () => {
      service.addToBlacklist("10.0.0.1", "Test reason");
      expect(service.isBlacklisted("10.0.0.1")).toBe(true);
    });

    it("should remove IP from blacklist", () => {
      service.addToBlacklist("10.0.0.2", "Test reason");
      expect(service.isBlacklisted("10.0.0.2")).toBe(true);

      const removed = service.removeFromBlacklist("10.0.0.2");
      expect(removed).toBe(true);
      expect(service.isBlacklisted("10.0.0.2")).toBe(false);
    });

    it("should return false when removing non-existent IP", () => {
      const removed = service.removeFromBlacklist("10.0.0.99");
      expect(removed).toBe(false);
    });

    it("should get all blacklisted IPs", () => {
      const blacklist = service.getBlacklistedIPs();
      expect(blacklist.length).toBeGreaterThan(0);
      expect(blacklist[0]).toHaveProperty("ipAddress");
      expect(blacklist[0]).toHaveProperty("reason");
      expect(blacklist[0]).toHaveProperty("addedAt");
    });
  });

  describe("logPasswordChange", () => {
    it("should log password change event", async () => {
      const mockLogEntry = {
        id: "test-id",
        user_id: "user-123",
        event_type: SecurityEventType.PASSWORD_CHANGE,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        success: true,
        error_message: null,
        metadata: { sessionsInvalidated: true },
        created_at: new Date(),
      };

      mockRepository.create.mockReturnValue(mockLogEntry);
      mockRepository.save.mockResolvedValue(mockLogEntry);

      await service.logPasswordChange(
        "user-123",
        "192.168.1.1",
        "Mozilla/5.0",
        { sessionsInvalidated: true },
      );

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("logPasswordReset", () => {
    it("should log password reset event", async () => {
      const mockLogEntry = {
        id: "test-id",
        user_id: "user-123",
        event_type: SecurityEventType.PASSWORD_RESET,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        success: true,
        error_message: null,
        metadata: null,
        created_at: new Date(),
      };

      mockRepository.create.mockReturnValue(mockLogEntry);
      mockRepository.save.mockResolvedValue(mockLogEntry);

      await service.logPasswordReset("user-123", "192.168.1.1", "Mozilla/5.0");

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("logAccountLockout", () => {
    it("should log account lockout event", async () => {
      const mockLogEntry = {
        id: "test-id",
        user_id: "user-123",
        event_type: SecurityEventType.ACCOUNT_LOCKOUT,
        ip_address: "192.168.1.1",
        user_agent: "Mozilla/5.0",
        success: true,
        error_message: null,
        metadata: { failedAttempts: 5 },
        created_at: new Date(),
      };

      mockRepository.create.mockReturnValue(mockLogEntry);
      mockRepository.save.mockResolvedValue(mockLogEntry);

      await service.logAccountLockout(
        "user-123",
        "192.168.1.1",
        "Mozilla/5.0",
        { failedAttempts: 5 },
      );

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("getUserLogs", () => {
    it("should get user logs", async () => {
      const mockLogs = [
        {
          id: "log-1",
          user_id: "user-123",
          event_type: SecurityEventType.LOGIN_SUCCESS,
          ip_address: "192.168.1.1",
          user_agent: "Mozilla/5.0",
          success: true,
          error_message: null,
          metadata: null,
          created_at: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getUserLogs("user-123", 100);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { user_id: "user-123" },
        order: { created_at: "DESC" },
        take: 100,
      });
      expect(result).toEqual(mockLogs);
    });
  });
});
