import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { AuditEventType, AuditEventResult } from "../../audit.service";

export class GetAuditStatisticsQueryDto {
  @ApiPropertyOptional({ description: "Filter from date (ISO 8601)" })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: "Filter to date (ISO 8601)" })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({
    description: "Filter by event type",
    enum: AuditEventType,
  })
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @ApiPropertyOptional({
    description: "Filter by result",
    enum: AuditEventResult,
  })
  @IsOptional()
  @IsEnum(AuditEventResult)
  result?: AuditEventResult;

  @ApiPropertyOptional({ description: "Filter by user email (partial match)" })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ description: "Filter by organization ID" })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional({ description: "Page number", default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Page size",
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: "Filter by user ID" })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: "Filter by event type",
    enum: AuditEventType,
  })
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @ApiPropertyOptional({
    description: "Filter by result",
    enum: AuditEventResult,
  })
  @IsOptional()
  @IsEnum(AuditEventResult)
  result?: AuditEventResult;

  @ApiPropertyOptional({ description: "Filter by action" })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: "Filter by resource" })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({
    description: "Filter logs from this date (ISO 8601)",
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Filter logs until this date (ISO 8601)",
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: "Filter by user email (partial match)" })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ description: "Search across action, resource, and user fields" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Export format: csv or json", default: "json" })
  @IsOptional()
  @IsString()
  format?: string;
}
