import {
  IsOptional,
  IsInt,
  IsBoolean,
  IsString,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { AlertSeverity } from "../../domain/value-objects";
import { AlertRuleState } from "../../domain/aggregates";

export class ListAlertRulesQueryDto {
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

  @ApiPropertyOptional({ description: "Filter by enabled status" })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: "Filter by severity",
    enum: AlertSeverity,
  })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({
    description: "Filter by state",
    enum: AlertRuleState,
  })
  @IsOptional()
  @IsEnum(AlertRuleState)
  state?: AlertRuleState;

  @ApiPropertyOptional({ description: "Search by name or description" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter rules linked to a graph registry ID (e.g. HOM10005)",
  })
  @IsOptional()
  @IsString()
  graphId?: string;
}
