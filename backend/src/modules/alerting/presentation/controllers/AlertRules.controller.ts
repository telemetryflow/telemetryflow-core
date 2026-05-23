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
  CreateAlertRuleRequestDto,
  UpdateAlertRuleRequestDto,
  ListAlertRulesQueryDto,
  ValidateTfqlQueryRequestDto,
  TfqlValidationResultDto,
} from "../dto";
import { TfqlValidationService } from "../../application/services";
import {
  ConditionAggregation,
  ConditionOperator,
} from "../../domain/value-objects/AlertCondition";
import {
  CreateAlertRuleCommand,
  UpdateAlertRuleCommand,
  DeleteAlertRuleCommand,
  EnableAlertRuleCommand,
  DisableAlertRuleCommand,
} from "../../application/commands";
import {
  GetAlertRuleQuery,
  ListAlertRulesQuery,
} from "../../application/queries";

@ApiTags("alert-rules")
@ApiBearerAuth()
@Controller("alert-rules")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertRulesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly tfqlValidationService: TfqlValidationService,
  ) {}

  @Post()
  @RequirePermissions("alert:write")
  @ApiOperation({
    summary: "Create alert rule",
    description:
      "Create a new alert rule with conditions and notification channels",
  })
  @ApiBody({ type: CreateAlertRuleRequestDto })
  @ApiResponse({
    status: 201,
    description: "Alert rule created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async create(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: CreateAlertRuleRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new CreateAlertRuleCommand(
      req.user.organizationId,
      dto.name,
      req.user.userId,
      dto.description,
      dto.severity,
      dto.conditions?.map((c) => ({
        ...c,
        aggregation: c.aggregation ?? ConditionAggregation.AVG,
        operator: c.operator ?? ConditionOperator.GREATER_THAN,
      })),
      dto.notificationChannels?.map((nc) => ({
        channelId: nc.channelId,
        sendOnResolve: nc.sendOnResolve ?? true,
      })),
      dto.labels,
      dto.annotations,
      dto.evaluationInterval,
      dto.forDuration,
      dto.workspaceId,
      dto.muteTimings,
      dto.queryLanguage,
      dto.queryString,
      dto.queryTarget,
      dto.sourceType,
    );

    return this.commandBus.execute(command);
  }

  @Get()
  @RequirePermissions("alert:read")
  @ApiOperation({
    summary: "List alert rules",
    description:
      "Get all alert rules for the organization with pagination and filters",
  })
  @ApiResponse({ status: 200, description: "List of alert rules" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  async list(
    @Request() req: { user: AuthenticatedUser },
    @Query() queryDto: ListAlertRulesQueryDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const query = new ListAlertRulesQuery(
      req.user.organizationId,
      queryDto.page,
      queryDto.pageSize,
      queryDto.enabled,
      queryDto.severity,
      queryDto.state,
      queryDto.search,
      queryDto.graphId,
    );

    return this.queryBus.execute(query);
  }

  @Post("validate-tfql")
  @RequirePermissions("alert:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Validate TFQL query",
    description:
      "Validate a TelemetryFlow Query Language (TFQL) query string for syntax and structure",
  })
  @ApiBody({ type: ValidateTfqlQueryRequestDto })
  @ApiResponse({
    status: 200,
    description: "Validation result",
    type: TfqlValidationResultDto,
  })
  @ApiResponse({ status: 400, description: "Invalid request body" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  validateTfqlQuery(
    @Body() dto: ValidateTfqlQueryRequestDto,
  ): TfqlValidationResultDto {
    return this.tfqlValidationService.validate(dto);
  }

  @Get(":id")
  @RequirePermissions("alert:read")
  @ApiOperation({
    summary: "Get alert rule",
    description: "Get alert rule details by ID",
  })
  @ApiParam({ name: "id", description: "Alert rule ID" })
  @ApiResponse({ status: 200, description: "Alert rule details" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert rule not found" })
  async get(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const query = new GetAlertRuleQuery(id, req.user.organizationId);
    return this.queryBus.execute(query);
  }

  @Patch(":id")
  @RequirePermissions("alert:write")
  @ApiOperation({
    summary: "Update alert rule",
    description: "Update alert rule details",
  })
  @ApiParam({ name: "id", description: "Alert rule ID" })
  @ApiBody({ type: UpdateAlertRuleRequestDto })
  @ApiResponse({ status: 200, description: "Alert rule updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert rule not found" })
  async update(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
    @Body() dto: UpdateAlertRuleRequestDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new UpdateAlertRuleCommand(
      id,
      req.user.organizationId,
      dto.name,
      dto.description,
      dto.severity,
      dto.conditions?.map((c) => ({
        ...c,
        aggregation: c.aggregation ?? ConditionAggregation.AVG,
        operator: c.operator ?? ConditionOperator.GREATER_THAN,
      })),
      dto.notificationChannels?.map((nc) => ({
        channelId: nc.channelId,
        sendOnResolve: nc.sendOnResolve ?? true,
      })),
      dto.labels,
      dto.annotations,
      dto.evaluationInterval,
      dto.forDuration,
      dto.muteTimings,
    );

    return this.commandBus.execute(command);
  }

  @Post(":id/enable")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Enable alert rule",
    description: "Enable an alert rule for evaluation",
  })
  @ApiParam({ name: "id", description: "Alert rule ID" })
  @ApiResponse({ status: 200, description: "Alert rule enabled" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert rule not found" })
  async enable(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new EnableAlertRuleCommand(id, req.user.organizationId);
    return this.commandBus.execute(command);
  }

  @Post(":id/disable")
  @RequirePermissions("alert:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Disable alert rule",
    description: "Disable an alert rule to stop evaluation",
  })
  @ApiParam({ name: "id", description: "Alert rule ID" })
  @ApiResponse({ status: 200, description: "Alert rule disabled" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert rule not found" })
  async disable(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new DisableAlertRuleCommand(id, req.user.organizationId);
    return this.commandBus.execute(command);
  }

  @Delete(":id")
  @RequirePermissions("alert:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete alert rule",
    description:
      "Delete an alert rule (this will also delete all associated alert instances)",
  })
  @ApiParam({ name: "id", description: "Alert rule ID" })
  @ApiResponse({ status: 204, description: "Alert rule deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Alert rule not found" })
  async delete(
    @Request() req: { user: AuthenticatedUser },
    @Param("id") id: string,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException("User must belong to an organization");
    }

    const command = new DeleteAlertRuleCommand(id, req.user.organizationId);
    await this.commandBus.execute(command);
  }
}
