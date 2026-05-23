import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../auth/guards/permissions.guard";
import { RequirePermissions } from "../../../auth/decorators/permissions.decorator";
import { AuthenticatedUser } from "../../../auth/interfaces/jwt-payload.interface";
import {
  CreateApiKeyRequestDto,
  UpdateApiKeyRequestDto,
  RevokeApiKeyRequestDto,
  ListApiKeysQueryDto,
} from "../dto";
import {
  CreateApiKeyCommand,
  UpdateApiKeyCommand,
  RevokeApiKeyCommand,
  DeleteApiKeyCommand,
  RotateApiKeyCommand,
  ActivateApiKeyCommand,
  DeactivateApiKeyCommand,
} from "../../application/commands";
import { GetApiKeyQuery, ListApiKeysQuery } from "../../application/queries";

@ApiTags("api-keys")
@ApiBearerAuth()
@Controller("api-keys")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApiKeysController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions("api-keys:write")
  @ApiOperation({
    summary: "Create API key",
    description:
      "Create a new API key for the organization. The raw key is only shown once.",
  })
  @ApiBody({ type: CreateApiKeyRequestDto })
  @ApiResponse({
    status: 201,
    description:
      "API key created successfully. The raw key is included in the response.",
  })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async create(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: CreateApiKeyRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new CreateApiKeyCommand(
      dto.name,
      dto.description,
      dto.keyType || "standard",
      dto.permissions || [],
      dto.scopes || [],
      dto.rateLimit,
      dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      req.user.organizationId,
      dto.workspaceId,
      undefined, // tenantId
      req.user.userId,
    );

    return this.commandBus.execute(command);
  }

  @Get()
  @RequirePermissions("api-keys:read")
  @ApiOperation({
    summary: "List API keys",
    description: "Get all API keys for the organization with pagination",
  })
  @ApiResponse({ status: 200, description: "List of API keys" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async list(
    @Request() req: { user: AuthenticatedUser },
    @Query() queryDto: ListApiKeysQueryDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const query = new ListApiKeysQuery(
      req.user.organizationId,
      queryDto.page,
      queryDto.pageSize,
      queryDto.isActive,
      queryDto.keyType,
      queryDto.search,
    );

    return this.queryBus.execute(query);
  }

  @Get(":id")
  @RequirePermissions("api-keys:read")
  @ApiOperation({
    summary: "Get API key",
    description: "Get API key details by ID",
  })
  @ApiParam({ name: "id", description: "API key ID" })
  @ApiResponse({ status: 200, description: "API key details" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async get(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const query = new GetApiKeyQuery(id, req.user.organizationId);
    return this.queryBus.execute(query);
  }

  @Patch(":id")
  @RequirePermissions("api-keys:write")
  @ApiOperation({
    summary: "Update API key",
    description: "Update API key details",
  })
  @ApiParam({ name: "id", description: "API key ID" })
  @ApiBody({ type: UpdateApiKeyRequestDto })
  @ApiResponse({ status: 200, description: "API key updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async update(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
    @Body() dto: UpdateApiKeyRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new UpdateApiKeyCommand(
      id,
      req.user.organizationId,
      dto.name,
      dto.description,
      dto.permissions,
      dto.scopes,
      dto.rateLimit,
      dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    );

    return this.commandBus.execute(command);
  }

  @Post(":id/rotate")
  @RequirePermissions("api-keys:write")
  @ApiOperation({
    summary: "Rotate API key",
    description: "Generate a new key while keeping the same API key record",
  })
  @ApiParam({ name: "id", description: "API key ID" })
  @ApiResponse({
    status: 200,
    description: "API key rotated. New raw key is included in the response.",
  })
  @ApiResponse({ status: 400, description: "Cannot rotate revoked key" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async rotate(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new RotateApiKeyCommand(
      id,
      req.user.organizationId,
      req.user.userId,
    );

    return this.commandBus.execute(command);
  }

  @Post(":id/activate")
  @RequirePermissions("api-keys:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Activate API key",
    description: "Activate a deactivated API key",
  })
  @ApiParam({ name: "id", description: "API key ID" })
  @ApiResponse({ status: 200, description: "API key activated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async activate(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new ActivateApiKeyCommand(id, req.user.organizationId);
    return this.commandBus.execute(command);
  }

  @Post(":id/deactivate")
  @RequirePermissions("api-keys:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Deactivate API key",
    description: "Temporarily deactivate an API key (can be reactivated)",
  })
  @ApiParam({ name: "id", description: "API key ID" })
  @ApiResponse({ status: 200, description: "API key deactivated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async deactivate(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new DeactivateApiKeyCommand(id, req.user.organizationId);
    return this.commandBus.execute(command);
  }

  @Post(":id/revoke")
  @RequirePermissions("api-keys:write")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Revoke API key",
    description:
      "Permanently revoke an API key so it can no longer be used (soft revoke)",
  })
  @ApiParam({ name: "id", description: "API key ID" })
  @ApiBody({ type: RevokeApiKeyRequestDto, required: false })
  @ApiResponse({ status: 204, description: "API key revoked" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async revoke(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
    @Body() dto?: RevokeApiKeyRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new RevokeApiKeyCommand(
      id,
      req.user.organizationId,
      req.user.userId,
      dto?.reason,
    );

    await this.commandBus.execute(command);
  }

  @Delete(":id")
  @RequirePermissions("api-keys:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete API key",
    description:
      "Permanently delete an API key record from the database (hard delete)",
  })
  @ApiParam({ name: "id", description: "API key ID" })
  @ApiResponse({ status: 204, description: "API key deleted" })
  @ApiResponse({ status: 400, description: "System keys cannot be deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async delete(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new DeleteApiKeyCommand(
      id,
      req.user.organizationId,
      req.user.userId,
    );
    await this.commandBus.execute(command);
  }
}
