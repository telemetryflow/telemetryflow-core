import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { OrganizationService } from "../services/organization.service";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ListApiKeysQuery } from "../../api-keys/application/queries/ListApiKeys.query";
import { RotateApiKeyCommand } from "../../api-keys/application/commands/RotateApiKey.command";
import { RevokeApiKeyCommand } from "../../api-keys/application/commands/RevokeApiKey.command";
import { AuditService, AuditEventResult } from "../../audit/audit.service";
import {
  UpdateOrganizationSettingsDto,
  AddUserToOrganizationDto,
  AuthOrganizationResponseDto,
  OrganizationUserResponseDto,
} from "../dto/organization.dto";

/**
 * Organization Controller
 *
 * Handles organization management endpoints with authorization guards and API key management.
 *
 * Requirements:
 * - 13.4: Support multiple administrators per organization
 * - 13.5: Allow administrators to invite users and assign roles
 * - 13.6: Only organization creator can modify organization settings
 * - 13.7: Non-creator administrators receive authorization error when attempting to modify settings
 */
@ApiTags("organizations")
@Controller("organizations")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get current user's organization details
   *
   * @param req - Request object containing authenticated user
   * @returns Organization details
   */
  @Get("me")
  @ApiOperation({
    summary: "Get current user organization",
    description: "Retrieve the organization details for the authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "Organization details retrieved successfully",
    type: AuthOrganizationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Organization not found",
  })
  async getCurrentUserOrganization(
    @Request() req,
  ): Promise<AuthOrganizationResponseDto> {
    const userId = req.user.userId;
    const user = await this.organizationService["userRepository"].findOne({
      where: { id: userId },
    });

    if (!user || !user.organization_id) {
      throw new NotFoundException("Organization not found");
    }

    const organization = await this.organizationService.getOrganization(
      user.organization_id,
    );

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    // Get entity for timestamps
    const orgEntity = await this.organizationService.getOrganizationEntity(
      user.organization_id,
    );

    return {
      id: organization.id.getValue(),
      name: organization.name,
      code: organization.code,
      description: organization.description,
      domain: organization.domain,
      creatorUserId: user.id, // This should be fetched from organization metadata
      createdAt: orgEntity?.created_at || new Date(),
      updatedAt: orgEntity?.updated_at || new Date(),
    };
  }

  /**
   * Get organization by ID
   *
   * @param organizationId - Organization ID
   * @param req - Request object containing authenticated user
   * @returns Organization details
   */
  @Get(":organizationId")
  @ApiOperation({
    summary: "Get organization by ID",
    description: "Retrieve organization details by organization ID",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Organization details retrieved successfully",
    type: AuthOrganizationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Organization not found",
    schema: {
      example: {
        error: {
          code: "ORGANIZATION_NOT_FOUND",
          message: "Organization not found",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async getOrganization(
    @Param("organizationId") organizationId: string,
    @Request() req,
  ): Promise<AuthOrganizationResponseDto> {
    const userId = req.user.userId;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      const organization =
        await this.organizationService.getOrganization(organizationId);

      if (!organization) {
        throw new NotFoundException("Organization not found");
      }

      // Get organization entity for timestamps
      const orgEntity =
        await this.organizationService.getOrganizationEntity(organizationId);

      // Get creator user ID
      const users =
        await this.organizationService.getOrganizationUsers(organizationId);
      const creator = users.find((u) => u.isOrganizationCreator);

      // Log audit event
      this.auditService.logAuth("get_organization", AuditEventResult.SUCCESS, {
        userId,
        organizationId,
        resource: "organization",
        ipAddress: ip,
        userAgent,
      });

      return {
        id: organization.id.getValue(),
        name: organization.name,
        code: organization.code,
        description: organization.description,
        domain: organization.domain,
        creatorUserId: creator?.id || "",
        createdAt: orgEntity?.created_at || new Date(),
        updatedAt: orgEntity?.updated_at || new Date(),
      };
    } catch (error) {
      this.auditService.logAuth("get_organization", AuditEventResult.FAILURE, {
        userId,
        organizationId,
        resource: "organization",
        ipAddress: ip,
        userAgent,
        metadata: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Update organization settings
   * Only the organization creator can modify organization settings
   *
   * @param organizationId - Organization ID
   * @param dto - Organization settings to update
   * @param req - Request object containing authenticated user
   */
  @Put(":organizationId/settings")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Update organization settings",
    description:
      "Update organization settings. Only the organization creator can modify settings. Non-creator administrators will receive an authorization error.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({
    type: UpdateOrganizationSettingsDto,
    examples: {
      example1: {
        summary: "Update organization name",
        value: {
          name: "My Updated Organization",
        },
      },
      example2: {
        summary: "Update all settings",
        value: {
          name: "My Organization",
          description: "Updated description",
          domain: "myorg.com",
        },
      },
    },
  })
  @ApiResponse({
    status: 204,
    description: "Organization settings updated successfully",
  })
  @ApiResponse({
    status: 403,
    description:
      "Only the organization creator can modify organization settings",
    schema: {
      example: {
        error: {
          code: "UNAUTHORIZED_ORGANIZATION_SETTINGS",
          message:
            "Only the organization creator can modify organization settings",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Organization not found",
  })
  async updateOrganizationSettings(
    @Param("organizationId") organizationId: string,
    @Body() dto: UpdateOrganizationSettingsDto,
    @Request() req,
  ): Promise<void> {
    const userId = req.user.userId;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      await this.organizationService.updateOrganizationSettings(
        organizationId,
        userId,
        dto,
      );

      // Log audit event
      this.auditService.logAuth(
        "update_organization_settings",
        AuditEventResult.SUCCESS,
        {
          userId,
          organizationId,
          resource: "organization",
          ipAddress: ip,
          userAgent,
          metadata: { changes: dto },
        },
      );
    } catch (error) {
      this.auditService.logAuth(
        "update_organization_settings",
        AuditEventResult.FAILURE,
        {
          userId,
          organizationId,
          resource: "organization",
          ipAddress: ip,
          userAgent,
          metadata: { error: error.message },
        },
      );
      throw error;
    }
  }

  /**
   * Get all users in an organization
   *
   * @param organizationId - Organization ID
   * @param req - Request object containing authenticated user
   * @returns List of users in the organization
   */
  @Get(":organizationId/users")
  @ApiOperation({
    summary: "Get organization users",
    description:
      "Retrieve all users in an organization with their roles and status.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Organization users retrieved successfully",
    type: [OrganizationUserResponseDto],
  })
  async getOrganizationUsers(
    @Param("organizationId") organizationId: string,
    @Request() req,
  ): Promise<OrganizationUserResponseDto[]> {
    const userId = req.user.userId;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      const users =
        await this.organizationService.getOrganizationUsers(organizationId);

      // Log audit event
      this.auditService.logAuth(
        "get_organization_users",
        AuditEventResult.SUCCESS,
        {
          userId,
          organizationId,
          resource: "organization",
          ipAddress: ip,
          userAgent,
        },
      );

      return users.map((user) => ({
        id: user.id,
        username: user.email, // Use email as username since username field doesn't exist
        email: user.email,
        role: "user", // Default role since role field doesn't exist yet
        isOrganizationCreator: user.isOrganizationCreator || false,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }));
    } catch (error) {
      this.auditService.logAuth(
        "get_organization_users",
        AuditEventResult.FAILURE,
        {
          userId,
          organizationId,
          resource: "organization",
          ipAddress: ip,
          userAgent,
          metadata: { error: error.message },
        },
      );
      throw error;
    }
  }

  /**
   * Get all administrators in an organization
   *
   * @param organizationId - Organization ID
   * @param req - Request object containing authenticated user
   * @returns List of administrators in the organization
   */
  @Get(":organizationId/administrators")
  @ApiOperation({
    summary: "Get organization administrators",
    description:
      "Retrieve all administrators in an organization. Supports multiple administrators per organization.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "Organization administrators retrieved successfully",
    type: [OrganizationUserResponseDto],
  })
  async getOrganizationAdministrators(
    @Param("organizationId") organizationId: string,
    @Request() req,
  ): Promise<OrganizationUserResponseDto[]> {
    const userId = req.user.userId;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      const admins =
        await this.organizationService.getOrganizationAdministrators(
          organizationId,
        );

      // Log audit event
      this.auditService.logAuth(
        "get_organization_administrators",
        AuditEventResult.SUCCESS,
        {
          userId,
          organizationId,
          resource: "organization",
          ipAddress: ip,
          userAgent,
        },
      );

      return admins.map((user) => ({
        id: user.id,
        username: user.email, // Use email as username since username field doesn't exist
        email: user.email,
        role: "administrator", // Default role
        isOrganizationCreator: user.isOrganizationCreator || false,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }));
    } catch (error) {
      this.auditService.logAuth(
        "get_organization_administrators",
        AuditEventResult.FAILURE,
        {
          userId,
          organizationId,
          resource: "organization",
          ipAddress: ip,
          userAgent,
          metadata: { error: error.message },
        },
      );
      throw error;
    }
  }

  /**
   * Add a user to an organization
   * Only administrators can add users to an organization
   *
   * @param organizationId - Organization ID
   * @param dto - User details to add
   * @param req - Request object containing authenticated user
   */
  @Post(":organizationId/users")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Add user to organization",
    description:
      "Add a user to an organization with a specific role. Administrators can invite users and assign roles (administrator, developer, viewer, demo).",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({
    type: AddUserToOrganizationDto,
    examples: {
      example1: {
        summary: "Add administrator",
        value: {
          userId: "123e4567-e89b-12d3-a456-426614174001",
          role: "administrator",
        },
      },
      example2: {
        summary: "Add developer",
        value: {
          userId: "123e4567-e89b-12d3-a456-426614174002",
          role: "developer",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "User added to organization successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Only administrators can add users to an organization",
  })
  @ApiResponse({
    status: 404,
    description: "User or organization not found",
  })
  async addUserToOrganization(
    @Param("organizationId") organizationId: string,
    @Body() dto: AddUserToOrganizationDto,
    @Request() req,
  ): Promise<void> {
    const userId = req.user.userId;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      await this.organizationService.addUserToOrganization(
        organizationId,
        dto.userId,
        dto.role,
      );

      // Log audit event
      this.auditService.logAuth(
        "add_user_to_organization",
        AuditEventResult.SUCCESS,
        {
          userId,
          organizationId,
          resource: "organization",
          ipAddress: ip,
          userAgent,
          metadata: { targetUserId: dto.userId, role: dto.role },
        },
      );
    } catch (error) {
      this.auditService.logAuth(
        "add_user_to_organization",
        AuditEventResult.FAILURE,
        {
          userId,
          organizationId,
          resource: "organization",
          ipAddress: ip,
          userAgent,
          metadata: { targetUserId: dto.userId, error: error.message },
        },
      );
      throw error;
    }
  }

  /**
   * Get all API keys for an organization
   *
   * @param organizationId - Organization ID
   * @param req - Request object containing authenticated user
   * @returns List of API keys for the organization
   */
  @Get(":organizationId/api-keys")
  @ApiOperation({
    summary: "Get organization API keys",
    description:
      "Retrieve all API keys for an organization. Keys are returned with masked secrets for security.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "API keys retrieved successfully",
    schema: {
      example: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "TELEMETRYFLOW_API_KEY_ID",
          description: "Default API Key ID for telemetry ingestion",
          keyType: "secret",
          keyPrefix: "tfk_",
          keyHint: "****1234",
          permissions: ["telemetry:write", "telemetry:read"],
          scopes: ["telemetry"],
          isActive: true,
          createdAt: "2024-01-01T00:00:00.000Z",
          lastUsedAt: "2024-01-15T10:30:00.000Z",
        },
      ],
    },
  })
  async getOrganizationApiKeys(
    @Param("organizationId") organizationId: string,
    @Request() req,
  ): Promise<any[]> {
    const userId = req.user.userId;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      const apiKeys = await this.queryBus.execute(
        new ListApiKeysQuery(organizationId),
      );

      // Log audit event
      this.auditService.logAuth(
        "get_organization_api_keys",
        AuditEventResult.SUCCESS,
        {
          userId,
          organizationId,
          resource: "api-keys",
          ipAddress: ip,
          userAgent,
        },
      );

      return apiKeys;
    } catch (error) {
      this.auditService.logAuth(
        "get_organization_api_keys",
        AuditEventResult.FAILURE,
        {
          userId,
          organizationId,
          resource: "api-keys",
          ipAddress: ip,
          userAgent,
          metadata: { error: error.message },
        },
      );
      throw error;
    }
  }

  /**
   * Rotate an API key
   *
   * @param organizationId - Organization ID
   * @param apiKeyId - API key ID to rotate
   * @param req - Request object containing authenticated user
   * @returns New API key value
   */
  @Post(":organizationId/api-keys/:apiKeyId/rotate")
  @ApiOperation({
    summary: "Rotate API key",
    description:
      "Rotate an API key to generate a new secret. The old key will be invalidated and a new key will be returned.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "apiKeyId",
    description: "API key ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 200,
    description: "API key rotated successfully",
    schema: {
      example: {
        newKey: "tfk_new_secret_key_here",
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "API key not found",
  })
  async rotateApiKey(
    @Param("organizationId") organizationId: string,
    @Param("apiKeyId") apiKeyId: string,
    @Request() req,
  ): Promise<{ newKey: string }> {
    const userId = req.user.userId;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      const result = await this.commandBus.execute(
        new RotateApiKeyCommand(apiKeyId, organizationId, userId),
      );

      // Log audit event
      this.auditService.logAuth("rotate_api_key", AuditEventResult.SUCCESS, {
        userId,
        organizationId,
        resource: "api-keys",
        ipAddress: ip,
        userAgent,
        metadata: { apiKeyId },
      });

      return { newKey: result };
    } catch (error) {
      this.auditService.logAuth("rotate_api_key", AuditEventResult.FAILURE, {
        userId,
        organizationId,
        resource: "api-keys",
        ipAddress: ip,
        userAgent,
        metadata: { apiKeyId, error: error.message },
      });
      throw error;
    }
  }

  /**
   * Revoke an API key
   *
   * @param organizationId - Organization ID
   * @param apiKeyId - API key ID to revoke
   * @param req - Request object containing authenticated user
   */
  @Post(":organizationId/api-keys/:apiKeyId/revoke")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Revoke API key",
    description:
      "Revoke an API key to prevent further use. The key will be permanently disabled.",
  })
  @ApiParam({
    name: "organizationId",
    description: "Organization ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "apiKeyId",
    description: "API key ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 204,
    description: "API key revoked successfully",
  })
  @ApiResponse({
    status: 404,
    description: "API key not found",
  })
  async revokeApiKey(
    @Param("organizationId") organizationId: string,
    @Param("apiKeyId") apiKeyId: string,
    @Request() req,
  ): Promise<void> {
    const userId = req.user.userId;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      await this.commandBus.execute(
        new RevokeApiKeyCommand(apiKeyId, userId, "Revoked by user"),
      );

      // Log audit event
      this.auditService.logAuth("revoke_api_key", AuditEventResult.SUCCESS, {
        userId,
        organizationId,
        resource: "api-keys",
        ipAddress: ip,
        userAgent,
        metadata: { apiKeyId },
      });
    } catch (error) {
      this.auditService.logAuth("revoke_api_key", AuditEventResult.FAILURE, {
        userId,
        organizationId,
        resource: "api-keys",
        ipAddress: ip,
        userAgent,
        metadata: { apiKeyId, error: error.message },
      });
      throw error;
    }
  }
}
