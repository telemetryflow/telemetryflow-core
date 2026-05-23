export { TELEMETRYFLOW_SOFT_LIMIT, TELEMETRYFLOW_HARD_LIMIT } from '@/shared/constants/telemetry-limits';

/**
 * Default pagination limit for datatable queries — alias for TELEMETRYFLOW_SOFT_LIMIT.
 * Import from @/shared/constants/telemetry-limits for fine-grained control.
 */
export const DEFAULT_QUERY_LIMIT = parseInt(process.env.TELEMETRYFLOW_LIMIT_DATA || '50000', 10);

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumber,
  IsISO8601,
  IsString,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Standardized pagination query parameters
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: "Page number (1-indexed)", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of items per page",
    default: 20,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

/**
 * Time range query parameters for statistics
 */
export class TimeRangeQueryDto {
  @ApiPropertyOptional({
    description: "Start of time range (ISO 8601 format)",
    example: "2024-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: "End of time range (ISO 8601 format)",
    example: "2024-01-01T23:59:59Z",
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

/**
 * Combined stats query with organization context
 */
export class StatsQueryDto extends TimeRangeQueryDto {
  @ApiPropertyOptional({ description: "Filter by organization ID" })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ description: "Filter by workspace ID" })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}

/**
 * Standardized paginated response wrapper
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: "Array of items for the current page" })
  data: T[];

  @ApiProperty({ description: "Total number of items across all pages" })
  total: number;

  @ApiProperty({ description: "Current page number (1-indexed)" })
  page: number;

  @ApiProperty({ description: "Number of items per page" })
  pageSize: number;

  @ApiProperty({ description: "Total number of pages" })
  totalPages: number;

  @ApiProperty({ description: "Whether there is a next page" })
  hasNext: boolean;

  @ApiProperty({ description: "Whether there is a previous page" })
  hasPrevious: boolean;

  static create<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
  ): PaginatedResponseDto<T> {
    const dto = new PaginatedResponseDto<T>();
    dto.data = data;
    dto.total = total;
    dto.page = page;
    dto.pageSize = pageSize;
    dto.totalPages = Math.ceil(total / pageSize);
    dto.hasNext = page < dto.totalPages;
    dto.hasPrevious = page > 1;
    return dto;
  }
}

/**
 * Sort configuration
 */
export class SortQueryDto {
  @ApiPropertyOptional({ description: "Field to sort by" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["asc", "desc"],
    default: "asc",
  })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "asc";
}

/**
 * Combined pagination and sort query
 */
export class PaginatedSortQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Field to sort by" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["asc", "desc"],
    default: "asc",
  })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "asc";
}
