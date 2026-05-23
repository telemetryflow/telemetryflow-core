/**
 * API Key Service
 *
 * High-level service that provides a clean interface for API key operations.
 * Wraps CQRS command/query handlers to provide a simpler API for other modules.
 *
 * This service is used by:
 * - OrganizationService for creating default API keys during registration
 * - Other modules that need to manage API keys programmatically
 */

import { Injectable, Inject } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateApiKeyCommand } from "../../application/commands/CreateApiKey.command";
import { UpdateApiKeyCommand } from "../../application/commands/UpdateApiKey.command";
import { RotateApiKeyCommand } from "../../application/commands/RotateApiKey.command";
import { RevokeApiKeyCommand } from "../../application/commands/RevokeApiKey.command";
import { ActivateApiKeyCommand } from "../../application/commands/ActivateApiKey.command";
import { DeactivateApiKeyCommand } from "../../application/commands/DeactivateApiKey.command";
import { GetApiKeyQuery } from "../../application/queries/GetApiKey.query";
import { ListApiKeysQuery } from "../../application/queries/ListApiKeys.query";
import { ApiKey } from "../../domain/aggregates/ApiKey";
import {
  IApiKeyRepository,
  API_KEY_REPOSITORY,
} from "../../domain/repositories/IApiKeyRepository";

export interface CreateApiKeyProps {
  name: string;
  description?: string;
  keyType: "test" | "secret" | "standard" | "service";
  permissions: string[];
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: Date;
  organizationId: string;
  workspaceId?: string;
  createdBy: string;
}

export interface CreateApiKeyResult {
  apiKey: ApiKey;
  rawApiKeyId: string;
  rawApiKeySecret: string;
  rawEncryptKey: string;
}

export interface RotateApiKeyResult {
  apiKey: ApiKey;
  rawApiKeySecret: string;
  rawEncryptKey: string;
}

export interface UpdateApiKeyProps {
  name?: string;
  description?: string;
  permissions?: string[];
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface ListApiKeysOptions {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  keyType?: string;
  search?: string;
}

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(API_KEY_REPOSITORY)
    private readonly apiKeyRepository: IApiKeyRepository,
  ) {}

  /**
   * Create a new API key
   * Returns the API key along with the raw keys (shown only once)
   *
   * @param props - API key creation properties
   * @returns Object containing the API key and raw keys
   */
  async createApiKey(props: CreateApiKeyProps): Promise<CreateApiKeyResult> {
    const result = await this.commandBus.execute(
      new CreateApiKeyCommand(
        props.name,
        props.description,
        props.keyType,
        props.permissions,
        props.scopes,
        props.rateLimit,
        props.expiresAt,
        props.organizationId,
        props.workspaceId,
        undefined, // tenantId
        props.createdBy,
      ),
    );

    // The result from CreateApiKeyHandler is ApiKeyCreatedResponseDto
    // We need to fetch the actual domain object
    const apiKey = await this.apiKeyRepository.findById(result.id);

    if (!apiKey) {
      throw new Error("Failed to retrieve created API key");
    }

    return {
      apiKey,
      rawApiKeyId: result.rawApiKeyId,
      rawApiKeySecret: result.rawApiKeySecret,
      rawEncryptKey: result.rawEncryptKey,
    };
  }

  /**
   * Validate an API key by its raw secret
   * Returns the API key if valid, null otherwise
   *
   * @param rawKey - The raw API key secret to validate
   * @returns The API key if valid, null otherwise
   */
  async validateApiKey(rawKey: string): Promise<ApiKey | null> {
    // Hash the raw key to find it in the database
    const crypto = require("crypto");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await this.apiKeyRepository.findByKeyHash(keyHash);

    if (!apiKey) {
      return null;
    }

    // Check if the key is valid (active and not expired)
    if (!apiKey.isValid()) {
      return null;
    }

    // Validate the key matches
    if (!apiKey.validateKey(rawKey)) {
      return null;
    }

    return apiKey;
  }

  /**
   * Rotate an API key (generate new secret)
   * Returns the API key along with the new raw secret and encryption key
   *
   * @param apiKeyId - The API key ID to rotate
   * @param organizationId - The organization ID
   * @param rotatedBy - The user ID performing the rotation
   * @returns Object containing the API key and new raw keys
   */
  async rotateApiKey(
    apiKeyId: string,
    organizationId: string,
    rotatedBy: string,
  ): Promise<RotateApiKeyResult> {
    const result = await this.commandBus.execute(
      new RotateApiKeyCommand(apiKeyId, organizationId, rotatedBy),
    );

    // Fetch the updated domain object
    const apiKey = await this.apiKeyRepository.findById(apiKeyId);

    if (!apiKey) {
      throw new Error("Failed to retrieve rotated API key");
    }

    return {
      apiKey,
      rawApiKeySecret: result.rawApiKeySecret,
      rawEncryptKey: result.rawEncryptKey,
    };
  }

  /**
   * Revoke an API key (soft delete - marks as inactive)
   *
   * @param apiKeyId - The API key ID to revoke
   * @param revokedBy - The user ID performing the revocation
   * @param reason - Optional reason for revocation
   */
  async revokeApiKey(
    apiKeyId: string,
    revokedBy: string,
    reason?: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeApiKeyCommand(apiKeyId, revokedBy, reason),
    );
  }

  /**
   * Activate an API key
   *
   * @param apiKeyId - The API key ID to activate
   * @param organizationId - The organization ID
   */
  async activateApiKey(
    apiKeyId: string,
    organizationId: string,
  ): Promise<ApiKey> {
    await this.commandBus.execute(
      new ActivateApiKeyCommand(apiKeyId, organizationId),
    );

    const apiKey = await this.apiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throw new Error("Failed to retrieve activated API key");
    }

    return apiKey;
  }

  /**
   * Deactivate an API key
   *
   * @param apiKeyId - The API key ID to deactivate
   * @param organizationId - The organization ID
   */
  async deactivateApiKey(
    apiKeyId: string,
    organizationId: string,
  ): Promise<ApiKey> {
    await this.commandBus.execute(
      new DeactivateApiKeyCommand(apiKeyId, organizationId),
    );

    const apiKey = await this.apiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throw new Error("Failed to retrieve deactivated API key");
    }

    return apiKey;
  }

  /**
   * Update an API key's properties
   *
   * @param apiKeyId - The API key ID to update
   * @param organizationId - The organization ID
   * @param props - Properties to update
   */
  async updateApiKey(
    apiKeyId: string,
    organizationId: string,
    props: UpdateApiKeyProps,
  ): Promise<ApiKey> {
    await this.commandBus.execute(
      new UpdateApiKeyCommand(
        apiKeyId,
        organizationId,
        props.name,
        props.description,
        props.permissions,
        props.scopes,
        props.rateLimit,
        props.expiresAt,
      ),
    );

    const apiKey = await this.apiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throw new Error("Failed to retrieve updated API key");
    }

    return apiKey;
  }

  /**
   * Get an API key by ID
   *
   * @param apiKeyId - The API key ID
   * @param organizationId - The organization ID
   * @returns The API key or null if not found
   */
  async getApiKey(
    apiKeyId: string,
    organizationId: string,
  ): Promise<ApiKey | null> {
    return this.queryBus.execute(new GetApiKeyQuery(apiKeyId, organizationId));
  }

  /**
   * List API keys for an organization with filtering and pagination
   *
   * @param organizationId - The organization ID
   * @param options - Filtering and pagination options
   * @returns Paginated list of API keys
   */
  async listApiKeys(organizationId: string, options?: ListApiKeysOptions) {
    return this.queryBus.execute(
      new ListApiKeysQuery(
        organizationId,
        options?.page || 1,
        options?.pageSize || 20,
        options?.isActive,
        options?.keyType,
        options?.search,
      ),
    );
  }

  /**
   * Check if an API key has a specific permission
   *
   * @param apiKeyId - The API key ID
   * @param permission - The permission to check
   * @returns True if the API key has the permission, false otherwise
   */
  async hasPermission(apiKeyId: string, permission: string): Promise<boolean> {
    const apiKey = await this.apiKeyRepository.findById(apiKeyId);

    if (!apiKey) {
      return false;
    }

    return apiKey.hasPermission(permission);
  }

  /**
   * Record usage of an API key
   *
   * @param apiKeyId - The API key ID
   * @param ipAddress - The IP address using the key
   */
  async recordUsage(apiKeyId: string, ipAddress?: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findById(apiKeyId);

    if (!apiKey) {
      throw new Error("API key not found");
    }

    apiKey.recordUsage(ipAddress);
    await this.apiKeyRepository.save(apiKey);
  }
}

export const API_KEY_SERVICE = Symbol("API_KEY_SERVICE");
