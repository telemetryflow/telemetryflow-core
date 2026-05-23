import {
  Controller,
  Get,
  Post,
  Put,
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../../auth/guards/permissions.guard";
import { RequirePermissions } from "../../../auth/decorators/permissions.decorator";
import { AuthenticatedUser } from "../../../auth/interfaces/jwt-payload.interface";
import {
  CreateNotificationChannelRequestDto,
  UpdateNotificationChannelRequestDto,
} from "../dto";
import { NotificationChannelService } from "../../application/services";

@ApiTags("notification-channels")
@ApiBearerAuth()
@Controller("notification-channels")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationChannelsController {
  constructor(
    private readonly notificationChannelService: NotificationChannelService,
  ) {}

  @Post()
  @RequirePermissions("alert:write")
  @ApiOperation({
    summary: "Create notification channel",
    description:
      "Create a new notification channel (email, slack, webhook, etc.)",
  })
  @ApiBody({ type: CreateNotificationChannelRequestDto })
  @ApiResponse({
    status: 201,
    description: "Notification channel created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @ApiResponse({ status: 409, description: "Channel name already exists" })
  async create(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: CreateNotificationChannelRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    return this.notificationChannelService.create({
      organizationId: req.user.organizationId,
      name: dto.name,
      type: dto.type,
      config: dto.config,
      description: dto.description,
      sendResolved: dto.sendResolved,
      sendReminder: dto.sendReminder,
      reminderInterval: dto.reminderInterval,
    });
  }

  @Get()
  @RequirePermissions("alert:read")
  @ApiOperation({
    summary: "List notification channels",
    description: "Get all notification channels for the organization",
  })
  @ApiQuery({ name: "enabled", required: false, type: Boolean })
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiResponse({ status: 200, description: "List of notification channels" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async list(
    @Request() req: { user: AuthenticatedUser },
    @Query("enabled") enabled?: string,
    @Query("type") type?: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    return this.notificationChannelService.findByOrganization(
      req.user.organizationId,
      {
        enabled: enabled !== undefined ? enabled === "true" : undefined,
        type,
      },
    );
  }

  @Get("defaults")
  @RequirePermissions("alert:read")
  @ApiOperation({
    summary: "Get default notification channels",
    description: "Get all channels marked as default for the organization",
  })
  @ApiResponse({ status: 200, description: "List of default channel IDs" })
  async getDefaults(@Request() req: { user: AuthenticatedUser }) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }
    const channels = await this.notificationChannelService.getDefaults(req.user.organizationId);
    return { channelIds: channels.map((c) => c.id) };
  }

  @Put("defaults")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Set default notification channels",
    description: "Replace the full list of default channels for the organization",
  })
  @ApiBody({ schema: { type: "object", properties: { channelIds: { type: "array", items: { type: "string" } } } } })
  @ApiResponse({ status: 200, description: "Default channels updated" })
  async setDefaults(
    @Request() req: { user: AuthenticatedUser },
    @Body() body: { channelIds: string[] },
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }
    await this.notificationChannelService.setDefaults(req.user.organizationId, body.channelIds || []);
    return { channelIds: body.channelIds || [] };
  }

  @Get(":id")
  @RequirePermissions("alert:read")
  @ApiOperation({
    summary: "Get notification channel",
    description: "Get notification channel details by ID",
  })
  @ApiParam({ name: "id", description: "Notification channel ID" })
  @ApiResponse({ status: 200, description: "Notification channel details" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Notification channel not found" })
  async get(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    return this.notificationChannelService.findById(
      id,
      req.user.organizationId,
    );
  }

  @Patch(":id")
  @RequirePermissions("alert:write")
  @ApiOperation({
    summary: "Update notification channel",
    description: "Update notification channel details",
  })
  @ApiParam({ name: "id", description: "Notification channel ID" })
  @ApiBody({ type: UpdateNotificationChannelRequestDto })
  @ApiResponse({
    status: 200,
    description: "Notification channel updated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Notification channel not found" })
  @ApiResponse({ status: 409, description: "Channel name already exists" })
  async update(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
    @Body() dto: UpdateNotificationChannelRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    return this.notificationChannelService.update(
      id,
      req.user.organizationId,
      dto,
    );
  }

  @Post(":id/enable")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Enable notification channel",
    description: "Enable a notification channel",
  })
  @ApiParam({ name: "id", description: "Notification channel ID" })
  @ApiResponse({ status: 200, description: "Notification channel enabled" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Notification channel not found" })
  async enable(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    return this.notificationChannelService.enable(id, req.user.organizationId);
  }

  @Post(":id/disable")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Disable notification channel",
    description: "Disable a notification channel",
  })
  @ApiParam({ name: "id", description: "Notification channel ID" })
  @ApiResponse({ status: 200, description: "Notification channel disabled" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Notification channel not found" })
  async disable(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    return this.notificationChannelService.disable(id, req.user.organizationId);
  }

  @Post(":id/test")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Test notification channel",
    description: "Send a test notification to verify the channel configuration",
  })
  @ApiParam({ name: "id", description: "Notification channel ID" })
  @ApiResponse({ status: 200, description: "Test notification sent" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Notification channel not found" })
  async test(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    return this.notificationChannelService.testChannel(
      id,
      req.user.organizationId,
    );
  }

  @Delete(":id")
  @RequirePermissions("alert:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete notification channel",
    description: "Delete a notification channel",
  })
  @ApiParam({ name: "id", description: "Notification channel ID" })
  @ApiResponse({ status: 204, description: "Notification channel deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Notification channel not found" })
  async delete(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    await this.notificationChannelService.delete(id, req.user.organizationId);
  }
}
