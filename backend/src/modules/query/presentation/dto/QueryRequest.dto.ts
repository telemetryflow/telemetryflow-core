import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TELEMETRYFLOW_HARD_LIMIT } from "@/shared/constants/telemetry-limits";

/**
 * Pagination DTO
 */
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: TELEMETRYFLOW_HARD_LIMIT })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(TELEMETRYFLOW_HARD_LIMIT)
  limit?: number = 100;
}

/**
 * Time Range DTO
 */
export class TimeRangeDto {
  @ApiProperty({
    description: "Start time (ISO 8601)",
    example: "2024-01-01T00:00:00Z",
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: "End time (ISO 8601)",
    example: "2024-01-02T00:00:00Z",
  })
  @IsString()
  to: string;
}

/**
 * Base Query Request DTO
 */
export class BaseQueryRequestDto extends TimeRangeDto {
  @ApiPropertyOptional({ description: "Workspace ID" })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ description: "Tenant ID" })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ type: PaginationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}

/**
 * Metrics Query Request DTO
 */
export class MetricsQueryRequestDto extends BaseQueryRequestDto {
  @ApiPropertyOptional({ description: "Metric name filter" })
  @IsOptional()
  @IsString()
  metricName?: string;

  @ApiPropertyOptional({
    description: "Multiple metric names filter",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metricNames?: string[];

  @ApiPropertyOptional({ description: "Service name filter" })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: "Label filters",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Aggregation type",
    enum: ["count", "sum", "avg", "min", "max", "p50", "p90", "p95", "p99"],
  })
  @IsOptional()
  @IsString()
  aggregation?: string;

  @ApiPropertyOptional({
    description: "Time bucket interval",
    enum: ["1m", "5m", "15m", "30m", "1h", "6h", "12h", "1d"],
  })
  @IsOptional()
  @IsString()
  interval?: string;

  @ApiPropertyOptional({ description: "Include percentiles in response" })
  @IsOptional()
  @IsBoolean()
  includePercentiles?: boolean;
}

/**
 * Logs Query Request DTO
 */
export class LogsQueryRequestDto extends BaseQueryRequestDto {
  @ApiPropertyOptional({ description: "Full-text search query" })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: "Severity level filter" })
  @IsOptional()
  @IsString()
  severityText?: string;

  @ApiPropertyOptional({
    description: "Multiple severity levels",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  severityTexts?: string[];

  @ApiPropertyOptional({ description: "Minimum severity number" })
  @IsOptional()
  @IsNumber()
  minSeverity?: number;

  @ApiPropertyOptional({ description: "Maximum severity number" })
  @IsOptional()
  @IsNumber()
  maxSeverity?: number;

  @ApiPropertyOptional({ description: "Service name filter" })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ description: "Trace ID filter" })
  @IsOptional()
  @IsString()
  traceId?: string;

  @ApiPropertyOptional({ description: "Span ID filter" })
  @IsOptional()
  @IsString()
  spanId?: string;

  @ApiPropertyOptional({
    description: "Resource attributes filter",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  resourceAttributes?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Log attributes filter",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  logAttributes?: Record<string, string>;
}

/**
 * Traces Query Request DTO
 */
export class TracesQueryRequestDto extends BaseQueryRequestDto {
  @ApiPropertyOptional({ description: "Trace ID filter" })
  @IsOptional()
  @IsString()
  traceId?: string;

  @ApiPropertyOptional({
    description: "Multiple trace IDs filter",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traceIds?: string[];

  @ApiPropertyOptional({ description: "Span name filter" })
  @IsOptional()
  @IsString()
  spanName?: string;

  @ApiPropertyOptional({
    description: "Span kind filter",
    enum: [
      "UNSPECIFIED",
      "INTERNAL",
      "SERVER",
      "CLIENT",
      "PRODUCER",
      "CONSUMER",
    ],
  })
  @IsOptional()
  @IsString()
  spanKind?: string;

  @ApiPropertyOptional({ description: "Service name filter" })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: "Status code filter",
    enum: ["UNSET", "OK", "ERROR"],
  })
  @IsOptional()
  @IsString()
  statusCode?: string;

  @ApiPropertyOptional({ description: "Minimum duration in milliseconds" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minDurationMs?: number;

  @ApiPropertyOptional({ description: "Maximum duration in milliseconds" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDurationMs?: number;

  @ApiPropertyOptional({ description: "Filter traces with errors only" })
  @IsOptional()
  @IsBoolean()
  hasError?: boolean;

  @ApiPropertyOptional({
    description: "Resource attributes filter",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  resourceAttributes?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Span attributes filter",
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  spanAttributes?: Record<string, string>;
}

/**
 * Get Trace By ID Request DTO
 */
export class GetTraceByIdRequestDto {
  @ApiProperty({ description: "Trace ID" })
  @IsString()
  traceId: string;
}

/**
 * Get Metric Names Request DTO
 */
export class GetMetricNamesRequestDto {
  @ApiPropertyOptional({ description: "Prefix filter" })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({
    description: "Maximum number of results",
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(TELEMETRYFLOW_HARD_LIMIT)
  limit?: number;
}

/**
 * Get Label Values Request DTO
 */
export class GetLabelValuesRequestDto {
  @ApiProperty({ description: "Label name" })
  @IsString()
  labelName: string;

  @ApiPropertyOptional({ description: "Metric name filter" })
  @IsOptional()
  @IsString()
  metricName?: string;

  @ApiPropertyOptional({
    description: "Maximum number of results",
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(TELEMETRYFLOW_HARD_LIMIT)
  limit?: number;
}

/**
 * Get Service Names Request DTO
 */
export class GetServiceNamesRequestDto {
  @ApiPropertyOptional({
    description: "Maximum number of results",
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(TELEMETRYFLOW_HARD_LIMIT)
  limit?: number;
}
