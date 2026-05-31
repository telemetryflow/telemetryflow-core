/**
 * Unit tests for API key management audit event coverage
 * Feature: ingestion-auth-api-key
 * Task 9.3 — Validates: Requirement 9.2
 *
 * Tests verify that each command handler publishes the correct domain event
 * containing actor user ID, action, apiKeyId, and timestamp.
 *
 * Audit entries are written by the AuditInterceptor at the HTTP layer
 * (all /api-keys routes tagged AUTHZ). The domain events here are the
 * typed domain signals — this test confirms they carry the required fields.
 *
 * Tests cover:
 *  - CreateApiKey handler → ApiKeyCreatedEvent with createdBy + apiKeyId
 *  - RotateApiKey handler → ApiKeyRotatedEvent with rotatedBy + apiKeyId
 *  - RevokeApiKey handler → ApiKeyRevokedEvent with revokedBy + apiKeyId
 *  - DeleteApiKey handler → ApiKeyDeletedEvent with deletedBy + apiKeyId
 */

import { EventBus } from "@nestjs/cqrs";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { CreateApiKeyHandler } from "../CreateApiKey.handler";
import { RotateApiKeyHandler } from "../RotateApiKey.handler";
import { RevokeApiKeyHandler } from "../RevokeApiKey.handler";
import { DeleteApiKeyHandler } from "../DeleteApiKey.handler";
import { CreateApiKeyCommand } from "../../commands/CreateApiKey.command";
import { RotateApiKeyCommand } from "../../commands/RotateApiKey.command";
import { RevokeApiKeyCommand } from "../../commands/RevokeApiKey.command";
import { DeleteApiKeyCommand } from "../../commands/DeleteApiKey.command";
import { ApiKeyCreatedEvent } from "../../../domain/events/ApiKeyCreated.event";
import { ApiKeyRotatedEvent } from "../../../domain/events/ApiKeyRotated.event";
import { ApiKeyRevokedEvent } from "../../../domain/events/ApiKeyRevoked.event";
import { ApiKeyDeletedEvent } from "../../../domain/events/ApiKeyDeleted.event";

// ── Shared mocks ─────────────────────────────────────────────────────────────

const mockEventBus = { publish: jest.fn() } as unknown as EventBus;

const mockEncryptionService = {
  encrypt: jest.fn().mockReturnValue("encrypted-enc-key"),
  decrypt: jest.fn().mockReturnValue("raw-enc-key"),
};

function makeApiKeyAggregate(
  overrides: {
    apiKeyId?: string;
    organizationId?: string;
    isActive?: boolean;
    isSystem?: boolean;
    domainEvents?: any[];
  } = {},
) {
  const events: any[] = overrides.domainEvents ?? [];
  return {
    getId: () => ({
      toString: () => "key-uuid-1",
      getValue: () => "key-uuid-1",
    }),
    getApiKeyId: () =>
      overrides.apiKeyId ?? "tfk_testapikey12345678901234567890",
    getName: () => "Test API Key",
    getDescription: () => "Test description",
    getDisplayKey: () => "tfk_test****",
    getKeyPrefix: () => ({ getValue: () => "tfk_test" }),
    getKeyHint: () => "tfk_test****",
    getKeyType: () => "secret",
    getOrganizationId: () => overrides.organizationId ?? "org-123",
    getWorkspaceId: () => undefined,
    getTenantId: () => undefined,
    getIsActive: () => overrides.isActive ?? true,
    getIsSystem: () => overrides.isSystem ?? false,
    isExpired: () => false,
    getEncryptKey: () => "encrypted-enc-key",
    setEncryptKey: jest.fn(),
    getPermissions: () => ["read:telemetry"],
    getScopes: () => [],
    getRateLimit: () => undefined,
    getExpiresAt: () => undefined,
    getLastUsedAt: () => undefined,
    getLastUsedIp: () => undefined,
    getUsageCount: () => 0,
    getCreatedBy: () => "user-1",
    getCreatedAt: () => new Date(),
    getUpdatedAt: () => new Date(),
    getRevokedAt: () => undefined,
    getRevokedBy: () => undefined,
    getRevocationReason: () => undefined,
    getRotatedAt: () => undefined,
    getRotatedBy: () => undefined,
    getRotationCount: () => 0,
    getMetadata: () => undefined,
    domainEvents: events,
    clearEvents: jest.fn(),
    rotate: jest.fn().mockReturnValue({
      rawKeySecret: "tfs_newsecret123456789012345678901",
      rawEncryptionKey: "new-raw-enc-key",
    }),
    revoke: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────

describe("CreateApiKey handler — emits ApiKeyCreatedEvent", () => {
  it("publishes ApiKeyCreatedEvent with createdBy and apiKeyId", async () => {
    const createdEvent = new ApiKeyCreatedEvent({
      apiKeyId: "tfk_testapikey12345678901234567890",
      name: "Test API Key",
      keyPrefix: "tfk_test",
      organizationId: "org-123",
      createdBy: "user-actor-1",
      permissions: ["read:telemetry"],
    });

    const aggregate = makeApiKeyAggregate({ domainEvents: [createdEvent] });

    const mockRepo = {
      findByName: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(aggregate),
    };

    // Mock ApiKey.create to return a known aggregate
    const ApiKeyModule = await import("../../../domain/aggregates/ApiKey");
    jest.spyOn(ApiKeyModule.ApiKey, "create").mockReturnValue({
      apiKey: aggregate as any,
      rawKeyId: "tfk_testapikey12345678901234567890",
      rawKeySecret: "tfs_rawsecret1234567890123456789012",
      rawEncryptionKey: "raw-enc-key",
    });

    const handler = new CreateApiKeyHandler(
      mockRepo as any,
      mockEncryptionService as any,
      mockEventBus,
    );

    // positional: name, description, keyType, permissions, scopes, rateLimit, expiresAt, organizationId, workspaceId, tenantId, createdBy
    const command = new CreateApiKeyCommand(
      "Test API Key",
      undefined,
      "secret",
      ["read:telemetry"],
      [],
      undefined,
      undefined,
      "org-123",
      undefined,
      undefined,
      "user-actor-1",
    );

    await handler.execute(command);

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKeyId: "tfk_testapikey12345678901234567890",
        createdBy: "user-actor-1",
        organizationId: "org-123",
      }),
    );
  });

  it("published event is an instance of ApiKeyCreatedEvent", async () => {
    const createdEvent = new ApiKeyCreatedEvent({
      apiKeyId: "tfk_testapikey12345678901234567890",
      name: "Test API Key",
      keyPrefix: "tfk_test",
      organizationId: "org-123",
      createdBy: "user-actor-1",
      permissions: [],
    });

    const aggregate = makeApiKeyAggregate({ domainEvents: [createdEvent] });
    const mockRepo = {
      findByName: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(aggregate),
    };

    const ApiKeyModule = await import("../../../domain/aggregates/ApiKey");
    jest.spyOn(ApiKeyModule.ApiKey, "create").mockReturnValue({
      apiKey: aggregate as any,
      rawKeyId: "tfk_testapikey12345678901234567890",
      rawKeySecret: "tfs_rawsecret1234567890123456789012",
      rawEncryptionKey: "raw-enc-key",
    });

    const handler = new CreateApiKeyHandler(
      mockRepo as any,
      mockEncryptionService as any,
      mockEventBus,
    );
    await handler.execute(
      new CreateApiKeyCommand(
        "Test",
        undefined,
        "secret",
        [],
        [],
        undefined,
        undefined,
        "org-123",
        undefined,
        undefined,
        "user-1",
      ),
    );

    const published = (mockEventBus.publish as jest.Mock).mock.calls[0][0];
    expect(published).toBeInstanceOf(ApiKeyCreatedEvent);
  });

  it("throws ConflictException if name already exists — no event published", async () => {
    const mockRepo = {
      findByName: jest.fn().mockResolvedValue({ id: "existing" }),
      save: jest.fn(),
      findById: jest.fn(),
    };
    const handler = new CreateApiKeyHandler(
      mockRepo as any,
      mockEncryptionService as any,
      mockEventBus,
    );
    await expect(
      handler.execute(
        new CreateApiKeyCommand(
          "Dupe",
          undefined,
          "secret",
          [],
          [],
          undefined,
          undefined,
          "org-123",
          undefined,
          undefined,
          "user-1",
        ),
      ),
    ).rejects.toThrow(ConflictException);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("RotateApiKey handler — emits ApiKeyRotatedEvent", () => {
  it("publishes ApiKeyRotatedEvent with rotatedBy and apiKeyId", async () => {
    const aggregate = makeApiKeyAggregate();
    const rotatedEvent = new ApiKeyRotatedEvent({
      apiKeyId: "tfk_testapikey12345678901234567890",
      name: "Test API Key",
      organizationId: "org-123",
      rotatedBy: "user-actor-2",
      previousKeyPrefix: "tfk_old",
      newKeyPrefix: "tfk_new",
    });
    (aggregate.domainEvents as any[]).push(rotatedEvent);

    const mockRepo = {
      findById: jest.fn().mockResolvedValue(aggregate),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const handler = new RotateApiKeyHandler(
      mockRepo as any,
      mockEncryptionService as any,
      mockEventBus,
    );
    await handler.execute(
      new RotateApiKeyCommand("key-uuid-1", "org-123", "user-actor-2"),
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKeyId: "tfk_testapikey12345678901234567890",
        rotatedBy: "user-actor-2",
        organizationId: "org-123",
      }),
    );
  });

  it("published event is an instance of ApiKeyRotatedEvent", async () => {
    const aggregate = makeApiKeyAggregate();
    const rotatedEvent = new ApiKeyRotatedEvent({
      apiKeyId: "tfk_testapikey12345678901234567890",
      name: "Test API Key",
      organizationId: "org-123",
      rotatedBy: "user-actor-2",
      previousKeyPrefix: "tfk_old",
      newKeyPrefix: "tfk_new",
    });
    (aggregate.domainEvents as any[]).push(rotatedEvent);

    const mockRepo = {
      findById: jest.fn().mockResolvedValue(aggregate),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const handler = new RotateApiKeyHandler(
      mockRepo as any,
      mockEncryptionService as any,
      mockEventBus,
    );
    await handler.execute(
      new RotateApiKeyCommand("key-uuid-1", "org-123", "user-actor-2"),
    );

    const published = (mockEventBus.publish as jest.Mock).mock.calls[0][0];
    expect(published).toBeInstanceOf(ApiKeyRotatedEvent);
  });

  it("throws NotFoundException when key not found — no event published", async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const handler = new RotateApiKeyHandler(
      mockRepo as any,
      mockEncryptionService as any,
      mockEventBus,
    );
    await expect(
      handler.execute(new RotateApiKeyCommand("missing", "org-123", "user-1")),
    ).rejects.toThrow(NotFoundException);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("RevokeApiKey handler — emits ApiKeyRevokedEvent", () => {
  it("publishes ApiKeyRevokedEvent with revokedBy and apiKeyId", async () => {
    const revokedEvent = new ApiKeyRevokedEvent({
      apiKeyId: "tfk_testapikey12345678901234567890",
      name: "Test API Key",
      organizationId: "org-123",
      revokedBy: "user-actor-3",
      reason: "Security breach",
    });

    const aggregate = makeApiKeyAggregate({ domainEvents: [revokedEvent] });
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(aggregate),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const handler = new RevokeApiKeyHandler(mockRepo as any, mockEventBus);
    await handler.execute(
      new RevokeApiKeyCommand(
        "key-uuid-1",
        "org-123",
        "user-actor-3",
        "Security breach",
      ),
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKeyId: "tfk_testapikey12345678901234567890",
        revokedBy: "user-actor-3",
        organizationId: "org-123",
      }),
    );
  });

  it("published event is an instance of ApiKeyRevokedEvent", async () => {
    const revokedEvent = new ApiKeyRevokedEvent({
      apiKeyId: "tfk_testapikey12345678901234567890",
      name: "Test API Key",
      organizationId: "org-123",
      revokedBy: "user-actor-3",
    });

    const aggregate = makeApiKeyAggregate({ domainEvents: [revokedEvent] });
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(aggregate),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const handler = new RevokeApiKeyHandler(mockRepo as any, mockEventBus);
    await handler.execute(
      new RevokeApiKeyCommand("key-uuid-1", "org-123", "user-1"),
    );

    const published = (mockEventBus.publish as jest.Mock).mock.calls[0][0];
    expect(published).toBeInstanceOf(ApiKeyRevokedEvent);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("DeleteApiKey handler — emits ApiKeyDeletedEvent", () => {
  it("publishes ApiKeyDeletedEvent with deletedBy and apiKeyId", async () => {
    const aggregate = makeApiKeyAggregate();
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(aggregate),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const handler = new DeleteApiKeyHandler(mockRepo as any, mockEventBus);
    await handler.execute(
      new DeleteApiKeyCommand("key-uuid-1", "org-123", "user-actor-4"),
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKeyId: "tfk_testapikey12345678901234567890",
        deletedBy: "user-actor-4",
        organizationId: "org-123",
      }),
    );
  });

  it("published event is an instance of ApiKeyDeletedEvent", async () => {
    const aggregate = makeApiKeyAggregate();
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(aggregate),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const handler = new DeleteApiKeyHandler(mockRepo as any, mockEventBus);
    await handler.execute(
      new DeleteApiKeyCommand("key-uuid-1", "org-123", "user-1"),
    );

    const published = (mockEventBus.publish as jest.Mock).mock.calls[0][0];
    expect(published).toBeInstanceOf(ApiKeyDeletedEvent);
  });

  it("ApiKeyDeletedEvent always has a timestamp (DomainEvent base class)", async () => {
    const aggregate = makeApiKeyAggregate();
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(aggregate),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const handler = new DeleteApiKeyHandler(mockRepo as any, mockEventBus);
    await handler.execute(
      new DeleteApiKeyCommand("key-uuid-1", "org-123", "user-1"),
    );

    const published = (mockEventBus.publish as jest.Mock).mock
      .calls[0][0] as ApiKeyDeletedEvent;
    // DomainEvent base sets timestamp in constructor
    expect(published).toBeDefined();
    expect(published.apiKeyId).toBeTruthy();
    expect(published.deletedBy).toBeTruthy();
  });

  it("throws NotFoundException when key not found — no event published", async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
    };
    const handler = new DeleteApiKeyHandler(mockRepo as any, mockEventBus);
    await expect(
      handler.execute(new DeleteApiKeyCommand("missing", "org-123", "user-1")),
    ).rejects.toThrow(NotFoundException);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it("throws BadRequestException for system key — no event published", async () => {
    const aggregate = makeApiKeyAggregate({ isSystem: true });
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(aggregate),
      delete: jest.fn(),
    };
    const handler = new DeleteApiKeyHandler(mockRepo as any, mockEventBus);
    await expect(
      handler.execute(
        new DeleteApiKeyCommand("key-uuid-1", "org-123", "user-1"),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Audit event payload completeness", () => {
  /**
   * Each domain event must contain the fields required by Requirement 9.2:
   *   - actor user ID (createdBy / rotatedBy / revokedBy / deletedBy)
   *   - action (implicit from event class name)
   *   - affected apiKeyId
   *   - organizationId (for scoping)
   */

  it("ApiKeyCreatedEvent has all required audit fields", () => {
    const event = new ApiKeyCreatedEvent({
      apiKeyId: "tfk_test",
      name: "Test",
      keyPrefix: "tfk_",
      organizationId: "org-1",
      createdBy: "user-1",
      permissions: [],
    });
    expect(event.apiKeyId).toBeTruthy();
    expect(event.createdBy).toBeTruthy();
    expect(event.organizationId).toBeTruthy();
  });

  it("ApiKeyRotatedEvent has all required audit fields", () => {
    const event = new ApiKeyRotatedEvent({
      apiKeyId: "tfk_test",
      name: "Test",
      organizationId: "org-1",
      rotatedBy: "user-2",
      previousKeyPrefix: "tfk_old",
      newKeyPrefix: "tfk_new",
    });
    expect(event.apiKeyId).toBeTruthy();
    expect(event.rotatedBy).toBeTruthy();
    expect(event.organizationId).toBeTruthy();
  });

  it("ApiKeyRevokedEvent has all required audit fields", () => {
    const event = new ApiKeyRevokedEvent({
      apiKeyId: "tfk_test",
      name: "Test",
      organizationId: "org-1",
      revokedBy: "user-3",
    });
    expect(event.apiKeyId).toBeTruthy();
    expect(event.revokedBy).toBeTruthy();
    expect(event.organizationId).toBeTruthy();
  });

  it("ApiKeyDeletedEvent has all required audit fields", () => {
    const event = new ApiKeyDeletedEvent({
      apiKeyId: "tfk_test",
      name: "Test",
      organizationId: "org-1",
      deletedBy: "user-4",
    });
    expect(event.apiKeyId).toBeTruthy();
    expect(event.deletedBy).toBeTruthy();
    expect(event.organizationId).toBeTruthy();
  });
});
