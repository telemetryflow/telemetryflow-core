/**
 * Unit tests for ApiKeyService
 */

import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiKeyService, API_KEY_SERVICE } from "../ApiKey.service";
import {
  API_KEY_REPOSITORY,
  IApiKeyRepository,
} from "../../../domain/repositories/IApiKeyRepository";
import { ApiKey } from "../../../domain/aggregates/ApiKey";
import { CreateApiKeyCommand } from "../../../application/commands/CreateApiKey.command";
import { RotateApiKeyCommand } from "../../../application/commands/RotateApiKey.command";
import { RevokeApiKeyCommand } from "../../../application/commands/RevokeApiKey.command";
import { GetApiKeyQuery } from "../../../application/queries/GetApiKey.query";
import { ListApiKeysQuery } from "../../../application/queries/ListApiKeys.query";

describe("ApiKeyService", () => {
  let service: ApiKeyService;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let repository: IApiKeyRepository;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockRepository = {
    findById: jest.fn(),
    findByKeyHash: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: API_KEY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
    repository = module.get<IApiKeyRepository>(API_KEY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createApiKey", () => {
    it("should create an API key and return raw keys", async () => {
      const props = {
        name: "Test API Key",
        description: "Test description",
        keyType: "secret" as const,
        permissions: ["read:telemetry"],
        scopes: ["telemetry"],
        organizationId: "org-123",
        createdBy: "user-123",
      };

      const mockResult = {
        id: "key-123",
        rawApiKeyId: "tfk_abc123",
        rawApiKeySecret: "tfs_secret123",
        rawEncryptKey: "encrypt123",
      };

      const mockApiKey = {
        getId: () => ({ getValue: () => "key-123" }),
        getName: () => "Test API Key",
      } as any;

      mockCommandBus.execute.mockResolvedValue(mockResult);
      mockRepository.findById.mockResolvedValue(mockApiKey);

      const result = await service.createApiKey(props);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateApiKeyCommand),
      );
      expect(repository.findById).toHaveBeenCalledWith("key-123");
      expect(result).toEqual({
        apiKey: mockApiKey,
        rawApiKeyId: "tfk_abc123",
        rawApiKeySecret: "tfs_secret123",
        rawEncryptKey: "encrypt123",
      });
    });

    it("should throw error if created API key cannot be retrieved", async () => {
      const props = {
        name: "Test API Key",
        keyType: "secret" as const,
        permissions: ["read:telemetry"],
        organizationId: "org-123",
        createdBy: "user-123",
      };

      mockCommandBus.execute.mockResolvedValue({
        id: "key-123",
        rawApiKeyId: "tfk_abc123",
        rawApiKeySecret: "tfs_secret123",
        rawEncryptKey: "encrypt123",
      });
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.createApiKey(props)).rejects.toThrow(
        "Failed to retrieve created API key",
      );
    });
  });

  describe("validateApiKey", () => {
    it("should validate a valid API key", async () => {
      const rawKey = "tfs_secret123";
      const mockApiKey = {
        isValid: () => true,
        validateKey: (key: string) => key === rawKey,
      } as any;

      mockRepository.findByKeyHash.mockResolvedValue(mockApiKey);

      const result = await service.validateApiKey(rawKey);

      expect(result).toBe(mockApiKey);
      expect(repository.findByKeyHash).toHaveBeenCalled();
    });

    it("should return null for non-existent API key", async () => {
      mockRepository.findByKeyHash.mockResolvedValue(null);

      const result = await service.validateApiKey("tfs_invalid");

      expect(result).toBeNull();
    });

    it("should return null for invalid (inactive/expired) API key", async () => {
      const mockApiKey = {
        isValid: () => false,
        validateKey: () => true,
      } as any;

      mockRepository.findByKeyHash.mockResolvedValue(mockApiKey);

      const result = await service.validateApiKey("tfs_secret123");

      expect(result).toBeNull();
    });

    it("should return null if key validation fails", async () => {
      const mockApiKey = {
        isValid: () => true,
        validateKey: () => false,
      } as any;

      mockRepository.findByKeyHash.mockResolvedValue(mockApiKey);

      const result = await service.validateApiKey("tfs_wrong");

      expect(result).toBeNull();
    });
  });

  describe("rotateApiKey", () => {
    it("should rotate an API key and return new raw keys", async () => {
      const apiKeyId = "key-123";
      const organizationId = "org-123";
      const rotatedBy = "user-123";

      const mockResult = {
        rawApiKeySecret: "tfs_newsecret123",
        rawEncryptKey: "newencrypt123",
      };

      const mockApiKey = {
        getId: () => ({ getValue: () => apiKeyId }),
      } as any;

      mockCommandBus.execute.mockResolvedValue(mockResult);
      mockRepository.findById.mockResolvedValue(mockApiKey);

      const result = await service.rotateApiKey(
        apiKeyId,
        organizationId,
        rotatedBy,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RotateApiKeyCommand),
      );
      expect(repository.findById).toHaveBeenCalledWith(apiKeyId);
      expect(result).toEqual({
        apiKey: mockApiKey,
        rawApiKeySecret: "tfs_newsecret123",
        rawEncryptKey: "newencrypt123",
      });
    });
  });

  describe("revokeApiKey", () => {
    it("should revoke an API key", async () => {
      const apiKeyId = "key-123";
      const revokedBy = "user-123";
      const reason = "Security breach";

      await service.revokeApiKey(apiKeyId, revokedBy, reason);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RevokeApiKeyCommand),
      );
    });
  });

  describe("getApiKey", () => {
    it("should get an API key by ID", async () => {
      const apiKeyId = "key-123";
      const organizationId = "org-123";
      const mockApiKey = { getId: () => ({ getValue: () => apiKeyId }) } as any;

      mockQueryBus.execute.mockResolvedValue(mockApiKey);

      const result = await service.getApiKey(apiKeyId, organizationId);

      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetApiKeyQuery));
      expect(result).toBe(mockApiKey);
    });
  });

  describe("listApiKeys", () => {
    it("should list API keys with filters", async () => {
      const organizationId = "org-123";
      const options = {
        page: 1,
        pageSize: 20,
        isActive: true,
        keyType: "secret",
      };

      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await service.listApiKeys(organizationId, options);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(ListApiKeysQuery),
      );
      expect(result).toBe(mockResult);
    });
  });

  describe("hasPermission", () => {
    it("should check if API key has permission", async () => {
      const apiKeyId = "key-123";
      const permission = "read:telemetry";

      const mockApiKey = {
        hasPermission: (perm: string) => perm === permission,
      } as any;

      mockRepository.findById.mockResolvedValue(mockApiKey);

      const result = await service.hasPermission(apiKeyId, permission);

      expect(result).toBe(true);
      expect(repository.findById).toHaveBeenCalledWith(apiKeyId);
    });

    it("should return false if API key not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.hasPermission("key-123", "read:telemetry");

      expect(result).toBe(false);
    });
  });

  describe("recordUsage", () => {
    it("should record API key usage", async () => {
      const apiKeyId = "key-123";
      const ipAddress = "192.168.1.1";

      const mockApiKey = {
        recordUsage: jest.fn(),
      } as any;

      mockRepository.findById.mockResolvedValue(mockApiKey);

      await service.recordUsage(apiKeyId, ipAddress);

      expect(mockApiKey.recordUsage).toHaveBeenCalledWith(ipAddress);
      expect(repository.save).toHaveBeenCalledWith(mockApiKey);
    });

    it("should throw error if API key not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.recordUsage("key-123")).rejects.toThrow(
        "API key not found",
      );
    });
  });
});
