import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus } from "@nestjs/cqrs";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { OrganizationService } from "../organization.service";
import { EmailService } from "../email.service";
import { UserEntity } from "../../../iam/infrastructure/persistence/entities/User.entity";
import { IOrganizationRepository } from "../../../iam/domain/repositories/IOrganizationRepository";
import { Organization } from "../../../iam/domain/aggregates/Organization";
import { OrganizationId } from "../../../iam/domain/value-objects/OrganizationId";
import { RegionId } from "../../../iam/domain/value-objects/RegionId";

describe("OrganizationService", () => {
  let service: OrganizationService;
  let commandBus: CommandBus;
  let userRepository: Repository<UserEntity>;
  let organizationRepository: IOrganizationRepository;
  let emailService: EmailService;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockOrganizationRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };

  const mockEmailService = {
    sendRegistrationConfirmation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: "IOrganizationRepository",
          useValue: mockOrganizationRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    commandBus = module.get<CommandBus>(CommandBus);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    organizationRepository = module.get<IOrganizationRepository>(
      "IOrganizationRepository",
    );
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrganization", () => {
    it("should create organization with random name format", async () => {
      const creatorUserId = "user-123";
      const regionId = "region-456";
      const organizationId = "org-789";

      mockCommandBus.execute.mockResolvedValue(organizationId);

      const result = await service.createOrganization(creatorUserId, regionId);

      expect(result).toBe(organizationId);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/^org-\d{10}$/),
          code: expect.stringMatching(/^ORG\d{10}$/),
          regionId,
        }),
      );
    });
  });

  describe("isOrganizationCreator", () => {
    it("should return true if user is organization creator", async () => {
      const userId = "user-123";
      const organizationId = "org-456";

      mockUserRepository.findOne.mockResolvedValue({
        id: userId,
        organization_id: organizationId,
        isOrganizationCreator: true,
      });

      const result = await service.isOrganizationCreator(
        organizationId,
        userId,
      );

      expect(result).toBe(true);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: userId,
          organization_id: organizationId,
        },
      });
    });

    it("should return false if user is not organization creator", async () => {
      const userId = "user-123";
      const organizationId = "org-456";

      mockUserRepository.findOne.mockResolvedValue({
        id: userId,
        organization_id: organizationId,
        isOrganizationCreator: false,
      });

      const result = await service.isOrganizationCreator(
        organizationId,
        userId,
      );

      expect(result).toBe(false);
    });

    it("should return false if user not found", async () => {
      const userId = "user-123";
      const organizationId = "org-456";

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.isOrganizationCreator(
        organizationId,
        userId,
      );

      expect(result).toBe(false);
    });
  });

  describe("updateOrganizationSettings", () => {
    it("should update settings if user is organization creator", async () => {
      const organizationId = "org-123";
      const userId = "user-456";
      const settings = { name: "New Name", description: "New Description" };

      mockUserRepository.findOne.mockResolvedValue({
        id: userId,
        organization_id: organizationId,
        isOrganizationCreator: true,
      });

      const mockOrganization = Organization.reconstitute(
        OrganizationId.create(organizationId),
        "Old Name",
        "ORG123",
        "Old Description",
        null,
        true,
        RegionId.create("region-1"),
      );

      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockCommandBus.execute.mockResolvedValue(undefined);

      await service.updateOrganizationSettings(
        organizationId,
        userId,
        settings,
      );

      expect(mockCommandBus.execute).toHaveBeenCalled();
    });

    it("should throw ForbiddenException if user is not organization creator", async () => {
      const organizationId = "org-123";
      const userId = "user-456";
      const settings = { name: "New Name" };

      mockUserRepository.findOne.mockResolvedValue({
        id: userId,
        organization_id: organizationId,
        isOrganizationCreator: false,
      });

      await expect(
        service.updateOrganizationSettings(organizationId, userId, settings),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw NotFoundException if organization not found", async () => {
      const organizationId = "org-123";
      const userId = "user-456";
      const settings = { name: "New Name" };

      mockUserRepository.findOne.mockResolvedValue({
        id: userId,
        organization_id: organizationId,
        isOrganizationCreator: true,
      });

      mockOrganizationRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateOrganizationSettings(organizationId, userId, settings),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createDefaultApiKeys", () => {
    it("should create two default API keys", async () => {
      const organizationId = "org-123";
      const createdBy = "user-456";

      const mockApiKeyIdResult = {
        keyId: "key-id-123",
        keySecret: "secret-123",
        encryptionKey: "enc-key-123",
      };

      const mockApiKeySecretResult = {
        keyId: "key-secret-456",
        keySecret: "secret-456",
        encryptionKey: "enc-key-456",
      };

      mockCommandBus.execute
        .mockResolvedValueOnce(mockApiKeyIdResult)
        .mockResolvedValueOnce(mockApiKeySecretResult);

      const result = await service.createDefaultApiKeys(
        organizationId,
        createdBy,
      );

      expect(result).toEqual({
        apiKeyId: mockApiKeyIdResult.keyId,
        apiKeySecret: mockApiKeySecretResult.keyId,
        encryptionKey: mockApiKeyIdResult.encryptionKey,
      });

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "TELEMETRYFLOW_API_KEY_ID",
          organizationId,
          createdBy,
        }),
      );
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "TELEMETRYFLOW_API_KEY_SECRET",
          organizationId,
          createdBy,
        }),
      );
    });
  });
});
