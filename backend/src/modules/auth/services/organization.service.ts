import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateOrganizationCommand } from "../../iam/application/commands/CreateOrganization.command";
import { UpdateOrganizationCommand } from "../../iam/application/commands/UpdateOrganization.command";
import { CreateApiKeyCommand } from "../../api-keys/application/commands/CreateApiKey.command";
import { IOrganizationRepository } from "../../iam/domain/repositories/IOrganizationRepository";
import { OrganizationId } from "../../iam/domain/value-objects/OrganizationId";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { EmailService } from "./email.service";
import { randomInt } from "crypto";

export interface OrganizationSettings {
  name?: string;
  description?: string;
  domain?: string;
}

export interface DefaultApiKeys {
  apiKeyId: string;
  apiKeySecret: string;
  encryptionKey: string;
}

/**
 * Organization Service
 *
 * Handles organization lifecycle management including:
 * - Organization creation with random name generation
 * - Organization creator validation
 * - Organization settings updates with authorization
 * - Default API keys creation (TELEMETRYFLOW_API_KEY_ID and TELEMETRYFLOW_API_KEY_SECRET)
 * - Integration with API key service
 */
@Injectable()
export class OrganizationService {
  constructor(
    @Inject("IOrganizationRepository")
    private readonly organizationRepository: IOrganizationRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly commandBus: CommandBus,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a new organization with a random name in format "org-{10-digit-random-number}"
   *
   * @param creatorUserId - The user ID of the organization creator
   * @param regionId - The region ID for the organization
   * @returns The created organization ID
   */
  async createOrganization(
    creatorUserId: string,
    regionId: string,
  ): Promise<string> {
    // Generate random organization name
    const randomNumber = randomInt(1000000000, 10000000000);
    const organizationName = `org-${randomNumber}`;
    const organizationCode = `ORG${randomNumber}`;

    // Create organization via CQRS command
    const organizationId = await this.commandBus.execute(
      new CreateOrganizationCommand(
        organizationName,
        organizationCode,
        regionId,
        `Organization for user ${creatorUserId}`,
        null, // domain
      ),
    );

    return organizationId;
  }

  /**
   * Get organization by ID
   *
   * @param organizationId - The organization ID
   * @returns The organization or null if not found
   */
  async getOrganization(organizationId: string) {
    const orgId = OrganizationId.create(organizationId);
    const organization = await this.organizationRepository.findById(orgId);
    return organization;
  }

  /**
   * Get organization entity by ID (for timestamps and other entity-specific data)
   *
   * @param organizationId - The organization ID
   * @returns The organization entity or null if not found
   */
  async getOrganizationEntity(organizationId: string) {
    const orgEntity = await this.organizationRepository[
      "organizationRepository"
    ].findOne({
      where: { organization_id: organizationId },
    });
    return orgEntity;
  }

  /**
   * Update organization settings with authorization check
   * Only the organization creator can modify organization settings
   *
   * @param organizationId - The organization ID
   * @param userId - The user attempting to update settings
   * @param settings - The settings to update
   * @throws ForbiddenException if user is not the organization creator
   * @throws NotFoundException if organization not found
   */
  async updateOrganizationSettings(
    organizationId: string,
    userId: string,
    settings: OrganizationSettings,
  ): Promise<void> {
    // Check if user is organization creator
    const isCreator = await this.isOrganizationCreator(organizationId, userId);

    if (!isCreator) {
      throw new ForbiddenException(
        "Only the organization creator can modify organization settings",
      );
    }

    // Get current organization
    const organization = await this.getOrganization(organizationId);
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    // Update organization via CQRS command
    await this.commandBus.execute(
      new UpdateOrganizationCommand(
        organizationId,
        settings.name || organization.name,
        settings.description || organization.description,
        settings.domain || organization.domain,
      ),
    );
  }

  /**
   * Check if a user is the organization creator
   *
   * @param organizationId - The organization ID
   * @param userId - The user ID to check
   * @returns True if user is the organization creator, false otherwise
   */
  async isOrganizationCreator(
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    // Query the user and check if they belong to this organization
    // and have the isOrganizationCreator flag set to true
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        organization_id: organizationId,
      },
    });

    if (!user) {
      return false;
    }

    // Check if user has isOrganizationCreator flag
    return user.isOrganizationCreator === true;
  }

  /**
   * Create default API keys for an organization
   * Creates two API keys: TELEMETRYFLOW_API_KEY_ID and TELEMETRYFLOW_API_KEY_SECRET
   *
   * @param organizationId - The organization ID
   * @param createdBy - The user ID creating the API keys
   * @returns Object containing both API key IDs and secrets
   */
  async createDefaultApiKeys(
    organizationId: string,
    createdBy: string,
  ): Promise<DefaultApiKeys> {
    // Create TELEMETRYFLOW_API_KEY_ID
    const apiKeyIdResult = await this.commandBus.execute(
      new CreateApiKeyCommand(
        "TELEMETRYFLOW_API_KEY_ID",
        "Default API Key ID for telemetry ingestion",
        "secret", // keyType
        ["telemetry:write", "telemetry:read"], // permissions
        ["telemetry"], // scopes
        undefined, // rateLimit
        undefined, // expiresAt
        organizationId,
        undefined, // workspaceId
        undefined, // tenantId
        createdBy,
      ),
    );

    // Create TELEMETRYFLOW_API_KEY_SECRET
    const apiKeySecretResult = await this.commandBus.execute(
      new CreateApiKeyCommand(
        "TELEMETRYFLOW_API_KEY_SECRET",
        "Default API Key Secret for telemetry ingestion",
        "secret", // keyType
        ["telemetry:write", "telemetry:read"], // permissions
        ["telemetry"], // scopes
        undefined, // rateLimit
        undefined, // expiresAt
        organizationId,
        undefined, // workspaceId
        undefined, // tenantId
        createdBy,
      ),
    );

    return {
      apiKeyId: apiKeyIdResult.keyId,
      apiKeySecret: apiKeySecretResult.keyId,
      encryptionKey: apiKeyIdResult.encryptionKey,
    };
  }

  /**
   * Add a user to an organization with a specific role
   *
   * @param organizationId - The organization ID
   * @param userId - The user ID to add
   * @param role - The role to assign (administrator, developer, viewer, demo)
   */
  async addUserToOrganization(
    organizationId: string,
    userId: string,
    _role: string,
  ): Promise<void> {
    // Update user's organization_id
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.organization_id = organizationId;
    await this.userRepository.save(user);

    // Note: Role assignment will be handled via IAM module's AssignRoleToUserCommand
    // when the role system is fully integrated
  }

  /**
   * Get all users in an organization
   *
   * @param organizationId - The organization ID
   * @returns Array of users in the organization
   */
  async getOrganizationUsers(organizationId: string): Promise<UserEntity[]> {
    return this.userRepository.find({
      where: {
        organization_id: organizationId,
      },
    });
  }

  /**
   * Get all administrators in an organization
   *
   * @param organizationId - The organization ID
   * @returns Array of administrator users
   */
  async getOrganizationAdministrators(
    organizationId: string,
  ): Promise<UserEntity[]> {
    // Query users in the organization
    // Note: This is a simplified implementation. In a full RBAC system,
    // we would query based on role assignments from the IAM module
    const users = await this.userRepository.find({
      where: {
        organization_id: organizationId,
        isActive: true,
      },
    });

    // For now, we return all users in the organization
    // In the future, this should filter by administrator role
    return users;
  }
}
