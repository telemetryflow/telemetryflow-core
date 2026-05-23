import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { CurrentUser } from "@/modules/auth/presentation/decorators/current-user.decorator";

import {
  QueryMetricsQuery,
  GetMetricNamesQuery,
  GetLabelValuesQuery,
  QueryLogsQuery,
  GetLogSeverityLevelsQuery,
  GetLogCountBySeverityQuery,
  QueryTracesQuery,
  GetTraceByIdQuery,
  GetTraceSummariesQuery,
  GetTraceServiceNamesQuery,
  GetSpanNamesQuery,
} from "../../application/queries";
import {
  TimeRange,
  TenantContext,
  AggregationInterval,
} from "../../domain/value-objects";
import {
  MetricsQueryRequestDto,
  LogsQueryRequestDto,
  TracesQueryRequestDto,
  GetMetricNamesRequestDto,
  GetLabelValuesRequestDto,
  GetServiceNamesRequestDto,
} from "../dto";
import {
  UnifiedQueryResponseDto,
  MetricDataPointDto,
  LogEntryDto,
  TraceSpanDto,
  TraceSummaryDto,
  MetricNamesResponseDto,
  LabelValuesResponseDto,
  ServiceNamesResponseDto,
  SeverityCountResponseDto,
} from "../dto";

@ApiTags("query-signals")
@ApiBearerAuth()
@Controller("query/signals")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SignalsQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  // ==================== METRICS ====================

  @Post("metrics")
  @RequirePermissions("telemetry:metrics:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Query metrics" })
  @ApiResponse({ status: 200, description: "Metrics query result" })
  async queryMetrics(
    @Body() dto: MetricsQueryRequestDto,
    @CurrentUser() user: { organizationId: string },
  ): Promise<UnifiedQueryResponseDto<MetricDataPointDto>> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
      workspaceId: dto.workspaceId,
      tenantId: dto.tenantId,
    });

    const timeRange = TimeRange.fromStrings(dto.from, dto.to);

    const query = new QueryMetricsQuery(
      tenantContext,
      timeRange,
      {
        metricName: dto.metricName,
        metricNames: dto.metricNames,
        serviceName: dto.serviceName,
        labels: dto.labels,
      },
      dto.pagination,
      {
        aggregation: dto.aggregation as any,
        interval: dto.interval
          ? AggregationInterval.fromString(dto.interval)
          : undefined,
        includePercentiles: dto.includePercentiles,
      },
    );

    return this.queryBus.execute(query);
  }

  @Get("metrics/names")
  @RequirePermissions("telemetry:metrics:read")
  @ApiOperation({ summary: "Get available metric names" })
  @ApiResponse({ status: 200, type: MetricNamesResponseDto })
  async getMetricNames(
    @Query() dto: GetMetricNamesRequestDto,
    @CurrentUser() user: { organizationId: string },
  ): Promise<MetricNamesResponseDto> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
    });

    const query = new GetMetricNamesQuery(tenantContext, dto.prefix, dto.limit);

    const names = await this.queryBus.execute<GetMetricNamesQuery, string[]>(
      query,
    );

    return {
      names,
      total: names.length,
    };
  }

  @Get("metrics/labels/:labelName")
  @RequirePermissions("telemetry:metrics:read")
  @ApiOperation({ summary: "Get label values for a metric" })
  @ApiParam({ name: "labelName", description: "Label name" })
  @ApiResponse({ status: 200, type: LabelValuesResponseDto })
  async getLabelValues(
    @Param("labelName") labelName: string,
    @Query() dto: GetLabelValuesRequestDto,
    @CurrentUser() user: { organizationId: string },
  ): Promise<LabelValuesResponseDto> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
    });

    const query = new GetLabelValuesQuery(
      tenantContext,
      labelName,
      dto.metricName,
      dto.limit,
    );

    const values = await this.queryBus.execute<GetLabelValuesQuery, string[]>(
      query,
    );

    return {
      label: labelName,
      values,
      total: values.length,
    };
  }

  // ==================== LOGS ====================

  @Post("logs")
  @RequirePermissions("telemetry:logs:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Query logs" })
  @ApiResponse({ status: 200, description: "Logs query result" })
  async queryLogs(
    @Body() dto: LogsQueryRequestDto,
    @CurrentUser() user: { organizationId: string },
  ): Promise<UnifiedQueryResponseDto<LogEntryDto>> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
      workspaceId: dto.workspaceId,
      tenantId: dto.tenantId,
    });

    const timeRange = TimeRange.fromStrings(dto.from, dto.to);

    const query = new QueryLogsQuery(
      tenantContext,
      timeRange,
      {
        query: dto.query,
        severityText: dto.severityText,
        severityTexts: dto.severityTexts,
        minSeverity: dto.minSeverity,
        maxSeverity: dto.maxSeverity,
        serviceName: dto.serviceName,
        traceId: dto.traceId,
        spanId: dto.spanId,
        resourceAttributes: dto.resourceAttributes,
        logAttributes: dto.logAttributes,
      },
      dto.pagination,
    );

    return this.queryBus.execute(query);
  }

  @Get("logs/severity-levels")
  @RequirePermissions("telemetry:logs:read")
  @ApiOperation({ summary: "Get available severity levels" })
  @ApiResponse({ status: 200, type: [String] })
  async getLogSeverityLevels(
    @CurrentUser() user: { organizationId: string },
  ): Promise<string[]> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
    });

    const query = new GetLogSeverityLevelsQuery(tenantContext);
    return this.queryBus.execute(query);
  }

  @Post("logs/count-by-severity")
  @RequirePermissions("telemetry:logs:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get log count by severity" })
  @ApiResponse({ status: 200, type: SeverityCountResponseDto })
  async getLogCountBySeverity(
    @Body() dto: { from: string; to: string },
    @CurrentUser() user: { organizationId: string },
  ): Promise<SeverityCountResponseDto> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
    });

    const timeRange = TimeRange.fromStrings(dto.from, dto.to);
    const query = new GetLogCountBySeverityQuery(tenantContext, timeRange);

    const counts = await this.queryBus.execute<
      GetLogCountBySeverityQuery,
      Record<string, number>
    >(query);

    return { counts };
  }

  // ==================== TRACES ====================

  @Post("traces")
  @RequirePermissions("telemetry:traces:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Query traces" })
  @ApiResponse({ status: 200, description: "Traces query result" })
  async queryTraces(
    @Body() dto: TracesQueryRequestDto,
    @CurrentUser() user: { organizationId: string },
  ): Promise<UnifiedQueryResponseDto<TraceSpanDto>> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
      workspaceId: dto.workspaceId,
      tenantId: dto.tenantId,
    });

    const timeRange = TimeRange.fromStrings(dto.from, dto.to);

    const query = new QueryTracesQuery(
      tenantContext,
      timeRange,
      {
        traceId: dto.traceId,
        traceIds: dto.traceIds,
        spanName: dto.spanName,
        spanKind: dto.spanKind as any,
        serviceName: dto.serviceName,
        statusCode: dto.statusCode as any,
        minDurationMs: dto.minDurationMs,
        maxDurationMs: dto.maxDurationMs,
        hasError: dto.hasError,
        resourceAttributes: dto.resourceAttributes,
        spanAttributes: dto.spanAttributes,
      },
      dto.pagination,
    );

    return this.queryBus.execute(query);
  }

  @Get("traces/:traceId")
  @RequirePermissions("telemetry:traces:read")
  @ApiOperation({ summary: "Get trace by ID" })
  @ApiParam({ name: "traceId", description: "Trace ID" })
  @ApiResponse({ status: 200, type: [TraceSpanDto] })
  async getTraceById(
    @Param("traceId") traceId: string,
    @CurrentUser() user: { organizationId: string },
  ): Promise<TraceSpanDto[]> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
    });

    const query = new GetTraceByIdQuery(tenantContext, traceId);
    return this.queryBus.execute(query);
  }

  @Post("traces/summaries")
  @RequirePermissions("telemetry:traces:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get trace summaries" })
  @ApiResponse({ status: 200, description: "Trace summaries" })
  async getTraceSummaries(
    @Body() dto: TracesQueryRequestDto,
    @CurrentUser() user: { organizationId: string },
  ): Promise<UnifiedQueryResponseDto<TraceSummaryDto>> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
      workspaceId: dto.workspaceId,
      tenantId: dto.tenantId,
    });

    const timeRange = TimeRange.fromStrings(dto.from, dto.to);

    const query = new GetTraceSummariesQuery(
      tenantContext,
      timeRange,
      {
        serviceName: dto.serviceName,
        hasError: dto.hasError,
        minDurationMs: dto.minDurationMs,
        maxDurationMs: dto.maxDurationMs,
      },
      dto.pagination,
    );

    return this.queryBus.execute(query);
  }

  @Get("traces/services")
  @RequirePermissions("telemetry:traces:read")
  @ApiOperation({ summary: "Get available service names from traces" })
  @ApiResponse({ status: 200, type: ServiceNamesResponseDto })
  async getTraceServiceNames(
    @Query() dto: GetServiceNamesRequestDto,
    @CurrentUser() user: { organizationId: string },
  ): Promise<ServiceNamesResponseDto> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
    });

    const query = new GetTraceServiceNamesQuery(tenantContext, dto.limit);
    const names = await this.queryBus.execute<
      GetTraceServiceNamesQuery,
      string[]
    >(query);

    return {
      names,
      total: names.length,
    };
  }

  @Get("traces/operations")
  @RequirePermissions("telemetry:traces:read")
  @ApiOperation({ summary: "Get available span/operation names" })
  @ApiResponse({ status: 200, type: [String] })
  async getSpanNames(
    @Query("serviceName") serviceName: string,
    @Query("limit") limit: number,
    @CurrentUser() user: { organizationId: string },
  ): Promise<string[]> {
    const tenantContext = TenantContext.create({
      organizationId: user.organizationId,
    });

    const query = new GetSpanNamesQuery(tenantContext, serviceName, limit);
    return this.queryBus.execute(query);
  }
}
