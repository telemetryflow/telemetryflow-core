import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EnforceRetentionDto {
  @ApiPropertyOptional({
    description: 'Type of data to enforce retention on (all if not specified)',
    enum: ['logs', 'metrics', 'traces', 'alerts', 'exemplars'],
  })
  @IsOptional()
  @IsEnum(['logs', 'metrics', 'traces', 'alerts', 'exemplars'])
  dataType?: 'logs' | 'metrics' | 'traces' | 'alerts' | 'exemplars';

  @ApiPropertyOptional({
    description: 'Dry run mode - simulate deletion without actually deleting',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
