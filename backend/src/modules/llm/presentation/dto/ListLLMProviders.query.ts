/**
 * List LLM Providers Query DTO
 */

import { IsOptional, IsInt, IsBoolean, IsEnum, Min, Max } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { ProviderTypeEnum } from "../../domain/value-objects/ProviderType";
import { TELEMETRYFLOW_HARD_LIMIT } from "../../../../shared/constants/telemetry-limits";

export class ListLLMProvidersQueryDto {
  @ApiPropertyOptional({
    description: "Page number",
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    default: 20,
    minimum: 1,
    maximum: TELEMETRYFLOW_HARD_LIMIT,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(TELEMETRYFLOW_HARD_LIMIT)
  @Transform(({ value }) => parseInt(value, 10))
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: "Filter by active status",
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Filter by provider type",
    enum: Object.values(ProviderTypeEnum),
  })
  @IsOptional()
  @IsEnum(ProviderTypeEnum)
  providerType?: ProviderTypeEnum;
}
