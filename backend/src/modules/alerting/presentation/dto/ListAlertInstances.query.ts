import {
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { AlertSeverity } from "../../domain/value-objects";
import { AlertInstanceStatus } from "../../domain/aggregates";

export class ListAlertInstancesQueryDto {
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

  @ApiPropertyOptional({
    description: "Filter by status",
    enum: AlertInstanceStatus,
  })
  @IsOptional()
  @IsEnum(AlertInstanceStatus)
  status?: AlertInstanceStatus;

  @ApiPropertyOptional({
    description: "Filter by severity",
    enum: AlertSeverity,
  })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ description: "Filter by alert rule ID" })
  @IsOptional()
  @IsUUID()
  alertRuleId?: string;

  @ApiPropertyOptional({
    description: "Filter by start date (ISO 8601)",
    example: "2025-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: "Filter by end date (ISO 8601)",
    example: "2025-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
