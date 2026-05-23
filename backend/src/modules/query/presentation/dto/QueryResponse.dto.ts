import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Query Metadata Response DTO
 */
export class QueryMetadataDto {
  @ApiProperty({ description: "Unique query ID" })
  queryId: string;

  @ApiProperty({ description: "Query execution time in milliseconds" })
  executionTimeMs: number;

  @ApiProperty({
    description: "Data source used for query",
    enum: ["clickhouse", "postgres", "federated"],
  })
  dataSource: string;

  @ApiProperty({ description: "Whether result was served from cache" })
  cached: boolean;

  @ApiPropertyOptional({ description: "Cache key if result was cached" })
  cacheKey?: string;
}

/**
 * Pagination Info Response DTO
 */
export class PaginationInfoDto {
  @ApiProperty({ description: "Current page number" })
  page: number;

  @ApiProperty({ description: "Items per page" })
  limit: number;

  @ApiProperty({ description: "Total number of pages" })
  totalPages: number;

  @ApiProperty({ description: "Has more pages" })
  hasNext: boolean;

  @ApiProperty({ description: "Has previous pages" })
  hasPrev: boolean;
}

/**
 * Generic Unified Query Response DTO
 */
export class UnifiedQueryResponseDto<T> {
  @ApiProperty({ description: "Query result data", type: "array" })
  data: T[];

  @ApiProperty({ description: "Total number of results" })
  total: number;

  @ApiProperty({ description: "Query metadata", type: QueryMetadataDto })
  metadata: QueryMetadataDto;

  @ApiPropertyOptional({
    description: "Pagination info",
    type: PaginationInfoDto,
  })
  pagination?: PaginationInfoDto;
}

/**
 * Metric Data Point Response DTO
 */
export class MetricDataPointDto {
  @ApiProperty({ description: "Timestamp" })
  timestamp: Date;

  @ApiProperty({ description: "Metric name" })
  metricName: string;

  @ApiProperty({
    description: "Metric type",
    enum: ["gauge", "counter", "histogram", "summary"],
  })
  metricType: string;

  @ApiProperty({ description: "Metric value" })
  value: number;

  @ApiProperty({ description: "Service name" })
  serviceName: string;

  @ApiPropertyOptional({
    description: "Resource attributes",
    type: "object",
    additionalProperties: true,
  })
  resourceAttributes?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Metric attributes",
    type: "object",
    additionalProperties: true,
  })
  metricAttributes?: Record<string, string>;

  @ApiPropertyOptional({ description: "Unit" })
  unit?: string;
}

/**
 * Log Entry Response DTO
 */
export class LogEntryDto {
  @ApiProperty({ description: "Timestamp" })
  timestamp: Date;

  @ApiPropertyOptional({ description: "Trace ID" })
  traceId?: string;

  @ApiPropertyOptional({ description: "Span ID" })
  spanId?: string;

  @ApiProperty({ description: "Severity text" })
  severityText: string;

  @ApiProperty({ description: "Severity number" })
  severityNumber: number;

  @ApiProperty({ description: "Service name" })
  serviceName: string;

  @ApiProperty({ description: "Log body/message" })
  body: string;

  @ApiPropertyOptional({
    description: "Resource attributes",
    type: "object",
    additionalProperties: true,
  })
  resourceAttributes?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Log attributes",
    type: "object",
    additionalProperties: true,
  })
  logAttributes?: Record<string, string>;
}

/**
 * Trace Span Response DTO
 */
export class TraceSpanDto {
  @ApiProperty({ description: "Timestamp" })
  timestamp: Date;

  @ApiProperty({ description: "Trace ID" })
  traceId: string;

  @ApiProperty({ description: "Span ID" })
  spanId: string;

  @ApiPropertyOptional({ description: "Parent span ID" })
  parentSpanId?: string;

  @ApiProperty({ description: "Span name" })
  spanName: string;

  @ApiProperty({
    description: "Span kind",
    enum: [
      "UNSPECIFIED",
      "INTERNAL",
      "SERVER",
      "CLIENT",
      "PRODUCER",
      "CONSUMER",
    ],
  })
  spanKind: string;

  @ApiProperty({ description: "Service name" })
  serviceName: string;

  @ApiProperty({ description: "Status code", enum: ["UNSET", "OK", "ERROR"] })
  statusCode: string;

  @ApiPropertyOptional({ description: "Status message" })
  statusMessage?: string;

  @ApiProperty({ description: "Duration in milliseconds" })
  durationMs: number;

  @ApiPropertyOptional({
    description: "Resource attributes",
    type: "object",
    additionalProperties: true,
  })
  resourceAttributes?: Record<string, string>;

  @ApiPropertyOptional({
    description: "Span attributes",
    type: "object",
    additionalProperties: true,
  })
  spanAttributes?: Record<string, string>;

  @ApiPropertyOptional({ description: "Span events", type: [String] })
  events?: string[];
}

/**
 * Trace Summary Response DTO
 */
export class TraceSummaryDto {
  @ApiProperty({ description: "Trace ID" })
  traceId: string;

  @ApiProperty({ description: "Root service name" })
  rootServiceName: string;

  @ApiProperty({ description: "Root span name" })
  rootSpanName: string;

  @ApiProperty({ description: "Total duration in milliseconds" })
  durationMs: number;

  @ApiProperty({ description: "Number of spans in trace" })
  spanCount: number;

  @ApiProperty({ description: "Number of error spans" })
  errorCount: number;

  @ApiProperty({ description: "Trace start time" })
  startTime: Date;

  @ApiProperty({ description: "Trace end time" })
  endTime: Date;

  @ApiProperty({ description: "Services involved in trace", type: [String] })
  services: string[];
}

/**
 * Metric Names Response DTO
 */
export class MetricNamesResponseDto {
  @ApiProperty({ description: "List of metric names", type: [String] })
  names: string[];

  @ApiProperty({ description: "Total count" })
  total: number;
}

/**
 * Label Values Response DTO
 */
export class LabelValuesResponseDto {
  @ApiProperty({ description: "Label name" })
  label: string;

  @ApiProperty({ description: "List of label values", type: [String] })
  values: string[];

  @ApiProperty({ description: "Total count" })
  total: number;
}

/**
 * Service Names Response DTO
 */
export class ServiceNamesResponseDto {
  @ApiProperty({ description: "List of service names", type: [String] })
  names: string[];

  @ApiProperty({ description: "Total count" })
  total: number;
}

/**
 * Severity Count Response DTO
 */
export class SeverityCountResponseDto {
  @ApiProperty({
    description: "Severity counts by level",
    type: "object",
    additionalProperties: true,
  })
  counts: Record<string, number>;
}
