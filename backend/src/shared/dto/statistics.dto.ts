import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Base Statistics Response Interface
 * All module statistics should implement this interface
 */
export interface IBaseStatisticsResponse {
  total: number;
  timestamp: Date;
  timeRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Trend data for comparative analysis
 */
export class TrendDataDto {
  @ApiProperty({ description: "Current period value" })
  current: number;

  @ApiProperty({ description: "Previous period value" })
  previous: number;

  @ApiProperty({ description: "Percentage change from previous period" })
  changePercent: number;

  @ApiProperty({
    description: "Direction of change",
    enum: ["up", "down", "stable"],
  })
  direction: "up" | "down" | "stable";

  static calculate(current: number, previous: number): TrendDataDto {
    const dto = new TrendDataDto();
    dto.current = current;
    dto.previous = previous;

    if (previous === 0) {
      dto.changePercent = current > 0 ? 100 : 0;
      dto.direction = current > 0 ? "up" : "stable";
    } else {
      dto.changePercent = ((current - previous) / previous) * 100;
      if (Math.abs(dto.changePercent) < 0.5) {
        dto.direction = "stable";
      } else {
        dto.direction = dto.changePercent > 0 ? "up" : "down";
      }
    }

    return dto;
  }
}

/**
 * Time range specification for statistics queries
 */
export class TimeRangeDto {
  @ApiProperty({ description: "Start of time range" })
  from: Date;

  @ApiProperty({ description: "End of time range" })
  to: Date;
}

/**
 * Base statistics response class
 */
export class BaseStatisticsResponseDto implements IBaseStatisticsResponse {
  @ApiProperty({ description: "Total count of items" })
  total: number;

  @ApiProperty({ description: "Timestamp when stats were computed" })
  timestamp: Date;

  @ApiPropertyOptional({
    description: "Time range used for the statistics",
    type: TimeRangeDto,
  })
  timeRange?: TimeRangeDto;
}

/**
 * Status distribution - generic type for any entity with statuses
 */
export type StatusDistribution<T extends string = string> = {
  [K in T]: number;
};

/**
 * Resource usage statistics - commonly used across modules
 */
export class ResourceUsageDto {
  @ApiProperty({ description: "Average CPU usage percentage (0-100)" })
  avgCpuUsage: number;

  @ApiProperty({ description: "Average memory usage percentage (0-100)" })
  avgMemoryUsage: number;

  @ApiPropertyOptional({ description: "Total CPU cores available" })
  totalCpuCores?: number;

  @ApiPropertyOptional({ description: "Total memory in bytes" })
  totalMemory?: number;

  @ApiPropertyOptional({ description: "Total disk space in bytes" })
  totalDisk?: number;

  @ApiPropertyOptional({ description: "Used disk space in bytes" })
  usedDisk?: number;
}

/**
 * Generic module statistics with status breakdown and trends
 */
export class ModuleStatisticsDto<
  TStatus extends string = string,
> extends BaseStatisticsResponseDto {
  @ApiPropertyOptional({
    description: "Count breakdown by status",
    type: "object",
    additionalProperties: { type: "number" },
  })
  byStatus?: StatusDistribution<TStatus>;

  @ApiPropertyOptional({
    description: "Trend data for total count",
    type: () => TrendDataDto,
  })
  totalTrend?: TrendDataDto;

  @ApiPropertyOptional({
    description: "Trend data for key metrics",
    type: "object",
    additionalProperties: { type: 'object' },
  })
  trends?: Record<string, TrendDataDto>;

  @ApiPropertyOptional({
    description: "Trend data per status",
    type: "object",
    additionalProperties: { type: 'object' },
  })
  byStatusTrends?: Record<string, TrendDataDto | undefined>;

  @ApiPropertyOptional({
    description: "Custom module-specific metrics",
    type: "object",
    additionalProperties: true,
  })
  customMetrics?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Resource usage statistics",
    type: () => ResourceUsageDto,
  })
  resourceUsage?: ResourceUsageDto;
}
