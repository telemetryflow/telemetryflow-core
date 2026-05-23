import {
  Controller,
  Get,
  Post,
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
  ListAlertInstancesQueryDto,
  AcknowledgeAlertRequestDto,
  ResolveAlertRequestDto,
  SilenceAlertRequestDto,
} from "../dto";
import {
  AcknowledgeAlertCommand,
  ResolveAlertCommand,
  SilenceAlertCommand,
} from "../../application/commands";
import {
  GetAlertInstanceQuery,
  ListAlertInstancesQuery,
  GetAlertStatsQuery,
} from "../../application/queries";

@ApiTags("alert-instances")
@ApiBearerAuth()
@Controller("alert-instances")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertInstancesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequirePermissions("alert:read")
  @ApiOperation({
    summary: "List alert instances",
    description:
      "Get all alert instances for the organization with pagination and filters",
  })
  @ApiResponse({ status: 200, description: "List of alert instances" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async list(
    @Request() req: { user: AuthenticatedUser },
    @Query() queryDto: ListAlertInstancesQueryDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const query = new ListAlertInstancesQuery(
      req.user.organizationId,
      queryDto.page,
      queryDto.pageSize,
      queryDto.status,
      queryDto.severity,
      queryDto.alertRuleId,
      queryDto.startDate ? new Date(queryDto.startDate) : undefined,
      queryDto.endDate ? new Date(queryDto.endDate) : undefined,
    );

    const data = await this.queryBus.execute(query);
    return { status: "success", data };
  }

  @Get("stats")
  @RequirePermissions("alert:read")
  @ApiOperation({
    summary: "Get alert statistics",
    description: "Get alert statistics for the organization",
  })
  @ApiResponse({ status: 200, description: "Alert statistics" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async getStats(@Request() req: { user: AuthenticatedUser }) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const query = new GetAlertStatsQuery(req.user.organizationId);
    const data = await this.queryBus.execute(query);
    return { status: "success", data };
  }

  @Get(":id")
  @RequirePermissions("alert:read")
  @ApiOperation({
    summary: "Get alert instance",
    description: "Get alert instance details by ID",
  })
  @ApiParam({ name: "id", description: "Alert instance ID" })
  @ApiResponse({ status: 200, description: "Alert instance details" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert instance not found" })
  async get(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const query = new GetAlertInstanceQuery(id, req.user.organizationId);
    const data = await this.queryBus.execute(query);
    return { status: "success", data };
  }

  @Post(":id/acknowledge")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Acknowledge alert",
    description:
      "Acknowledge an alert instance to indicate it is being worked on",
  })
  @ApiParam({ name: "id", description: "Alert instance ID" })
  @ApiBody({ type: AcknowledgeAlertRequestDto, required: false })
  @ApiResponse({ status: 200, description: "Alert acknowledged" })
  @ApiResponse({
    status: 400,
    description: "Cannot acknowledge resolved alert",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert instance not found" })
  async acknowledge(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
    @Body() dto?: AcknowledgeAlertRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new AcknowledgeAlertCommand(
      id,
      req.user.organizationId,
      req.user.userId,
      dto?.comment,
    );

    const data = await this.commandBus.execute(command);
    return { status: "success", data };
  }

  @Post(":id/resolve")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Resolve alert",
    description: "Manually resolve an alert instance",
  })
  @ApiParam({ name: "id", description: "Alert instance ID" })
  @ApiBody({ type: ResolveAlertRequestDto, required: false })
  @ApiResponse({ status: 200, description: "Alert resolved" })
  @ApiResponse({ status: 400, description: "Alert already resolved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert instance not found" })
  async resolve(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
    @Body() dto?: ResolveAlertRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new ResolveAlertCommand(
      id,
      req.user.organizationId,
      req.user.userId,
      dto?.resolution,
    );

    const data = await this.commandBus.execute(command);
    return { status: "success", data };
  }

  @Post(":id/silence")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Silence alert",
    description: "Silence an alert instance until a specified time",
  })
  @ApiParam({ name: "id", description: "Alert instance ID" })
  @ApiBody({ type: SilenceAlertRequestDto })
  @ApiResponse({ status: 200, description: "Alert silenced" })
  @ApiResponse({ status: 400, description: "Cannot silence resolved alert" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert instance not found" })
  async silence(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
    @Body() dto: SilenceAlertRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new SilenceAlertCommand(
      id,
      req.user.organizationId,
      new Date(dto.until),
      req.user.userId,
      dto.reason,
    );

    const data = await this.commandBus.execute(command);
    return { status: "success", data };
  }
}
